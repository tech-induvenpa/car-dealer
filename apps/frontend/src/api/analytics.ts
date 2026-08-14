import { api } from './client'

const SESSION_KEY = 'car-dealer-session-id'

export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

type AnalyticsEventType =
  | 'VEHICLE_VIEWED'
  | 'VEHICLE_ADDED_TO_COMPARISON'
  | 'COMPARISON_PERFORMED'
  | 'QUIZ_COMPLETED'

interface TrackEventInput {
  type: AnalyticsEventType
  vehicleId?: number
  vehicleIds?: number[]
  metadata?: Record<string, unknown>
}

// ponytail: fire-and-forget — nunca bloquea la UI, un fallo de red no debe
// romper la experiencia del visitante.
export function trackEvent(input: TrackEventInput): void {
  api
    .post('/analytics/events', { ...input, sessionId: getSessionId() })
    .catch(() => {
      /* fire-and-forget */
    })
}

export interface VehicleCount {
  vehicleId: number
  count: number
}

export interface PairCount {
  vehicleIds: [number, number]
  count: number
}

export interface DashboardResult {
  topViewed: VehicleCount[]
  topCompared: VehicleCount[]
  topPairs: PairCount[]
  leadsByVehicle: VehicleCount[]
}

// admin — requiere sesión
export function getDashboard(): Promise<DashboardResult> {
  return api.get<DashboardResult>('/analytics/dashboard')
}
