export interface ReactDecorOptions {
  /** Files to transform, tested against the query-stripped module id. Default: `/\.at\.tsx$/`. */
  include?: RegExp
}

// Inline import() type on purpose: `vite` is ESM-only, and a top-level `import type`
// from this CommonJS declaration is rejected under nodenext resolution (which would
// error-type the whole module for consumers).
declare function reactDecor(options?: ReactDecorOptions): import('vite').Plugin
export default reactDecor
