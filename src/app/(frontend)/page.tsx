import { redirect } from 'next/navigation'
import { getPreferredLocale } from '@/lib/getPreferredLocale'

export default async function RootPage() {
  const locale = await getPreferredLocale()
  redirect(`/${locale}`)
}
