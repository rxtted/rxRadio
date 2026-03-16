const getResourceName = () =>
  typeof window.GetParentResourceName === 'function' ? window.GetParentResourceName() : window.location.hostname

export const postNui = async (eventName: string, payload: unknown = {}) => {
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
