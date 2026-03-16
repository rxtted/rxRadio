import { useEffect, useRef, useState, type PointerEventHandler } from 'react'

import './index.css'

import { useRadioUi } from './useRadioUi'

const DRAG_VIEWPORT_INSET_RATIO = 0.0005
const getResourceName = () =>
  typeof window.GetParentResourceName === 'function' ? window.GetParentResourceName() : window.location.hostname

const postNui = async (eventName: string, payload: unknown = {}) => {
  if (import.meta.env.DEV) {
    return
  }

  await fetch(`https://${getResourceName()}/${eventName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

type PanelPosition = {
  x: number
  y: number
}

function App() {
  const { channel, entries, frequency, isEmpty, isMoveMode, isVisible, memberCount } = useRadioUi()
  const shellRef = useRef<HTMLElement | null>(null)
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null)

  useEffect(() => {
    if (!isMoveMode || !shellRef.current) {
      dragRef.current = null
      return
    }

    const rect = shellRef.current.getBoundingClientRect()
    setPanelPosition((currentPosition) => currentPosition ?? { x: rect.left, y: rect.top })
  }, [isMoveMode])

  useEffect(() => {
    if (!isMoveMode) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.code !== 'Enter' && event.code !== 'NumpadEnter') {
        return
      }

      event.preventDefault()
      void postNui('finishMoveMode')
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMoveMode])

  useEffect(() => {
    if (!panelPosition || !shellRef.current) {
      return
    }

    const clampPosition = () => {
      const rect = shellRef.current?.getBoundingClientRect()
      if (!rect) {
        return
      }

      const inset = window.innerHeight * DRAG_VIEWPORT_INSET_RATIO
      const maxX = Math.max(inset, window.innerWidth - rect.width - inset)
      const maxY = Math.max(inset, window.innerHeight - rect.height - inset)

      setPanelPosition((currentPosition) =>
        currentPosition
          ? {
              x: Math.min(Math.max(currentPosition.x, inset), maxX),
              y: Math.min(Math.max(currentPosition.y, inset), maxY),
            }
          : currentPosition,
      )
    }

    window.addEventListener('resize', clampPosition)

    return () => {
      window.removeEventListener('resize', clampPosition)
    }
  }, [panelPosition])

  const handlePointerDown: PointerEventHandler<HTMLElement> = (event) => {
    if (!isMoveMode || event.button !== 0 || !shellRef.current) {
      return
    }

    const rect = shellRef.current.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    }

    shellRef.current.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  const handlePointerMove: PointerEventHandler<HTMLElement> = (event) => {
    if (!isMoveMode || !shellRef.current || !dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return
    }

    const rect = shellRef.current.getBoundingClientRect()
    const inset = window.innerHeight * DRAG_VIEWPORT_INSET_RATIO
    const maxX = Math.max(inset, window.innerWidth - rect.width - inset)
    const maxY = Math.max(inset, window.innerHeight - rect.height - inset)
    const nextX = Math.min(Math.max(event.clientX - dragRef.current.offsetX, inset), maxX)
    const nextY = Math.min(Math.max(event.clientY - dragRef.current.offsetY, inset), maxY)

    setPanelPosition({ x: nextX, y: nextY })
  }

  const finishDragging: PointerEventHandler<HTMLElement> = (event) => {
    if (!shellRef.current || !dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return
    }

    shellRef.current.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setIsDragging(false)
  }

  const shellStyle = panelPosition
    ? {
        left: `${panelPosition.x}px`,
        right: 'auto',
        top: `${panelPosition.y}px`,
      }
    : undefined
  const isActivelyDragging = isMoveMode && isDragging

  return (
    <div className="radio-app">
      <section
        className={[
          'radio-shell',
          isVisible ? 'radio-shell--visible' : '',
          isMoveMode ? 'radio-shell--move-mode' : '',
          isActivelyDragging ? 'radio-shell--dragging' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDragging}
        onPointerCancel={finishDragging}
        ref={shellRef}
        style={shellStyle}
      >
        <div className="radio-panel">
          <header className="badge-header">
            <div className="badge-header__icon">
              <span id="radio-frequency">{frequency}</span>
            </div>
            <div className="badge-header__text">
              <strong id="radio-channel">{channel}</strong>
            </div>
            <span className="badge-header__count">
              online <strong id="radio-member-count">{memberCount}</strong>
            </span>
          </header>

          <div className="radio-body">
            {isEmpty ? <div className="radio-empty">Waiting for traffic</div> : null}

            <div className="radio-list">
              {entries.map((entry) => (
                <article
                  className={[
                    'radio-entry',
                    entry.isSelf ? 'radio-entry--self' : '',
                    entry.isTalking ? 'radio-entry--talking' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={entry.id}
                >
                  {entry.isSelf ? <span className="radio-entry__self-tag">You</span> : null}
                  <div className="radio-entry__info">
                    <span className="radio-entry__name">{entry.name}</span>
                  </div>
                  <span className="radio-entry__status" aria-hidden="true" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
