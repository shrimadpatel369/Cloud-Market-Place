// src/controllers/adminController.js
const User = require("../models/user");
const Vm = require("../models/vm");
const clientsStore = require("../clients/clientsStore");
const vmStore = require("../vm/vmStore");
const wsService = require("../services/wsService");
const jobQueue = require("../jobs/jobQueue"); // optional, if present
const logger = require("../utils/logger");

// LIST all users
exports.listUsers = async (req, res) => {
    try {
        const users = await User.find().select("-passwordHash").lean();
        res.json({ ok: true, users });
    } catch (err) {
        logger.error("admin.listUsers:", err && err.message ? err.message : err);
        res.status(500).json({ ok: false, error: err.message || String(err) });
    }
};

// GET single user
exports.getUser = async (req, res) => {
    try {
        const id = req.params.id;
        const u = await User.findById(id).select("-passwordHash");
        if (!u) return res.status(404).json({ ok: false, error: "user_not_found" });
        res.json({ ok: true, user: u });
    } catch (err) {
        logger.error("admin.getUser:", err && err.message ? err.message : err);
        res.status(500).json({ ok: false, error: err.message || String(err) });
    }
};

// CHANGE role of a user (promote/demote)
exports.changeRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        if (!userId || !role) return res.status(400).json({ ok: false, error: "userId_and_role_required" });
        if (!["user", "admin"].includes(role)) return res.status(400).json({ ok: false, error: "invalid_role" });

        const u = await User.findById(userId);
        if (!u) return res.status(404).json({ ok: false, error: "user_not_found" });

        u.role = role;
        await u.save();
        res.json({ ok: true, user: { id: u._id, email: u.email, role: u.role } });
    } catch (err) {
        logger.error("admin.changeRole:", err && err.message ? err.message : err);
        res.status(500).json({ ok: false, error: err.message || String(err) });
    }
};

// LIST clients (agents)
exports.listClients = async (req, res) => {
    try {
        const clients = clientsStore.list();
        res.json({ ok: true, clients });
    } catch (err) {
        logger.error("admin.listClients:", err && err.message ? err.message : err);
        res.status(500).json({ ok: false, error: err.message || String(err) });
    }
};

// GET client details (including lastStats and lastCmdResult)
exports.getClientDetails = async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const c = clientsStore.get(clientId);
        if (!c) return res.status(404).json({ ok: false, error: "client_not_found" });

        // enrich with VMs known on that client
        const vms = await Vm.find({ clientId }).lean();
        res.json({ ok: true, client: { id: c.id, meta: c.meta, lastStats: c.lastStats, lastCmdResult: c.lastCmdResult, activeJobs: (c.activeJobs && c.activeJobs.size) || 0 }, vms });
    } catch (err) {
        logger.error("admin.getClientDetails:", err && err.message ? err.message : err);
        res.status(500).json({ ok: false, error: err.message || String(err) });
    }
};

// Force stats update on client (sends WS request)
exports.requestStatsOnClient = async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const c = clientsStore.get(clientId);
        if (!c) return res.status(404).json({ ok: false, error: "client_not_found" });

        // send request (fire-and-forget)
        await wsService.sendToClient(clientId, { type: "request_stats", payload: {} }).catch(e => { /* ignore */ });
        res.json({ ok: true, requested: true });
    } catch (err) {
        logger.error("admin.requestStatsOnClient:", err && err.message ? err.message : err);
        res.status(500).json({ ok: false, error: err.message || String(err) });
    }
};

// Exec a safe command on client machine (admin only) — waits for "agent-exec-result"
exports.execOnClient = async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const { command } = req.body;
        if (!command) return res.status(400).json({ ok: false, error: "command_required" });

        const c = clientsStore.get(clientId);
        if (!c) return res.status(404).json({ ok: false, error: "client_not_found" });

        const reply = await wsService.sendToClient(clientId, { type: "agent-exec", payload: { command } }, { waitFor: "agent-exec-result", timeoutMs: 30000 });
        res.json({ ok: true, result: reply.payload });
    } catch (err) {
        logger.error("admin.execOnClient:", err && err.message ? err.message : err);
        res.status(500).json({ ok: false, error: err.message || String(err) });
    }
};

// LIST all VMs
exports.listAllVms = async (req, res) => {
    try {
        const vms = await Vm.find().lean();
        res.json({ ok: true, vms });
    } catch (err) {
        logger.error("admin.listAllVms:", err && err.message ? err.message : err);
        res.status(500).json({ ok: false, error: err.message || String(err) });
    }
};

// GET VM by vmId (admin)
exports.getVmById = async (req, res) => {
    try {
        const vmId = req.params.vmId;
        if (!vmId) return res.status(400).json({ ok: false, error: "vmId_required" });

        const vmDoc = await Vm.findOne({ vmId });
        if (!vmDoc) return res.status(404).json({ ok: false, error: "vm_not_found" });

        // attempt to add live info if agent connected (non-blocking but try)
        const info = vmDoc.toObject();
        if (vmDoc.clientId) {
            const client = clientsStore.get(vmDoc.clientId);
            if (client && client.ws && client.ws.readyState === client.ws.OPEN) {
                try {
                    const reply = await wsService.sendToClient(client.id, { type: "inspect-vm", payload: { vmId } }, { waitFor: "vm-inspected", timeoutMs: 8000 });
                    info.live = reply.payload || null;
                } catch (e) {
                    info.liveError = e && e.message ? e.message : String(e);
                }
            } else {
                info.clientStatus = "offline";
            }
        }
        res.json({ ok: true, vm: info });
    } catch (err) {
        logger.error("admin.getVmById:", err && err.message ? err.message : err);
        res.status(500).json({ ok: false, error: err.message || String(err) });
    }
};

// DELETE VM (asks agent to delete and removes DB record)
exports.deleteVm = async (req, res) => {
    try {
        const vmId = req.params.vmId;
        if (!vmId) return res.status(400).json({ ok: false, error: "vmId_required" });

        const vmDoc = await Vm.findOne({ vmId });
        if (!vmDoc) return res.status(404).json({ ok: false, error: "vm_not_found" });

        const client = clientsStore.get(vmDoc.clientId);
        if (client) {
            try {
                await wsService.sendToClient(client.id, { type: "delete-vm", payload: { vmId } }, { waitFor: "vm-deleted", timeoutMs: 20000 });
            } catch (e) {
                logger.warn("admin.deleteVm: client did not confirm deletion:", e && e.message ? e.message : e);
            }
        }

        await Vm.deleteOne({ vmId });
        vmStore.remove(vmId);

        res.json({ ok: true, deleted: true, vmId });
    } catch (err) {
        logger.error("admin.deleteVm:", err && err.message ? err.message : err);
        res.status(500).json({ ok: false, error: err.message || String(err) });
    }
};

// List VMs for a particular clientId
exports.vmsByClient = async (req, res) => {
    try {
        const clientId = req.params.clientId;
        if (!clientId) return res.status(400).json({ ok: false, error: "clientId_required" });
        const vms = await Vm.find({ clientId }).lean();
        res.json({ ok: true, vms });
    } catch (err) {
        logger.error("admin.vmsByClient:", err && err.message ? err.message : err);
        res.status(500).json({ ok: false, error: err.message || String(err) });
    }
};

// Debug: show pending jobs (if you have jobQueue pending map)
exports.debugPendingJobs = async (req, res) => {
    try {
        const pending = [];
        if (jobQueue && typeof jobQueue.list === "function") {
            const jobs = jobQueue.list();
            res.json({ ok: true, jobs });
            return;
        }
        res.json({ ok: true, note: "no jobQueue available" });
    } catch (err) {
        logger.error("admin.debugPendingJobs:", err && err.message ? err.message : err);
        res.status(500).json({ ok: false, error: err.message || String(err) });
    }
};

// Debug: vmStore mappings
exports.debugVmMappings = async (req, res) => {
    try {
        const mappings = typeof vmStore.list === "function" ? vmStore.list() : {};
        res.json({ ok: true, mappings });
    } catch (err) {
        logger.error("admin.debugVmMappings:", err && err.message ? err.message : err);
        res.status(500).json({ ok: false, error: err.message || String(err) });
    }
};
