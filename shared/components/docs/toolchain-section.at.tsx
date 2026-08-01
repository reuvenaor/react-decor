import { useTranslation } from 'react-i18next'
import { CodeBlock } from '@shared/components/docs/code-block'
import { DocTopic } from '@shared/components/docs/doc-topic'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import { SNIPPET_VIRTUALIZED } from '@shared/content/docs-snippets'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// The four tools whose shims keep the raw syntax green. Rows are lowercase leaves
// via the table primitives, so the map keys the row directly.
const TOOL_KEYS = ['tsc', 'ide', 'eslint', 'prettier'] as const

@DocTopic({ id: 'toolchain', 'data-section': 'toolchain' })
export function ToolchainSection() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading title={t('docs.toolchain.title')} intro={t('docs.toolchain.intro')} />
      <CodeBlock code={SNIPPET_VIRTUALIZED} />
      <p className="text-muted-foreground max-w-3xl text-base">{t('docs.toolchain.p1')}</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('docs.toolchain.col_tool')}</TableHead>
            <TableHead>{t('docs.toolchain.col_shim')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {TOOL_KEYS.map((key) => (
            <TableRow key={key}>
              <TableCell className="font-mono text-xs whitespace-nowrap">
                {t(`docs.toolchain.tools.${key}.name`)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm whitespace-normal">
                {t(`docs.toolchain.tools.${key}.shim`)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
