import crypto from 'crypto'

export async function sendMetaEvent(eventName, eventData, userData = {}) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN

  if (!pixelId || !token) {
    console.warn('Meta CAPI: Missing pixel ID or token.')
    return
  }

  const url = `https://graph.facebook.com/v19.0/${pixelId}/events`

  // Node.js crypto hash
  const hashString = (str) => {
    if (!str) return undefined
    return crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex')
  }

  const em = userData.email ? hashString(userData.email) : undefined
  const ph = userData.telefono ? hashString(userData.telefono) : undefined

  // The client_ip and client_user_agent are highly recommended by Meta
  const user_data = {
    client_ip: userData.client_ip || '127.0.0.1',
    client_user_agent: userData.client_user_agent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  }
  
  if (em) user_data.em = [em]
  if (ph) user_data.ph = [ph]

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data,
        custom_data: eventData,
      },
    ],
    access_token: token,
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = await res.json()
    if (!res.ok) {
      console.error('Meta CAPI Error:', result)
    } else {
      console.log(`Meta CAPI: ${eventName} event tracked successfully.`)
    }
  } catch (err) {
    console.error('Meta CAPI Fetch Error:', err.message)
  }
}
