import { useEffect, useEffectEvent, useState } from 'react'

import { startMockRadioFeed } from './mockRadioFeed'
import type { RadioEntry, RadioMessage, RadioState } from './types'

const DEFAULT_CHANNEL = 'Radio Net'
const DEFAULT_FREQUENCY = '--'

const initialState: RadioState = {
  channel: DEFAULT_CHANNEL,
  frequency: DEFAULT_FREQUENCY,
  entries: [],
  isForcedHidden: false,
  isPanelActive: false,
}

const formatFrequency = (value?: string | number) => {
  if (value === undefined || value === null) {
    return DEFAULT_FREQUENCY
  }

  const raw = String(value)
  const numeric = raw.replace(/[^0-9]/g, '')

  if (numeric.length > 0) {
    return numeric.slice(0, 4)
  }

  return raw.slice(0, 4).toUpperCase()
}

const upsertEntry = (
  entries: RadioEntry[],
  message: Required<Pick<RadioMessage, 'radioId' | 'radioName'>> & Pick<RadioMessage, 'self'>,
) => {
  const nextEntries = [...entries]
  const index = nextEntries.findIndex((entry) => entry.id === message.radioId)
  const existing = index >= 0 ? nextEntries[index] : undefined
  const nextEntry: RadioEntry = {
    id: message.radioId,
    name: message.radioName,
    isSelf: Boolean(message.self),
    isTalking: existing?.isTalking ?? false,
  }

  if (index >= 0) {
    nextEntries.splice(index, 1)
  }

  if (nextEntry.isSelf) {
    nextEntries.unshift(nextEntry)
  } else {
    nextEntries.push(nextEntry)
  }

  return nextEntries
}

const toggleTalkingState = (entries: RadioEntry[], radioId: number, isTalking: boolean) =>
  entries.map((entry) => (entry.id === radioId ? { ...entry, isTalking } : entry))

const removeEntry = (entries: RadioEntry[], radioId: number) =>
  entries.filter((entry) => entry.id !== radioId)

export const useRadioUi = () => {
  const [state, setState] = useState<RadioState>(initialState)

  const applyMessage = useEffectEvent((message: RadioMessage) => {
    setState((currentState) => {
      if (message.clearRadioList) {
        return {
          ...initialState,
          isForcedHidden: currentState.isForcedHidden,
        }
      }

      let nextState = currentState

      if (message.changeVisibility) {
        nextState = {
          ...nextState,
          isForcedHidden: message.visible !== true,
        }
      }

      if (message.radioId === undefined || message.radioId === null) {
        return nextState
      }

      nextState = {
        ...nextState,
        isPanelActive: true,
      }

      if (message.channel) {
        nextState = {
          ...nextState,
          channel: message.channel,
        }
      }

      if (message.channelFrequency !== undefined) {
        nextState = {
          ...nextState,
          frequency: formatFrequency(message.channelFrequency),
        }
      } else if (message.channel && nextState.frequency === DEFAULT_FREQUENCY) {
        nextState = {
          ...nextState,
          frequency: formatFrequency(message.channel),
        }
      }

      if (message.radioName !== undefined) {
        nextState = {
          ...nextState,
          entries: upsertEntry(nextState.entries, {
            radioId: message.radioId,
            radioName: message.radioName,
            self: message.self,
          }),
        }
      } else if (message.radioTalking !== undefined) {
        nextState = {
          ...nextState,
          entries: toggleTalkingState(nextState.entries, message.radioId, Boolean(message.radioTalking)),
        }
      } else {
        nextState = {
          ...nextState,
          entries: removeEntry(nextState.entries, message.radioId),
        }
      }

      return nextState
    })
  })

  useEffect(() => {
    const forceTransparentBackground = () => {
      const docEl = document.documentElement
      const body = document.body

      docEl?.style.setProperty('background', 'transparent', 'important')
      docEl?.style.setProperty('background-color', 'rgba(0,0,0,0)', 'important')
      body?.style.setProperty('background', 'transparent', 'important')
      body?.style.setProperty('background-color', 'rgba(0,0,0,0)', 'important')
    }

    const handleMessage = (event: MessageEvent<RadioMessage>) => {
      applyMessage(event.data ?? {})
    }

    forceTransparentBackground()
    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    return startMockRadioFeed()
  }, [])

  return {
    ...state,
    memberCount: state.entries.length,
    isVisible: state.isPanelActive && !state.isForcedHidden,
    isEmpty: state.entries.length === 0,
  }
}
