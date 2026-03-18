import { useEffect, useRef, useState, type PointerEventHandler, type RefObject } from 'react'

import { postNui } from './nui'
import type { EditHandle, EditInteraction, RadioLayout } from './types'

type DragState = {
  offsetX: number
  offsetY: number
  pointerId: number
}

type ResizeState = {
  anchorX: number
  anchorY: number
  baseHeight: number
  baseWidth: number
  handle: Exclude<EditHandle, null>
  initialDistance: number
  initialScale: number
  pointerId: number
}

const VIEWPORT_INSET_RATIO = 0.015
const MIN_USER_SCALE = 0.75
const MAX_USER_SCALE = 1.5

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const getInset = () => window.innerHeight * VIEWPORT_INSET_RATIO

const getMaxScaleForHandle = (
  handle: Exclude<EditHandle, null>,
  anchorX: number,
  anchorY: number,
  baseWidth: number,
  baseHeight: number,
  baseScale: number,
) => {
  const inset = getInset()

  switch (handle) {
    case 'nw':
      return Math.min((anchorX - inset) / (baseWidth * baseScale), (anchorY - inset) / (baseHeight * baseScale))
    case 'ne':
      return Math.min(
        (window.innerWidth - inset - anchorX) / (baseWidth * baseScale),
        (anchorY - inset) / (baseHeight * baseScale),
      )
    case 'sw':
      return Math.min(
        (anchorX - inset) / (baseWidth * baseScale),
        (window.innerHeight - inset - anchorY) / (baseHeight * baseScale),
      )
    case 'se':
      return Math.min(
        (window.innerWidth - inset - anchorX) / (baseWidth * baseScale),
        (window.innerHeight - inset - anchorY) / (baseHeight * baseScale),
      )
  }
}

const getNextLayoutFromHandle = (
  anchorX: number,
  anchorY: number,
  width: number,
  height: number,
  handle: Exclude<EditHandle, null>,
) => {
  switch (handle) {
    case 'nw':
      return { x: anchorX - width, y: anchorY - height }
    case 'ne':
      return { x: anchorX, y: anchorY - height }
    case 'sw':
      return { x: anchorX - width, y: anchorY }
    case 'se':
      return { x: anchorX, y: anchorY }
  }
}

const getCurrentShellLayout = (shellElement: HTMLElement): RadioLayout => {
  const rect = shellElement.getBoundingClientRect()

  return {
    scale: 1,
    x: rect.left,
    y: rect.top,
  }
}

export const useRadioEditor = ({
  baseScale,
  isEditMode,
  layout,
  onUpdateLayout,
  shellRef,
}: {
  baseScale: number
  isEditMode: boolean
  layout: RadioLayout | null
  onUpdateLayout: (layout: RadioLayout | ((currentLayout: RadioLayout) => RadioLayout)) => void
  shellRef: RefObject<HTMLElement | null>
}) => {
  const dragRef = useRef<DragState | null>(null)
  const resizeRef = useRef<ResizeState | null>(null)
  const frameRef = useRef<number | null>(null)
  const pendingLayoutRef = useRef<RadioLayout | null>(null)
  const [interaction, setInteraction] = useState<EditInteraction>('idle')

  const flushPendingLayout = () => {
    frameRef.current = null

    if (!pendingLayoutRef.current) {
      return
    }

    onUpdateLayout(pendingLayoutRef.current)
    pendingLayoutRef.current = null
  }

  const queueLayoutUpdate = (nextLayout: RadioLayout) => {
    pendingLayoutRef.current = nextLayout

    if (frameRef.current !== null) {
      return
    }

    frameRef.current = window.requestAnimationFrame(flushPendingLayout)
  }

  useEffect(() => {
    if (!isEditMode) {
      dragRef.current = null
      resizeRef.current = null
    }
  }, [isEditMode])

  useEffect(() => {
    if (!isEditMode) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.code !== 'Enter' && event.code !== 'NumpadEnter') {
        return
      }

      if (!shellRef.current) {
        return
      }

      event.preventDefault()
      void postNui('finishEditMode', { layout: layout ?? getCurrentShellLayout(shellRef.current) })
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isEditMode, layout, shellRef])

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  const startDrag: PointerEventHandler<HTMLElement> = (event) => {
    if (!isEditMode || event.button !== 0 || !shellRef.current) {
      return
    }

    const rect = shellRef.current.getBoundingClientRect()
    dragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      pointerId: event.pointerId,
    }
    shellRef.current.setPointerCapture(event.pointerId)
    setInteraction('drag')
  }

  const onDrag: PointerEventHandler<HTMLElement> = (event) => {
    if (!isEditMode || !dragRef.current || dragRef.current.pointerId !== event.pointerId || !shellRef.current) {
      return
    }

    const activeLayout = layout ?? getCurrentShellLayout(shellRef.current)

    queueLayoutUpdate({
      ...activeLayout,
      x: event.clientX - dragRef.current.offsetX,
      y: event.clientY - dragRef.current.offsetY,
    })
  }

  const startResize = (handle: EditHandle): PointerEventHandler<HTMLButtonElement> => (event) => {
    if (!isEditMode || !shellRef.current || !handle || event.button !== 0) {
      return
    }

    event.stopPropagation()
    const rect = shellRef.current.getBoundingClientRect()
    const activeLayout = layout ?? getCurrentShellLayout(shellRef.current)
    const anchorMap = {
      ne: { x: rect.left, y: rect.bottom },
      nw: { x: rect.right, y: rect.bottom },
      se: { x: rect.left, y: rect.top },
      sw: { x: rect.right, y: rect.top },
    }
    const anchor = anchorMap[handle]
    const effectiveScale = activeLayout.scale * baseScale
    const initialDistance = Math.max(1, Math.hypot(event.clientX - anchor.x, event.clientY - anchor.y))

    resizeRef.current = {
      anchorX: anchor.x,
      anchorY: anchor.y,
      baseHeight: rect.height / effectiveScale,
      baseWidth: rect.width / effectiveScale,
      handle,
      initialDistance,
      initialScale: activeLayout.scale,
      pointerId: event.pointerId,
    }
    shellRef.current.setPointerCapture(event.pointerId)
    setInteraction('resize')
  }

  const onResize: PointerEventHandler<HTMLElement> = (event) => {
    if (!isEditMode || !resizeRef.current) {
      return
    }

    if (resizeRef.current.pointerId !== event.pointerId) {
      return
    }

    const distance = Math.max(1, Math.hypot(event.clientX - resizeRef.current.anchorX, event.clientY - resizeRef.current.anchorY))
    const pointerScale = resizeRef.current.initialScale * (distance / resizeRef.current.initialDistance)
    const maxScaleForHandle = getMaxScaleForHandle(
      resizeRef.current.handle,
      resizeRef.current.anchorX,
      resizeRef.current.anchorY,
      resizeRef.current.baseWidth,
      resizeRef.current.baseHeight,
      baseScale,
    )
    const scale = clamp(pointerScale, MIN_USER_SCALE, Math.min(MAX_USER_SCALE, maxScaleForHandle))
    const width = resizeRef.current.baseWidth * baseScale * scale
    const height = resizeRef.current.baseHeight * baseScale * scale
    const nextPosition = getNextLayoutFromHandle(
      resizeRef.current.anchorX,
      resizeRef.current.anchorY,
      width,
      height,
      resizeRef.current.handle,
    )

    queueLayoutUpdate({
      scale,
      x: nextPosition.x,
      y: nextPosition.y,
    })
  }

  const finishInteraction: PointerEventHandler<HTMLElement> = (event) => {
    if (!shellRef.current) {
      return
    }

    if (dragRef.current && dragRef.current.pointerId === event.pointerId) {
      shellRef.current.releasePointerCapture(event.pointerId)
      dragRef.current = null
    }

    if (resizeRef.current && resizeRef.current.pointerId === event.pointerId) {
      shellRef.current.releasePointerCapture(event.pointerId)
      resizeRef.current = null
    }

    setInteraction('idle')
  }

  return {
    finishInteraction,
    interaction,
    onDrag,
    onResize,
    startDrag,
    startResize,
  }
}
