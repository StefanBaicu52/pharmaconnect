# Technology Stack Analysis — PharmaConnect

## Task 0: Framework Comparison

### Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Performance | 20% | Bundle size, rendering speed, Lighthouse score |
| Ecosystem | 20% | Available libraries, community packages |
| TypeScript Support | 15% | First-class TS integration |
| Learning Curve | 15% | Time to productivity for a small team |
| Community & Jobs | 15% | GitHub stars, Stack Overflow questions, job market |
| DX (Dev Experience) | 15% | Hot reload, tooling, error messages |

### Benchmark Table (score 1–10)

| Framework | Performance | Ecosystem | TypeScript | Learning Curve | Community | DX | **Weighted Score** |
|-----------|-------------|-----------|------------|----------------|-----------|----|--------------------|
| **React 19 + Vite** | 9 | 10 | 10 | 7 | 10 | 9 | **9.15** |
| Vue 3 + Vite | 9 | 8 | 8 | 9 | 8 | 9 | **8.55** |
| Angular 17 | 8 | 9 | 10 | 5 | 8 | 7 | **7.85** |
| Svelte 5 | 10 | 6 | 7 | 8 | 6 | 9 | **7.70** |
| Next.js 14 | 9 | 10 | 10 | 6 | 9 | 8 | **8.70** |

### Justification

**Chosen stack: React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui**

1. **React** has the largest ecosystem (npm downloads: 20M+/week) and the most available component libraries. For a healthcare app requiring complex UI (data tables, modals, charts), React's mature ecosystem is essential.

2. **Vite** provides near-instant HMR (Hot Module Replacement) compared to Create React App's Webpack, reducing dev iteration time significantly. Build times are 10–100x faster.

3. **TypeScript** enforces type safety for medical data (Prescription, Order interfaces), reducing runtime bugs in critical patient-facing features.

4. **Tailwind CSS v4** enables rapid, consistent styling with built-in responsive utilities — critical for the elderly-friendly, mobile-first design requirements.

5. **shadcn/ui** provides accessible (WCAG 2.1), pre-built components (Button, Input, Dialog, Switch) that follow Radix UI accessibility primitives — important for elderly users.

6. **React Context** was chosen over Redux/Zustand for state management because the app is small enough that a single context with useState suffices, keeping complexity minimal.

### Build toolchain

| Tool | Purpose |
|------|---------|
| Vite 6 | Dev server + bundler |
| Vitest | Unit testing (runs in Vite pipeline, no separate config needed) |
| Playwright | E2E browser testing |
| @vitest/coverage-v8 | Coverage reports |
