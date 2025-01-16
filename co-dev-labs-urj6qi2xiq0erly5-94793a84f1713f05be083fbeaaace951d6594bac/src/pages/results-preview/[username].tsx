import { useRouter } from 'next/router';
import { ResultsWidget } from '@/components/ResultsWidget';

export default function ResultsPreviewPage() {
  const router = useRouter();
  const { username } = router.query;

  if (!username || typeof username !== 'string') {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <ResultsWidget username={username} />
    </div>
  );
}