import { useCallback, useEffect, useRef, useState } from 'react'

import type { RadioLayout, RadioMessage } from './types'

const VIEWPORT_INSET_RATIO = 0.015
const BASE_VIEWPORT_HEIGHT = 1440
const MIN_BASE_SCALE = 0.75
const MAX_BASE_SCALE = 1.5
const MIN_USER_SCALE = 0.75
const MAX_USER_SCALE = 1.5

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const getInset = () => window.innerHeight * VIEWPORT_INSET_RATIO
export const getViewportBaseScale = () =>
  clamp(window.innerHeight / BASE_VIEWPORT_HEIGHT, MIN_BASE_SCALE, MAX_BASE_SCALE)

const getElementLayout = (element: HTMLElement): RadioLayout => {
  const rect = element.getBoundingClientRect()

  return {
    scale: 1,
    x: rect.left,
    y: rect.top,
  }
}

export const useRadioLayout = () => {
  const [layout, setLayout] = useState<RadioLayout | null>(null)
  const attachedElementRef = useRef<HTMLElement | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const clampLayout = useCallback(
    (nextLayout: RadioLayout, element: HTMLElement | null = attachedElementRef.current) => {
      const boundedUserScale = clamp(nextLayout.scale, MIN_USER_SCALE, MAX_USER_SCALE)
      const effectiveScale = getViewportBaseScale() * boundedUserScale

      if (!element) {
        return {
          ...nextLayout,
          scale: boundedUserScale,
        }
      }

      const inset = getInset()
      const width = element.offsetWidth * effectiveScale
      const height = element.offsetHeight * effectiveScale

      return {
        scale: boundedUserScale,
        x: clamp(nextLayout.x, inset, Math.max(inset, window.innerWidth - width - inset)),
        y: clamp(nextLayout.y, inset, Math.max(inset, window.innerHeight - height - inset)),
      }
    },
    [],
  )

  const updateLayout = useCallback(
    (nextLayout: RadioLayout | ((currentLayout: RadioLayout) => RadioLayout)) => {
      setLayout((currentLayout) => {
        const baseLayout = currentLayout ?? (attachedElementRef.current ? getElementLayout(attachedElementRef.current) : null)

        if (!baseLayout) {
          return currentLayout
        }

        const resolvedLayout = typeof nextLayout === 'function' ? nextLayout(baseLayout) : nextLayout
        return clampLayout(resolvedLayout)
      })
    },
    [clampLayout],
  )

  const attachShell = useCallback(
    (element: HTMLElement | null) => {
      if (attachedElementRef.current === element) {
        return
      }

      resizeObserverRef.current?.disconnect()
      attachedElementRef.current = element

      if (!element) {
        return
      }

      resizeObserverRef.current = new ResizeObserver(() => {
        setLayout((currentLayout) => (currentLayout ? clampLayout(currentLayout, element) : currentLayout))
      })
      resizeObserverRef.current.observe(element)
    },
    [clampLayout],
  )

  useEffect(() => {
    const onMessage = (event: MessageEvent<RadioMessage>) => {
      const nextMessage = event.data ?? {}

      if (nextMessage.resetSavedLayout) {
        setLayout(null)
        return
      }

      if (!nextMessage.applySavedLayout || !nextMessage.layout) {
        return
      }

      setLayout(clampLayout(nextMessage.layout))
    }

    window.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [clampLayout])

  useEffect(() => {
    const onResize = () => {
      setLayout((currentLayout) => (currentLayout ? clampLayout(currentLayout) : currentLayout))
    }

    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [clampLayout])

  useEffect(() => {
    return () => {
      resizeObserverRef.current?.disconnect()
    }
  }, [])

  return {
    attachShell,
    baseScale: getViewportBaseScale(),
    layout,
    updateLayout,
  }
}
