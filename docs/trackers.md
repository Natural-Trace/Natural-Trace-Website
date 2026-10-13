# Third parties and trackers

Every outside service the live site talks to, what it receives, and what has to
happen before it runs. Written 13 Oct 2026 from the built site and a live test
on natural-trace.com, not from memory.

**Update this file in the same change that adds or removes a script, font,
image host, form endpoint or vendor.** The privacy policy at `/privacy/` has to
name everything listed here; if this list and the policy disagree, the policy
is the one that is wrong and someone is relying on it.

## What loads, and when

| Service | Host | What it receives | Runs when |
|---|---|---|---|
| GitHub Pages | natural-trace.com | IP, user agent, every page request | Always. It is the host. |
| Cloudflare Web Analytics | static.cloudflareinsights.com, cloudflareinsights.com | IP, user agent, page URL, referrer. No cookie. | Always |
| PostHog (EU) | eu-assets.i.posthog.com, eu.i.posthog.com | IP (anonymised by the project), user agent, page URL, clicks, quiz option IDs. Cookieless until Accept. | Always, cookieless. A cookie and session replay only after Accept. |
| HubSpot tracking | js-na2.hs-scripts.com and the hs-* hosts it loads | IP, user agent, page views, HubSpot cookies | Only after Accept |
| HubSpot Forms API | api-na2.hsforms.com | Everything typed into the contact form, plus the page URL | Only when the visitor presses Send |
| LinkedIn | linkedin.com iframe | IP, user agent, LinkedIn cookies | Only when the visitor clicks to load a post |
| unpkg | unpkg.com | IP of the editor | `/admin/` only. Decap, pinned and integrity-checked. |
| GitHub API | api.github.com | Editor's GitHub token | `/admin/` only |
| CMS sign-in Worker | Cloudflare Workers, source in `oauth/` | GitHub OAuth code and token, in transit | `/admin/` login only |

Fonts and every image are served from natural-trace.com itself. Google Fonts
was removed on 13 Oct 2026 and the last Unsplash hotlink the same day.

## Session replay

Replay records only visitors who have pressed Accept. Four things have to
agree before a page is recorded, and each one alone is enough to stop it:

1. **The code.** `disable_session_recording: true` in `src/_includes/base.njk`;
   the recorder starts only from `startSessionRecording()` after Accept.
2. **The project switch.** Session replay on, in PostHog project 264315.
3. **The allowed domain.** `recording_domains` is `https://natural-trace.com`
   only, so a copy of the site elsewhere cannot record into the project.
4. **The URL blocklist.** `/contact` and `/admin` are never recorded.

Inside a recording, every input is masked (in code and in the project), and the
contact form carries `ph-no-capture`, which removes it entirely. Console logs
are not captured. Network request bodies and headers are not captured.
Recordings are deleted after 30 days.

Items 2 to 4 were set through the PostHog API on 13 Oct 2026. They live in
PostHog, not here, so check them with `project-get` if replay ever records
something it should not.

## Repository settings

Set on 13 Oct 2026, on a public repository:

- Secret scanning and push protection: on.
- Dependabot alerts and security updates: on.
- Ruleset "Protect main": no deletion, no force-push. Pull requests are not
  required, on purpose: Decap publishes by merging its own pull requests and
  CMS editors cannot work around a required review.

## Not yet done

- **The privacy policy** does not yet name GitHub, Google (until 13 Oct) or
  Unsplash, says nothing about legal basis, transfers, retention or the right
  to complain, and its effective date predates PostHog and HubSpot. That is a
  rewrite for Kirsty and a lawyer, not a code change.
- **natural-trace.netlify.app is still live**: old privacy policy, no consent
  banner, a git-gateway `/admin/`. It needs unpublishing in the Netlify
  dashboard.
- **The CMS sign-in Worker changes in `oauth/` are not live until someone runs
  `wrangler deploy`** from that folder. Merging does not deploy it.
- **HubSpot's form has no CAPTCHA.** The site's only spam check is a honeypot
  field. reCAPTCHA is a setting on the form in HubSpot.
- **The breach plan is a draft.** `docs/breach-plan.md` needs the CEO to fill
  in the roles, agree it, and set up the private contact sheet it refers to.
- **No security headers beyond Referrer-Policy.** GitHub Pages cannot send
  them. A real CSP, HSTS and frame protection need Cloudflare (or similar) in
  front of the site.
