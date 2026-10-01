// Express 5 forwards rejected promises already, but this keeps handlers explicit
// and works the same on Express 4.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
