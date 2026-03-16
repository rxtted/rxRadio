export type RadioLayout = {
  x: number
  y: number
  scale: number
}

export type EditHandle = 'nw' | 'ne' | 'sw' | 'se' | null

export type EditInteraction = 'idle' | 'drag' | 'resize'

export type EditState = {
  enabled: boolean
  handle: EditHandle
  interaction: EditInteraction
}

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
  changeEditMode?: boolean
  editMode?: boolean
  applySavedLayout?: boolean
  resetSavedLayout?: boolean
  layout?: RadioLayout
}

export type RadioEntry = {
  id: number
  name: string
  isSelf: boolean
  isTalking: boolean
}

export type RadioUiState = {
  channel: string
  frequency: string
  entries: RadioEntry[]
  isForcedHidden: boolean
  isPanelActive: boolean
  isEditMode: boolean
}

declare global {
  interface Window {
    GetParentResourceName?: () => string
  }
}
