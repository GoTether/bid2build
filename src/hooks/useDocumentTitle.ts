import { useEffect } from 'react'

export default function useDocumentTitle(title: string) {
  useEffect(() => {
    const base = 'bid2build'
    document.title = title ? `${title} · ${base}` : base
  }, [title])
}