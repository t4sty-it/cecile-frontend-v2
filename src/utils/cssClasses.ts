export function cssClasses(classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}