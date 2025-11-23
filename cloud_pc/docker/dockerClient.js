const Docker = require("dockerode");
const logger = require("../utils/logger");

let docker;

try {
  if (process.platform === "win32") {
    logger.info("Using Windows Docker TCP → localhost:2375");
    docker = new Docker({ host: "localhost", port: 2375 });
  } else {
    logger.info("Using Unix Docker socket → /var/run/docker.sock");
    docker = new Docker({ socketPath: "/var/run/docker.sock" });
  }
} catch (error) {
  logger.error("Failed to create Docker client:", error);
}

module.exports = docker;
