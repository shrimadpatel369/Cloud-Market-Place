const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');


// optional admin endpoints to inspect client details
const clientsStore = require('../clients/clientsStore');


router.use(auth);
router.get('/', (req, res) => res.json({ agents: clientsStore.list() }));
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const r = clientsStore.get(id);
    if (!r) return res.status(404).json({ error: 'not_found' });
    res.json({ id, meta: r.meta, lastStats: r.lastStats, lastCmdResult: r.lastCmdResult });
});


module.exports = router;