export function RadioHeader({
  channel,
  frequency,
  memberCount,
}: {
  channel: string
  frequency: string
  memberCount: number
}) {
  return (
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
  )
}
