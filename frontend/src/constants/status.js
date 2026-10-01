// Shared status / role metadata so every page renders them the same way.
export const STATUS_META = {
  pending:         { label: 'Pending',          pill: 'bg-yellow-900/30 text-yellow-500 border border-yellow-500/30' },
  verified:        { label: 'Verified',         pill: 'bg-blue-900/30 text-blue-500 border border-blue-500/30' },
  investigating:   { label: 'Investigating',    pill: 'bg-purple-900/30 text-purple-500 border border-purple-500/30' },
  forensic_review: { label: 'Forensic Review',  pill: 'bg-cyan-900/30 text-cyan-500 border border-cyan-500/30' },
  legal_review:    { label: 'Legal Review',     pill: 'bg-amber-900/30 text-amber-500 border border-amber-500/30' },
  closed:          { label: 'Closed',           pill: 'bg-green-900/30 text-green-500 border border-green-500/30' },
};

export const statusPill = (status) => (STATUS_META[status] || STATUS_META.pending).pill;
export const statusLabel = (status) => (STATUS_META[status] || { label: status }).label;

// Mirrors backend/config/constants.js STATUS_PERMISSIONS (the server is the real authority).
export const STATUS_PERMISSIONS = {
  admin: ['pending', 'verified', 'investigating', 'forensic_review', 'legal_review', 'closed'],
  police: ['pending', 'verified', 'investigating', 'forensic_review', 'legal_review', 'closed'],
  forensic: ['investigating', 'forensic_review', 'legal_review'],
  judge: ['legal_review'],
};

export const CRIME_TYPES = ['Theft', 'Cybercrime', 'Fraud', 'Violence', 'Other'];
export const PASSWORD_RULES = (pw) => [
  { label: 'At least 8 characters', ok: pw.length >= 8 },
  { label: 'Contains a number', ok: /\d/.test(pw) },
  { label: 'Contains a letter', ok: /[a-zA-Z]/.test(pw) },
];
