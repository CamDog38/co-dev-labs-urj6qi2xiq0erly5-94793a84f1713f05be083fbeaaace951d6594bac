import AdminLayout from "@/components/admin/AdminLayout";
import AnalyticsManager from "@/components/AnalyticsManager";

export default function AdminAnalytics() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics Management</h1>
        <p className="text-gray-600">
          Configure and manage analytics tracking codes for your application.
        </p>
        <AnalyticsManager />
      </div>
    </AdminLayout>
  );
}