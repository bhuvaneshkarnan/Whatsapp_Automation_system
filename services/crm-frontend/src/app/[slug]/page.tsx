import DashboardPage from '../dashboard/page';

export function generateStaticParams() {
  return [
    { slug: 'boldlabs' },
    { slug: 'mindbodyrecovery' },
    { slug: 'dashboard' },
  ];
}

export const dynamicParams = true;

export default async function TenantDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolvedParams = await params;
  const currentSlug = resolvedParams?.slug?.toLowerCase() || 'default';
  return <DashboardPage key={currentSlug} routeSlug={resolvedParams?.slug} />;
}