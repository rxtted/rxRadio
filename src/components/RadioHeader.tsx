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
      <div className="badge-header__frequency">
        <strong id="radio-frequency">{frequency}</strong>
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
