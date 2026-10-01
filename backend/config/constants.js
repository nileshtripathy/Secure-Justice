// Single source of truth for roles, statuses and who may do what.
const ROLES = ['citizen', 'police', 'forensic', 'lawyer', 'victim', 'defendant', 'judge', 'admin'];

// Roles a person may pick when self-registering. "admin", "judge" can never be self-assigned.
const SELF_REGISTER_ROLES = ['citizen', 'police', 'forensic', 'lawyer'];
// These need an ID card and must be approved by an admin before they can log in.
const APPROVAL_ROLES = ['police', 'forensic', 'lawyer'];

const FIR_STATUSES = ['pending', 'verified', 'investigating', 'forensic_review', 'legal_review', 'closed'];

// Which statuses each role may set through PUT /api/fir/:id
const STATUS_PERMISSIONS = {
  admin: FIR_STATUSES,
  police: FIR_STATUSES,
  forensic: ['investigating', 'forensic_review', 'legal_review'],
  judge: ['legal_review'], // judges close a case by recording a judgment
};

// Roles that only ever see their own FIRs
const OWN_CASES_ONLY = ['citizen', 'victim', 'defendant'];

const EVIDENCE_UPLOAD_ROLES = ['police', 'forensic', 'admin'];
const EVIDENCE_VERIFY_ROLES = ['forensic', 'judge', 'police', 'admin'];

module.exports = {
  ROLES,
  SELF_REGISTER_ROLES,
  APPROVAL_ROLES,
  FIR_STATUSES,
  STATUS_PERMISSIONS,
  OWN_CASES_ONLY,
  EVIDENCE_UPLOAD_ROLES,
  EVIDENCE_VERIFY_ROLES,
};
