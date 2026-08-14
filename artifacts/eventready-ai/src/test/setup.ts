import '@testing-library/jest-dom';

/**
 * jsdom does not implement IntersectionObserver, and framer-motion's
 * `whileInView` reaches for it on mount. Any component tree containing a
 * scroll-reveal section therefore throws during render, which fails tests
 * that have nothing to do with animation.
 *
 * The stub reports nothing as intersecting. That is deliberate: tests should
 * assert on content that is present in the DOM, not on whether an entrance
 * animation has played. framer-motion still renders children when the
 * observer never fires, so this does not hide markup from the tests.
 */
if (!('IntersectionObserver' in globalThis)) {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
}
