export function RadioHeader({
  channel,
  frequency,
  memberCount,
  isEmpty,
}: {
  channel: string
  frequency: string
  memberCount: number
  isEmpty: boolean
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
        {isEmpty ? '..' : 'online'} <strong id="radio-member-count">{isEmpty ? '..' : memberCount}</strong>
      </span>
    </header>
  )
}
