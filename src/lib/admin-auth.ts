import "server-only"

import { createHmac, timingSafeEqual } from "crypto"

import { cookies } from "next/headers"

const ADMIN_COOKIE_NAME = "acj_admin_session"

function getAuthSecret() {
  return process.env.AUTH_SECRET || "dev-auth-secret-change-me"
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("hex")
}

export async function createAdminSession() {
  const payload = `admin:${Date.now()}`
  const signature = sign(payload)
  const cookieStore = await cookies()

  cookieStore.set(ADMIN_COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
}

export async function verifyAdminSession() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(ADMIN_COOKIE_NAME)?.value

  if (!raw) return false

  const lastDot = raw.lastIndexOf(".")
  if (lastDot === -1) return false

  const payload = raw.slice(0, lastDot)
  const signature = raw.slice(lastDot + 1)
  const expected = sign(payload)

  const receivedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer)
}

export function validateAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return password === expected
}
