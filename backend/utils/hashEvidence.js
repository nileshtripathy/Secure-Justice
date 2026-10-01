const crypto = require('crypto');
const fs = require('fs');

// Streams the file in chunks so the event loop stays free for other requests.
async function hashEvidence(filePath) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(filePath)) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}

module.exports = hashEvidence;
