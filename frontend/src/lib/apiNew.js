export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options };
  const response = await fetch(url, config);
  if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
  return response.json();
}

export async function getCaseDetail(caseId: string) { return apiFetch<any>(`/api/cases/${caseId}/detail`); }
export async function saveCaseDraft(caseId: string, data: any) {
  const res = await fetch(`${API_BASE}/api/cases/${caseId}/draft`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save draft');
  return res.json();
}
