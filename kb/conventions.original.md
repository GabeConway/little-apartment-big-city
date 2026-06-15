# Conventions

- Functional components with explicit TypeScript `interface` for props.
- Avoid external icon libraries; prefer inline SVGs (or `lucide-react` only if already present).
- Browser-only APIs (`window`, `navigator`, `document`) must be guarded with `useEffect` or `typeof window !== 'undefined'`.
- Static images go in `public/images/`, referenced as `/images/file.png`.
- Match surrounding code's comment density, naming, and idiom.
- Synchronous-read-after-set: don't read a state value right after its setter in the same handler — it's stale. Use a `useRef` if you need the value immediately.
- Prefer stable identifiers (data attributes, refs) over matching on rendered style strings when querying the DOM.
