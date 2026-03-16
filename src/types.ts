export type RadioMessage = {
  self?: boolean
  radioId?: number
  radioName?: string
  radioTalking?: boolean
  channel?: string
  channelFrequency?: string | number
  clearRadioList?: boolean
  changeVisibility?: boolean
  visible?: boolean
  changeMoveMode?: boolean
  moveMode?: boolean
}

export type RadioEntry = {
  id: number
  name: string
  isSelf: boolean
  isTalking: boolean
}

export type RadioState = {
  channel: string
  frequency: string
  entries: RadioEntry[]
  isForcedHidden: boolean
  isPanelActive: boolean
  isMoveMode: boolean
}

declare global {
  interface Window {
    GetParentResourceName?: () => string
  }
}
