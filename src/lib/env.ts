/**
 * Centralised env access. We read process.env lazily via a getter Proxy so
 * scripts that load dotenv after the module is imported still see the
 * values. In Next.js, .env.local is loaded by the framework before any
 * server code runs, so the laziness is essentially free there.
 */

const optional = (name: string): string | undefined => process.env[name] || undefined;

interface Env {
  databaseUrl: string;
  databaseAuthToken: string | undefined;

  anthropicKey: string | undefined;
  anthropicModel: string;

  betterAuthSecret: string;
  betterAuthUrl: string;

  resendKey: string | undefined;
  resendFrom: string;

  tavilyKey: string | undefined;
  exaKey: string | undefined;

  serviceCalendarEmail: string;

  limitPerEmail: number;
  limitGlobalDaily: number;

  isProd: boolean;
}

const handler: ProxyHandler<{}> = {
  get(_target, prop: string) {
    switch (prop) {
      case "databaseUrl":
        return process.env.DATABASE_URL ?? "file:./data/dev.db";
      case "databaseAuthToken":
        return optional("DATABASE_AUTH_TOKEN");
      case "anthropicKey":
        return optional("ANTHROPIC_API_KEY");
      case "anthropicModel":
        return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
      case "betterAuthSecret":
        return (
          process.env.BETTER_AUTH_SECRET ||
          "dev-only-do-not-use-in-prod-change-me-please-32-chars"
        );
      case "betterAuthUrl":
        return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
      case "resendKey":
        return optional("RESEND_API_KEY");
      case "resendFrom":
        return (
          process.env.RESEND_FROM ?? "Tagesplan-Briefing <hello@labs.appsales-consulting.de>"
        );
      case "tavilyKey":
        return optional("TAVILY_API_KEY");
      case "exaKey":
        return optional("EXA_API_KEY");
      case "serviceCalendarEmail":
        return process.env.SERVICE_CALENDAR_EMAIL ?? "briefing@appsales-consulting.com";
      case "limitPerEmail":
        return Number(process.env.BRIEFING_LIMIT_PER_EMAIL ?? 3);
      case "limitGlobalDaily":
        return Number(process.env.BRIEFING_LIMIT_GLOBAL_DAILY ?? 50);
      case "isProd":
        return process.env.NODE_ENV === "production";
      default:
        return undefined;
    }
  },
};

export const env = new Proxy({}, handler) as Env;
