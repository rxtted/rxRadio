import type { RadioMessage } from './types'

const mockEntries = [
  { id: 12, name: 'AW-798', self: false },
  { id: 27, name: 'OE-75 | 175BX', self: true },
  { id: 34, name: 'HELIMED 27', self: false },
]

const dispatchRadioMessage = (message: RadioMessage) => {
  window.dispatchEvent(new MessageEvent<RadioMessage>('message', { data: message }))
}

export const startMockRadioFeed = () => {
  const bootstrapTimeout = window.setTimeout(() => {
    dispatchRadioMessage({
      applySavedLayout: true,
      layout: {
        x: Math.max(window.innerWidth - 360, 32),
        y: Math.max(window.innerHeight * 0.08, 32),
        scale: 1,
      },
    })

    dispatchRadioMessage({ changeVisibility: true, visible: true })
    dispatchRadioMessage({ changeEditMode: true, editMode: false })

    for (const entry of mockEntries) {
      dispatchRadioMessage({
        radioId: entry.id,
        radioName: entry.name,
        self: entry.self,
        channel: 'PAN LONDON',
        channelFrequency: 10,
      })
    }

    dispatchRadioMessage({
      radioId: mockEntries[0].id,
      radioTalking: true,
    })
  }, 0)

  let talkingIndex = 0
  const interval = window.setInterval(() => {
    const previousEntry = mockEntries[talkingIndex % mockEntries.length]
    const nextEntry = mockEntries[(talkingIndex + 1) % mockEntries.length]

    dispatchRadioMessage({
      radioId: previousEntry.id,
      radioTalking: false,
    })

    dispatchRadioMessage({
      radioId: nextEntry.id,
      radioTalking: true,
    })

    talkingIndex += 1
  }, 1400)
  return () => {
    window.clearTimeout(bootstrapTimeout)
    window.clearInterval(interval)
  }
}
