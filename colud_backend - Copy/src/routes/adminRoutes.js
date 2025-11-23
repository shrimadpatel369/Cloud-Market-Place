const express = require("express");
const router = express.Router();
const admin = require("../controllers/adminController");
const { authJwt, requireRole } = require("../middlewares/authJwt");

// All admin routes require auth + admin role
router.use(authJwt, requireRole("admin"));

// Users
router.get("/users", admin.listUsers);
router.get("/users/:id", admin.getUser);
router.post("/users/role", admin.changeRole); // body: { userId, role }

// Clients / agents
router.get("/clients", admin.listClients);
router.get("/clients/:clientId", admin.getClientDetails);
router.post("/clients/:clientId/request-stats", admin.requestStatsOnClient); // force stats
router.post("/clients/:clientId/exec", admin.execOnClient); // run safe admin command on agent

// VMs
router.get("/vms", admin.listAllVms);
router.get("/vms/:vmId", admin.getVmById);
router.get("/vms/client/:clientId", admin.vmsByClient);
router.delete("/vms/:vmId", admin.deleteVm);

// Jobs / debugging
router.get("/debug/pending-jobs", admin.debugPendingJobs); // optional: shows server pending WS jobs
router.get("/debug/vm-mappings", admin.debugVmMappings); // returns in-memory vmStore mappings

module.exports = router;
