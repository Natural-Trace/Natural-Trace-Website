# Savepoint v1 — 18 August 2026

Everything needed to put the website and the domain back to exactly the state
they were in immediately before the natural-trace.com cutover.

Taken while the old WordPress site was still live on the domain and nothing on
the GitHub side had been merged. Nothing in here is a secret; every DNS value
below is public.

---

## 1. Git

| What | Value |
| --- | --- |
| Tag | `v1` |
| Commit | `aa7bf94` — "Invert the How It Works headline" |
| Branch | `main`, working tree clean |
| `origin/main` | `aa7bf94` |
| `origin/domain-cutover` | `756ca2a` — "Update PATH_PREFIX in deploy workflow" |
| `origin/gh-pages` | `ef5ca9f` — "Build from 2366aa3" |

### Getting back

Preferred, because it does not rewrite anything anyone else has pulled:

```
git revert -m 1 <merge-commit-sha>
git push
```

`-m 1` tells git to keep the first parent, which is main as it was before the
cutover branch came in. The deploy workflow then rebuilds and publishes the
pre-cutover site.

Only if history really has to go back, and only after telling anyone who has
cloned the repository:

```
git checkout main
git reset --hard v1
git push --force-with-lease origin main
```

To read the savepoint without changing anything:

```
git switch --detach v1
```

---

## 2. GitHub Pages, as configured at the savepoint

- Source: `gh-pages` branch, root
- Custom domain: **none set**
- Enforce HTTPS: not applicable, no custom domain
- Published at `https://natural-trace.github.io/Natural-Trace-Website/`
- `PATH_PREFIX` in `.github/workflows/deploy.yml` on `main`: `/Natural-Trace-Website/`
- `PATH_PREFIX` on `domain-cutover`: `/`

### Getting back

Clear the custom domain field in Settings → Pages, and make sure `main` carries
`PATH_PREFIX: /Natural-Trace-Website/` again. Both have to happen: the prefix
alone with a custom domain still set will serve a site whose assets are all one
directory too deep.

---

## 3. DNS at Hostinger

Read from a public resolver on 18 August 2026, before any change.

Nameservers: `ns1.dns-parking.com`, `ns2.dns-parking.com` — these are
Hostinger's, which is what makes the hPanel DNS zone editor the authoritative
one for this domain.

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `217.21.74.49` |
| CNAME | `www` | `natural-trace.com` |
| MX | `@` | `1 aspmx.l.google.com` |
| MX | `@` | `5 alt1.aspmx.l.google.com` |
| MX | `@` | `5 alt2.aspmx.l.google.com` |
| MX | `@` | `10 alt3.aspmx.l.google.com` |
| MX | `@` | `10 alt4.aspmx.l.google.com` |
| TXT | `@` | `google-site-verification=f7iKoYlAt3oRfAwWBxIxRqKUx5tH_W_YS4BUEH3xzaM` |
| TXT | `@` | `v=spf1 include:_spf.google.com include:23458507.spf08.hubspotemail.net -all` |

### Getting back

Delete the four `185.199.*.153` A records, add a single A record on `@` pointing
to `217.21.74.49`, and set the `www` CNAME target back to `natural-trace.com`.

The five MX records and the two TXT records are not part of the cutover and must
not be edited at any point in either direction. They carry Google Workspace mail
routing, the Google site verification, and the SPF record that keeps outbound
mail from HubSpot and Workspace out of spam folders. They are recorded here so
that if one is lost by accident it can be put back exactly.

Allow the same propagation time coming back as going out. Hostinger's guidance
is up to 24 hours; in practice it is usually minutes.

---

## 4. What this savepoint does not cover

- **The Cloudflare Worker in `oauth/`.** Its deployed state lives at Cloudflare,
  not in git. To roll it back, check out `v1` and run `npx wrangler deploy` from
  the `oauth/` directory. The `GITHUB_CLIENT_SECRET` is set with
  `wrangler secret put` and is not in the repository, which is correct and must
  stay that way.
- **HubSpot.** Form definitions and the portal configuration live in HubSpot.
- **Anything a CMS editor changes after this point.** Those arrive as ordinary
  commits on top of `v1` and are reverted as ordinary commits.
- **The old Hostinger hosting plan.** Leave it running for several days after a
  successful cutover. It is the fastest way back and costs nothing to keep.

---

## 5. Open at the time of the savepoint

- `search_indexable` is `false` on `domain-cutover`. Going live with that value
  puts a noindex tag on every page of a domain that is currently indexed, which
  withdraws the existing pages from search rather than launching quietly. This
  was flagged and not yet decided.
- The `/assess/` page is not reachable from the site navigation. The nav button
  labelled "Request Assessment" points at `/contact/`. Raised with Kirsty,
  not yet changed.
