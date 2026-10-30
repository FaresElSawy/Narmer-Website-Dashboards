export async function chooseDateTime(page, label, local) {
  await page.getByRole('button', { name: label, exact: true }).click()
  const picker = page.locator('.narmer-date-popover:popover-open')
  async function choose(name, value) {
    const trigger = picker.getByRole('combobox', { name, exact: true }),
      text = await trigger.locator('..').locator(`select option[value="${value}"]`).innerText()
    await trigger.click()
    await picker.getByRole('listbox').getByRole('option', { name: text, exact: true }).click()
  }
  const ar = (await picker.getAttribute('dir')) === 'rtl'
  await choose(ar ? 'السنة' : 'Year', Number(local.slice(0, 4)))
  await choose(ar ? 'الشهر' : 'Month', Number(local.slice(5, 7)) - 1)
  await picker.locator(`[data-date="${local.slice(0, 10)}"]`).click()
  await choose(ar ? 'الساعة' : 'Hour', local.slice(11, 13))
  await choose(ar ? 'الدقيقة' : 'Minute', local.slice(14, 16))
  await picker.getByRole('button', { name: ar ? 'تطبيق' : 'Apply', exact: true }).click()
  await picker.waitFor({ state: 'hidden' })
}
