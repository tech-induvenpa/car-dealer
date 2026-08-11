import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'

type HealthResponse = { status: string; db: string }

function App() {
  const [health, setHealth] = useState<HealthResponse | 'error' | null>(null)

  useEffect(() => {
    fetch('http://localhost:3000/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth('error'))
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Car Dealer</h1>
      <p>
        Backend:{' '}
        {health === null && 'cargando...'}
        {health === 'error' && 'no responde'}
        {health && health !== 'error' && `${health.status} (db: ${health.db})`}
      </p>
      <Button color="primary">HeroUI conectado</Button>
    </main>
  )
}

export default App
