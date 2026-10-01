// Controller logic tests with the Mongoose models stubbed (no database needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

process.env.JWT_SECRET = 'test-secret-test-secret-123';

const Evidence = require('../models/Evidence');
const FIR = require('../models/FIR');
const CaseLog = require('../models/CaseLog');
const User = require('../models/User');
const Notification = require('../models/Notification');
const hashEvidence = require('../utils/hashEvidence');
const { UPLOAD_DIR } = require('../middleware/upload');
const { verifyEvidence } = require('../controllers/evidenceController');
const { updateFIRStatus, createFIR } = require('../controllers/firController');

const ID = '507f1f77bcf86cd799439011';
const FIR_ID = '507f1f77bcf86cd799439012';
const OWNER = '507f1f77bcf86cd799439013';
const POLICE = '507f1f77bcf86cd799439014';

const mockRes = () => {
  const res = { statusCode: 200 };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
};
const logs = [];
CaseLog.create = async (d) => { logs.push(d); return d; };
Notification.insertMany = async () => [];

test('verifyEvidence: intact file verifies, modified file is flagged as tampered', async () => {
  const name = `test-${Date.now()}.txt`;
  const file = path.join(UPLOAD_DIR, name);
  fs.writeFileSync(file, 'original evidence');
  const goodHash = await hashEvidence(file);

  Evidence.findById = async () => ({ _id: ID, firId: FIR_ID, fileUrl: name, fileHash: goodHash });
  FIR.findById = () => ({ select: async () => ({ userId: OWNER }) });
  const req = { params: { id: ID }, user: { id: POLICE, role: 'police' } };

  let res = mockRes();
  await verifyEvidence(req, res);
  assert.equal(res.body.verified, true);

  fs.writeFileSync(file, 'tampered evidence'); // simulate tampering on disk
  res = mockRes();
  await verifyEvidence(req, res);
  assert.equal(res.body.verified, false);
  assert.notEqual(res.body.currentHash, res.body.originalHash);
  assert.ok(logs.some((l) => /hash mismatch/.test(l.action)));

  fs.unlinkSync(file);
  res = mockRes();
  await verifyEvidence(req, res);
  assert.equal(res.body.verified, false); // missing file is also a failure, not a silent "verified"
});

const makeFir = (over = {}) => {
  const fir = {
    _id: FIR_ID, caseNumber: 'FIR-2026-12345678', userId: OWNER, status: 'pending', judgment: '',
    assignedPoliceId: undefined, saved: false,
    save: async function () { this.saved = true; },
    populate: async function () { return this; },
    toObject: function () { return { ...this }; },
    ...over,
  };
  return fir;
};
const run = async (user, body, firOver) => {
  const fir = makeFir(firOver);
  FIR.findById = async () => fir;
  User.findOne = () => ({ select: async () => ({ name: 'Officer', _id: POLICE }) });
  const res = mockRes();
  await updateFIRStatus({ params: { id: FIR_ID }, user, body, app: { get: () => null } }, res);
  return { res, fir };
};

test('updateFIRStatus enforces role permissions', async () => {
  let r = await run({ id: POLICE, role: 'police' }, { status: 'investigating' });
  assert.equal(r.res.statusCode, 200);
  assert.equal(r.fir.status, 'investigating');
  assert.ok(logs.some((l) => l.action === 'Status updated to investigating')); // old bug logged "undefined"

  r = await run({ id: 'x', role: 'forensic' }, { status: 'closed' });
  assert.equal(r.res.statusCode, 403);

  r = await run({ id: 'x', role: 'police' }, { status: 'bogus' });
  assert.equal(r.res.statusCode, 400);

  r = await run({ id: 'x', role: 'citizen' }, { status: 'closed' }, { userId: 'someone-else' });
  assert.equal(r.res.statusCode, 404); // citizens cannot even see other people's cases
});

test('judgment is saved, closes the case, judge-only, and cannot be overwritten', async () => {
  let r = await run({ id: 'j1', role: 'judge' }, { judgment: 'Guilty', status: 'closed' }, { status: 'legal_review' });
  assert.equal(r.res.statusCode, 200);
  assert.equal(r.fir.judgment, 'Guilty');
  assert.equal(r.fir.status, 'closed');
  assert.ok(r.fir.judgmentDate instanceof Date);

  r = await run({ id: 'p', role: 'police' }, { judgment: 'x' });
  assert.equal(r.res.statusCode, 403);

  r = await run({ id: 'j1', role: 'judge' }, { judgment: 'Changed' }, { status: 'legal_review', judgment: 'Guilty' });
  assert.equal(r.res.statusCode, 400);
});

test('closed cases are locked for everyone but admin', async () => {
  let r = await run({ id: POLICE, role: 'police' }, { status: 'pending' }, { status: 'closed' });
  assert.equal(r.res.statusCode, 400);
  r = await run({ id: 'a', role: 'admin' }, { status: 'investigating' }, { status: 'closed' });
  assert.equal(r.res.statusCode, 200);
});

test('police can assign themselves to a case', async () => {
  const r = await run({ id: POLICE, role: 'police' }, { assignedPoliceId: 'me' });
  assert.equal(r.res.statusCode, 200);
  assert.equal(String(r.fir.assignedPoliceId), POLICE);
});

test('createFIR validates input', async () => {
  let res = mockRes();
  await createFIR({ body: { complaintText: 'x', location: 'y', crimeType: 'Hacking' }, user: { id: OWNER } }, res);
  assert.equal(res.statusCode, 400);
  res = mockRes();
  await createFIR({ body: { complaintText: { $gt: '' }, location: 'y', crimeType: 'Theft' }, user: { id: OWNER } }, res);
  assert.equal(res.statusCode, 400);

  FIR.create = async (d) => ({ _id: FIR_ID, ...d });
  res = mockRes();
  await createFIR({ body: { complaintText: 'Phone stolen', location: 'Market', crimeType: 'Theft' }, user: { id: OWNER } }, res);
  assert.equal(res.statusCode, 201);
  assert.match(res.body.caseNumber, /^FIR-\d{4}-\d{8}$/);
});
