// The /accessibility statement's uniform heading+body blocks, in page order. Structure
// only — the copy lives in i18n (the a11y.statement.* keys). The heterogeneous header,
// standard <dl>, and coordinator blocks stay inline in the route.
export const A11Y_STATEMENT = [
  {
    id: 'assistive-heading',
    headingKey: 'a11y.statement.assistive_tech_heading',
    bodyKey: 'a11y.statement.assistive_tech_body',
  },
  {
    id: 'gaps-heading',
    headingKey: 'a11y.statement.known_gaps_heading',
    bodyKey: 'a11y.statement.known_gaps_body',
  },
  {
    id: 'feedback-heading',
    headingKey: 'a11y.statement.feedback_heading',
    bodyKey: 'a11y.statement.feedback_body',
  },
] as const
