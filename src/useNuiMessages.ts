import { useEffect } from 'react'

import { startMockRadioFeed } from './mockRadioFeed'

export const useNuiMessages = () => {
  useEffect(() => {
    const docEl = document.documentElement
    const body = document.body

    docEl?.style.setProperty('background', 'transparent', 'important')
    docEl?.style.setProperty('background-color', 'rgba(0,0,0,0)', 'important')
    body?.style.setProperty('background', 'transparent', 'important')
    body?.style.setProperty('background-color', 'rgba(0,0,0,0)', 'important')
  }, [])

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    return startMockRadioFeed()
  }, [])
}
