export interface LintRule {
  /** i18n key segment (docs.lint.items.<key>.what). */
  key: string
  /** Rule id, verbatim (rendered mono, never translated). */
  name: string
  /** Where the repo config applies it. */
  scope: 'at' | 'all'
}

// The eight rules shipped by react-decor/eslint — reactDecorEslint() enables the full set
// on *.at.tsx; no-key-prop / no-t-prop are additionally applied to every React file.
export const LINT_RULES: LintRule[] = [
  { key: 'no_aschild_decl_decorator', name: 'no-aschild-decl-decorator', scope: 'at' },
  { key: 'no_props_selector_decl', name: 'no-props-selector-decl', scope: 'at' },
  { key: 'no_static_return_directive', name: 'no-static-return-directive', scope: 'at' },
  { key: 'no_local_atom', name: 'no-local-atom', scope: 'at' },
  { key: 'no_passthrough_atom', name: 'no-passthrough-atom', scope: 'at' },
  { key: 'no_stray_at_sentinel', name: 'no-stray-at-sentinel', scope: 'at' },
  { key: 'no_key_prop', name: 'no-key-prop', scope: 'all' },
  { key: 'no_t_prop', name: 'no-t-prop', scope: 'all' },
]
