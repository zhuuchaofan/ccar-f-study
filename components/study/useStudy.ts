'use client';
import { useEffect, useState } from 'react';
import { getStudy, isAnon, type StudySummary } from '@/lib/api';

export type Study = StudySummary;
export type Prog = StudySummary['progress'][number];

// One request shared by every component on the page (dashboard, stats, question list, lesson status).
let cached: { at: number; p: Promise<StudySummary> } | null = null;
const TTL = 30_000;
const load = () => { if (!cached || Date.now() - cached.at > TTL) cached = { at: Date.now(), p: getStudy() }; return cached.p; };
/** Call after anything that changes progress (answering, lesson status) so the next read is fresh. */
export const invalidateStudy = () => { cached = null; };

export function useStudy() {
  const [data, setData] = useState<StudySummary | null>(null);
  const [state, setState] = useState<'loading' | 'anon' | 'ready'>('loading');
  useEffect(() => {
    let live = true;
    load().then((d) => { if (live) { setData(d); setState('ready'); } }).catch((e) => { if (isAnon(e)) invalidateStudy(); if (live) setState('anon'); });
    return () => { live = false; };
  }, []);
  return { data, state };
}
