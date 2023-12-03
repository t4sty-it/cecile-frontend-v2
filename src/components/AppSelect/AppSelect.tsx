import './AppSelect.scss'
import { cssClasses } from "@/utils/cssClasses"

export function AppSelect({
  options,
  selected,
}: {
  options: string[],
  selected?: number
}) {

  return (
    <div className="app-select">
      {options.map((option, idx) =>
        <AppOption
          key={idx}
          value={option}
          selected={idx == selected}
        />
      )}
    </div>
  )
}

export function AppOption({
  value,
  selected
}: {
  value: string,
  selected: boolean
}) {

  const className = cssClasses([
    'app-option',
    selected && 'app-option--selected'
  ])

  return (
    <option value={value} className={className}>{value}</option>
  )
}