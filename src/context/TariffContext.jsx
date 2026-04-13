import { createContext, useContext, useState, useMemo } from 'react'
import { TARIFFS, DEFAULT_TARIFF } from '../tariffs/index.js'

const TariffContext = createContext(null)

/**
 * Normalise the per-unit amount across the different shapes used in the JSON:
 *   - most items:      item.amount
 *   - F1:             item.amount_bwp
 *   - B1b / B2:       item.first_10_folios_amount
 *   - fixed_maximum:  item.max_amount
 */
function effectiveAmount(item) {
  if (item.amount != null)               return item.amount
  if (item.amount_bwp != null)           return item.amount_bwp
  if (item.first_10_folios_amount != null) return item.first_10_folios_amount
  if (item.max_amount != null)           return item.max_amount
  return null
}

export function TariffProvider({ children }) {
  const [tariffKey, setTariffKey] = useState(
    () => sessionStorage.getItem('active_tariff') || DEFAULT_TARIFF
  )

  const activeTariff = TARIFFS[tariffKey] ?? TARIFFS[DEFAULT_TARIFF]

  const allSections = activeTariff.sections

  /** Flat list of every item across all sections, with section metadata attached */
  const allItems = useMemo(() =>
    allSections.flatMap(section =>
      section.items.map(item => ({
        ...item,
        _amount: effectiveAmount(item),   // normalised amount
        sectionCode:  section.code,
        sectionLabel: section.label,
      }))
    ),
    [allSections]
  )

  const getItemByCode = (code) =>
    allItems.find(i => i.code === code) ?? null

  const hourlyRates = activeTariff.hourly_rates.rates

  const value = {
    activeTariff,
    allSections,
    allItems,
    getItemByCode,
    hourlyRates,
    tariffKey,
    setTariffKey: (key) => {
      sessionStorage.setItem('active_tariff', key)
      setTariffKey(key)
    },
  }

  return (
    <TariffContext.Provider value={value}>
      {children}
    </TariffContext.Provider>
  )
}

export const useTariff = () => {
  const ctx = useContext(TariffContext)
  if (!ctx) throw new Error('useTariff must be used inside <TariffProvider>')
  return ctx
}
