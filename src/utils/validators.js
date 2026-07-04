export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateRegNumber(reg) {
  return /^\d{2}\/(ms|cs)\/\d+$/i.test(reg)
}

export function validateMobile(mobile) {
  return /^\d{10}$/.test(mobile)
}

export function validatePassword(password) {
  return password.length >= 8
}
