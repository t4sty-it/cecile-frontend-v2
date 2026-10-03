import readme from '../../README.md'

// README.md is the docs index, every docs/<page>.md becomes page <page>;
// the html comes from plugins/markdown.ts, which rewrites links to match
const pages = import.meta.glob<string>('/docs/*.md', { eager: true, import: 'default' })

export const docs: Record<string, string> = {
  '': readme,
  ...Object.fromEntries(
    Object.entries(pages).map(([file, html]) => [file.replace(/^\/docs\/(.*)\.md$/, '$1'), html])
  ),
}
