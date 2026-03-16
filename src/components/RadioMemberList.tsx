import type { RadioEntry } from '../types'

export function RadioMemberList({ entries, isEmpty }: { entries: RadioEntry[]; isEmpty: boolean }) {
  return (
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
  )
}
