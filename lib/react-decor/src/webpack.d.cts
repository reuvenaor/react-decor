/**
 * Minimal structural slice of the webpack LoaderContext this loader touches —
 * declared inline so the package needs no dependency on webpack's types.
 */
export interface ReactDecorLoaderContext {
  resourcePath: string
  callback: (err: Error | null, content?: string, map?: object) => void
}

declare function reactDecorLoader(this: ReactDecorLoaderContext, source: string, map?: object): void
export default reactDecorLoader
