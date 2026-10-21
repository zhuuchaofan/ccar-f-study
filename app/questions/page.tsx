import { getQuestions, domainOf } from '@/core/content';
import QuestionList from '@/components/study/QuestionList';
import { currentUser } from '@/core/auth';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function Questions() {
  if (!(await currentUser())) redirect('/login?next=/questions');
  // list shows only the stem excerpt: no options, no answers
  const items = getQuestions().map((q) => ({ num: q.num, domain: domainOf(q), excerpt: q.i18n.zh ? q.i18n.zh.stem.slice(-70) : q.stem.slice(-140), ts: q.task_statement }));
  return <QuestionList items={items} />;
}
