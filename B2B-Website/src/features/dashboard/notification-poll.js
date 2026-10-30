// One in-flight read, no hidden-tab requests, and bounded backoff after failures.
export function startNotificationPoll(
  read,
  commit,
  { document: page = globalThis.document, setTimer = setTimeout, clearTimer = clearTimeout } = {},
) {
  let stopped = false,
    timer,
    controller,
    failures = 0,
    resumeAt = 0
  async function run() {
    clearTimer(timer)
    if (stopped || page.hidden || controller) return
    const remaining = resumeAt - Date.now()
    if (remaining > 0) {
      timer = setTimer(run, remaining)
      return
    }
    controller = new AbortController()
    let delay = 60000
    try {
      const result = await read(controller.signal)
      if (!stopped) commit(result)
      failures = 0
    } catch (error) {
      if (stopped || error.name === 'AbortError') return
      if ([401, 403].includes(error.status)) {
        stopped = true
        return
      }
      failures++
      delay = Math.max(
        (error.retryAfter ?? 0) * 1000,
        Math.min(300000, 30000 * 2 ** Math.min(failures, 4)),
      )
    } finally {
      controller = null
    }
    resumeAt = Date.now() + delay
    if (!stopped) timer = setTimer(run, delay)
  }
  const resume = () => {
    if (!page.hidden) run()
    else clearTimer(timer)
  }
  page.addEventListener('visibilitychange', resume)
  run()
  return {
    refresh: () => {
      if (Date.now() >= resumeAt) run()
    },
    stop: () => {
      stopped = true
      clearTimer(timer)
      controller?.abort()
      page.removeEventListener('visibilitychange', resume)
    },
  }
}
