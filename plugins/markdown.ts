import path from 'node:path'
import { Marked, type RendererObject } from 'marked'
import type { Plugin } from 'vite'

// Compiles imported `.md` files to an HTML string at build time, so the docs
// can be rendered inside the app without shipping a markdown parser.
//
// The markdown is written to read well on the code host, so relative links
// are rewritten for the app:
// - README.md and docs/<page>.md become routes, `<base>` and `<base>/<page>`
// - relative images are imported, so Vite fingerprints and bundles them
// - links to anything else (e.g. source files) are dropped, keeping their text
// - external links open in a new tab, so following one never loses the patch
export function markdown({ base }: { base: string }): Plugin {
  let root = process.cwd()

  const docRoute = (file: string): string | null => {
    const rel = path.relative(root, file)
    if (rel == 'README.md') return base
    const match = rel.match(/^docs\/([^/]+)\.md$/)
    return match ? `${base}/${match[1]}` : null
  }

  return {
    name: 'cecile-markdown',

    configResolved(config) {
      root = config.root
    },

    transform(src, id) {
      if (!id.endsWith('.md')) return null

      const dir = path.dirname(id)
      const images: string[] = []
      const slugs: Record<string, number> = {}

      const renderer: RendererObject = {
        heading({ tokens, depth }) {
          const inner = this.parser.parseInline(tokens)
          const slug = githubSlug(inner)
          const count = slugs[slug] ?? 0
          slugs[slug] = count + 1
          const id = count ? `${slug}-${count}` : slug
          return `<h${depth} id="${id}">${inner}</h${depth}>\n`
        },

        link({ href, tokens }) {
          const inner = this.parser.parseInline(tokens)

          if (/^[a-z]+:/i.test(href))
            return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
          if (href.startsWith('#'))
            return `<a href="${escapeAttr(href)}">${inner}</a>`

          const [file, hash] = href.split('#')
          const route = docRoute(path.resolve(dir, file))
          return route
            ? `<a href="${route}${hash ? '#' + hash : ''}">${inner}</a>`
            : inner
        },

        // ```cecile blocks are runnable snippets: the docs overlay loads them
        // into the console when their button is clicked
        code({ text, lang }) {
          if (lang != 'cecile') return false
          return `<div class="docs-snippet">`
            + `<pre><code class="language-cecile">${escapeHtml(text)}</code></pre>`
            + `<button type="button" class="docs-snippet__load" title="Load into the console">Try it</button>`
            + `</div>\n`
        },

        image({ href, text }) {
          if (/^[a-z]+:/i.test(href))
            return `<img src="${escapeAttr(href)}" alt="${escapeAttr(text)}">`
          images.push(path.resolve(dir, href))
          return `<img src="\0${images.length - 1}\0" alt="${escapeAttr(text)}">`
        },
      }

      const html = new Marked({ renderer, gfm: true }).parse(src, { async: false })

      // splice the imported image urls into the html string
      const parts = html
        .split(/\0(\d+)\0/)
        .map((part, idx) => idx % 2 ? `img${part}` : JSON.stringify(part))

      return {
        code: [
          ...images.map((file, idx) => `import img${idx} from ${JSON.stringify(file)}`),
          `export default ${parts.join(' + ')}`,
        ].join('\n'),
        map: null,
      }
    },
  }
}

// mirrors the anchors GitHub/Bitbucket generate, so `#section` links in the
// markdown work in both places
function githubSlug(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z0-9#]+;/gi, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-')
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
