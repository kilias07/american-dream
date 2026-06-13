import { renderReservation, reservationMetadata } from '@/views/ReservationView'

export default async function Page() {
  return renderReservation('en')
}

export async function generateMetadata() {
  return reservationMetadata('en')
}
