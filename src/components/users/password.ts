// Sin caracteres ambiguos (0/O, 1/l/I) para que sea fácil de dictar o transcribir
const LOWER = 'abcdefghijkmnpqrstuvwxyz'
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%*-_?'
const ALL = LOWER + UPPER + DIGITS + SYMBOLS

const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length]

/** Contraseña aleatoria con al menos una letra minúscula, mayúscula, número y símbolo. */
export function generatePassword(length = 14) {
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)]
  while (chars.length < length) chars.push(pick(ALL))
  // Fisher–Yates para que los caracteres obligatorios no queden siempre al principio
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

export const STRENGTH_LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'] as const

/** Puntaje de 0 a 4 según longitud y variedad de caracteres. */
export function passwordStrength(pw: string) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length
  if (kinds >= 3) score++
  if (kinds === 4 && pw.length >= 10) score++
  return pw.length < 8 ? Math.min(score, 1) : score
}
