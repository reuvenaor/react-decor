'use client'

import { useTranslation } from 'react-i18next'
import { ProsePage } from '@shared/components/site/prose-page.at'
import { A11Y_STATEMENT } from '@shared/content/a11y-statement'

/**
 * Israeli IS 5568 / WCAG 2.1 AA accessibility statement — the same body as the
 * react-router app's _app.accessibility.tsx route.
 *
 * Renders inside the shared `<main id="main">` from the SiteShell, so this page
 * provides only the content wrapper (not its own <main>). Update the
 * `a11y.statement.*` keys with the real coordinator name, contact details,
 * last-review date, and any known gaps before going to production.
 */
export function AccessibilityPage() {
  const { t } = useTranslation()
  return (
    <ProsePage>
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{t('a11y.statement.heading')}</h1>
        <p className="text-muted-foreground">{t('a11y.statement.intro')}</p>
      </header>

      <dl className="grid gap-3 sm:grid-cols-[max-content_1fr]">
        <dt className="font-medium">{t('a11y.statement.standard_label')}</dt>
        <dd className="text-muted-foreground">{t('a11y.statement.standard_value')}</dd>
        <dt className="font-medium">{t('a11y.statement.last_reviewed_label')}</dt>
        <dd className="text-muted-foreground">{t('a11y.statement.last_reviewed_value')}</dd>
      </dl>

      <section aria-labelledby="coordinator-heading" className="space-y-3">
        <h2 id="coordinator-heading" className="text-xl font-semibold">
          {t('a11y.statement.coordinator_heading')}
        </h2>
        <dl className="grid gap-3 sm:grid-cols-[max-content_1fr]">
          <dt className="font-medium">{t('a11y.statement.coordinator_name_label')}</dt>
          <dd className="text-muted-foreground">{t('a11y.statement.coordinator_name_value')}</dd>
          <dt className="font-medium">{t('a11y.statement.coordinator_email_label')}</dt>
          <dd>
            <a
              href={`mailto:${t('a11y.statement.coordinator_email_value')}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {t('a11y.statement.coordinator_email_value')}
            </a>
          </dd>
          <dt className="font-medium">{t('a11y.statement.coordinator_phone_label')}</dt>
          <dd>
            <a
              href={`tel:${t('a11y.statement.coordinator_phone_value').replace(/\s+/g, '')}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {t('a11y.statement.coordinator_phone_value')}
            </a>
          </dd>
        </dl>
      </section>

      {A11Y_STATEMENT.map(({ id, headingKey, bodyKey }) => (
        <section key={id} aria-labelledby={id} className="space-y-2">
          <h2 id={id} className="text-xl font-semibold">
            {t(headingKey)}
          </h2>
          <p className="text-muted-foreground">{t(bodyKey)}</p>
        </section>
      ))}
    </ProsePage>
  )
}
