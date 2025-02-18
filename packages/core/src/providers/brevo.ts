import type { EmailConfig, EmailUserConfig } from "./index.js"
import { html, text } from "../lib/utils/email.js"
import { AuthError } from "../errors.js"

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
 *   providers: [Brevo],
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
export default function Brevo(config: EmailUserConfig): EmailConfig {
  return {
    id: "brevo",
    type: "email",
    name: "Brevo",
    from: "Auth.js <no-reply@authjs.dev>",
    maxAge: 24 * 60 * 60,
    async sendVerificationRequest(params) {
      const { identifier: to, provider, url, theme } = params
      const { host } = new URL(url)
      const domain = provider.from?.split("@").at(1)

      if (!domain) throw new Error("Invalid sender email")
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
            name: provider.name,
            email: provider.from,
          },
          to: [
            {
              email: to,
            },
          ],
          subject: `Sign in to ${host}`,
          html: html({ url, host, theme }),
          text: text({ url, host }),
        }),
      })

      if (!res.ok)
        throw new Error("Brevo error: " + JSON.stringify(await res.json()))
    },
    options: config,
  }
}
