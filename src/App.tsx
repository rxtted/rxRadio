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
                  <div className="radio-entry__info">
                    <span aria-hidden="true" className="radio-entry__pulse" />
                    <span className="radio-entry__name">{entry.name}</span>
                  </div>
                  {entry.isSelf ? <span className="radio-entry__pill">You</span> : null}
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
