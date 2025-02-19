import type { EmailConfig, EmailUserConfig } from "./index.js"
import type { Awaitable, Theme } from "../types.js"
import { html, text } from "../lib/utils/email.js"
import { AuthError } from "../errors.js"

interface BrevoConfig
  extends Omit<EmailConfig, "from" | "options" | "sendVerificationRequest"> {
  from?: {
    name?: string
    email: string
  }
  sendVerificationRequest: (params: {
    identifier: string
    url: string
    expires: Date
    provider: BrevoConfig
    token: string
    theme: Theme
    request: Request
  }) => Awaitable<void>
  options?: BrevoUserConfig
}

export type BrevoUserConfig = Omit<Partial<BrevoConfig>, "options" | "type">

/**
 * Add Brevo login to your page.
 *
 * ### Setup
 *
 * #### Configuration
 * Add an `AUTH_BREVO_KEY` variable to your `.env` file containing your API key, then add a code similar to the following in your `auth.ts` file
 *```ts
 * ...
 * import Brevo from "@auth/core/providers/brevo"
 * ...
 *
 * // Add Brevo to your list of providers (SvelteKit shown here)
 * export const { handle, signIn, signOut } = SvelteKitAuth({
 *   adapter: YourAdapter(),
 *   providers: [Brevo({
 *      apiKey: process.env.SOME_NAME // only if the environment variable isn't named AUTH_BREVO_KEY
 *      from: {
 *        email:"example@example.com"
 *        name:"ACME"
 *      }
 *    })
 *   ],
 * })
 * ```
 *
 * ### Resources
 *
 *  - [Brevo documentation](https://developers.brevo.com/docs)
 *
 * :::info **Disclaimer**
 *
 * If you think you found a bug in the default configuration, you can [open an issue](https://authjs.dev/new/provider-issue).
 *
 * Auth.js strictly adheres to the specification and it cannot take responsibility for any deviation from
 * the spec by the provider. You can open an issue, but if the problem is non-compliance with the spec,
 * we might not pursue a resolution. You can ask for more help in [Discussions](https://authjs.dev/new/github-discussions).
 *
 * :::
 */
export default function Brevo(config: BrevoUserConfig): BrevoConfig {
  return {
    id: "brevo",
    type: "email",
    name: "Brevo",
    from: {
      email: "no-reply@authjs.dev",
    },
    maxAge: 24 * 60 * 60,
    async sendVerificationRequest(params) {
      const { identifier: to, provider, url, theme } = params
      const { host } = new URL(url)
      if (!provider.from) throw new Error("Brevo error: Missing sender info")
      if (!provider.apiKey) throw new AuthError("Missing Brevo API key")

      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": provider.apiKey,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: provider.from.name,
            email: provider.from.email,
          },
          to: [
            {
              email: to,
            },
          ],
          subject: `Sign in to ${host}`,
          htmlContent: html({ url, host, theme }),
          textContent: text({ url, host }),
        }),
      })

      if (!res.ok)
        throw new Error("Brevo error: " + JSON.stringify(await res.json()))
    },
    options: config,
  }
}
