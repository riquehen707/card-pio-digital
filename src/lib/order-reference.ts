function pad(value: number) {
  return String(value).padStart(2, "0")
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "X")
}

export function generateOrderReference(date = new Date()) {
  const year = String(date.getFullYear()).slice(-2)
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return `AJ-${year}${month}${day}-${hours}${minutes}-${randomSuffix()}`
}

export function normalizeOrderReference(value?: string | null) {
  const normalized = value?.trim().toUpperCase()
  return normalized ? normalized : null
}
