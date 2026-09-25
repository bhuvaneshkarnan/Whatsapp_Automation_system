import BookingClient from './BookingClient';

export function generateStaticParams() {
  return [
    { slug: 'boldlabs' },
    { slug: 'mindbodyrecovery' },
    { slug: 'bizpipe-demo' },
    { slug: 'smaato-mobile' },
    { slug: 'aadhiran' },
    { slug: 'dashboard' },
  ];
}

export default function PublicBookingPage() {
  return <BookingClient />;
}
