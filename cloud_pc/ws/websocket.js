const WebSocket = require("ws");
const os = require("os");
const logger = require("../utils/logger");
const { SERVER_URL, STATS_INTERVAL } = require("../config");
const handleMessage = require("./messageHandler");
const { attachWebSocket, sendToBackend, flushQueue } = require("./queue");
const { gatherSystemInfo } = require("../system/systemInfo");

function startWebSocket() {
    logger.info("Connecting to WebSocket:", SERVER_URL);
    console.log("[WS] connecting to:", SERVER_URL);

    const ws = new WebSocket(SERVER_URL);
    attachWebSocket(ws);
    console.log("[WS] attachWebSocket called");

    ws.on("open", async () => {
        logger.success("Connected to backend");
        console.log("[WS] open -> flushed queue, sending register/stats");

        try {
            flushQueue();
        } catch (e) {
            logger.error("flushQueue error:", e);
            console.error(e);
        }

        try {
            sendToBackend({
                type: "register",
                hostname: os.hostname(),
                metadata: { platform: process.platform },
            });
            console.log("[WS] register sent:", { hostname: os.hostname(), platform: process.platform });
        } catch (e) {
            logger.error("sendToBackend(register) error:", e);
            console.error(e);
        }

        try {
            const stats = await gatherSystemInfo();
            sendToBackend({ type: "stats", payload: stats });
            console.log("[WS] initial stats sent:", stats && stats.timestamp);
        } catch (e) {
            logger.error("gatherSystemInfo/send stats error:", e);
            console.error(e);
        }

        setInterval(async () => {
            try {
                const s = await gatherSystemInfo();
                sendToBackend({ type: "stats", payload: s });
                console.log("[WS] periodic stats sent:", s && s.timestamp);
            } catch (e) {
                logger.error("periodic stats error:", e);
                console.error(e);
            }
        }, STATS_INTERVAL);
    });

    ws.on("message", async (raw) => {
        // raw can be Buffer or string
        const rawStr = raw && raw.toString ? raw.toString() : String(raw);
        logger.info("Raw message:", rawStr);
        console.log("[WS] raw message received:", rawStr);

        // parse JSON safely
        let msg;
        try {
            msg = JSON.parse(rawStr);
            console.log("[WS] parsed message:", msg && msg.type ? msg.type : "(no type)", msg && msg.payload ? "with payload" : "(no payload)");
        } catch (err) {
            logger.error("Invalid JSON from backend:", err.message || err);
            console.error("[WS] JSON parse error. raw:", rawStr, "err:", err && err.stack ? err.stack : err);
            return;
        }

        // Defensive: ensure handleMessage exists
        if (!handleMessage || typeof handleMessage !== "function") {
            logger.error("handleMessage is not a function or is missing!");
            console.error("[WS] handleMessage:", handleMessage);
            return;
        }

        // Call handler robustly: prefer (ws, msg) if handler expects 2 args
        try {
            const expectedArgs = handleMessage.length || 0;
            console.log(`[WS] dispatching to handleMessage (expects ${expectedArgs} args)`);

            if (expectedArgs >= 2) {
                // handler likely expects (ws, msg)
                await handleMessage(ws, msg);
            } else {
                // handler likely expects (msg) only
                await handleMessage(msg);
            }
            console.log("[WS] handleMessage completed for type:", msg.type);
        } catch (err) {
            logger.error("Error inside handleMessage:", err && err.message ? err.message : err);
            console.error("[WS] handleMessage threw:", err && err.stack ? err.stack : err);
            // optionally, send error back to server
            try {
                sendToBackend({ type: "agent-error", payload: { message: err.message || String(err), original: msg && msg.type } });
            } catch (e) {
                logger.error("failed to send agent-error to backend:", e);
                console.error(e);
            }
        }
    });

    ws.on("close", (code, reason) => {
        logger.error("WS disconnected, retrying in 5s...", code, reason && reason.toString ? reason.toString() : reason);
        console.log("[WS] close - scheduling reconnect in 5s. code:", code, "reason:", reason);
        setTimeout(startWebSocket, 5000);
    });

    ws.on("error", (err) => {
        logger.error("WS error:", err && err.message ? err.message : err);
        console.error("[WS] socket error:", err && err.stack ? err.stack : err);
    });
}

module.exports = startWebSocket;
