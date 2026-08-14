import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { trackEvent } from '../../api/analytics'

interface Question {
  key: 'uso' | 'presupuesto'
  prompt: string
  options: { label: string; value: string }[]
}

const QUESTIONS: Question[] = [
  {
    key: 'uso',
    prompt: '¿Para qué lo vas a usar principalmente?',
    options: [
      { label: 'Uso familiar', value: 'SUV' },
      { label: 'Ciudad', value: 'COMPACTO' },
      { label: 'Trabajo / campo', value: 'PICKUP' },
    ],
  },
  {
    key: 'presupuesto',
    prompt: '¿Cuál es tu presupuesto aproximado?',
    options: [
      { label: 'Hasta $20,000', value: '20000' },
      { label: '$20,000 - $35,000', value: '35000' },
      { label: 'Más de $35,000', value: '' },
    ],
  },
]

export function Quiz() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  function answer(value: string) {
    const question = QUESTIONS[step]
    const next = { ...answers, [question.key]: value }
    setAnswers(next)

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
      return
    }

    trackEvent({ type: 'QUIZ_COMPLETED', metadata: next })
    const params = new URLSearchParams()
    if (next.uso) params.set('category', next.uso)
    if (next.presupuesto) params.set('maxPrice', next.presupuesto)
    navigate(`/?${params.toString()}`)
  }

  const question = QUESTIONS[step]

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-12 text-center">
      <p className="text-sm text-neutral-500">
        Pregunta {step + 1} de {QUESTIONS.length}
      </p>
      <h1 className="text-xl font-semibold">{question.prompt}</h1>
      <div className="flex w-full flex-col gap-3">
        {question.options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => answer(option.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white py-4 text-center font-medium hover:border-blue-600 hover:bg-blue-50"
          >
            {option.label}
          </button>
        ))}
      </div>
      <Link to="/" className="text-sm text-neutral-500 underline hover:text-neutral-900">
        Ver todo el catálogo
      </Link>
    </div>
  )
}
