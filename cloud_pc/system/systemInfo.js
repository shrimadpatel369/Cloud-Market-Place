// src/system/systemInfo.js
const si = require("systeminformation");
const logger = require("../utils/logger");

const now = () => new Date().toISOString();

function safeNum(n, fallback = 0) {
    if (n === undefined || n === null || Number.isNaN(n)) return fallback;
    return Number(n);
}

exports.gatherSystemInfo = async () => {
    logger.info("Gathering system info...");
    try {
        const cpu = await si.cpu();
        const mem = await si.mem();
        const fsInfo = await si.fsSize();
        const load = await si.currentLoad();

        // build a clean object (no accidental trailing commas)
        const info = {
            timestamp: now(),
            cpuCores: safeNum(cpu.cores, 1),
            cpuModel: `${cpu.manufacturer || ""} ${cpu.brand || ""}`.trim(),
            cpuLoadPercent: Math.round(safeNum(load.currentload, 0)),
            totalMemMB: Math.round(safeNum(mem.total, 0) / 1024 / 1024),
            freeMemMB: Math.round(safeNum(mem.available, 0) / 1024 / 1024),
            disks: Array.isArray(fsInfo)
                ? fsInfo.map((d) => ({
                    filesystem: d.fs || "",
                    mount: d.mount || "",
                    totalGB: Math.round(safeNum(d.size, 0) / 1024 ** 3),
                    freeGB: Math.round(safeNum((d.size - d.used), 0) / 1024 ** 3),
                }))
                : []
        };

        return info;
    } catch (err) {
        logger.error("System info error:", err && err.message ? err.message : err);
        return { error: err && err.message ? err.message : String(err) };
    }
};
