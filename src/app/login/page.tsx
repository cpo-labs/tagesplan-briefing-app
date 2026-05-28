import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <>
      <section
        className="grain min-h-svh flex flex-col"
        style={{ background: "var(--cream)", color: "var(--ink)" }}
      >
        <SiteHeader />
        <div
          className="flex-1 flex items-center justify-center"
          style={{ padding: "3rem var(--gut) 5rem" }}
        >
          <div className="w-full max-w-[28rem]">
            <p className="eyebrow">Login per Magic Link</p>
            <h1 className="display mt-6 text-[clamp(2.4rem,4.5vw,3.6rem)] leading-none">
              Deine <em style={{ color: "var(--coral)", fontStyle: "normal" }}>Mail</em>,<br />
              dein Link, fertig.
            </h1>
            <p className="lead mt-5">
              Wir schicken dir einen Login-Link. Keine Passwoerter. Der Link laeuft
              nach 15 Minuten ab.
            </p>
            <div className="mt-9">
              <LoginForm />
            </div>
            <p className="mt-7 text-[0.82rem]" style={{ color: "var(--soft)" }}>
              Mit dem Login akzeptierst du, dass wir deine Mail-Adresse speichern.
              Wir nutzen sie ausschliesslich fuer den Login und das Rate-Limit
              (3 Briefings pro Mail).
            </p>
          </div>
        </div>
        <SiteFooter />
      </section>
    </>
  );
}
