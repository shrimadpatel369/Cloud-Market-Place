// simple auth middleware for API endpoints
module.exports = function apiAuth(req, res, next) {
const header = req.headers['x-auth-token'] || req.query.token;
const valid = header && header === process.env.AUTH_TOKEN;
if (!valid) return res.status(401).json({ error: 'unauthorized' });
next();
};