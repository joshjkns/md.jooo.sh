export const settings = {
  type: "settings",
  accountId: "85bdedefc99883a456bfc20cdd969962",
} as const;

export default {
  type: "worker",
  name: "md-jooo-sh-api",
  entrypoint: "worker/src/index.ts",
  compatibilityDate: "2026-07-23",
  workersDev: true,
  domains: ["api.md.jooo.sh"],
  triggers: [{ type: "scheduled", schedule: "17 3 * * *" }],
  observability: { enabled: true },
  env: {
    DB: {
      type: "d1",
      name: "md-jooo-sh",
      id: "1b7db208-e2f8-4d36-be5b-4340f27f9ecc",
      remote: true,
    },
    ALLOWED_ORIGIN: {
      type: "text",
      value: "https://md.jooo.sh",
    },
    PASTE_IP_HASH_SALT: {
      type: "secret",
    },
  },
} as const;
