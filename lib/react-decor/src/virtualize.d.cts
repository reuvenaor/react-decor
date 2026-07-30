import type { AtError, ScanResult } from './scan.cjs'

export declare function virtualizeFromScan(
  code: string,
  result: ScanResult,
): { code: string; changed: boolean }

export declare function virtualize(
  code: string,
  fileName?: string,
): { code: string; changed: boolean; errors: AtError[]; hasDirectives: boolean }
