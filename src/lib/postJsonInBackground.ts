type PostJsonResult = {
  transport: "beacon" | "fetch"
}

export function postJsonInBackground(url: string, payload: unknown): PostJsonResult {
  const body = JSON.stringify(payload)

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const sent = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }))

    if (sent) {
      return { transport: "beacon" }
    }
  }

  void fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body,
    keepalive: true,
    cache: "no-store",
  }).catch(() => undefined)

  return { transport: "fetch" }
}
