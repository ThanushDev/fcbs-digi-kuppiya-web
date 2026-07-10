export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateRegNumber(reg, batch) {
  const base = /^\d{2}\/(ms|cs)\/\d+$/i
  if (!base.test(reg)) return false

  if (batch) {
    const parts = batch.split('/')
    if (parts.length === 2) {
      const batchStart = parseInt(parts[0])
      const batchEnd = parseInt(parts[1])
      const regYear = parseInt(reg.split('/')[0])
      if (regYear !== batchStart && regYear !== batchEnd - 1) {
        return false
      }
    }
  }
  return true
}

export function validateMobile(mobile) {
  return /^\d{10}$/.test(mobile)
}

export function validatePassword(password) {
  return password.length >= 8
}
