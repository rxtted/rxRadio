import { useCallback, useRef } from 'react'

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

  const shellRef = useRef<HTMLElement | null>(null)
  const { channel, entries, frequency, isEditMode, isVisible, memberCount } = useRadioUi()
  const { attachShell, layout, updateLayout } = useRadioLayout()
  const { finishInteraction, interaction, onDrag, onResize, startDrag, startResize } = useRadioEditor({
    isEditMode,
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
      <section
        className={[
          'radio-shell',
          isVisible ? 'radio-shell--visible' : '',
          isEditMode ? 'radio-shell--edit-mode' : '',
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
          <RadioHeader channel={channel} frequency={frequency} memberCount={memberCount} />
          <RadioMemberList entries={entries} isEmpty={entries.length === 0} />
          {isEditMode ? <RadioResizeHandles onPointerDown={startResize} /> : null}
        </div>
      </section>
    </div>
  )
}

export default App
