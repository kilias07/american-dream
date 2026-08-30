import { renderReservation, reservationMetadata } from '@/views/ReservationView'

export default async function Page() {
  return renderReservation('de')
}

export async function generateMetadata() {
  return reservationMetadata('de')
}
