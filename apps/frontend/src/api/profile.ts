import { api } from './client'
import { getSessionId } from './analytics'

// ponytail: fire-and-forget, mismo criterio que trackEvent — completar el
// Wizard no debe bloquearse ni fallar visiblemente si esto no llega.
export function captureWizardCompletion(uso: string, presupuesto: string): void {
  api
    .post('/profile/wizard-completion', {
      sessionId: getSessionId(),
      uso,
      presupuesto: presupuesto === '' ? '' : Number(presupuesto),
    })
    .catch(() => {
      /* fire-and-forget */
    })
}
