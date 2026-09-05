import BookingClient from './BookingClient';

export function generateStaticParams() {
  return [
    { slug: 'boldlabs' },
    { slug: 'dashboard' },
  ];
}

export default function PublicBookingPage() {
  return <BookingClient />;
}
