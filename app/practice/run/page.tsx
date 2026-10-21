import { Suspense } from 'react';
import QuizRunner from '@/components/quiz/QuizRunner';
export default function Run() { return <Suspense fallback={<p className="muted">加载中…</p>}><QuizRunner /></Suspense>; }
