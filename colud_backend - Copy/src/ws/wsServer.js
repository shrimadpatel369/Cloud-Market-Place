// src/ws/wsServer.js
const WebSocket = require("ws");
const clientsStore = require("../clients/clientsStore");
const wsService = require("../services/wsService");
const vmStore = require("../vm/vmStore");      // <-- add this
const Vm = require("../models/vm");           // optional, if you persist to DB
const logger = require("../utils/logger");

function attachToServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws, req) => {
    const clientId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    console.log("⚡ Agent connected:", clientId);
    clientsStore.add(clientId, ws);

    // NOTE: message handler is async so we can await DB writes
    ws.on("message", async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (e) {
        logger.error("Invalid JSON from client:", e && e.message ? e.message : e);
        return;
      }

      logger.info("📩 Received from", clientId, msg && msg.type);

      // ====== INSERT YOUR vm-created HANDLER HERE ======
      // vm-created handling — only save mapping to vmStore, do NOT persist to DB here
      if (msg.type === "vm-created" || msg.type === "vm_created" || msg.type === "vm_created_ack") {
        try {
          // correlate to any pending server request
          wsService.handleClientMessage(clientId, msg);
        } catch (e) {
          logger.error("handleClientMessage error:", e && e.message ? e.message : e);
        }

        try {
          const p = msg.payload || {};
          logger.info("vm-created payload received from", clientId, p);

          // attempt many possible id keys
          const vmId = p.vmId || p.id || p.vm_id || p.name || (p.container && (p.container.Id || p.container.id)) || null;

          if (!vmId) {
            logger.warn("vm-created arrived without vmId. Keys:", Object.keys(p));
          } else {
            // Save only the mapping for routing purposes. DB persistence is responsibility of HTTP controller.
            vmStore.save(vmId, clientId, {
              name: p.name,
              ip: p.ip,
              cpu: p.cpu,
              memory: p.memory,
              image: p.image,
              status: p.status || (p.success === false ? "failed" : "running"),
              rawPayload: p
            });
            logger.success("vmStore.save: saved mapping", { vmId, clientId });
          }
        } catch (err) {
          logger.error("vm-created handling failed:", err && err.message ? err.message : err);
        }

        return; // done
      }

      // ====== END vm-created HANDLER ======

      // other message handling (stats, register, vm-output, etc.)
      if (msg.type === "register") {
        clientsStore.setMeta(clientId, { hostname: msg.hostname, ...(msg.metadata || {}) });
        if (msg.payload) clientsStore.setStats(clientId, msg.payload);
        return;
      }

      if (msg.type === "stats") {
        clientsStore.setStats(clientId, msg.payload);
        return;
      }

      if (msg.type === "vm-output" || msg.type === "error") {
        clientsStore.setLastCmdResult(clientId, msg);
        wsService.handleClientMessage(clientId, msg);
        return;
      }

      // fallback: let wsService try to resolve any pending requests
      wsService.handleClientMessage(clientId, msg);
    });

    ws.on("close", () => {
      console.log("❌ Agent disconnected:", clientId);
      clientsStore.remove(clientId);
    });

    ws.on("error", (err) => {
      console.log("WS error for", clientId, err && err.message ? err.message : err);
      clientsStore.remove(clientId);
    });
  });

  console.log("WebSocket server up");
}

module.exports = { attachToServer };
