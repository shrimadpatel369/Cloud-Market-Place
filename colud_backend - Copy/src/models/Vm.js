// src/models/vm.js
const mongoose = require("mongoose");

const VmSchema = new mongoose.Schema({
  vmId: { type: String, required: true, unique: true },
  name: { type: String },

  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  clientId: { type: String, required: true },

  // VM configuration (from user request)
  os: String,
  cpu: Number,       // CPU cores (Number)
  memory: Number,    // MB (Number)
  storage: Number,   // MB (Number)
  image: String,

  // runtime info
  ip: String,
  status: { type: String, default: "running" },

  lastAgentReply: { type: mongoose.Schema.Types.Mixed }, // store last agent payload/time
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Vm", VmSchema);
