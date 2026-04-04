import { redirect } from "next/navigation"

import { logoutAdminAction, syncGoogleAdsAction } from "@/app/admin/actions"
import { verifyAdminSession } from "@/lib/admin-auth"
import { getAdminDashboardData } from "@/lib/admin-dashboard"

export const dynamic = "force-dynamic"

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const NUMBER = new Intl.NumberFormat("pt-BR")

function formatDateTime(value: Date | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value)
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper?: string
}) {
  return (
    <div className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      {helper ? <p className="mt-2 text-sm text-muted-foreground">{helper}</p> : null}
    </div>
  )
}

export default async function AdminPage() {
  const isAuthenticated = await verifyAdminSession()
  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  const data = await getAdminDashboardData()

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <section className="flex flex-col gap-4 rounded-[36px] border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
            Analytics
          </p>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">Painel de dados</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Funil de navegação, leads disparados via WhatsApp, campanhas UTM e dados diários do
              Google Ads.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Último sync Google Ads:{" "}
            <span className="font-medium text-foreground">
              {formatDateTime(
                data.latestSyncRun?.finishedAt ?? data.latestSyncRun?.startedAt ?? null
              )}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <form action={syncGoogleAdsAction}>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Sincronizar Google Ads
            </button>
          </form>
          <form action={logoutAdminAction}>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-5 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Sair
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Leads em 30 dias"
          value={NUMBER.format(data.summary.totalLeads)}
          helper={`${NUMBER.format(data.summary.totalSessions)} sessões iniciadas`}
        />
        <MetricCard
          label="Receita estimada"
          value={BRL.format(data.summary.estimatedRevenue)}
          helper={`${BRL.format(data.summary.totalDeliveryFees)} em taxas de entrega`}
        />
        <MetricCard
          label="Add to cart"
          value={NUMBER.format(data.summary.totalProductAdds)}
          helper={`${NUMBER.format(data.summary.totalPageViews)} page views rastreados`}
        />
        <MetricCard
          label="Google Ads"
          value={BRL.format(data.summary.googleAdsSpend)}
          helper={`${NUMBER.format(data.summary.googleAdsClicks)} cliques e ${NUMBER.format(
            data.summary.googleAdsImpressions
          )} impressões`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[32px] border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Série diária</h2>
              <p className="text-sm text-muted-foreground">
                Últimos 14 dias de leads e investimento.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {data.dailySeries.map((row) => {
              const maxRevenue = Math.max(...data.dailySeries.map((item) => item.revenue), 1)
              const width = `${Math.max((row.revenue / maxRevenue) * 100, row.revenue > 0 ? 8 : 0)}%`

              return (
                <div
                  key={row.day}
                  className="grid gap-2 rounded-2xl border border-border bg-background p-3 lg:grid-cols-[96px_1fr_auto] lg:items-center"
                >
                  <div className="text-sm font-medium text-foreground">{row.day}</div>
                  <div className="h-3 rounded-full bg-secondary">
                    <div className="h-3 rounded-full bg-primary" style={{ width }} />
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {row.leads} lead(s) • {BRL.format(row.revenue)} • Ads{" "}
                    {BRL.format(row.adSpend)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-[32px] border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Sync Google Ads</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Status mais recente da rotina de sincronização.
          </p>
          <div className="mt-5 space-y-3 text-sm">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-muted-foreground">Status</p>
              <p className="mt-1 font-medium text-foreground">
                {data.latestSyncRun?.status ?? "Sem execuções"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-muted-foreground">Início</p>
              <p className="mt-1 font-medium text-foreground">
                {formatDateTime(data.latestSyncRun?.startedAt ?? null)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-muted-foreground">Fim</p>
              <p className="mt-1 font-medium text-foreground">
                {formatDateTime(data.latestSyncRun?.finishedAt ?? null)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-muted-foreground">Erro</p>
              <p className="mt-1 font-medium text-foreground">
                {data.latestSyncRun?.errorMessage ?? "Nenhum"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Produtos mais pedidos</h2>
          <div className="mt-4 overflow-hidden rounded-3xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-secondary/60 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Quantidade</th>
                  <th className="px-4 py-3 font-medium">Leads</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product) => (
                  <tr key={product.productId} className="border-t border-border bg-background">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{product.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.category || "Sem categoria"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{NUMBER.format(product.quantity)}</td>
                    <td className="px-4 py-3 text-foreground">
                      {NUMBER.format(product.leadCount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[32px] border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Campanhas UTM</h2>
          <div className="mt-4 overflow-hidden rounded-3xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-secondary/60 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">Campanha</th>
                  <th className="px-4 py-3 font-medium">Leads</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((campaign) => (
                  <tr
                    key={`${campaign.source}-${campaign.medium}-${campaign.campaign}`}
                    className="border-t border-border bg-background"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{campaign.source}</div>
                      <div className="text-xs text-muted-foreground">{campaign.medium}</div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{campaign.campaign}</td>
                    <td className="px-4 py-3 text-foreground">{NUMBER.format(campaign.leads)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-[32px] border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Google Ads por campanha</h2>
          <div className="mt-4 overflow-hidden rounded-3xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-secondary/60 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Campanha</th>
                  <th className="px-4 py-3 font-medium">Cliques</th>
                  <th className="px-4 py-3 font-medium">Investimento</th>
                </tr>
              </thead>
              <tbody>
                {data.googleAdsCampaigns.map((campaign) => (
                  <tr key={campaign.campaignId} className="border-t border-border bg-background">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{campaign.campaignName}</div>
                      <div className="text-xs text-muted-foreground">
                        {NUMBER.format(campaign.impressions)} impressões •{" "}
                        {NUMBER.format(campaign.conversions)} conversões
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{NUMBER.format(campaign.clicks)}</td>
                    <td className="px-4 py-3 text-foreground">{BRL.format(campaign.spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[32px] border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Últimos leads</h2>
          <div className="mt-4 space-y-3">
            {data.latestLeads.map((lead) => (
              <div key={lead.id} className="rounded-3xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{BRL.format(lead.total)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(lead.createdAt)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{lead.utmCampaign || "Sem campanha"}</div>
                    <div>{lead.gclid ? "Com GCLID" : "Sem GCLID"}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-foreground">
                  {lead.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
