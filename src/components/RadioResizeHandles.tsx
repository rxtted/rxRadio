import type { PointerEventHandler } from 'react'

import type { EditHandle } from '../types'

const handles: Exclude<EditHandle, null>[] = ['nw', 'ne', 'sw', 'se']

export function RadioResizeHandles({
  onPointerDown,
}: {
  onPointerDown: (handle: EditHandle) => PointerEventHandler<HTMLButtonElement>
}) {
  return (
    <>
      {handles.map((handle) => (
        <button
          aria-label={`Resize ${handle}`}
          className={`radio-resize-handle radio-resize-handle--${handle}`}
          key={handle}
          onPointerDown={onPointerDown(handle)}
          type="button"
        />
      ))}
    </>
  )
}
