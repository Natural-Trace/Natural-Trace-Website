# PostHog Setup

PostHog records which pages are read and what gets clicked, page by page and
element by element. It is the third measuring tool on the site and it overlaps
with the other two on purpose:

| | Sets a cookie | Sees | Good for |
|---|---|---|---|
| Cloudflare Web Analytics | Never | Everyone | Page-view counts |
| HubSpot tracking | Yes | Only people who tap Accept | Tying a visit to a CRM contact |
| PostHog | Only after Accept | Everyone, at two levels of detail | Clicks, funnels, the quiz, session replay for consenters |

The thing it adds that the other two cannot is event-level data on the
compatibility quiz: where people abandon it, which combinations they actually
enter, and whether "Testing required" is where they leave. That is evidence for
the four open quiz decisions.

## 1. Switching it on

1. Create a project at **eu.posthog.com** (EU region, so the data stays there).
   Do not use us.posthog.com unless there is a decision on record to.
2. In that project, switch on **Cookieless server hash mode** under Project
   Settings, Web analytics. Without it PostHog will not accept the anonymous
   events, and the site's own code sends none until PostHog confirms the
   setting is on. Everyone who has not tapped Accept would then go uncounted,
   silently.
3. Copy the **Project API key** from Settings, Project. It starts with `phc_`.
   It is a public key, published in every page. It is not the personal API
   key, which must never go anywhere near this repository.
4. In the CMS, Integrations, **PostHog Analytics**: paste the token, set the
   region to `eu`, tick Enabled.
5. **Before publishing**, add the privacy policy paragraph in section 3 below.
   The policy currently names Cloudflare as the one tool that runs without
   asking; once PostHog is on that sentence is incomplete.
6. **After publishing**, open the live site in a private window, do not touch
   the banner, click around, and confirm a pageview arrives in PostHog. This
   is the one part that could not be checked before going live: with no real
   project behind it, the cookied path was seen sending and the cookieless
   path was not, which is what step 2 exists to fix.

Until the token is filled in nothing loads at all.

## 2. How consent works

The site already has a cookie banner. PostHog is wired to it in
`src/_includes/partials/consent.njk`, and loads from `src/_includes/base.njk`
in a mode PostHog calls `on_reject`:

- **Before any choice, and after Decline:** no cookie. The only thing kept on
  the device is a flag saying "not accepted", in the same browser storage the
  banner already uses for its own answer. Visitors are counted by a hash
  computed on PostHog's servers from IP address and browser, under a salt that
  changes daily. Page views, clicks, rage clicks and heatmaps all still work.
- **After Accept:** a cookie, so the same person is recognised across days,
  and session replay can run if it is switched on in PostHog.

Three consequences to know before reading the numbers:

- **Visitor counts are inflated.** The daily salt means one person on Monday
  and Tuesday is two people. Compare trends, not absolute unique-visitor
  figures, for anyone who has not accepted.
- **Two people on one office network with the same browser can merge into
  one.** Rare, and irrelevant to page and click counts.
- **Session replay and surveys never run for anyone who has not accepted.**
  This is enforced by PostHog, not by us, and cannot be switched off.

Session replay is a switch in the PostHog project settings, not in this
repository. Leave it off unless there is a reason on record; when on, form
inputs are masked by default, which covers the contact form.

## 3. Privacy policy wording

Draft for the "Cookies and Tracking Technologies" section of `/privacy/`,
directly after the Cloudflare paragraph. Wording is for Kirsty to approve;
the facts in it are what the code does.

> We also use PostHog to understand which pages are read and what visitors
> click on, so we can improve the site. Until you accept cookies it sets no
> cookie, and the only thing kept on your device is a note that you have not
> accepted; visitors are counted using an anonymised identifier that changes
> every day and cannot be traced back to you. If you accept cookies, PostHog
> sets a cookie so that return visits can be recognised and may record how a
> page was used, with anything you type into a form hidden. PostHog stores
> this data in the European Union.

If session replay is ever switched on, the phrase "may record how a page was
used" is doing the work. If it stays off, that clause can go.

## 4. What is not in the repository

- The project token, until someone pastes it into the CMS.
- Anything from the PostHog "wizard" (`npx @posthog/wizard`). It does not
  support Eleventy, and its self-driving mode connects to the GitHub
  repository and switches on session replay and error tracking by itself.
  None of that belongs here. The loader is fifteen lines in `base.njk`.
- An npm package. There is no bundler on this site; `posthog-js` from npm
  would be installed and never loaded.
