const wrap = (target, prefix = '{{', postfix = '}}', escape = false) => {
  const matcher = el => el.match(/./g).map(char => `\\${char}`).join('')
  if (escape) {
    return `${matcher(prefix)}${target}${matcher(postfix)}`
  } else {
    return `${prefix}${target}${postfix}`
  }
}
export { wrap }
