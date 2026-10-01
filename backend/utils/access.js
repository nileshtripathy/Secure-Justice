const FIR = require('../models/FIR');
const { OWN_CASES_ONLY } = require('../config/constants');
const { isObjectId } = require('./validate');

// Works for both populated documents ({ _id }) and raw ObjectIds.
const idOf = (ref) => (ref && ref._id ? String(ref._id) : ref ? String(ref) : '');

/**
 * Object-level authorization: role checks alone (RBAC) are not enough,
 * a citizen must never read somebody else's case (IDOR).
 */
const canAccessFIR = (user, fir) => {
  if (!user || !fir) return false;
  if (OWN_CASES_ONLY.includes(user.role)) return idOf(fir.userId) === user.id;
  return true;
};

// Loads a FIR by Mongo id and checks access in one step. Returns null if missing / not allowed.
const loadAccessibleFIR = async (user, firId) => {
  if (!isObjectId(firId)) return null;
  const fir = await FIR.findById(firId);
  return fir && canAccessFIR(user, fir) ? fir : null;
};

// Hide the complainant's identity on anonymous FIRs from everybody except the owner and admins.
const maskFIR = (fir, user) => {
  const obj = typeof fir.toObject === 'function' ? fir.toObject() : { ...fir };
  if (obj.isAnonymous && user.role !== 'admin' && idOf(obj.userId) !== user.id) {
    obj.userId = null;
  }
  return obj;
};

module.exports = { idOf, canAccessFIR, loadAccessibleFIR, maskFIR };
