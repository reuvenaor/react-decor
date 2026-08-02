import { HomePage } from '@/components/home-page'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('home.meta.title', 'home.meta.desc')

export default function Page() {
  return <HomePage />
}
