'use client';
import { useEffect, useState } from 'react';
export type Prog = { question_num: number; attempts: number; correct: number; streak_wrong: number; box: number; last_at: number | null; due_at: number | null; mastery: number };
export type Att = { question_num: number; is_correct: boolean; created_at: number; mode: string | null };
export type Study = { progress: Prog[]; attempts: Att[]; lessons: Record<string, string>; now: number };
export function useStudy() {
  const [data, setData] = useState<Study | null>(null);
  const [state, setState] = useState<'loading' | 'anon' | 'ready'>('loading');
  useEffect(() => {
    fetch('/api/progress').then(async (r) => { if (r.status === 401) { setState('anon'); return; } setData(await r.json()); setState('ready'); }).catch(() => setState('anon'));
  }, []);
  return { data, state };
}
