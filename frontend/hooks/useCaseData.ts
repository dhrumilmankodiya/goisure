import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useCaseData(caseId: string | undefined) {
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const fetchData = useCallback(async () => {
    if (!caseId || caseId === '[caseId]') { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/cases/${caseId}/detail`);
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      if (mounted.current) { setCaseData(data); setError(null); }
    } catch (err: any) {
      if (mounted.current) { setError(err.message); console.error(err); }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [caseId]);

  const refresh = useCallback(() => { setRefreshCount(c => c + 1); fetchData(); }, [fetchData]);

  useEffect(() => { fetchData(); }, [fetchData, refreshCount]);

  return { caseData, loading, error, refresh, refreshCount };
}
