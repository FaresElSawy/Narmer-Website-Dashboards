import { prerenderToNodeStream } from 'react-dom/static'
import { text } from 'node:stream/consumers'

export async function renderStatic(element) {
  let failure
  const { prelude, postponed } = await prerenderToNodeStream(element, {
    signal: AbortSignal.timeout(15000),
    // Static files must contain the page inline, rather than script-swapped large sections.
    progressiveChunkSize: Number.MAX_SAFE_INTEGER,
    onError(error) {
      failure = error
    },
  })
  if (failure) throw failure
  if (postponed) throw new Error('Public rendering did not finish; refusing partial HTML')
  return text(prelude)
}
