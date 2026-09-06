import DashboardPage from '../dashboard/page';

export function generateStaticParams() {
  return [
    { slug: 'boldlabs' },
    { slug: 'mindbodyrecovery' },
    { slug: 'dashboard' },
  ];
}

export default async function TenantDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolvedParams = await params;
  return <DashboardPage routeSlug={resolvedParams?.slug} />;
}