/// <reference types="vite/client" />
// compiled to an HTML string by plugins/markdown.ts
declare module '*.md' {
  const html: string
  export default html
}
