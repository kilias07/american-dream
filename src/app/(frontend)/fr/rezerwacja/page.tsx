import { renderReservation, reservationMetadata } from '@/views/ReservationView'

export default async function Page() {
  return renderReservation('fr')
}

export async function generateMetadata() {
  return reservationMetadata('fr')
}
