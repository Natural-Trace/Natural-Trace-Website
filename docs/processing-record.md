# Record of processing activities

GDPR Article 30 asks every controller to keep a written list of what personal
data it processes, why, who receives it, where it goes and how long it is kept.
This is that list for the website and the enquiries it brings in. Drafted 13 Oct
2026. **Draft until the CEO and the lawyer have read it.**

Anything marked *proposed* is a recommendation, not a decision. Anything marked
*to confirm* is a fact nobody has checked yet. Both need clearing before this is
the record.

This file is in a public repository, so it holds no names, numbers or
passwords. Keep it in step with `docs/trackers.md`: when a vendor is added
there, it is added here.

## The controller

- **Organisation:** Natural Trace Pte Ltd, Singapore
- **Contact for privacy matters:** info@natural-trace.com (a dedicated address
  such as privacy@ is *proposed*)
- **Data Protection Officer (PDPA):** _[role]_
- **EU representative (GDPR Art. 27):** none yet. *To confirm with the lawyer*;
  likely required, because the website monitors EU visitors and the company has
  no EU establishment.

## Activities

### 1. Website enquiries (contact form)

- **Why:** to answer the person who wrote to us.
- **Whose data:** people who fill in the form on /contact/.
- **What data:** first and last name, email, company, job title, chosen topic,
  message, the page they sent it from.
- **Legal basis:** *proposed:* taking steps at the person's request before a
  contract (Art. 6(1)(b)), or legitimate interest in replying to business
  enquiries (Art. 6(1)(f)).
- **Who receives it:** HubSpot (processor), the team.
- **Where it goes:** HubSpot's US data centre (portal region na2).
  **Transfer safeguard:** *to confirm*: HubSpot's Data Processing Agreement and
  its EU-US Data Privacy Framework certification or Standard Contractual Clauses.
- **Kept for:** *proposed:* 2 years after the last contact, then deleted.
  Today nothing deletes it.
- **Protection:** HubSpot access limited to named staff; two-factor login
  *to confirm* for every user.

### 2. Email to info@natural-trace.com

- **Why:** answering enquiries, and the fallback when the form cannot submit.
- **Whose data:** anyone who emails us.
- **What data:** name, email, anything they choose to write.
- **Legal basis:** *proposed:* legitimate interest in answering correspondence.
- **Who receives it:** Google Workspace (processor), the team.
- **Where it goes:** Google, which may store outside the EU.
  **Transfer safeguard:** *to confirm*, Google Workspace's data processing terms.
- **Kept for:** *proposed:* 2 years after the last message.
- **Protection:** two-factor login *to confirm*.

### 3. Internship applications

- **Why:** choosing interns.
- **Whose data:** applicants, via the careers page, by email.
- **What data:** whatever they send: CV, contact details, education, and often
  date of birth, nationality and address.
- **Legal basis:** *proposed:* steps at the applicant's request before a
  contract (Art. 6(1)(b)).
- **Who receives it:** Google Workspace (processor), whoever reviews applications.
- **Where it goes:** as activity 2.
- **Kept for:** *proposed:* 6 months after the decision, longer only with the
  applicant's agreement. Today they stay in the mailbox indefinitely.
- **Protection:** *proposed:* move CVs out of the shared mailbox into a folder
  only the reviewers can open.

### 4. Website analytics without consent (cookieless)

- **Why:** counting visits and seeing which pages and quiz answers are used.
- **Whose data:** every visitor, including those who decline cookies.
- **What data:** a daily-rotating hash of IP address and browser, the page
  address, referrer, clicks, quiz option IDs. IP addresses are anonymised by
  PostHog before storage. No cookie is set.
- **Legal basis:** *to confirm with the lawyer:* legitimate interest (Art.
  6(1)(f)), which needs a written legitimate interest assessment. If the lawyer
  does not accept that, Decline must switch PostHog off entirely.
- **Who receives it:** PostHog (processor).
- **Where it goes:** PostHog EU (Frankfurt). PostHog is a US company;
  **transfer safeguard** for any access from the US *to confirm* in PostHog's DPA.
- **Kept for:** PostHog's event retention for the plan, *to confirm*.

### 5. Analytics and session replay with consent

- **Why:** understanding how the site is used, finding broken pages.
- **Whose data:** visitors who press Accept.
- **What data:** as activity 4, plus a PostHog cookie, and a recording of the
  page as they used it. Every input is masked, the contact form and /admin are
  never recorded, no network bodies, no console logs.
- **Legal basis:** consent (Art. 6(1)(a)), withdrawable through "Cookie
  settings" in the footer.
- **Who receives it:** PostHog (processor).
- **Where it goes:** as activity 4.
- **Kept for:** recordings 30 days. Events as activity 4.

### 6. HubSpot visitor tracking

- **Why:** connecting a visit to an enquiry so the team knows which pages a
  contact read.
- **Whose data:** visitors who press Accept.
- **What data:** HubSpot cookies, pages viewed, IP address, browser.
- **Legal basis:** consent (Art. 6(1)(a)).
- **Who receives it, where, safeguard:** as activity 1.
- **Kept for:** HubSpot's defaults, *to confirm*.

### 7. Cloudflare Web Analytics

- **Why:** counting visits, including people with blockers.
- **Whose data:** every visitor.
- **What data:** IP address and browser in the request; Cloudflare reports only
  aggregates and sets no cookie.
- **Legal basis:** *proposed:* legitimate interest.
- **Who receives it:** Cloudflare (processor). **Where:** global network,
  including the US; **safeguard** *to confirm* in Cloudflare's DPA.
- **Kept for:** Cloudflare's defaults, *to confirm*.

### 8. Hosting

- **Why:** serving the website.
- **Whose data:** every visitor.
- **What data:** IP address and browser, in server logs.
- **Legal basis:** *proposed:* legitimate interest (the site cannot be served
  without it).
- **Who receives it:** GitHub Pages (processor). **Where:** US. **Safeguard**
  *to confirm* in GitHub's DPA.
- **Kept for:** GitHub's defaults, *to confirm*.

### 9. Website editors

- **Why:** letting staff edit the site through the CMS.
- **Whose data:** staff with CMS access.
- **What data:** GitHub username, and the access token issued at login.
- **Legal basis:** *proposed:* legitimate interest / employment.
- **Who receives it:** GitHub, Cloudflare (the sign-in Worker passes the token
  through and stores nothing).
- **Kept for:** for as long as the person has access.

### Not ours to record

The LinkedIn post embed loads only when a visitor clicks to see it. From that
point LinkedIn collects data as its own controller, under its own policy. The
privacy policy should say so.

## Checklist before this stops being a draft

- [ ] Every *to confirm* checked, and the answer written in
- [ ] Every *proposed* either agreed or replaced
- [ ] A DPA in place with HubSpot, PostHog, Cloudflare, GitHub and Google
- [ ] Legitimate interest assessment written for activities 4, 7 and 8, or
      activity 4 changed to consent only
- [ ] EU representative appointed, or the lawyer's reason for not needing one
      written here
- [ ] Deletion actually set up for the retention periods in activities 1 to 3
- [ ] Privacy policy matches this record
- [ ] Reviewed: _[date]_
