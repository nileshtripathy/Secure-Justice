const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const fs = require('fs');
const path = require('path');

process.env.JWT_SECRET = 'test-secret-test-secret-123';

const { authorize } = require('../middleware/authMiddleware');
const rateLimit = require('../middleware/rateLimit');
const hashEvidence = require('../utils/hashEvidence');
const { generateOtp, hashOtp, safeEqual } = require('../utils/otp');
const { isEmail, isStrongPassword, isObjectId, cleanString } = require('../utils/validate');
const { canAccessFIR, maskFIR } = require('../utils/access');
const { resolveUpload } = require('../middleware/upload');

const mockRes = () => {
  const res = { statusCode: 200, headers: {} };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.set = (k, v) => { res.headers[k] = v; return res; };
  return res;
};

test('authorize allows listed roles and rejects others with 403', () => {
  let called = false;
  authorize('police', 'admin')({ user: { role: 'police' } }, mockRes(), () => { called = true; });
  assert.equal(called, true);

  const res = mockRes();
  authorize('police', 'admin')({ user: { role: 'citizen' } }, res, () => assert.fail('must not pass'));
  assert.equal(res.statusCode, 403);
});

test('rate limiter blocks after max requests', () => {
  const limiter = rateLimit({ windowMs: 60000, max: 2 });
  const req = { ip: '1.2.3.4' };
  let passed = 0;
  for (let i = 0; i < 3; i += 1) limiter(req, mockRes(), () => { passed += 1; });
  assert.equal(passed, 2);
  const res = mockRes();
  limiter(req, res, () => assert.fail('should be limited'));
  assert.equal(res.statusCode, 429);
});

test('hashEvidence matches known SHA-256 and detects a changed file', async () => {
  const f = path.join(os.tmpdir(), `ev-${Date.now()}.txt`);
  fs.writeFileSync(f, 'abc');
  const h = await hashEvidence(f);
  assert.equal(h, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  fs.writeFileSync(f, 'abd');
  assert.notEqual(await hashEvidence(f), h);
  fs.unlinkSync(f);
});

test('otp is 6 digits, hashed, and compared safely', () => {
  const otp = generateOtp();
  assert.match(otp, /^\d{6}$/);
  const h = hashOtp('a@b.com', otp);
  assert.notEqual(h, otp);
  assert.ok(safeEqual(h, hashOtp('a@b.com', otp)));
  assert.ok(!safeEqual(h, hashOtp('a@b.com', '000000') ));
  assert.ok(!safeEqual(h, hashOtp('other@b.com', otp)));
});

test('validators reject NoSQL-injection objects and weak input', () => {
  assert.equal(isEmail({ $ne: null }), false);
  assert.equal(isEmail('user@example.com'), true);
  assert.equal(isStrongPassword('short1'), false);
  assert.equal(isStrongPassword('longenough'), false);
  assert.equal(isStrongPassword('longenough1'), true);
  assert.equal(isObjectId('507f1f77bcf86cd799439011'), true);
  assert.equal(isObjectId({ $gt: '' }), false);
  assert.equal(cleanString({ $gt: '' }), '');
});

test('citizens can only access their own FIRs; staff can access all', () => {
  const fir = { userId: 'u1' };
  assert.equal(canAccessFIR({ id: 'u1', role: 'citizen' }, fir), true);
  assert.equal(canAccessFIR({ id: 'u2', role: 'citizen' }, fir), false);
  assert.equal(canAccessFIR({ id: 'p1', role: 'police' }, fir), true);
});

test('anonymous FIRs hide the complainant from police but not from the owner/admin', () => {
  const fir = { userId: { _id: 'u1', name: 'Alice' }, isAnonymous: true };
  assert.equal(maskFIR(fir, { id: 'p1', role: 'police' }).userId, null);
  assert.equal(maskFIR(fir, { id: 'u1', role: 'citizen' }).userId.name, 'Alice');
  assert.equal(maskFIR(fir, { id: 'a1', role: 'admin' }).userId.name, 'Alice');
});

test('resolveUpload refuses path traversal', () => {
  const p = resolveUpload('../../etc/passwd');
  assert.ok(p === null || p.endsWith(`${path.sep}passwd`) && p.includes(`${path.sep}uploads${path.sep}`));
  assert.equal(resolveUpload(''), null);
});
