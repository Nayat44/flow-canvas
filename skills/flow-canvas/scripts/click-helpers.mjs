// Click steps for a shots config. Each helper returns a JS expression string that the
// capture script evaluates in the page; returning 'miss' makes the script warn instead
// of silently capturing the previous state.

/** Scope for in-modal clicks — the page behind usually has same-labelled buttons. */
export const IN_DIALOG = "(document.querySelector('[role=\"dialog\"]') ?? document)"

/** Clicks the first button/link inside the dialog matching a predicate on the element. */
export const clickInDialog = (matcherSource) => `(() => {
  const root = ${IN_DIALOG}
  const el = [...root.querySelectorAll('button, a')].find(${matcherSource})
  if (!el) return 'miss'
  el.click()
  return 'ok'
})()`

/** Clicks the nth control inside the dialog whose trimmed text matches exactly. */
export const clickNthInDialog = (text, index) => `(() => {
  const root = ${IN_DIALOG}
  const hits = [...root.querySelectorAll('button, a')].filter((el) => el.textContent?.trim() === ${JSON.stringify(text)})
  if (!hits[${index}]) return 'miss'
  hits[${index}].click()
  return 'ok'
})()`

/** Clicks the last visible element with this exact text — page-wide. */
export const clickByText = (text, tag = '*') => `(() => {
  const hit = [...document.querySelectorAll('${tag}')]
    .reverse()
    .find((el) => el.textContent?.trim() === ${JSON.stringify(text)} && el.offsetParent !== null)
  if (!hit) return 'miss'
  hit.click()
  return 'ok'
})()`

export const clickBySelector = (selector) => `(() => {
  const el = document.querySelector(${JSON.stringify(selector)})
  if (!el) return 'miss'
  el.click()
  return 'ok'
})()`
