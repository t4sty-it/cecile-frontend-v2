import { MouseEvent, useEffect, useRef } from "react"
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom"
import { docs } from "@/lib/docs"
import './DocsOverlay.scss'

// Rendered over the graph page (as a child route) rather than as a page of
// its own, so opening the docs doesn't unmount the editor and lose the patch
export default function DocsOverlay() {
  const { page = '' } = useParams()
  const { hash } = useLocation()
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  const close = () => navigate('/graph')

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key == 'Escape' && close()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  useEffect(() => {
    const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)))
    if (target) target.scrollIntoView()
    else scrollRef.current?.scrollTo(0, 0)
  }, [page, hash])

  // links in the compiled markdown are plain <a>s: route internal ones
  // through the router instead of reloading the page
  const onClick = (e: MouseEvent) => {
    const link = (e.target as HTMLElement).closest('a')
    if (!link || link.target) return

    const url = new URL(link.href)
    if (url.origin != location.origin) return

    e.preventDefault()
    navigate(url.pathname + url.hash)
  }

  const html = docs[page]

  return (
    <div className="docs-overlay" onClick={close}>
      <div className="docs-overlay__panel" onClick={e => e.stopPropagation()}>
        <nav className="docs-overlay__nav">
          <NavLink to="/graph/docs" end>Readme</NavLink>
          <NavLink to="/graph/docs/language">Language</NavLink>
          <NavLink to="/graph/docs/modules">Modules</NavLink>
          <button className="docs-overlay__close" title="Close (Esc)" onClick={close}>×</button>
        </nav>

        <div className="docs-overlay__scroll" ref={scrollRef}>
          {html != null
            ? <article
                className="docs-overlay__content"
                onClick={onClick}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            : <article className="docs-overlay__content">
                <p>No such page.</p>
              </article>
          }
        </div>
      </div>
    </div>
  )
}
