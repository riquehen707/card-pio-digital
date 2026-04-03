"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

function isStandalone() {
  if (typeof window === "undefined") return false

  const iosNavigator = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(iosNavigator.standalone)
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [instalado, setInstalado] = useState(false)

  useEffect(() => {
    setInstalado(isStandalone())

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined)
    }

    function handleBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    function handleAppInstalled() {
      setInstalado(true)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  async function instalar() {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice

    if (choice.outcome !== "accepted") {
      return
    }

    setDeferredPrompt(null)
  }

  if (instalado || !deferredPrompt) {
    return null
  }

  return (
    <Button size="sm" onClick={instalar} className="rounded-full">
      <Download className="size-4" />
      Instalar app
    </Button>
  )
}

