export declare const meta: { name: string; version: string }
export declare function parseForESLint(
  code: string,
  options?: Record<string, unknown>,
): ReturnType<(typeof import('@typescript-eslint/parser'))['parseForESLint']>
