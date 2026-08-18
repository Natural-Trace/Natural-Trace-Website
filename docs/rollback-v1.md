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

The whole zone as it stood immediately before the cutover on 18 August 2026,
transcribed from the hPanel record list rather than from public lookups. The
first version of this section was built from public queries and was incomplete:
it missed the apex AAAA record, both HubSpot signing records, `_dmarc`, and the
`dev`, `staging` and `ftp` hosts. Restoring from that version would have left
the site broken over IPv6 and quietly damaged outbound mail authentication.

Nameservers: `ns1.dns-parking.com`, `ns2.dns-parking.com`. These are
Hostinger's, which is what makes the hPanel zone editor authoritative for this
domain.

### Rows that the cutover changed

| Type | Name | Before | After |
| --- | --- | --- | --- |
| A | `@` | `217.21.74.49` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| AAAA | `@` | `2a02:4780:3:711:0:2a16:dc3:2` | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| CNAME | `www` | `natural-trace.com` | `natural-trace.github.io` |

All at TTL 14400.

To roll back: delete the four A and four AAAA records on `@`, add a single A
record `@` to `217.21.74.49` and a single AAAA record `@` to
`2a02:4780:3:711:0:2a16:dc3:2`, and set the `www` target back to
`natural-trace.com`.

The AAAA record is the one that is easy to miss and expensive to get wrong.
Leaving a stale AAAA in place sends every IPv6 visitor to a different server
from everyone else, which presents as an intermittent fault that cannot be
reproduced on the machine of whoever is investigating it.

### Rows that were not touched, and must not be

These carry mail, mail authentication and two separate hosts. None of them are
part of the cutover in either direction.

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| MX | `@` | `1 aspmx.l.google.com` | 3600 |
| MX | `@` | `5 alt1.aspmx.l.google.com` | 3600 |
| MX | `@` | `5 alt2.aspmx.l.google.com` | 3600 |
| MX | `@` | `10 alt3.aspmx.l.google.com` | 3600 |
| MX | `@` | `10 alt4.aspmx.l.google.com` | 3600 |
| TXT | `@` | `google-site-verification=f7iKoYlAt3oRfAwWBxIxRqKUx5tH_W_YS4BUEH3xzaM` | 300 |
| TXT | `@` | `v=spf1 include:_spf.google.com include:23458507.spf08.hubspotemail.net -all` | 300 |
| TXT | `_dmarc` | `v=DMARC1;p=none;sp=none;adkim=r;aspf=r;pct=100` | 14400 |
| CNAME | `hs1-23458507._domainkey` | `natural--trace-com.hs07a.dkim.hubspotemail.net` | 300 |
| CNAME | `hs2-23458507._domainkey` | `natural--trace-com.hs07b.dkim.hubspotemail.net` | 300 |
| A | `dev` | `217.21.74.49` | 1800 |
| AAAA | `dev` | `2a02:4780:3:711:0:2a16:dc3:2` | 1800 |
| A | `staging` | `217.21.74.49` | 1800 |
| AAAA | `staging` | `2a02:4780:3:711:0:2a16:dc3:2` | 1800 |
| A | `ftp` | `217.21.74.49` | 14400 |
| CNAME | `autoconfig.mail.hostpoint.ch` | `autoconfig.mail.hostpoint.ch` | 300 |
| CNAME | `autoconfig-nonssl.mail.hostpoint.ch` | `autoconfig-nonssl.mail.hostpoint.ch` | 300 |
| CNAME | `lists.admin.hostpoint.ch` | `lists.admin.hostpoint.ch` | 300 |

The five MX rows and the SPF and DKIM records are Google Workspace and HubSpot
mail. Deleting an MX row stops mail arriving. Deleting the SPF or either DKIM
row sends outbound mail to spam folders, which is worse, because it fails
silently and nobody reports the email they never received.

`dev`, `staging` and `ftp` still point at Hostinger and are unrelated to the
website. They are the reason the Hostinger plan must not be cancelled.

The three `hostpoint.ch` rows point at themselves and appear to be leftovers
from an earlier host. They do nothing. Leave them; today is not the day.

### Timing

The old apex records carried a 14400 second TTL, so resolvers held the previous
answer for up to four hours after the change. The same delay applies going
back. `www` was the slowest to follow, for the same reason. Dropping these to
300 while the zone is stable would make any future change take minutes instead
of hours.

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
