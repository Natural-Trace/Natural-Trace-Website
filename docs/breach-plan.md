# Data breach plan

What to do if personal data the website collects reaches someone it should not.
Drafted 13 Oct 2026. **Not yet agreed.** The CEO needs to read it, fill in the
roles below, and say yes before it counts as the plan.

> **This repository is public.** Names, phone numbers and passwords never go in
> this file. They live on the private contact sheet described at the end. This
> file only says what to do and in what order.

---

## 1. What counts as a breach

Any time personal data is seen, copied, changed, lost or deleted by someone who
should not have done it. It does not have to be a hacker. All of these count:

- someone gets into HubSpot or the info@ mailbox
- a secret key or password is pushed to GitHub, or pasted somewhere public
- a laptop or phone with customer emails on it is lost or stolen
- a contact export is emailed to the wrong person
- a vendor we use (HubSpot, PostHog, Cloudflare, GitHub, Google) tells us
  *they* had a breach that touched our data

If you are not sure whether it counts, treat it as if it does and tell the
incident lead. Reporting something that turns out to be nothing costs nothing.

## 2. What we hold, and where

| Where | What is in it | How bad if it leaked |
|---|---|---|
| HubSpot | Every contact form message: name, email, company, job title, what they wrote. HubSpot's own visitor tracking for people who accepted cookies. | **Highest.** Real people, named, with what they asked us. |
| info@natural-trace.com mailbox | Enquiries, and **internship applications with CVs** (the careers page sends them here by email). | **Highest.** CVs can carry addresses, dates of birth, nationality. |
| PostHog (EU) | Page views and clicks. Session recordings for visitors who accepted, kept 30 days, form fields masked, contact page never recorded. IP addresses anonymised. | Low to medium. Mostly not linkable to a named person. |
| Cloudflare Web Analytics | Aggregate visit counts. No cookies, no names. | Low. |
| GitHub repository | Website code and copy. Public by design. Must never contain secrets. | Low for personal data. **High** if a secret is ever pushed. |
| Cloudflare Worker (`oauth/`) | The GitHub OAuth client secret used for CMS logins. | High: it is the key to editor logins. |

## 3. Roles

Fill these in with job titles here and names on the contact sheet.

- **Incident lead:** _[role]_. Makes the calls. One person, not a group.
- **Deputy:** _[role]_. Takes over if the lead cannot be reached within 2 hours.
- **Technical responder:** _[role]_. Locks accounts, rotates keys, collects evidence.
- **Data Protection Officer** (required under Singapore's PDPA): _[role]_.
  Decides with the lead whether we must notify, and sends the notifications.

## 4. The first hour: stop it getting worse

Do not delete anything. Logs and emails are evidence. Write down what you do
and when, as you go (section 7).

1. **Tell the incident lead.** Phone, not email, if the mailbox might be the
   thing that was broken into.
2. **Lock the door that was opened.** For whichever system is involved:
   - **HubSpot:** reset the password of every user, turn on two-factor for all,
     remove users who should not be there, revoke any private app or API key.
   - **info@ mailbox (Google):** reset the password, sign out all sessions,
     check forwarding rules and filters for anything new (a common trick is a
     rule that quietly forwards everything elsewhere).
   - **GitHub:** remove any unknown collaborator; in the OAuth app settings,
     revoke all user tokens; rotate the client secret with
     `wrangler secret put GITHUB_CLIENT_SECRET` in `oauth/`. If a secret was
     pushed, rotate it first, then clean the history.
   - **PostHog / Cloudflare:** rotate personal API keys, remove unknown
     members. The PostHog project key on the website is public by design and
     does not need rotating.
3. **Check the vendor's audit log** (HubSpot, Google, GitHub and PostHog all
   have one) and save a copy: who logged in, from where, what they exported.

## 5. Decide: do we have to report it?

Answer these, and write the answers down (section 7):

- What data, and how many people?
- Could it hurt them? (Fraud, phishing that looks like us, embarrassment, a
  CV in the wrong hands.)
- Is it actually out, or only exposed with no sign anyone took it?

### Singapore (PDPA). Always applies to us.

- **When we must report:** the breach is likely to cause *significant harm* to
  the people affected, **or** it affects **500 or more people**. Names and
  emails alone are usually not "significant harm", but the 500 threshold still
  applies: check how many contacts HubSpot holds.
- **Deadlines:** finish deciding quickly (the PDPC expects within **30 days**
  of first suspecting a breach, and sooner is better). Once we decide it is
  reportable, tell the **PDPC within 3 calendar days**, using the online form
  on pdpc.gov.sg. Tell the affected people as soon as practicable, at the same
  time as the PDPC or after.

### Europe (GDPR). Probably applies, because we track EU visitors.

The website records how EU visitors use it, and the team meets European buyers
at trade fairs, which is likely enough to bring us under GDPR. **Check this with
the lawyer before you need it.**

- **When we must report:** unless the breach is unlikely to put anyone at risk.
- **Deadline:** the supervisory authority **within 72 hours** of becoming aware.
  If the risk to people is high, tell them too, without undue delay.
- **Every breach gets recorded**, reported or not.

### Anywhere else

US states and other countries have their own rules and deadlines. If people
from there are affected, ask the lawyer on day one.

### If a vendor tells us about their breach

It is still our notification to make. Their notice starts our clock.

## 6. Telling people

Short, plain and honest. Say:

- what happened and when we found out
- what data was involved
- what we have done about it
- what they should do (for example: watch for emails pretending to be us)
- who to contact with questions

Do not guess, do not play it down, and do not promise it cannot happen again.
Have the lawyer read it before it goes to the regulator.

## 7. Write it down

Keep one record per incident, on the private drive, not in this repository:

- date and time first noticed, by whom, and how
- what systems and data were involved, and how many people
- each action taken, with the time
- the decision on notifying, who made it, and why
- copies of every notification sent
- afterwards: what caused it and what we changed

GDPR requires this record even when nothing is reported, and it is what a
regulator asks for first.

## 8. Afterwards

Within two weeks of closing an incident, spend half an hour on what to change so
it cannot happen the same way again, and update this file if the plan itself
did not work.

Read this plan once a year, and whenever a new system starts holding personal
data. The last review date goes here: _[date]_.

---

## The private contact sheet

Keep this on the company drive, **not** in this repository. Everyone with a role
above should know where it is and be able to open it from their phone.

- Incident lead, deputy, technical responder, DPO: name, mobile, personal email
- Lawyer: name, firm, mobile, out-of-hours number
- PDPC: link to the breach notification form
- Account owners and recovery details for HubSpot, Google Workspace, GitHub,
  Cloudflare and PostHog, and where their audit logs are
- Vendor security contacts: HubSpot, Google, GitHub, Cloudflare, PostHog
