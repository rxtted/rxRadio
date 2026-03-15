import type { RadioMessage } from './types'

const mockEntries = [
  { id: 12, name: 'AW-798', self: false },
  { id: 27, name: 'OE-075 | 175BX', self: true },
  { id: 34, name: 'HELIMED 27', self: false },
]

const dispatchRadioMessage = (message: RadioMessage) => {
  window.dispatchEvent(new MessageEvent<RadioMessage>('message', { data: message }))
}

export const startMockRadioFeed = () => {
  dispatchRadioMessage({ changeVisibility: true, visible: true })

  for (const entry of mockEntries) {
    dispatchRadioMessage({
      radioId: entry.id,
      radioName: entry.name,
      self: entry.self,
      channel: 'PAN LONDON',
      channelFrequency: 10,
    })
  }

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

  dispatchRadioMessage({
    radioId: mockEntries[0].id,
    radioTalking: true,
  })

  return () => {
    window.clearInterval(interval)
  }
}
