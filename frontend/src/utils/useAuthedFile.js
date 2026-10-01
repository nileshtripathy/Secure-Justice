import api from '../api/axios';

// Evidence is no longer a public URL: fetch it with the JWT and open it as a blob.
// The tab is opened synchronously (inside the click) so popup blockers allow it.
export const openEvidenceFile = async (evidenceId) => {
  const tab = window.open('', '_blank');
  try {
    const res = await api.get(`/evidence/file/${evidenceId}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    if (tab) tab.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
  } catch (err) {
    if (tab) tab.close();
    throw err;
  }
};
