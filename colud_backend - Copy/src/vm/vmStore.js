// src/vm/vmStore.js
const map = new Map();

function save(vmId, clientId, info = {}) {
    if (!vmId || !clientId) return;
    map.set(String(vmId), { clientId, createdAt: Date.now(), info });
}

function get(vmId) {
    return map.get(String(vmId)) || null;
}

function remove(vmId) {
    return map.delete(String(vmId));
}

function list() {
    return Array.from(map.entries()).map(([vmId, meta]) => ({ vmId, ...meta }));
}

module.exports = { save, get, remove, list };
