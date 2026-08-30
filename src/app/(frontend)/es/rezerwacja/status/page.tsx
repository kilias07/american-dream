import { renderReservationStatus, reservationStatusMetadata } from '@/views/ReservationStatusView'

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  return renderReservationStatus(id, 'es')
}

export async function generateMetadata() {
  return reservationStatusMetadata('es')
}
