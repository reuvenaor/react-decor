// The /docs page's anchored topics, in page order — the single source for the TOC,
// the section ids, and the hash targets used by the chrome. Labels: docs.toc.<id>.
export const DOC_SECTIONS = [
  'overview',
  'forms',
  'placements',
  'scoping',
  'target-slots',
  'keyed-tile',
  'slot',
  'footguns',
  'toolchain',
  'lint',
  'errors',
] as const

export type DocSectionId = (typeof DOC_SECTIONS)[number]
