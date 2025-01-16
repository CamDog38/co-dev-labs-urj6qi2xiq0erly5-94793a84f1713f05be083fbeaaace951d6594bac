import EventsManager from "@/components/EventsManager";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function EventsPage() {
  return (
    <ProtectedRoute>
      <EventsManager />
    </ProtectedRoute>
  );
}