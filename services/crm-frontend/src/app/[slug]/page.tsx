import DashboardPage from '../dashboard/page';

export function generateStaticParams() {
  return [
    { slug: 'boldlabs' },
    { slug: 'dashboard' },
  ];
}

export default function TenantDashboardPage() {
  return <DashboardPage />;
}