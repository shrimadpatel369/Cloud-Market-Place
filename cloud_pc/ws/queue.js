const logger = require("../utils/logger");

let ws = null;
let messageQueue = [];

exports.attachWebSocket = (socket) => {
  ws = socket;
};

exports.sendToBackend = (msg) => {
  const message = JSON.stringify(msg);

  if (ws && ws.readyState === 1) {
    logger.info("Sent →", message);
    ws.send(message);
  } else {
    logger.warn("WS not ready, queued →", message);
    messageQueue.push(message);
  }
};

exports.flushQueue = () => {
  if (ws && ws.readyState === 1 && messageQueue.length > 0) {
    logger.info(`Flushing ${messageQueue.length} queued messages...`);
    messageQueue.forEach((m) => ws.send(m));
    messageQueue = [];
  }
};
