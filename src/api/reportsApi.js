export const API_BASE = 'https://u28oqmzvh9.execute-api.ap-southeast-1.amazonaws.com';

/**
 * Unwrap the API envelope { success, message, data } and surface errors.
 */
async function unwrap(res) {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `API error ${res.status}${res.statusText ? ` (${res.statusText})` : ''}${body ? `: ${body}` : ''}`
    );
  }
  const json = await res.json();
  if (json.success === false) {
    throw new Error(`API returned failure: ${json.message || 'Unknown error'}`);
  }
  return json.data;
}

/**
 * GET /reports/tests
 * Fetch all test reports (aggregate stats per test).
 */
export async function fetchAllReports() {
  const res = await fetch(`${API_BASE}/reports/tests?_=${Date.now()}`, { cache: 'no-store' });
  return unwrap(res);
}

/**
 * GET /reports/tests/{testId}
 * Fetch a single test's aggregate report.
 */
export async function fetchTestReport(testId) {
  const res = await fetch(`${API_BASE}/reports/tests/${encodeURIComponent(testId)}?_=${Date.now()}`, { cache: 'no-store' });
  return unwrap(res);
}

/**
 * DELETE /reports/tests/{testId}
 * Delete a single test report.
 */
export async function deleteTestReport(testId) {
  const res = await fetch(`${API_BASE}/reports/tests/${encodeURIComponent(testId)}`, {
    method: 'DELETE'
  });
  return unwrap(res);
}

/**
 * GET /reports/tests/{testId}/candidates
 * Fetch ALL candidate reports for a given test.
 */
export async function fetchTestCandidates(testId, page = 1, limit = 10) {
  const res = await fetch(`${API_BASE}/reports/tests/${encodeURIComponent(testId)}/candidates?page=${page}&limit=${limit}&_=${Date.now()}`, { cache: 'no-store' });
  return unwrap(res);
}

/**
 * GET /reports/tests/{testId}/candidates/{mailId}
 * Fetch an individual candidate's report for a given test.
 */
export async function fetchCandidateReport(testId, mailId) {
  const res = await fetch(
    `${API_BASE}/reports/tests/${encodeURIComponent(testId)}/candidates/${encodeURIComponent(mailId)}?_=${Date.now()}`,
    { cache: 'no-store' }
  );
  return unwrap(res);
}

/**
 * GET /rankings/{testId}
 * Fetch candidate rankings in a sorted/ranked way.
 */
export async function fetchCandidateRankings(testId) {
  const res = await fetch(`${API_BASE}/rankings/${encodeURIComponent(testId)}?_=${Date.now()}`, { cache: 'no-store' });
  return unwrap(res);
}

/**
 * GET /rankings/{testId}/shortlisted
 * Fetch only shortlisted candidates.
 */
export async function fetchShortlistedCandidates(testId) {
  const res = await fetch(`${API_BASE}/rankings/${encodeURIComponent(testId)}/shortlisted?_=${Date.now()}`, { cache: 'no-store' });
  return unwrap(res);
}

/**
 * POST /rankings/{testId}/generate
 * Generate or regenerate the ranking and shortlist using thresholds.
 */
export async function generateRankings(testId, { topN, minimumPercentage, maximumWarnings, passedOnly }) {
  const res = await fetch(`${API_BASE}/rankings/${encodeURIComponent(testId)}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topN: Number(topN),
      minimumPercentage: Number(minimumPercentage),
      maximumWarnings: Number(maximumWarnings),
      passedOnly: Boolean(passedOnly),
    }),
  });
  return unwrap(res);
}
