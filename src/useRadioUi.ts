import { useEffect, useState } from 'react'

import type { RadioEntry, RadioMessage, RadioUiState } from './types'

const DEFAULT_CHANNEL = '..'
const DEFAULT_FREQUENCY = '..'

const initialState: RadioUiState = {
  channel: DEFAULT_CHANNEL,
  frequency: DEFAULT_FREQUENCY,
  entries: [],
  isForcedHidden: false,
  isPanelActive: false,
  isEditMode: false,
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

const sortEntries = (entries: RadioEntry[]) =>
  [...entries].sort((leftEntry, rightEntry) =>
    leftEntry.name.localeCompare(rightEntry.name, undefined, {
      sensitivity: 'base',
    }),
  )

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

  nextEntries.push(nextEntry)
  return sortEntries(nextEntries)
}

const reduceRadioUiState = (currentState: RadioUiState, lastMessage: RadioMessage) => {
  if (lastMessage.clearRadioList) {
    return {
      ...initialState,
      isEditMode: currentState.isEditMode,
      isForcedHidden: currentState.isForcedHidden,
    }
  }

  let nextState = currentState

  if (lastMessage.changeVisibility) {
    nextState = {
      ...nextState,
      isForcedHidden: lastMessage.visible !== true,
    }
  }

  if (lastMessage.changeEditMode) {
    nextState = {
      ...nextState,
      isEditMode: lastMessage.editMode === true,
      isPanelActive: lastMessage.editMode === true || nextState.isPanelActive,
    }
  }

  if (lastMessage.channel) {
    nextState = {
      ...nextState,
      channel: lastMessage.channel,
    }
  }

  if (lastMessage.channelFrequency !== undefined) {
    nextState = {
      ...nextState,
      frequency: formatFrequency(lastMessage.channelFrequency),
    }
  } else if (lastMessage.channel && nextState.frequency === DEFAULT_FREQUENCY) {
    nextState = {
      ...nextState,
      frequency: formatFrequency(lastMessage.channel),
    }
  }

  if (lastMessage.radioId === undefined || lastMessage.radioId === null) {
    return nextState
  }

  nextState = {
    ...nextState,
    isPanelActive: true,
  }

  if (lastMessage.radioName !== undefined) {
    nextState = {
      ...nextState,
      entries: upsertEntry(nextState.entries, {
        radioId: lastMessage.radioId,
        radioName: lastMessage.radioName,
        self: lastMessage.self,
      }),
    }
  } else if (lastMessage.radioTalking !== undefined) {
    nextState = {
      ...nextState,
      entries: nextState.entries.map((entry) =>
        entry.id === lastMessage.radioId ? { ...entry, isTalking: Boolean(lastMessage.radioTalking) } : entry,
      ),
    }
  } else {
    nextState = {
      ...nextState,
      entries: nextState.entries.filter((entry) => entry.id !== lastMessage.radioId),
    }
  }

  nextState = {
    ...nextState,
    entries: sortEntries(nextState.entries),
  }

  return nextState
}

export const useRadioUi = () => {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    const onMessage = (event: MessageEvent<RadioMessage>) => {
      const nextMessage = event.data ?? {}
      setState((currentState) => reduceRadioUiState(currentState, nextMessage))
    }

    window.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [])

  return {
    ...state,
    isVisible: (state.isPanelActive && !state.isForcedHidden) || state.isEditMode,
    memberCount: state.entries.length,
  }
}
