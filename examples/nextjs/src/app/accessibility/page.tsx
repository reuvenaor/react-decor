import { AccessibilityPage } from '@/components/accessibility-page'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('a11y.statement.title')

export default function Page() {
  return <AccessibilityPage />
}
