import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '@heroui/react'
import { trackEvent } from '../../api/analytics'
import { captureWizardCompletion } from '../../api/profile'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, SparkleIcon } from '../../components/icons'

interface Option {
  label: string
  value: string
  description: string
}

interface Question {
  key: 'uso' | 'presupuesto'
  prompt: string
  description: string
  options: Option[]
}

const QUESTIONS: Question[] = [
  {
    key: 'uso',
    prompt: '¿Para qué lo vas a usar principalmente?',
    description: 'Esto nos ayuda a mostrarte los vehículos que mejor se adaptan a tu día a día.',
    options: [
      { label: 'Uso familiar', value: 'SUV', description: 'Espacio y comodidad para toda la familia' },
      { label: 'Ciudad', value: 'COMPACTO', description: 'Ágil y económico para el día a día' },
      { label: 'Trabajo / campo', value: 'PICKUP', description: 'Capacidad de carga y buena tracción' },
    ],
  },
  {
    key: 'presupuesto',
    prompt: '¿Cuál es tu presupuesto aproximado?',
    description: 'Vamos a priorizar las opciones que entren en ese rango.',
    options: [
      { label: 'Hasta $20,000', value: '20000', description: 'Modelos de entrada, buena relación precio-valor' },
      { label: '$20,000 - $35,000', value: '35000', description: 'Versiones intermedias, bien equipadas' },
      { label: 'Más de $35,000', value: '', description: 'Gama alta y máximo equipamiento' },
    ],
  },
]

export function Quiz() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [askInput, setAskInput] = useState('')

  const question = QUESTIONS[step]
  const selectedValue = answers[question.key]
  const hasSelection = selectedValue !== undefined

  function select(value: string) {
    setAnswers((prev) => ({ ...prev, [question.key]: value }))
  }

  function goBack() {
    if (step > 0) setStep(step - 1)
  }

  function continueStep() {
    if (!hasSelection) return
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
      return
    }

    trackEvent({ type: 'QUIZ_COMPLETED', metadata: answers })
    // aditivo, no reemplaza el comportamiento anterior — ver CEB-41.
    captureWizardCompletion(answers.uso, answers.presupuesto)
    const params = new URLSearchParams()
    if (answers.uso) params.set('category', answers.uso)
    if (answers.presupuesto) params.set('maxPrice', answers.presupuesto)
    navigate(`/?${params.toString()}`)
  }

  // ruta separada del Wizard a propósito — ver CEB-36-UI-05: cuál de los
  // dos mecanismos usa el comprador (botones vs. este input) ES la señal,
  // no se envía nada acá, el envío real ocurre en el Research Hub.
  function askAssistant(e: FormEvent) {
    e.preventDefault()
    const message = askInput.trim()
    if (!message) return
    navigate('/asistente', { state: { pendingMessage: message } })
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-8">
      <div className="flex items-center justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Atrás
          </button>
        ) : (
          <span />
        )}
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          Paso {step + 1} de {QUESTIONS.length}
        </p>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
        />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{question.prompt}</h1>
        <p className="mt-1 text-muted">{question.description}</p>
      </div>

      <form onSubmit={askAssistant} className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 pl-4 shadow-surface">
        <SparkleIcon className="h-4 w-4 shrink-0 text-accent" />
        <Input
          fullWidth
          type="text"
          value={askInput}
          onChange={(e) => setAskInput(e.target.value)}
          placeholder="Describí tu presupuesto o necesidad con tus palabras..."
          className="border-none bg-transparent p-0 shadow-none"
        />
        <Button type="submit" size="sm" isDisabled={!askInput.trim()}>
          Preguntar
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-border" />
        O elegí una opción abajo
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((option) => {
          const isSelected = selectedValue === option.value
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => select(option.value)}
              className={`flex flex-col gap-1 rounded-2xl border p-4 text-left transition ${
                isSelected ? 'border-accent bg-accent-soft' : 'border-border bg-surface hover:border-accent/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${isSelected ? 'text-accent-soft-foreground' : 'text-foreground'}`}>
                  {option.label}
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSelected ? 'border-accent bg-accent text-accent-foreground' : 'border-border'
                  }`}
                >
                  {isSelected ? <CheckIcon className="h-3 w-3" /> : null}
                </span>
              </div>
              <p className="text-sm text-muted">{option.description}</p>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between border-t border-separator pt-4">
        <Link to="/" className="text-sm text-muted hover:text-foreground">
          Ver todo el catálogo
        </Link>
        <Button isDisabled={!hasSelection} onPress={continueStep}>
          Continuar <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
