import { type ReactNode } from 'react'
import Container from './Container'
import Navigation from './Navigation'
import AuthButton from './AuthButton'

interface ShellProps {
  children: ReactNode
}

export default function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-neutral-200">
        <Container>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-neutral-800 mr-8">bid2build</h1>
              <Navigation />
            </div>
            <AuthButton />
          </div>
        </Container>
      </header>
      
      <main>
        <Container>
          {children}
        </Container>
      </main>
    </div>
  )
}