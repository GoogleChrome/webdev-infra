
import * as typedocModels from 'typedoc/dist/lib/models';


export type ReleaseType = '' | 'beta' | 'dev';

/**
 * Data about a specific symbol in Chrome, over time.
 */
export interface SymbolInfo {

  /**
   * When was this API removed from the platform?
   */
  high?: number;

  /**
   * When was this API first seen/introduced? This can be empty if it's prior to the first valid
   * .d.ts file that can be parsed (around Chrome 35).
   */
  low?: number;

  /**
   * Which release was this symbol deprecated at, if any. This will always be <= the highest API
   * version seen at. Not all APIs are deprecated before removal.
   *
   * This will be negative if deprecated prior to the first parsed version.
   */
  deprecated?: number;

  /**
   * The type of release: stable (blank), beta or dev.
   *
   * TODO: this resets the other variables when changed
   */
  release?: ReleaseType;
}

/**
 * Data about symbols inside Chrome. Missing data just implies defaults.
 */
export type VersionData = {[name: string]: SymbolInfo};

/**
 * Data about a symbol in Chrome at a specific release version.
 */
export interface RawSymbolInfo {
  deprecated: boolean;
  release: ReleaseType;
}

/**
 * Data about all symbols in Chrome at a specific release version.
 */
export interface NamesSet {
  version: number;
  data: {[name: string]: RawSymbolInfo};
}

export interface CommentHelper<T = typedocModels.Reflection> {

  /**
   * Resolves the ambiguous "foo.Bar" syntax into a complete Reflection, or void if not available
   * in this project.
   */
  resolveLink(name: string): T|void;

  /**
   * Generates a HTML link to the target, or blank for don't include a link.
   */
  generateHref(resolved: T): string;

  /**
   * Resolves an existing HTML link to a reflection, or an updated href, blank for remove.
   */
  resolveExistingHref(href: string): T|string;

}
