// The AT error codes in catalog order (AT010 is unassigned upstream). Meanings live
// in i18n (docs.errors.items.<code>).
export const ERROR_CODES = [
  'AT000',
  'AT001',
  'AT002',
  'AT003',
  'AT004',
  'AT005',
  'AT006',
  'AT007',
  'AT008',
  'AT009',
  'AT011',
  'AT012',
  'AT013',
  'AT014',
  'AT015',
  'AT016',
  'AT017',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]
