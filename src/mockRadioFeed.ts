import type { RadioMessage } from './types'

type MockEntry = {
  id: number
  name: string
  self: boolean
}

const callsignPrefixes = ['AW', 'ON', 'XN', 'INT'] as const
const commandDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

type MockEntryTemplate = {
  key: string
  buildName: (prefix: (typeof callsignPrefixes)[number]) => string
}

const baseMockEntries: MockEntry[] = [
  { id: 12, name: 'AW-201', self: false },
  { id: 27, name: 'ON-74 | 174BX', self: true },
  { id: 34, name: 'XN-203', self: false },
]

const buildMockEntryTemplates = (): MockEntryTemplate[] => {
  const templates: MockEntryTemplate[] = []

  for (let tens = 0; tens <= 9; tens += 1) {
    for (let ones = 0; ones <= 9; ones += 1) {
      const suffix = `2${tens}${ones}`
      templates.push({
        key: `standard:${suffix}`,
        buildName: (prefix) => `${prefix}-${suffix}`,
      })
    }
  }

  for (const digit of commandDigits) {
    templates.push({
      key: `command:${digit}`,
      buildName: (prefix) => `${prefix}-7${digit} | 17${digit}BX`,
    })
  }

  return templates
}

const buildAdditionalMockEntries = (count: number): MockEntry[] => {
  const usedIds = new Set(baseMockEntries.map((entry) => entry.id))
  const usedTemplateKeys = new Set(
    baseMockEntries.flatMap((entry) => {
      const standardMatch = entry.name.match(/^[A-Z]+-(2\d\d)$/)
      if (standardMatch) {
        return [`standard:${standardMatch[1]}`]
      }

      const commandMatch = entry.name.match(/^[A-Z]+-7(\d) \| 17\dBX$/)
      if (commandMatch) {
        return [`command:${commandMatch[1]}`]
      }

      return []
    }),
  )
  const availableTemplates = buildMockEntryTemplates().filter((template) => !usedTemplateKeys.has(template.key))
  const additionalEntries: MockEntry[] = []
  let prefixIndex = 0
  let templateIndex = 0

  for (let id = 10; id <= 200 && additionalEntries.length < count; id += 1) {
    if (usedIds.has(id) || templateIndex >= availableTemplates.length) {
      continue
    }

    const template = availableTemplates[templateIndex]
    additionalEntries.push({
      id,
      name: template.buildName(callsignPrefixes[prefixIndex % callsignPrefixes.length]),
      self: false,
    })

    usedIds.add(id)
    prefixIndex += 1
    templateIndex += 1
  }

  return additionalEntries
}

const mockEntries = [...baseMockEntries, ...buildAdditionalMockEntries(22)]

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
