import { useTranslation } from 'react-i18next'
import { DocTopic } from '@shared/components/docs/doc-topic'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import { ERROR_CODES } from '@shared/content/error-catalog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

@DocTopic({ id: 'errors', 'data-section': 'errors' })
export function ErrorsSection() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading title={t('docs.errors.title')} intro={t('docs.errors.intro')} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">{t('docs.errors.col_code')}</TableHead>
            <TableHead>{t('docs.errors.col_meaning')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ERROR_CODES.map((code) => (
            <TableRow key={code}>
              <TableCell>
                <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                  {code}
                </code>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm whitespace-normal">
                {t(`docs.errors.items.${code}`)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
