// Never send internal error messages to clients; log them server-side.
const logError = (context, err) => console.error(`[${context}]`, err && err.stack ? err.stack : err);
module.exports = { logError };
