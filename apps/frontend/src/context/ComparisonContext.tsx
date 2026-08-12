import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { trackEvent } from '../api/analytics'

const STORAGE_KEY = 'car-dealer-comparison'
const MAX_VEHICLES = 4

type State = number[]

type Action =
  | { type: 'ADD'; id: number }
  | { type: 'REMOVE'; id: number }
  | { type: 'CLEAR' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      if (state.includes(action.id) || state.length >= MAX_VEHICLES) return state
      return [...state, action.id]
    case 'REMOVE':
      return state.filter((id) => id !== action.id)
    case 'CLEAR':
      return []
  }
}

function loadInitialState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_VEHICLES) : []
  } catch {
    return []
  }
}

interface ComparisonContextValue {
  vehicleIds: number[]
  maxVehicles: number
  addVehicle: (id: number) => void
  removeVehicle: (id: number) => void
  clear: () => void
  isFull: boolean
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null)

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [vehicleIds, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicleIds))
  }, [vehicleIds])

  const value: ComparisonContextValue = {
    vehicleIds,
    maxVehicles: MAX_VEHICLES,
    addVehicle: (id) => {
      // solo trackear si realmente va a entrar — mismo guard que el reducer.
      if (!vehicleIds.includes(id) && vehicleIds.length < MAX_VEHICLES) {
        trackEvent({ type: 'VEHICLE_ADDED_TO_COMPARISON', vehicleId: id })
      }
      dispatch({ type: 'ADD', id })
    },
    removeVehicle: (id) => dispatch({ type: 'REMOVE', id }),
    clear: () => dispatch({ type: 'CLEAR' }),
    isFull: vehicleIds.length >= MAX_VEHICLES,
  }

  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>
}

export function useComparison(): ComparisonContextValue {
  const ctx = useContext(ComparisonContext)
  if (!ctx) throw new Error('useComparison debe usarse dentro de ComparisonProvider')
  return ctx
}
