import type { DecodedSourceMap, SourceMap } from 'magic-string'
import type { AtCode, AtError, DirectiveGroup } from './scan.cjs'

export interface TransformResult {
  code: string
  map: SourceMap
  changed: boolean
}

/** Transform + decoded map + scan groups, for position-mapping consumers (at-tsc pass 2). */
export interface TransformWithDecodedMapResult {
  code: string
  decodedMap: DecodedSourceMap
  groups: DirectiveGroup[]
  changed: boolean
}

/** Build error carrying the raw-file position of the offending directive. */
export declare class AtBuildError extends Error {
  readonly atCode: AtCode
  readonly pos: number
  readonly end: number
  constructor(err: AtError)
}

export declare function transform(code: string, id: string): TransformResult
export declare function transformWithDecodedMap(
  code: string,
  id: string,
): TransformWithDecodedMapResult
