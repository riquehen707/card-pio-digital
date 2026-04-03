"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import {
  clearAdminSession,
  createAdminSession,
  validateAdminPassword,
  verifyAdminSession,
} from "@/lib/admin-auth"
import { runGoogleAdsSync } from "@/lib/google-ads"

export async function loginAdminAction(formData: FormData) {
  const password = String(formData.get("password") || "")

  if (!validateAdminPassword(password)) {
    redirect("/admin/login?error=invalid_credentials")
  }

  await createAdminSession()
  redirect("/admin")
}

export async function logoutAdminAction() {
  await clearAdminSession()
  redirect("/admin/login")
}

export async function syncGoogleAdsAction() {
  const isAuthenticated = await verifyAdminSession()
  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  await runGoogleAdsSync()
  revalidatePath("/admin")
  redirect("/admin?sync=success")
}

