import { useEffect, useState } from 'react'
import { getApiUrl } from './utils/apiUrl'

export default function App() {
  const [api, setApi] = useState<'checking' | 'up' | 'down'>('checking')

  useEffect(() => {
    fetch(`${getApiUrl()}/health`)
      .then((r) => setApi(r.ok ? 'up' : 'down'))
      .catch(() => setApi('down'))
  }, [])

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: 640 }}>
      <h1>Assessment Review</h1>
      <p>Harness is running. The API is {api}.</p>
      <p>Replace this with your own thing. Styling, routing and state are all your call.</p>
    </main>
  )
}
