import ExamRunner from '@/components/exam/ExamRunner';
export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) { return <ExamRunner id={(await params).id} />; }
