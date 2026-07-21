const API_BASE = 'https://u28oqmzvh9.execute-api.ap-southeast-1.amazonaws.com';

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
  const res = await fetch(`${API_BASE}/reports/tests`);
  return unwrap(res);
}

/**
 * GET /reports/tests/{testId}
 * Fetch a single test's aggregate report.
 */
export async function fetchTestReport(testId) {
  const res = await fetch(`${API_BASE}/reports/tests/${encodeURIComponent(testId)}`);
  return unwrap(res);
}

/**
 * GET /reports/tests/{testId}/candidates
 * Fetch ALL candidate reports for a given test.
 */
export async function fetchTestCandidates(testId) {
  const res = await fetch(`${API_BASE}/reports/tests/${encodeURIComponent(testId)}/candidates`);
  return unwrap(res);
}

/**
 * GET /reports/tests/{testId}/candidates/{mailId}
 * Fetch an individual candidate's report for a given test.
 */
export async function fetchCandidateReport(testId, mailId) {
  const res = await fetch(
    `${API_BASE}/reports/tests/${encodeURIComponent(testId)}/candidates/${encodeURIComponent(mailId)}`
  );
  return unwrap(res);
}
