// src/controllers/vmController.js
const clientsStore = require("../clients/clientsStore");
const wsService = require("../services/wsService");
const logger = require("../utils/logger");
const vmStore = require("../vm/vmStore");
const Vm = require("../models/vm");

// Helper: parse size strings like "4GB", "4096MB", "4G", "512M", "20480" -> MB (Number)
// Returns integer MB or null if invalid
function parseSizeToMB(val) {
  if (val == null) return null;
  if (typeof val === "number" && Number.isFinite(val)) return Math.floor(val);

  if (typeof val !== "string") return null;
  const s = val.trim().toLowerCase();
  // allow commas and spaces, e.g. "4,096 mb"
  const re = /^([\d,.]+)\s*(gb|g|mb|m|kb|k)?$/i;
  const m = s.match(re);
  if (!m) return null;

  const num = parseFloat(m[1].replace(/,/g, ""));
  if (Number.isNaN(num)) return null;

  const unit = (m[2] || "").toLowerCase();
  switch (unit) {
    case "gb":
    case "g":
      return Math.round(num);
    case "mb":
    case "m":
      return Math.round(num);
    case "kb":
    case "k":
      return Math.round(num / 1024);
    default:
      // No unit — assume MB (explicit is better but we choose MB by default)
      return Math.round(num);
  }
}

// LIST VMs (admin: all, user: only real & verified VMs)
exports.listVMs = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ error: "unauthenticated" });

    // Query: admin -> all VMs, user -> only own
    const query = requester.role === "admin" ? {} : { owner: requester.id };

    const dbVms = await Vm.find(query).lean();
    const finalList = [];

    for (const vm of dbVms) {
      const vmObj = { ...vm };

      // Always include DB-stored details
      vmObj.details = {
        name: vm.name || null,
        os: vm.os || vm.image || null,
        cpu: vm.cpu != null ? vm.cpu : null,
        memory: vm.memory != null ? vm.memory : null, // MB
        storage: vm.storage != null ? vm.storage : null, // MB
        image: vm.image || null
      };

      // If no client assigned -> hide from non-admins
      if (!vm.clientId) {
        if (requester.role !== "admin") continue;
        vmObj.liveStatus = "agent_offline";
        finalList.push(vmObj);
        continue;
      }

      const client = clientsStore.get(vm.clientId);

      // agent offline -> hide from non-admins
      if (!client || !client.ws || client.ws.readyState !== client.ws.OPEN) {
        if (requester.role !== "admin") continue;
        vmObj.liveStatus = "agent_offline";
        finalList.push(vmObj);
        continue;
      }

      // Query live status via agent
      try {
        const reply = await wsService.sendToClient(
          client.id,
          { type: "inspect-vm", payload: { vmId: vm.vmId } },
          { waitFor: "vm-inspected", timeoutMs: 7000 }
        );

        const live = reply.payload || {};

        // If agent indicates error/missing container -> hide for users
        if (live.status === "error" || live.message || live.containerNotFound) {
          if (requester.role !== "admin") continue;
          vmObj.liveStatus = "stopped";
          vmObj.live = { running: false, error: live.message || live.error };
          finalList.push(vmObj);
          continue;
        }

        // Container exists -> show running/stopped
        const isRunning = !!live.running;
        vmObj.liveStatus = isRunning ? "running" : "stopped";
        vmObj.live = {
          running: isRunning,
          status: live.status,
          ip: live.ip || vm.ip || null,
          startedAt: live.startedAt,
          finishedAt: live.finishedAt
        };

        finalList.push(vmObj);
      } catch (err) {
        // agent didn't reply -> hide from users; admin sees stopped with inspectError
        if (requester.role !== "admin") continue;
        vmObj.liveStatus = "stopped";
        vmObj.live = { running: false, inspectError: err.message || String(err) };
        finalList.push(vmObj);
      }
    }

    return res.json({ ok: true, vms: finalList });
  } catch (err) {
    logger.error("listVMs error:", err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};

// CREATE VM - authenticated users only (attach owner)
// memory/storage from request accepted as "4GB","4096MB","4096" etc and stored as MB
exports.createVm = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "unauthenticated" });

    const { cpu, memory, storage, os, name, image } = req.body;

    const agent = clientsStore.chooseBestClient();
    if (!agent) return res.status(500).json({ error: "no_agent_connected" });

    const msg = { type: "create-vm", payload: { cpu, memory, storage, os, name, image } };
    const reply = await wsService.sendToClient(agent.id, msg, { waitFor: "vm-created", timeoutMs: 60000 });

    const payload = reply.payload || {};
    const vmId = payload.vmId || payload.id || payload.name;
    if (!vmId) {
      return res.status(500).json({ ok: false, error: "agent_did_not_return_vmId" });
    }

    // Normalize numeric fields
    const cpuVal = cpu != null ? Number(cpu) : (payload.cpu != null ? Number(payload.cpu) : null);
    const memoryMB = parseSizeToMB(memory != null ? memory : payload.memory);
    const storageMB = parseSizeToMB(storage != null ? storage : payload.storage);

    // Validate sizes (if user supplied strings but invalid)
    if ((memory != null || payload.memory != null) && memoryMB === null) {
      return res.status(400).json({ ok: false, error: "invalid_memory_format", example: "4GB / 4096MB / 4G" });
    }
    if ((storage != null || payload.storage != null) && storageMB === null) {
      return res.status(400).json({ ok: false, error: "invalid_storage_format", example: "20GB / 20480MB / 20G" });
    }

    // persist to DB with owner and clientId (memory/storage stored as MB numbers)
    const vmDoc = await Vm.create({
      vmId,
      name: payload.name || name,
      owner: user.id,
      clientId: agent.id,
      ip: payload.ip || null,
      cpu: Number.isFinite(cpuVal) ? cpuVal : undefined,
      memory: Number.isFinite(memoryMB) ? memoryMB : undefined,
      storage: Number.isFinite(storageMB) ? storageMB : undefined,
      os: os || payload.os || payload.image || null,
      image: image || payload.image || null,
      status: payload.status || "running"
    });

    // save mapping in vmStore for routing
    try {
      vmStore.save(vmId, agent.id, { owner: user.id, name: vmDoc.name });
    } catch (e) {
      logger.warn("vmStore.save failed:", e && e.message ? e.message : e);
    }

    return res.json({ ok: true, clientId: agent.id, created: vmDoc });
  } catch (err) {
    logger.error("createVm error:", err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};

// START VM — wait for agent confirmation, update DB, return updated VM info
exports.startVm = async (req, res) => {
  try {
    const vmId = req.params.id;
    if (!vmId) return res.status(400).json({ error: "vmId_required" });

    const vmDoc = await Vm.findOne({ vmId });
    if (!vmDoc) return res.status(404).json({ error: "vm_not_known" });

    // Ownership check for non-admins
    if (req.user?.role !== "admin" && String(vmDoc.owner) !== String(req.user?.id)) {
      return res.status(403).json({ error: "not_vm_owner" });
    }

    const clientId = vmDoc.clientId;
    if (!clientId) return res.status(500).json({ error: "vm_missing_client" });

    const client = clientsStore.get(clientId);
    if (!client || !client.ws || client.ws.readyState !== client.ws.OPEN) {
      return res.status(500).json({ error: "client_not_connected" });
    }

    // send start request and WAIT for vm-started reply
    let reply;
    try {
      reply = await wsService.sendToClient(clientId, {
        type: "start-vm",
        payload: { vmId }
      }, {
        waitFor: "vm-started",
        timeoutMs: 30000
      });
    } catch (err) {
      logger.error("startVm: wsService.sendToClient failed:", err && err.message ? err.message : err);
      return res.status(504).json({ ok: false, error: "agent_response_timeout", detail: err && err.message ? err.message : String(err) });
    }

    const payload = reply.payload || {};

    // If agent reports failure, update DB and respond
    if (payload.success === false) {
      try {
        vmDoc.status = payload.status || "error";
        vmDoc.lastAgentReply = { time: new Date(), payload };
        await vmDoc.save();
      } catch (e) { logger.warn("startVm: db update failed:", e && e.message ? e.message : e); }

      return res.status(500).json({ ok: false, error: "agent_failed_to_start", detail: payload.message || payload });
    }

    // Agent reported success — update DB
    try {
      vmDoc.status = payload.status || "running";
      if (payload.ip) vmDoc.ip = payload.ip;
      vmDoc.lastAgentReply = { time: new Date(), payload };
      await vmDoc.save();
    } catch (dbErr) {
      logger.warn("startVm: failed to update VM doc:", dbErr && dbErr.message ? dbErr.message : dbErr);
    }

    // Try a follow-up inspect to return live info
    try {
      await new Promise(r => setTimeout(r, 700));
      const inspectReply = await wsService.sendToClient(clientId, {
        type: "inspect-vm",
        payload: { vmId }
      }, { waitFor: "vm-inspected", timeoutMs: 7000 });

      const live = inspectReply.payload || {};
      const response = {
        ok: true,
        vmId,
        clientId,
        agentReply: payload,
        live: {
          status: live.status || (payload.status || "running"),
          running: typeof live.running === "boolean" ? live.running : (live.status === "running"),
          ip: live.ip || vmDoc.ip || null,
          startedAt: live.startedAt || null,
          raw: live
        }
      };

      // merge live info back into DB if useful
      try {
        if (live.ip) vmDoc.ip = live.ip;
        vmDoc.status = response.live.running ? "running" : vmDoc.status;
        await vmDoc.save();
      } catch (_) { /* ignore update errors */ }

      return res.json(response);
    } catch (inspectErr) {
      // inspect failed — still return agent start success but live unknown
      return res.json({
        ok: true,
        vmId,
        clientId,
        agentReply: payload,
        live: { status: "unknown", running: true, inspectError: inspectErr.message }
      });
    }
  } catch (err) {
    logger.error("startVm error:", err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};

// GET /vms/:vmId — returns DB data plus live status if agent connected
exports.getVmById = async (req, res) => {
  try {
    const vmId = req.params.vmId;
    if (!vmId) return res.status(400).json({ error: "vmId_required" });

    const vmDoc = await Vm.findOne({ vmId });
    if (!vmDoc) return res.status(404).json({ error: "vm_not_found" });

    // user access check
    if (req.user.role !== "admin" && String(vmDoc.owner) !== String(req.user.id)) {
      return res.status(403).json({ error: "not_vm_owner" });
    }

    const result = { ok: true, vm: vmDoc.toObject() };

    if (vmDoc.clientId) {
      const client = clientsStore.get(vmDoc.clientId);
      if (client && client.ws && client.ws.readyState === client.ws.OPEN) {
        try {
          const reply = await wsService.sendToClient(client.id, {
            type: "inspect-vm",
            payload: { vmId }
          }, { waitFor: "vm-inspected", timeoutMs: 8000 });

          const live = (reply && reply.payload) ? reply.payload : null;
          if (live) {
            result.vm.liveStatus = live.status || live.state || null;
            if (live.ip) result.vm.ip = live.ip;
            if (live.message) result.vm.inspectMessage = live.message;
            result.vm.live = live;
          }
        } catch (err) {
          result.vm.liveStatus = "unknown";
          result.vm.inspectError = err && err.message ? err.message : String(err);
        }
      } else {
        result.vm.liveStatus = "agent_offline";
      }
    } else {
      result.vm.liveStatus = "no_client_assigned";
    }

    return res.json(result);
  } catch (err) {
    logger.error("getVmById error:", err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};

// STOP VM — wait for agent reply and update DB
exports.stopVm = async (req, res) => {
  try {
    const vmId = req.params.id;
    if (!vmId) return res.status(400).json({ ok: false, error: "vmId_required" });

    const vmDoc = await Vm.findOne({ vmId });
    if (!vmDoc) return res.status(404).json({ ok: false, error: "vm_not_found" });

    if (req.user?.role !== "admin" && String(vmDoc.owner) !== String(req.user?.id)) {
      return res.status(403).json({ ok: false, error: "not_vm_owner" });
    }

    const clientId = vmDoc.clientId;
    if (!clientId) return res.status(500).json({ ok: false, error: "vm_has_no_client" });

    const client = clientsStore.get(clientId);
    if (!client || !client.ws || client.ws.readyState !== client.ws.OPEN) {
      return res.status(500).json({ ok: false, error: "client_not_connected" });
    }

    const msg = { type: "stop-vm", payload: { vmId } };

    let reply;
    try {
      reply = await wsService.sendToClient(clientId, msg, { waitFor: "vm-stopped", timeoutMs: 30000 });
    } catch (err) {
      logger.error("stopVm: wsService.sendToClient failed:", err && err.message ? err.message : err);
      return res.status(504).json({ ok: false, error: "agent_response_timeout", detail: err && err.message ? err.message : String(err) });
    }

    const payload = reply.payload || {};
    try {
      const newStatus = payload.status || (payload.success ? "stopped" : "unknown");
      vmDoc.status = newStatus;
      vmDoc.lastAgentReply = { time: new Date(), payload };
      await vmDoc.save();
    } catch (dbErr) {
      logger.warn("stopVm: failed to update VM doc:", dbErr && dbErr.message ? dbErr.message : dbErr);
    }

    return res.json({ ok: true, result: payload });
  } catch (err) {
    logger.error("stopVm: unexpected error:", err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};

// EXEC COMMAND - enforce ownership + matching client
exports.execVm = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "unauthenticated" });

    const { clientId, vmId, command } = req.body;
    if (!clientId || !vmId || !command) return res.status(400).json({ error: "clientId_vmId_command_required" });

    const vmDoc = await Vm.findOne({ vmId });
    if (!vmDoc) return res.status(404).json({ error: "vm_not_known" });

    if (String(vmDoc.owner) !== String(user.id) && user.role !== "admin") {
      return res.status(403).json({ error: "not_vm_owner" });
    }

    if (vmDoc.clientId !== clientId) {
      return res.status(409).json({ error: "vm_owned_by_other_client", ownerClient: vmDoc.clientId });
    }

    const client = clientsStore.get(clientId);
    if (!client || !client.ws || client.ws.readyState !== client.ws.OPEN) {
      return res.status(404).json({ error: "client_not_connected" });
    }

    const msg = { type: "exec-vm", payload: { vmId, command } };
    const reply = await wsService.sendToClient(clientId, msg, { waitFor: "vm-output", timeoutMs: 60000 });

    return res.json({ ok: true, output: reply.payload });
  } catch (err) {
    logger.error("execVm error:", err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};
