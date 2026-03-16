import { useCallback, useRef, useState } from 'react'

import './index.css'

import { RadioHeader } from './components/RadioHeader'
import { RadioMemberList } from './components/RadioMemberList'
import { RadioResizeHandles } from './components/RadioResizeHandles'
import { useNuiMessages } from './useNuiMessages'
import { useRadioEditor } from './useRadioEditor'
import { useRadioLayout } from './useRadioLayout'
import { useRadioUi } from './useRadioUi'

function App() {
  useNuiMessages()

  const isDevEnvironment = import.meta.env.DEV
  const shellRef = useRef<HTMLElement | null>(null)
  const [isDevEditMode, setIsDevEditMode] = useState(false)
  const { channel, entries, frequency, isEditMode, isVisible, memberCount } = useRadioUi()
  const { attachShell, layout, updateLayout } = useRadioLayout()
  const isEditModeActive = isEditMode || (isDevEnvironment && isDevEditMode)
  const isPanelVisible = isVisible || (isDevEnvironment && isDevEditMode)
  const { finishInteraction, interaction, onDrag, onResize, startDrag, startResize } = useRadioEditor({
    isEditMode: isEditModeActive,
    layout,
    onUpdateLayout: updateLayout,
    shellRef,
  })
  const setShellRef = useCallback(
    (node: HTMLElement | null) => {
      shellRef.current = node
      attachShell(node)
    },
    [attachShell],
  )

  const shellStyle = layout
    ? {
        left: `${layout.x}px`,
        right: 'auto',
        top: `${layout.y}px`,
        transform: `scale(${layout.scale})`,
        transformOrigin: 'top left',
      }
    : undefined

  return (
    <div className="radio-app">
      {isDevEnvironment ? (
        <button
          className={['radio-dev-toggle', isDevEditMode ? 'radio-dev-toggle--active' : ''].filter(Boolean).join(' ')}
          onClick={() => {
            setIsDevEditMode((currentState) => !currentState)
          }}
          type="button"
        >
          {isDevEditMode ? 'Exit Edit Preview' : 'Show Edit Preview'}
        </button>
      ) : null}
      {isEditModeActive ? (
        <div aria-hidden="true" className="radio-edit-overlay">
          <div className="radio-edit-overlay__bounds" />
        </div>
      ) : null}
      <section
        className={[
          'radio-shell',
          isPanelVisible ? 'radio-shell--visible' : '',
          isEditModeActive ? 'radio-shell--edit-mode' : '',
          interaction !== 'idle' ? 'radio-shell--editing' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onPointerCancel={finishInteraction}
        onPointerDown={startDrag}
        onPointerMove={interaction === 'resize' ? onResize : onDrag}
        onPointerUp={finishInteraction}
        ref={setShellRef}
        style={shellStyle}
      >
        <div className="radio-panel">
          <RadioHeader channel={channel} frequency={frequency} isEmpty={entries.length === 0} memberCount={memberCount} />
          <RadioMemberList entries={entries} />
          {isEditModeActive ? <RadioResizeHandles onPointerDown={startResize} /> : null}
        </div>
      </section>
    </div>
  )
}

export default App
