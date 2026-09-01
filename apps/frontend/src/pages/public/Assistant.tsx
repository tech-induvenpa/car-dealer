import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, Input, Modal, Spinner } from '@heroui/react'
import Markdown, { type Components } from 'react-markdown'
import { getActiveConversation, sendMessage } from '../../api/agent'
import { trackEvent } from '../../api/analytics'
import type { ConversationTurn, PanelSelection } from '../../types/agent'
import { InlineVehicleCard } from '../../components/agent/InlineVehicleCard'
import { VehiclePanel } from '../../components/agent/VehiclePanel'
import { useComparison } from '../../context/ComparisonContext'

interface LocationState {
  pendingMessage?: string
}

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

export function Assistant() {
  const location = useLocation()
  const { vehicleIds: trayIds } = useComparison()
  const [conversationId, setConversationId] = useState<number | undefined>(undefined)
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const [showNewConversationWarning, setShowNewConversationWarning] = useState(false)
  const [panelSelection, setPanelSelection] = useState<PanelSelection>({ mode: 'auto' })
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const sentPendingRef = useRef(false)
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

  useEffect(() => {
    if (!ready || sentPendingRef.current) return
    const pending = (location.state as LocationState | null)?.pendingMessage
    if (pending) {
      sentPendingRef.current = true
      void send(pending)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, sending])

  async function send(message: string) {
    const trimmed = message.trim()
    if (!trimmed || sending) return
    setInput('')
    setSending(true)
    setError(false)
    try {
      const result = await sendMessage(trimmed, conversationId)
      setConversationId(result.conversationId)
      setTurns((prev) => [
        ...prev,
        {
          buyerMessage: trimmed,
          agentReply: result.reply,
          intentSignal: null,
          referencedVehicleIds: result.referencedVehicleIds,
        },
      ])
      // un turno nuevo siempre retoma el control automático del panel —
      // una fijación manual anterior (Detalle/Comparar) solo dura hasta acá.
      setPanelSelection({ mode: 'auto' })
      setMobilePanelOpen(false)
    } catch {
      setError(true)
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  // CEB-36-UI-06: sin contenido no hay nada que perder, arranca directo
  // sin mostrar el aviso.
  function startNewConversation() {
    if (turns.length > 0) {
      setShowNewConversationWarning(true)
      return
    }
    resetToEmptyConversation()
  }

  function resetToEmptyConversation() {
    setConversationId(undefined)
    setTurns([])
    setPanelSelection({ mode: 'auto' })
    setMobilePanelOpen(false)
    setShowNewConversationWarning(false)
  }

  function confirmNewConversation() {
    trackEvent({ type: 'NEW_CONVERSATION_WARNING_DECIDED', metadata: { decision: 'CONFIRMED' } })
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
  // 'tray' lee del carrito global useComparison() en vivo — si el
  // comprador agrega/quita otro vehículo desde el panel, se refleja acá
  // sin esperar un turno nuevo.
  const panelIds =
    panelSelection.mode === 'auto'
      ? latestTurnVehicleIds
      : panelSelection.mode === 'single'
        ? [panelSelection.vehicleId]
        : trayIds
  const hasPanel = panelIds.length > 0

  return (
    <div
      className={`mx-auto flex flex-col gap-6 py-8 lg:flex-row lg:items-start ${hasPanel ? 'max-w-5xl' : 'max-w-2xl'}`}
    >
      <div className={`flex h-[calc(100vh-8rem)] flex-col ${hasPanel ? 'flex-1' : 'w-full'}`}>
        <div className="flex items-center justify-between border-b border-separator py-3">
          <h1 className="font-medium text-foreground">Research Hub</h1>
          <Button variant="ghost" size="sm" onPress={startNewConversation}>
            Nueva conversación
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          {turns.length === 0 ? (
            <p className="py-12 text-center text-muted">
              Contame qué estás buscando — presupuesto, uso, lo que sea. Te ayudo a encontrar el vehículo
              indicado.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {turns.map((turn, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-accent px-4 py-2 text-accent-foreground">
                    {turn.buyerMessage}
                  </div>
                  <div className="mr-auto max-w-[80%] rounded-2xl rounded-bl-sm bg-surface-secondary px-4 py-2 text-foreground">
                    <Markdown components={markdownComponents}>{turn.agentReply}</Markdown>
                  </div>
                  {turn.referencedVehicleIds.length > 0 ? (
                    <div className="mr-auto grid w-[80%] grid-cols-2 gap-2">
                      {turn.referencedVehicleIds.map((vehicleId) => (
                        <InlineVehicleCard key={vehicleId} vehicleId={vehicleId} onSelect={setPanelSelection} />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {sending ? (
                <div className="mr-auto flex max-w-[80%] items-center gap-2 rounded-2xl rounded-bl-sm bg-surface-secondary px-4 py-2 text-muted">
                  <Spinner size="sm" /> Escribiendo...
                </div>
              ) : null}
            </div>
          )}
          {error ? (
            <p className="mt-4 text-center text-sm text-danger">
              No pudimos enviar tu mensaje — intentá de nuevo.
            </p>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-separator py-4">
          <Input
            fullWidth
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribile al asistente..."
            disabled={sending}
          />
          <Button type="submit" isDisabled={sending || !input.trim()}>
            Enviar
          </Button>
        </form>
      </div>

      {hasPanel ? (
        <>
          <div className="hidden h-[calc(100vh-8rem)] w-80 shrink-0 overflow-y-auto rounded-3xl border border-border bg-surface p-4 lg:block">
            <VehiclePanel
              vehicleIds={panelIds}
              onSelectSingle={(vehicleId) => setPanelSelection({ mode: 'single', vehicleId })}
            />
          </div>

          <button
            type="button"
            onClick={() => setMobilePanelOpen(true)}
            className="fixed right-4 bottom-20 z-30 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-lg lg:hidden"
          >
            Ver vehículo{panelIds.length > 1 ? 's' : ''}
          </button>

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
                      onSelectSingle={(vehicleId) => setPanelSelection({ mode: 'single', vehicleId })}
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
                  La conversación anterior no va a estar accesible — ¿empezar una nueva?
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
