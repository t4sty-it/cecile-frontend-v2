// Re-runs ESLint whenever a .ts/.tsx file under src/ changes.
// The "lint: started" / "lint: finished" lines delimit each run for the
// background problem matcher of the "bun: lint watch" VS Code task.
import { watch } from 'node:fs'

let running = false
let pending = false
let timer: ReturnType<typeof setTimeout> | undefined

async function lint() {
  if (running) {
    pending = true
    return
  }
  running = true
  console.log('lint: started')
  const proc = Bun.spawn(
    ['node_modules/.bin/eslint', '.', '--report-unused-disable-directives'],
    { stdout: 'inherit', stderr: 'inherit' },
  )
  await proc.exited
  console.log('lint: finished')
  running = false
  if (pending) {
    pending = false
    lint()
  }
}

watch('src', { recursive: true }, (_, file) => {
  if (!file || !/\.tsx?$/.test(file)) return
  clearTimeout(timer)
  timer = setTimeout(lint, 200)
})

lint()
