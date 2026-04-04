import { loginAdminAction } from "@/app/admin/actions"

export const dynamic = "force-dynamic"

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const invalidCredentials = params.error === "invalid_credentials"

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <section className="w-full rounded-[32px] border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
            Admin
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Entrar no painel
          </h1>
          <p className="text-sm text-muted-foreground">
            Use a senha definida em <code>ADMIN_PASSWORD</code> para acessar os dados do negócio.
          </p>
        </div>

        <form action={loginAdminAction} className="space-y-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
            Senha
            <input
              type="password"
              name="password"
              className="h-12 rounded-2xl border border-border bg-background px-4 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </label>

          {invalidCredentials ? (
            <p className="text-sm text-destructive">Senha inválida.</p>
          ) : null}

          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Entrar
          </button>
        </form>
      </section>
    </main>
  )
}
