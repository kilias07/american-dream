import { renderReservation, reservationMetadata } from '@/views/ReservationView'

export default async function Page() {
  return renderReservation('pl')
}

export async function generateMetadata() {
  return reservationMetadata('pl')
}
