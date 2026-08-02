import { DocsPage } from '@/components/docs-page'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('docs.meta.title', 'docs.meta.desc')

export default function Page() {
  return <DocsPage />
}
