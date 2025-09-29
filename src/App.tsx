import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Container from './components/Container'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-neutral-50">
      <Container className="py-8">
        <div className="text-center">
          <div className="flex justify-center items-center gap-8 mb-8">
            <a href="https://vite.dev" target="_blank" className="hover:opacity-80 transition-opacity">
              <img src={viteLogo} className="h-24" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank" className="hover:opacity-80 transition-opacity">
              <img src={reactLogo} className="h-24 animate-spin" style={{ animationDuration: '20s' }} alt="React logo" />
            </a>
          </div>
          
          <h1 className="text-4xl font-bold text-neutral-800 mb-8">
            Vite + React + TypeScript + Tailwind
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-neutral-200">
            <button 
              onClick={() => setCount((count) => count + 1)}
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mb-4"
            >
              Count is {count}
            </button>
            <p className="text-neutral-600">
              Edit <code className="bg-neutral-100 px-2 py-1 rounded text-sm font-mono">src/App.tsx</code> and save to test HMR
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-neutral-500">
              Click on the Vite and React logos to learn more
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm">React 19</span>
              <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm">TypeScript</span>
              <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm">Vite</span>
              <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm">Tailwind CSS</span>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default App
