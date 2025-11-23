// src/jobs/jobQueue.js
// -------------------------------------------------------------
// Lightweight in-memory job queue with status tracking.
// Each job can represent a task (e.g., sending a command to a VM or waiting for agent result).
// In production, replace this with a persistent queue (Redis, RabbitMQ, etc.).

const jobs = new Map();
let jobCounter = 1;

/**
 * Create a new job.
 * @param {Object} jobData - Initial job data (like action, payload, targetClientId)
 * @returns {String} jobId
 */
function create(jobData) {
    const id = String(jobCounter++);
    const rec = {
        id,
        status: 'pending', // pending | running | completed | failed
        createdAt: Date.now(),
        updatedAt: null,
        job: jobData || {},
        result: null,
        error: null,
    };
    jobs.set(id, rec);
    return id;
}

/**
 * Update job status.
 * @param {String} id - jobId
 * @param {String} status - new status
 * @param {Object} [result] - optional result data
 */
function setStatus(id, status, result) {
    if (!jobs.has(id)) return null;
    const rec = jobs.get(id);
    rec.status = status;
    rec.updatedAt = Date.now();
    if (status === 'completed') rec.result = result || null;
    if (status === 'failed') rec.error = result || null;
    jobs.set(id, rec);
    return rec;
}

/**
 * Get a job by ID.
 */
function get(id) {
    return jobs.get(id) || null;
}

/**
 * List all jobs.
 */
function list() {
    return Array.from(jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Delete job (optional cleanup)
 */
function remove(id) {
    return jobs.delete(id);
}

/**
 * Simple helper to wrap async job execution.
 * Example:
 *   const id = create({action: 'create_vm'});
 *   run(id, async () => { ... });
 */
async function run(id, fn) {
    const rec = jobs.get(id);
    if (!rec) throw new Error('job_not_found');
    try {
        setStatus(id, 'running');
        const result = await fn();
        setStatus(id, 'completed', result);
        return result;
    } catch (err) {
        setStatus(id, 'failed', { message: err.message });
        throw err;
    }
}

module.exports = {
    create,
    setStatus,
    get,
    list,
    remove,
    run,
};
