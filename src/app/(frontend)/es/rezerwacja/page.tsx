import { renderReservation, reservationMetadata } from '@/views/ReservationView'

export default async function Page() {
  return renderReservation('es')
}

export async function generateMetadata() {
  return reservationMetadata('es')
}
