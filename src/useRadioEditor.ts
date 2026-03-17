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
  pointerId: number
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
  const [interaction, setInteraction] = useState<EditInteraction>('idle')

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

    onUpdateLayout({
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

    resizeRef.current = {
      anchorX: anchor.x,
      anchorY: anchor.y,
      baseHeight: rect.height / effectiveScale,
      baseWidth: rect.width / effectiveScale,
      handle,
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

    const dx = Math.abs(event.clientX - resizeRef.current.anchorX)
    const dy = Math.abs(event.clientY - resizeRef.current.anchorY)
    const scale = Math.max(dx / resizeRef.current.baseWidth, dy / resizeRef.current.baseHeight, 0.75)
    const width = resizeRef.current.baseWidth * scale
    const height = resizeRef.current.baseHeight * scale
    const nextPosition = getNextLayoutFromHandle(
      resizeRef.current.anchorX,
      resizeRef.current.anchorY,
      width,
      height,
      resizeRef.current.handle,
    )

    onUpdateLayout({
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
