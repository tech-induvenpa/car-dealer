// El Wizard captura un tope único, no un rango (ver CEB-41 / Quiz.tsx:
// 20000 | 35000 | '' para "más de $35,000"). Profile.budgetRange siempre
// tiene piso y techo, así que se normaliza acá — piso 0 para los topes
// finitos, y para "más de $35,000" el piso pasa a ser 35000 en vez de 0.
const WIZARD_UNBOUNDED_BUDGET_FLOOR = 35000;

// ponytail: el Wizard no define un techo real para "más de $35,000" — este
// valor es un techo práctico solo para que BudgetRange tenga un max finito
// y agregable, no un dato real del comprador. Ajustar si el negocio define
// un techo de mercado real más adelante.
const UNBOUNDED_BUDGET_PRACTICAL_CAP = 100000;

export function normalizeWizardBudget(topeWizard: number | ''): { min: number; max: number } {
  if (topeWizard === '') {
    return { min: WIZARD_UNBOUNDED_BUDGET_FLOOR, max: UNBOUNDED_BUDGET_PRACTICAL_CAP };
  }
  return { min: 0, max: topeWizard };
}
