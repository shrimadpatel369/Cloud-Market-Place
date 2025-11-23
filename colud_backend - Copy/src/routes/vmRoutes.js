// src/routes/vmRoutes.js
const express = require("express");
const router = express.Router();
const VmController = require("../controllers/vmController");
const vmStore = require("../vm/vmStore");
const { authJwt, requireRole } = require("../middlewares/authJwt");

// create VM (user)
router.post("/create", authJwt, VmController.createVm);

// list VMs for current user
router.get("/my", authJwt, VmController.listVMs);

// exec - requires clientId + vmId and must belong to user (or admin)
router.post("/exec", authJwt, VmController.execVm); // update execVm below

// debug listing (admin)
router.get("/list-mappings", authJwt, requireRole("admin"), (req, res) => {
  res.json({ ok: true, mappings: vmStore.list() });
});

// START/STOP using path param :id (vmId)
router.post("/start/:id", authJwt, VmController.startVm);
router.post("/stop/:id", authJwt, VmController.stopVm);
router.get("/:vmId", authJwt, VmController.getVmById);
module.exports = router;
