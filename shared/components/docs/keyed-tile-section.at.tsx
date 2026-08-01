import { useTranslation } from 'react-i18next'
import { CodeBlock } from '@shared/components/docs/code-block'
import { DocTopic } from '@shared/components/docs/doc-topic'
import { IdentityDemo } from '@shared/components/docs/identity-demo.at'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import {
  SNIPPET_BAKED,
  SNIPPET_FULL_STRIP,
  SNIPPET_LOCAL_ATOM_BAD,
  SNIPPET_SPECIALIZATION,
} from '@shared/content/docs-snippets'

const PROSE = 'text-muted-foreground max-w-3xl text-base'
const SUBHEAD = 'text-lg font-semibold tracking-tight'

@DocTopic({ id: 'keyed-tile', 'data-section': 'keyed-tile' })
export function KeyedTileSection() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading title={t('docs.keyedtile.title')} intro={t('docs.keyedtile.intro')} />
      <CodeBlock filename="why-strip.at.tsx" code={SNIPPET_FULL_STRIP} />
      <p className={PROSE}>{t('docs.keyedtile.p_shape')}</p>

      <div className="flex flex-col gap-3">
        <h3 className={SUBHEAD}>{t('docs.keyedtile.forms_title')}</h3>
        <p className={PROSE}>{t('docs.keyedtile.p_forms')}</p>
        <CodeBlock filename="back-link.at.tsx" code={SNIPPET_SPECIALIZATION} />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className={SUBHEAD}>{t('docs.keyedtile.baked_title')}</h3>
        <p className={PROSE}>{t('docs.keyedtile.p_baked')}</p>
        <CodeBlock filename="section-heading.at.tsx" code={SNIPPET_BAKED} />
        <p className={PROSE}>{t('docs.keyedtile.p_passthrough')}</p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className={SUBHEAD}>{t('docs.keyedtile.demo.title')}</h3>
        <p className={PROSE}>{t('docs.keyedtile.demo.intro')}</p>
        <IdentityDemo />
        <CodeBlock code={SNIPPET_LOCAL_ATOM_BAD} />
        <p className={PROSE}>{t('docs.keyedtile.demo.bad_note')}</p>
      </div>
    </>
  )
}
