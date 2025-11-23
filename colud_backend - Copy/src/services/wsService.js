// src/services/wsService.js
const { v4: uuidv4 } = require("uuid");
const clientsStore = require("../clients/clientsStore");
const logger = require("../utils/logger");

// pending map keyed by `${clientId}:${serverJobId}`
const pending = new Map();

function _key(clientId, serverJobId) {
    return `${clientId}:${serverJobId}`;
}

/**
 * Send message to client and optionally wait for a reply.
 * opts = { waitFor: 'vm-output'|'vm-created'|'vm-inspected'|'vm-started'|'vm-stopped', timeoutMs: 30000, nonce: '...' }
 */
function sendToClient(clientId, msg, opts = {}) {
    const client = clientsStore.get(clientId);
    if (!client || !client.ws || client.ws.readyState !== client.ws.OPEN) {
        throw new Error("agent_not_connected");
    }

    const serverJobId = opts.nonce || uuidv4();
    const payload = { ...(msg.payload || {}), serverJobId };
    const outgoing = { ...msg, payload };

    // send now
    client.ws.send(JSON.stringify(outgoing));
    logger.info(`[WS-SEND] to ${clientId} type=${outgoing.type} serverJobId=${serverJobId}`);

    // mark the job on the client for best-fit heuristics
    try { clientsStore.addJobToClient(clientId, serverJobId); } catch (e) { logger.error("mark job error:", e); }

    if (!opts.waitFor) return Promise.resolve(outgoing);

    const key = _key(clientId, serverJobId);
    logger.debug(`[WS-PENDING] pendingCountBefore=${pending.size}`);
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            pending.delete(key);
            try { clientsStore.removeJobFromClient(clientId, serverJobId); } catch (e) { }
            reject(new Error("response_timeout"));
        }, opts.timeoutMs || 30000);

        pending.set(key, {
            resolve: (msg) => {
                clearTimeout(timeout);
                pending.delete(key);
                try { clientsStore.removeJobFromClient(clientId, serverJobId); } catch (e) { }
                resolve(msg);
            },
            reject: (err) => {
                clearTimeout(timeout);
                pending.delete(key);
                try { clientsStore.removeJobFromClient(clientId, serverJobId); } catch (e) { }
                reject(err);
            },
            waitFor: opts.waitFor
        });
    });
}

/**
 * Called from ws server when a message arrives from a client.
 * If pending promise matches serverJobId+clientId and expected type, resolves it.
 */
function handleClientMessage(clientId, msg) {
    if (!msg || !msg.payload) return;
    const serverJobId = msg.payload.serverJobId || msg.payload.jobId || null;
    if (!serverJobId) {
        logger.debug(`[WS-RECV] from ${clientId} type=${msg.type} missing serverJobId`);
        return;
    }

    const key = _key(clientId, serverJobId);
    const p = pending.get(key);
    logger.info(`[WS-RECV] from ${clientId} type=${msg.type} serverJobId=${serverJobId} pendingHas=${!!p}`);

    if (!p) return;

    // If waitFor specified, check type matches
    if (p.waitFor && p.waitFor !== msg.type) {
        logger.debug(`[WS-RECV] ignored (waiting for ${p.waitFor})`);
        return;
    }

    // resolve
    p.resolve(msg);
}

module.exports = { sendToClient, handleClientMessage };
