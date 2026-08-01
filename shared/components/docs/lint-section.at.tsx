import { useTranslation } from 'react-i18next'
import { DocTopic } from '@shared/components/docs/doc-topic'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import { LINT_RULES } from '@shared/content/lint-rules'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

@DocTopic({ id: 'lint', 'data-section': 'lint' })
export function LintSection() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading title={t('docs.lint.title')} intro={t('docs.lint.intro')} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('docs.lint.col_rule')}</TableHead>
            <TableHead>{t('docs.lint.col_scope')}</TableHead>
            <TableHead>{t('docs.lint.col_what')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {LINT_RULES.map((rule) => (
            <TableRow key={rule.key}>
              <TableCell className="font-mono text-xs whitespace-nowrap">{rule.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {rule.scope === 'at' ? t('docs.lint.scope_at') : t('docs.lint.scope_all')}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm whitespace-normal">
                {t(`docs.lint.items.${rule.key}.what`)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-muted-foreground max-w-3xl text-base">{t('docs.lint.p_disable')}</p>
    </>
  )
}
