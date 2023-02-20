export const __prod__ = process.env.NODE_ENV === 'production'

//TODO: add server link
export const SERVER = __prod__ ? "" : 'http://localhost:4000'

export const CLIENT  = __prod__ ? "gamingpills.com" : 'http://localhost:3000'

export const COOKIE_NAME = 'qid'

export const VERIFY_EMAIL_PREFIX = 'verify-email'

export const RESET_PASSWORD_EMAIL_PREFIX = 'reset-password'

export const PLATFROM_FEE = 10