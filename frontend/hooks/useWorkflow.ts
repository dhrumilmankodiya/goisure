import { useState, useCallback, useRef, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface WorkflowState {
  caseId: string;
  tab: string;
  changes: Record<string, any>;
  timestamp: string;
}

export function useWorkflow(caseId: string) {
  const [savedState, setSavedState] = useState<WorkflowState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!caseId || caseId === '[caseId]') return;
    const stored = localStorage.getItem(`workflow_${caseId}`);
    if (stored) {
      try { setSavedState(JSON.parse(stored)); setLastSavedAt(Date.now()); } catch (e) {}
    }
  }, [caseId]);

  const saveState = useCallback(async (state: any) => {
    if (!caseId || caseId === '[caseId]') return;
    setIsSaving(true);
    try {
      const ws = { ...state, savedAt: new Date().toISOString() };
      localStorage.setItem(`workflow_${caseId}`, JSON.stringify(ws));
      await fetch(`${API_BASE}/api/cases/${caseId}/workflow`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ws),
      }).catch(() => {});
      setSavedState(ws); setLastSavedAt(Date.now()); setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Save failed:', err);
      const ws = { ...state, savedAt: new Date().toISOString() };
      localStorage.setItem(`workflow_${caseId}`, JSON.stringify(ws));
      setSavedState(ws); setLastSavedAt(Date.now()); setHasUnsavedChanges(false);
    } finally { setIsSaving(false); }
  }, [caseId]);

  const clearSavedState = useCallback(() => {
    localStorage.removeItem(`workflow_${caseId}`);
    setSavedState(null); setLastSavedAt(null); setHasUnsavedChanges(false);
  }, [caseId]);

  const resumeWorkflow = useCallback(async () => {
    if (!caseId) return null;
    const stored = localStorage.getItem(`workflow_${caseId}`);
    if (stored) { try { return JSON.parse(stored); } catch (e) {} }
    try {
      const res = await fetch(`${API_BASE}/api/cases/${caseId}/resume`);
      if (res.ok) { const d = await res.json(); return d.draft; }
    } catch (e) {}
    return null;
  }, [caseId]);

  const checkResumeAvailability = useCallback(async (id: string) => {
    const stored = localStorage.getItem(`workflow_${id}`);
    if (stored) { try { const d = JSON.parse(stored); if (d.timestamp) setHasUnsavedChanges(true); } catch (e) {} }
  }, []);

  return { savedState, isSaving, isSavingDraft, lastSavedAt, hasUnsavedChanges, saveState, clearSavedState, resumeWorkflow, checkResumeAvailability };
}
