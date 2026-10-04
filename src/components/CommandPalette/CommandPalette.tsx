import { nodes } from '@/lib/commands/node/nodes'
import { useEffect } from 'react'
import './CommandPalette.scss'

// Group node types by the category each module declares for itself, so that
// new modules show up here without touching this component.
const byCategory = Object.entries(nodes).reduce<Record<string, string[]>>(
  (acc, [name, node]) => ({
    ...acc,
    [node.category]: [...(acc[node.category] ?? []), name]
  }),
  {}
)

export default function CommandPalette({
  onSelect,
  onClose,
}: {
  onSelect: (nodeType: string) => void,
  onClose: () => void,
}) {

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="command-palette" onMouseDown={e => { e.stopPropagation(); onClose() }}>
      <div className="command-palette__panel" onMouseDown={e => e.stopPropagation()}>
        {Object.entries(byCategory).map(([category, names]) =>
          <section key={category} className="command-palette__category">
            <h2>{category}</h2>
            <div className="command-palette__items">
              {names.map(name =>
                <button
                  key={name}
                  className="command-palette__item"
                  onClick={() => onSelect(name)}
                >
                  {name}
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
