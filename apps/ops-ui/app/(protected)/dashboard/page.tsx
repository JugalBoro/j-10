import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  // Skip authentication for development
  return <DashboardClient />;
}