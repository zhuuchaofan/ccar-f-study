import ExamRunner from '@/components/ExamRunner';
export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) { return <ExamRunner id={(await params).id} />; }
