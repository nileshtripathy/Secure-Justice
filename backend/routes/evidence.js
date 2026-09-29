const express = require("express");
const router = express.Router();
const hashEvidence = require("../utils/hashEvidence");

router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const sha256 = await hashEvidence(req.file.path);

    // Independent writes run concurrently instead of one after another
    const [evidence] = await Promise.all([
      Evidence.create({ caseId: req.body.caseId, path: req.file.path, sha256 }),
      AuditLog.create({ action: "EVIDENCE_UPLOAD", user: req.user.id }),
    ]);

    res.status(201).json(evidence);
  } catch (err) {
    next(err);
  }
});

module.exports = router;