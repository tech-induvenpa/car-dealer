import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Input, Modal, Spinner, buttonVariants } from '@heroui/react'
import Markdown, { type Components } from 'react-markdown'
import { getActiveConversation, sendMessage } from '../../api/agent'
import { startNewConversation as startNewConversationOnServer } from '../../api/profile'
import { trackEvent } from '../../api/analytics'
import type { ConversationTurn, PanelSelection, Verdict } from '../../types/agent'
import { InlineVehicleCard } from '../../components/agent/InlineVehicleCard'
import { VehiclePanel } from '../../components/agent/VehiclePanel'
import { VerdictCard } from '../../components/agent/VerdictCard'
import { SplitCard } from '../../components/agent/SplitCard'
import { WarningIcon } from '../../components/icons'

// Atajos de apertura: los mismos dos pasos que hacía el quiz, ahora adentro de
// la Conversación. Llevan shortcutId porque su significado lo conoce el
// sistema — el hecho se captura sin pasar por el modelo (ver
// profile/domain/services/shortcut.ts).
// Presentación del Agente, escrita del lado del cliente: no es un Turno ni
// viaja al servidor, así que abrir la home no cuesta una llamada al proveedor
// de IA — importa, porque con la conversación de home cada visitante costaría
// una (ver la nota de costo por visitante en CEB-78).
//
// Existe porque los Atajos solos quedaban flotando: eran respuestas a algo que
// nadie había preguntado. Con la presentación, los chips son la respuesta a la
// pregunta que acaba de hacer el Agente.
const OPENING_MESSAGE = `¡Hola! 👋 Soy el asistente de Car Dealer y estoy para ayudarte a encontrar tu próximo carro 🚗

Te hago un par de preguntas y te digo **cuál te conviene**, con los números que lo sostienen — sin que tengas que ponerte a filtrar catálogos.

Para empezar: ¿para qué lo vas a usar principalmente?`

// Cada tanda lleva su pregunta, por si los chips aparecen lejos de donde se
// preguntó. La primera no la necesita: la hace la presentación de arriba.
const USE_SHORTCUTS = {
  question: '¿Para qué lo vas a usar principalmente?',
  options: [
    { id: 'uso-familiar', label: '🚙 Uso familiar' },
    { id: 'uso-ciudad', label: '🏙 Para ciudad' },
    { id: 'uso-trabajo', label: '🔧 Trabajo o campo' },
  ],
}
const BUDGET_SHORTCUTS = {
  question: '¿En qué rango de precio te mueves?',
  options: [
    { id: 'presupuesto-hasta-20000', label: '💵 Hasta $20.000' },
    { id: 'presupuesto-20000-35000', label: '💰 $20.000 a $35.000' },
    { id: 'presupuesto-mas-de-35000', label: '💎 Más de $35.000' },
  ],
}

// Marca que el comprador tapeó una respuesta pre-formulada del Agente. No
// lleva un hecho —eso solo lo hacen los Atajos de arriba— pero sí cuenta como
// tap para la señal "tapear vs. escribir".
const QUICK_REPLY_ID = 'respuesta-sugerida'

// el Agente responde en markdown (negritas, listas) — este mapeo lo
// alinea con la tipografía de la burbuja en vez de dejar los estilos por
// default del navegador (sin sumar @tailwindcss/typography por unos pocos tags).
const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="underline">
      {children}
    </a>
  ),
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      // 44px, no los 40 del botón de HeroUI: los Atajos son LA interacción del
      // pivote y 44 es el mínimo táctil.
      // Apilados en vertical y alineados a la izquierda, no en fila con scroll
      // lateral: así entra completa una respuesta sugerida larga (el Agente
      // propone preguntas enteras) y no hay nada escondido fuera de pantalla.
      className="min-h-11 w-fit max-w-[85%] rounded-3xl border border-accent bg-accent-soft px-4 py-2.5 text-right text-sm font-semibold text-accent-soft-foreground hover:bg-accent-soft-hover"
    >
      {label}
    </button>
  )
}

export function Assistant() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [conversationId, setConversationId] = useState<number | undefined>(undefined)
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const [verdictByTurn, setVerdictByTurn] = useState<Record<number, Verdict | null>>({})
  const [suggested, setSuggested] = useState<string[]>([])
  // Lo que el Agente ya sabe. Los Atajos de apertura se ofrecen según esto, no
  // según cuántos turnos van: el Perfil sobrevive entre Conversaciones, así que
  // contar turnos hacía que la interfaz preguntara cosas ya respondidas.
  const [known, setKnown] = useState({ need: false, budget: false })
  const [input, setInput] = useState('')
  // El mensaje que el comprador acaba de mandar y todavía no tiene respuesta.
  // Se pinta al instante como burbuja propia: antes el turno entero aparecía
  // recién cuando llegaba la respuesta, así que al escribir —o peor, al tapear
  // un Atajo en el primer turno— la pantalla se quedaba igual y parecía colgada.
  const [pending, setPending] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const [lastFailed, setLastFailed] = useState<{ message: string; shortcutId?: string } | null>(null)
  const [showNewConversationWarning, setShowNewConversationWarning] = useState(false)
  const [panelSelection, setPanelSelection] = useState<PanelSelection>({ mode: 'auto' })
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    getActiveConversation()
      .then((conversation) => {
        if (cancelled) return
        if (conversation) {
          setConversationId(conversation.id)
          setTurns(conversation.turns)
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // El header pide una conversación nueva por la URL. Se atiende recién con la
  // conversación cargada: si hay contenido hay que avisar antes de descartarlo.
  useEffect(() => {
    if (!ready || searchParams.get('nueva') !== '1') return
    setSearchParams({}, { replace: true })
    if (turns.length > 0) {
      setShowNewConversationWarning(true)
      return
    }
    void startNewConversationOnServer().catch(() => {})
    resetToEmptyConversation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, searchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, pending])

  async function send(message: string, shortcutId?: string) {
    const trimmed = message.trim()
    if (!trimmed || sending) return
    setInput('')
    setPending(trimmed)
    setSending(true)
    setError(false)
    setSuggested([])
    try {
      const result = await sendMessage(trimmed, conversationId, shortcutId)
      setConversationId(result.conversationId)
      setTurns((prev) => {
        const next = [
          ...prev,
          {
            buyerMessage: trimmed,
            agentReply: result.reply,
            intentSignal: null,
            referencedVehicleIds: result.referencedVehicleIds,
            inputMethod: shortcutId ? ('TAP' as const) : ('TYPE' as const),
          },
        ]
        setVerdictByTurn((v) => ({ ...v, [next.length - 1]: result.verdict }))
        return next
      })
      setSuggested(result.suggestedReplies)
      setKnown(result.known)
      setLastFailed(null)
      // un turno nuevo siempre retoma el control automático del panel —
      // una fijación manual anterior (Detalle) solo dura hasta acá.
      setPanelSelection({ mode: 'auto' })
      setMobilePanelOpen(false)
    } catch {
      setError(true)
      setLastFailed({ message: trimmed, shortcutId })
    } finally {
      setPending(null)
      setSending(false)
    }
  }

  // En escritorio el panel está siempre a la vista; en móvil vive en un modal,
  // y su única entrada ahora es esta. Antes "Detalle" fijaba el panel pero no
  // abría nada: en móvil el botón no hacía absolutamente nada.
  function showInPanel(selection: PanelSelection) {
    setPanelSelection(selection)
    setMobilePanelOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  // Solo limpia la pantalla. El olvido del lado del servidor lo dispara
  // confirmNewConversation o el efecto que atiende ?nueva=1.
  function resetToEmptyConversation() {
    setConversationId(undefined)
    setTurns([])
    setVerdictByTurn({})
    setPending(null)
    setSuggested([])
    setKnown({ need: false, budget: false })
    setError(false)
    setLastFailed(null)
    setPanelSelection({ mode: 'auto' })
    setMobilePanelOpen(false)
    setShowNewConversationWarning(false)
  }

  function confirmNewConversation() {
    trackEvent({ type: 'NEW_CONVERSATION_WARNING_DECIDED', metadata: { decision: 'CONFIRMED' } })
    void startNewConversationOnServer().catch(() => {
      /* si falla, el peor caso es que el Agente recuerde de más — no vale
         bloquear al comprador que pidió empezar de nuevo */
    })
    resetToEmptyConversation()
  }

  function cancelNewConversation() {
    trackEvent({ type: 'NEW_CONVERSATION_WARNING_DECIDED', metadata: { decision: 'CANCELLED' } })
    setShowNewConversationWarning(false)
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted">
        <Spinner /> Cargando...
      </div>
    )
  }

  const latestTurnVehicleIds = turns.length > 0 ? turns[turns.length - 1].referencedVehicleIds : []
  const panelIds =
    panelSelection.mode === 'single' ? [panelSelection.vehicleId] : latestTurnVehicleIds
  const hasPanel = panelIds.length > 0

  // Los Atajos de apertura se ofrecen mientras falte ese dato — no por número
  // de turno. Son los dos que el quiz capturaba y los mismos que habilitan
  // pedir contacto y entregar un Veredicto, así que conviene tenerlos temprano
  // y de forma determinista.
  const openingShortcuts = !known.need ? USE_SHORTCUTS : !known.budget ? BUDGET_SHORTCUTS : null

  // UNA sola tanda, nunca las dos: los Atajos deterministas ganan cuando
  // aplican, porque capturan el hecho sin pasar por el modelo. Mostrar las dos
  // apilaba siete botones preguntando lo mismo dos veces.
  const chips: { key: string; label: string; shortcutId: string }[] = openingShortcuts
    ? openingShortcuts.options.map((o) => ({ key: o.id, label: o.label, shortcutId: o.id }))
    : suggested.map((label) => ({ key: label, label, shortcutId: QUICK_REPLY_ID }))
  const showChips = chips.length > 0 && !error && !pending

  return (
    <div className={`mx-auto flex flex-col gap-6 lg:flex-row lg:items-start ${hasPanel ? 'max-w-6xl' : 'max-w-2xl'}`}>
      <div className={`flex h-[calc(100vh-6.5rem)] flex-col ${hasPanel ? 'lg:w-[40rem]' : 'w-full'}`}>
        <div className="flex-1 overflow-y-auto pb-6">
          {/* min-h-full + justify-end ancla la conversación abajo cuando es
              corta, sin romper el scroll: poner justify-end en el contenedor
              que scrollea desborda hacia arriba y deja contenido inalcanzable. */}
          <div className="flex min-h-full flex-col justify-end gap-4">
            {/* La presentación abre siempre la conversación: es el comienzo del
                hilo, no un encabezado que desaparece al primer mensaje. */}
            <div className="mr-auto max-w-[88%] rounded-2xl rounded-bl-sm bg-surface-secondary px-4 py-2 text-foreground">
              <Markdown components={markdownComponents}>{OPENING_MESSAGE}</Markdown>
            </div>

            {turns.map((turn, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-accent px-4 py-2 text-accent-foreground">
                  {turn.buyerMessage}
                </div>
                <div className="mr-auto max-w-[88%] rounded-2xl rounded-bl-sm bg-surface-secondary px-4 py-2 text-foreground">
                  <Markdown components={markdownComponents}>{turn.agentReply}</Markdown>
                </div>

                {/* Veredicto verificado: el artefacto que reemplaza a la tabla. */}
                {verdictByTurn[i] ? <VerdictCard verdict={verdictByTurn[i] as Verdict} /> : null}

                {/* Regla 9: hay dos sobre la mesa pero no hubo Veredicto —
                    se muestra el reparto en vez de forzar un ganador. */}
                {!verdictByTurn[i] && turn.referencedVehicleIds.length === 2 ? (
                  <SplitCard vehicleIds={turn.referencedVehicleIds} />
                ) : null}

                {/* Sin Veredicto, las tarjetas son cómo el comprador ve los
                    vehículos de los que se habló. Con Veredicto no hacen
                    falta: la tarjeta ya los muestra a los dos. */}
                {!verdictByTurn[i] && turn.referencedVehicleIds.length > 0 ? (
                  <div className="mr-auto grid w-[88%] grid-cols-2 gap-2">
                    {turn.referencedVehicleIds.map((vehicleId) => (
                      <InlineVehicleCard key={vehicleId} vehicleId={vehicleId} onSelect={showInPanel} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {/* El turno en vuelo: la burbuja del comprador se pinta ya, y el
                spinner va debajo. Vale igual para lo escrito y para los
                Atajos — los dos pasan por send(). */}
            {pending ? (
              <div className="flex flex-col gap-3">
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-accent px-4 py-2 text-accent-foreground">
                  {pending}
                </div>
                <div className="mr-auto flex items-center gap-2 rounded-2xl rounded-bl-sm bg-surface-secondary px-4 py-2.5 text-muted">
                  <Spinner size="sm" /> Escribiendo...
                </div>
              </div>
            ) : null}

            {/* Cuelgan del último mensaje del Agente y scrollean con él, en vez
                de vivir en una sección fija arriba del input: ahí quedaban
                separados de la pregunta que los motiva, y al llegar un turno
                nuevo se apilaban con los de antes. */}
            {showChips ? (
              <div className="flex flex-col items-end gap-2">
                {chips.map((c) => (
                  <Chip key={c.key} label={c.label} onPress={() => void send(c.label, c.shortcutId)} />
                ))}
              </div>
            ) : null}
          </div>

          {/* Regla 7: el comprador nunca ve una home inservible. Se admite la
              falla, se puede reintentar, y siempre hay salida al catálogo. La
              conversación previa se conserva. */}
          {error ? (
            <div className="mt-4 overflow-hidden rounded-3xl bg-surface shadow-surface">
              <div className="flex flex-col gap-2 p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-3xl bg-warning-soft text-warning-soft-foreground">
                  <WarningIcon className="h-5 w-5" />
                </span>
                <h2 className="font-display text-xl leading-tight font-bold tracking-tight text-pretty">
                  El asistente no está respondiendo
                </h2>
                <p className="text-sm leading-relaxed text-pretty text-muted">
                  Es un problema nuestro, no tuyo. Tu conversación quedó guardada — prueba de nuevo en un momento, o
                  mira el catálogo mientras tanto.
                </p>
              </div>
              <div className="flex flex-col gap-2 border-t border-separator p-4">
                <Button
                  fullWidth
                  onPress={() => lastFailed && void send(lastFailed.message, lastFailed.shortcutId)}
                >
                  Intentar de nuevo
                </Button>
                <Link to="/catalogo" className={buttonVariants({ variant: 'outline', fullWidth: true })}>
                  Ver el catálogo
                </Link>
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-separator pt-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              fullWidth
              className="min-h-11"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={error ? 'Sin conexión con el asistente' : 'Escribe lo que buscas...'}
              disabled={sending || error}
            />
            <Button type="submit" isDisabled={sending || error || !input.trim()}>
              Enviar
            </Button>
          </form>
        </div>
      </div>

      {hasPanel ? (
        <>
          <div className="hidden h-[calc(100vh-6.5rem)] flex-1 overflow-y-auto rounded-3xl border border-border bg-surface p-4 lg:block">
            <VehiclePanel
              vehicleIds={panelIds}
              onSelectSingle={(vehicleId) => showInPanel({ mode: 'single', vehicleId })}
            />
          </div>

          <Modal isOpen={mobilePanelOpen} onOpenChange={setMobilePanelOpen}>
            <Modal.Backdrop>
              <Modal.Container size="lg">
                <Modal.Dialog aria-label="Vehículos">
                  <Modal.Header>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Body>
                    <VehiclePanel
                      vehicleIds={panelIds}
                      onSelectSingle={(vehicleId) => showInPanel({ mode: 'single', vehicleId })}
                    />
                  </Modal.Body>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        </>
      ) : null}

      <Modal
        isOpen={showNewConversationWarning}
        onOpenChange={(open) => {
          if (!open) cancelNewConversation()
        }}
      >
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Body>
                <p className="text-sm text-foreground">
                  Vas a empezar de cero: la conversación anterior no va a estar accesible y el asistente olvida lo
                  que le contaste. ¿Seguimos?
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" onPress={cancelNewConversation}>
                  Cancelar
                </Button>
                <Button variant="primary" onPress={confirmNewConversation}>
                  Sí, empezar de nuevo
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}
