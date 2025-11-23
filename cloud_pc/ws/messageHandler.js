// src/ws/messageHandler.js
const { createVM } = require("../docker/createVM");
const dockerClientRaw = require("../docker/dockerClient");
const docker = (dockerClientRaw && dockerClientRaw.listContainers) ? dockerClientRaw : (dockerClientRaw && dockerClientRaw.docker ? dockerClientRaw.docker : dockerClientRaw);
const logger = require("../utils/logger");

// Helper to send replies and always echo serverJobId
function sendReply(ws, type, payload = {}, incomingServerJobId = null) {
    const outPayload = { ...(payload || {}) };
    if (incomingServerJobId) outPayload.serverJobId = incomingServerJobId;
    const msg = { type, payload: outPayload };

    // Prevent accidental echo of the same incoming message
    if (ws.__lastReceived && ws.__lastReceived.type === type && ws.__lastReceived.payload && ws.__lastReceived.payload.serverJobId === incomingServerJobId) {
        logger.warn("[AGENT] prevented accidental echo back to server", { type, serverJobId: incomingServerJobId });
        return;
    }

    logger.info("[AGENT-SEND]", type, { serverJobId: outPayload.serverJobId });
    ws.send(JSON.stringify(msg));
}

// mark last received to help prevent echo loops
function markLastReceived(ws, msg) {
    try {
        ws.__lastReceived = { type: msg.type, payload: msg.payload || {} };
        setTimeout(() => {
            if (ws.__lastReceived && ws.__lastReceived.payload && ws.__lastReceived.payload.serverJobId === (msg.payload && msg.payload.serverJobId)) {
                ws.__lastReceived = null;
            }
        }, 2500);
    } catch (e) { /* ignore */ }
}

// Helper: resolve container by id or name
async function resolveContainer(identifier) {
    if (!identifier) throw new Error("missing_container_identifier");
    if (!docker) throw new Error("docker_client_unavailable");

    // fast path
    try {
        const c = docker.getContainer(identifier);
        await c.inspect();
        return c;
    } catch (err) {
        // fallback to listContainers
        const all = await docker.listContainers({ all: true });
        const found = all.find(ci => {
            if (!ci) return false;
            if (ci.Id && ci.Id.startsWith(identifier)) return true;
            if (ci.Names && ci.Names.some(n => n === `/${identifier}` || n === identifier)) return true;
            if (ci.Names && ci.Names.some(n => n.includes(identifier))) return true;
            return false;
        });
        if (!found) throw new Error("container_not_found");
        return docker.getContainer(found.Id);
    }
}

// --- HANDLERS ---

async function handleCreateVM(ws, msg) {
    const serverJobId = msg.payload && msg.payload.serverJobId;
    const image = (msg.payload && (msg.payload.image || msg.payload.os || msg.payload.oos)) || "ubuntu:latest";

    try {
        const result = await createVM(image);
        const payload = {
            ...result,
            vmId: result.vmId || result.id || null
        };
        sendReply(ws, "vm-created", payload, serverJobId);
        logger.info("[AGENT] vm-created sent", payload);
    } catch (err) {
        sendReply(ws, "vm-created", { success: false, message: err.message || String(err), vmId: null }, serverJobId);
        logger.error("[AGENT] createVM failed:", err && err.message ? err.message : err);
    }
}

async function handleStartVM(ws, msg) {
    const serverJobId = msg.payload && msg.payload.serverJobId;
    const vmId = msg.payload && (msg.payload.vmId || msg.payload.name || msg.payload.id);
    try {
        if (!vmId) throw new Error("vmId_missing");

        const container = await resolveContainer(vmId);
        const before = await container.inspect();
        if (before.State && before.State.Running) {
            sendReply(ws, "vm-started", { vmId, success: true, status: before.State.Status }, serverJobId);
            return;
        }

        await container.start();
        await new Promise(r => setTimeout(r, 800));
        const after = await container.inspect();
        const success = !!(after.State && after.State.Running);
        sendReply(ws, "vm-started", { vmId, success, status: after.State && after.State.Status }, serverJobId);
    } catch (err) {
        logger.error("[AGENT] handleStartVM error:", err && err.message ? err.message : err);
        sendReply(ws, "vm-started", { vmId: vmId || null, success: false, message: err.message || String(err) }, serverJobId);
    }
}

async function handleStopVM(ws, msg) {
    const serverJobId = msg.payload && msg.payload.serverJobId;
    const vmId = msg.payload && (msg.payload.vmId || msg.payload.name || msg.payload.id);
    try {
        if (!vmId) throw new Error("vmId_missing");

        const container = await resolveContainer(vmId);
        const before = await container.inspect();
        if (!before.State || !before.State.Running) {
            sendReply(ws, "vm-stopped", { vmId, success: true, status: before.State && before.State.Status }, serverJobId);
            return;
        }

        try {
            await container.stop({ t: 10 });
        } catch (stopErr) {
            logger.warn("[AGENT] stop failed, trying kill:", stopErr && stopErr.message ? stopErr.message : stopErr);
            await container.kill();
        }

        await new Promise(r => setTimeout(r, 800));
        const after = await container.inspect();
        const success = !(after.State && after.State.Running);
        sendReply(ws, "vm-stopped", { vmId, success, status: after.State && after.State.Status }, serverJobId);
    } catch (err) {
        logger.error("[AGENT] handleStopVM error:", err && err.message ? err.message : err);
        sendReply(ws, "vm-stopped", { vmId: vmId || null, success: false, message: err.message || String(err) }, serverJobId);
    }
}

async function handleExecVM(ws, msg) {
    const serverJobId = msg.payload && msg.payload.serverJobId;
    const vmId = msg.payload && msg.payload.vmId;
    const command = msg.payload && msg.payload.command;

    try {
        if (!vmId || !command) {
            sendReply(ws, "error", { message: "vmId_and_command_required" }, serverJobId);
            return;
        }

        const container = await resolveContainer(vmId);
        const exec = await container.exec({
            Cmd: Array.isArray(command) ? command : command.split(" "),
            AttachStdout: true,
            AttachStderr: true
        });

        const stream = await exec.start({});
        let output = "";
        stream.on("data", (d) => { output += d.toString(); });
        stream.on("end", () => {
            sendReply(ws, "vm-output", { vmId, output, exitCode: 0 }, serverJobId);
        });
        stream.on("error", (err) => {
            sendReply(ws, "vm-output", { vmId, output: "", stderr: err.message || String(err), exitCode: 1 }, serverJobId);
        });
    } catch (err) {
        logger.error("[AGENT] handleExecVM error:", err && err.message ? err.message : err);
        sendReply(ws, "error", { message: err.message || String(err) }, serverJobId);
    }
}

async function handleInspectVM(ws, msg) {
    const serverJobId = msg.payload && msg.payload.serverJobId;
    const vmId = msg.payload && (msg.payload.vmId || msg.payload.name || msg.payload.id);
    logger.info("[AGENT] inspect-vm received", { vmId, serverJobId });

    try {
        if (!vmId) throw new Error("vmId_missing");
        const container = await resolveContainer(vmId);
        const info = await container.inspect();

        let ip = null;
        try {
            if (info.NetworkSettings && info.NetworkSettings.IPAddress) ip = info.NetworkSettings.IPAddress;
            else if (info.NetworkSettings && info.NetworkSettings.Networks) {
                const nets = info.NetworkSettings.Networks;
                const first = Object.keys(nets || {})[0];
                ip = first ? (nets[first] && nets[first].IPAddress) : null;
            }
        } catch (e) { /* ignore */ }

        const payload = {
            vmId,
            status: info.State && info.State.Status,
            running: !!(info.State && info.State.Running),
            startedAt: info.State && info.State.StartedAt,
            finishedAt: info.State && info.State.FinishedAt,
            ip
        };

        sendReply(ws, "vm-inspected", payload, serverJobId);
        logger.info("[AGENT] vm-inspected sent", { vmId, serverJobId, status: payload.status });
    } catch (err) {
        logger.error("[AGENT] handleInspectVM error:", err && err.message ? err.message : err);
        sendReply(ws, "vm-inspected", { vmId: vmId || null, status: "error", message: err.message || String(err) }, serverJobId);
    }
}

// exported dispatcher
module.exports = async function (ws, msg) {
    if (!msg || !msg.type) {
        logger.warn("[AGENT] received invalid msg:", msg);
        return;
    }

    // defensive: mark last received and debug
    markLastReceived(ws, msg);
    logger.info("[AGENT-RECV] type=", msg.type, "keys=", Object.keys(msg.payload || {}));

    switch (msg.type) {
        case "create-vm": await handleCreateVM(ws, msg); break;
        case "start-vm": await handleStartVM(ws, msg); break;
        case "stop-vm": await handleStopVM(ws, msg); break;
        case "exec-vm": await handleExecVM(ws, msg); break;
        case "inspect-vm": await handleInspectVM(ws, msg); break;
        default: logger.warn("[AGENT] Unknown command:", msg.type);
    }
};
