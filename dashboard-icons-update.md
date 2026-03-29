# Task: Dashboard Icons Update

Update the icons in the first three KPI cards of the Dashboard and standardize them using the common `KpiCard` component.

## 🛠 Proposed Changes

### 1. `src/pages/Index.tsx`
- Import `Users`, `UserMinus`, `FileCheck` from `lucide-react`.
- Import `KpiCard` from `@/components/ui/kpi-card`.
- Replace the three hardcoded overview cards with `KpiCard` instances.
- Maintain existing data bindings (`headcountAtivo`, `headcountDeletado`, `contratosAtivos`).

## ✅ Verification Plan

### Manual Verification
- Check the "Visão geral" page to ensure the icons are correctly displayed.
- Verify that the colors match the icons on the "Colaboradores" page (light blue background, dark blue icon).
- Ensure the layout remains consistent (three cards in a vertical stack on desktop).

### Quality Control
- Run `npm run lint` to ensure no styling or import issues.
- Run `npx tsc --noEmit` to verify type safety.
