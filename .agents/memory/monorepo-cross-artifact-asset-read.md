---
name: Reading another artifact's static files from a bundled backend
description: How to reliably locate the monorepo root from a backend artifact that needs to read another artifact's static assets off disk (not over HTTP).
---

When a backend artifact needs to read another artifact's static files
directly off disk in the same monorepo checkout (e.g. a Node API server
reading a frontend's `public/` images to forward as bytes to a third-party
API, rather than fetching them over HTTP), don't compute the monorepo root
as a hardcoded number of `path.resolve(dir, "../../..")` hops from
`import.meta.url`.

**Why:** that hop count is only valid for one specific execution shape. A
bundler (esbuild/webpack) collapses a whole source tree into one output
file, changing how many directories separate the running file from the
monorepo root — and that count differs again when the same module is
imported straight from source (e.g. via `tsx` in a test/script) instead of
through the bundle. Hardcoding the hop count silently breaks in whichever
of those two contexts you didn't test in, throwing a confusing ENOENT
rather than a clear "wrong root" error.

**How to apply:** walk upward from `import.meta.url`'s directory until you
find a file that only exists at the monorepo root (e.g. `pnpm-workspace.yaml`),
then join the target artifact's known relative path from there. This works
identically whether the code runs bundled or from source.
