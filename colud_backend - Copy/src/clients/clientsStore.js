// src/clients/clientsStore.js
// clientsStore with best-fit + round-robin tie-breaking

const clients = new Map();

// rr pointer increments across chooseBestClient tie selections
let rrIndex = 0;

module.exports = {
  add(id, ws) {
    clients.set(id, {
      id,
      ws,
      meta: null,
      lastStats: null,
      lastCmdResult: null,
      activeJobs: new Set(),
      lastSeen: Date.now()
    });
  },

  remove(id) {
    clients.delete(id);
    // keep rrIndex in bounds
    const len = clients.size;
    if (rrIndex >= len) rrIndex = 0;
  },

  get(id) {
    return clients.get(id);
  },

  list() {
    return [...clients.values()].map(c => ({
      id: c.id,
      meta: c.meta,
      lastStats: c.lastStats,
      activeJobs: c.activeJobs.size,
      lastSeen: c.lastSeen
    }));
  },

  setMeta(id, meta = {}) {
    const c = clients.get(id);
    if (!c) return;
    c.meta = { ...(c.meta || {}), ...meta };
    c.lastSeen = Date.now();
  },

  setStats(id, stats = {}) {
    const c = clients.get(id);
    if (!c) return;
    c.lastStats = stats;
    c.lastSeen = Date.now();
  },

  setLastCmdResult(id, result = {}) {
    const c = clients.get(id);
    if (!c) return;
    c.lastCmdResult = result;
    c.lastSeen = Date.now();
  },

  addJobToClient(id, jobId) {
    const c = clients.get(id);
    if (!c) return;
    c.activeJobs.add(jobId);
    c.lastSeen = Date.now();
  },

  removeJobFromClient(id, jobId) {
    const c = clients.get(id);
    if (!c) return;
    c.activeJobs.delete(jobId);
    c.lastSeen = Date.now();
  },

  // choose best client: least activeJobs, then lowest cpuLoadPercent
  // if multiple candidates tie, pick in round-robin order for fairness
  chooseBestClient() {
    const arr = [...clients.values()];
    if (arr.length === 0) return null;

    // compute primary metrics
    let bestScore = null;
    const buckets = new Map(); // scoreKey -> array of clients

    for (const c of arr) {
      const jobs = c.activeJobs.size;
      const load = (c.lastStats && Number(c.lastStats.cpuLoadPercent)) || 0;
      // score: lower is better; combine jobs and load to define tie groups
      // Use tuple-like key "jobs|loadRounded" to group near-equal loads
      const loadRounded = Math.round(load); // integer for grouping
      const key = `${jobs}|${loadRounded}`;

      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(c);

      // track best numeric comparison (jobs then load)
      if (bestScore === null) bestScore = { jobs, load };
      else if (jobs < bestScore.jobs || (jobs === bestScore.jobs && load < bestScore.load)) {
        bestScore = { jobs, load };
      }
    }

    // find bucket that matches bestScore
    const bestKey = `${bestScore.jobs}|${Math.round(bestScore.load)}`;
    const candidates = buckets.get(bestKey) || [];

    // Round-robin selection among candidates
    if (candidates.length === 1) return candidates[0];

    // ensure rrIndex cycles globally
    const pickIndex = rrIndex % candidates.length;
    const chosen = candidates[pickIndex];
    rrIndex = (rrIndex + 1) % Math.max(1, clients.size); // advance global pointer
    return chosen;
  }
};
