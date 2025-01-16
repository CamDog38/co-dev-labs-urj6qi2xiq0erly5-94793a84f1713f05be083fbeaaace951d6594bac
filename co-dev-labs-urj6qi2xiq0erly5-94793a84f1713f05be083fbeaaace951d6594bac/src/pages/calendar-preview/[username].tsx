import { useRouter } from 'next/router';
import { CalendarWidget } from '@/components/CalendarWidget';

export default function CalendarPreviewPage() {
  const router = useRouter();
  const { username } = router.query;

  if (!username || typeof username !== 'string') {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <CalendarWidget username={username} />
    </div>
  );
}