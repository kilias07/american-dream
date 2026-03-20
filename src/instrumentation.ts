export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const events = await import('events')
    events.default.defaultMaxListeners = 20
  }
}
