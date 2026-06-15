# Conventions

- Functional components, explicit TypeScript `interface` for props.
- Avoid external icon libs; prefer inline SVGs (or `lucide-react` only if already present).
- Browser-only APIs (`window`, `navigator`, `document`) must guard with `useEffect` or `typeof window !== 'undefined'`.
- Static images go `public/images/`, referenced as `/images/file.png`.
- Match surrounding code comment density, naming, idiom.
- Synchronous-read-after-set: no read state value right after its setter in same handler — stale. Use `useRef` if need value now.
- Prefer stable identifiers (data attributes, refs) over matching rendered style strings when querying DOM.