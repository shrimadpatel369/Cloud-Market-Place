const { exec } = require('child_process');


module.exports = function execPromise(cmd, opts = {}) {
return new Promise((resolve, reject) => {
exec(cmd, { maxBuffer: 1024 * 1024 * 10, ...opts }, (err, stdout, stderr) => {
if (err) return reject(new Error(stderr || err.message));
resolve(stdout ? stdout.toString() : '');
});
});
};