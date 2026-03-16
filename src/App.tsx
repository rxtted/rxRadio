import './index.css'

import { useRadioUi } from './useRadioUi'

function App() {
  const { channel, entries, frequency, isEmpty, isVisible, memberCount } = useRadioUi()

  return (
    <div className="radio-app">
      <section className={`radio-shell${isVisible ? ' radio-shell--visible' : ''}`}>
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
