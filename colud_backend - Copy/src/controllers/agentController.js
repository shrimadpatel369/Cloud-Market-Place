// optional: control agent via API (force request stats, run arbitrary safe command)
const wsService = require('../services/wsService');


async function requestStats(req, res) {
const clientId = req.params.id;
try {
wsService.sendToClient(clientId, { type: 'request_stats', ts: Date.now() });
res.json({ ok: true });
} catch (e) {
res.status(500).json({ ok: false, error: e.message });
}
}


module.exports = { requestStats };