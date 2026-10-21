import { getQuestions, domainOf } from '@/core/content';
import QuestionList from '@/components/QuestionList';
import { currentUser } from '@/core/auth';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function Questions() {
  if (!(await currentUser())) redirect('/login');
  // list shows only the stem excerpt: no options, no answers
  const items = getQuestions().map((q) => ({ num: q.num, domain: domainOf(q), excerpt: q.stem.slice(-140) }));
  return <QuestionList items={items} />;
}
