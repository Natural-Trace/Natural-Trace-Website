# Handling privacy requests

What to do when someone asks to see, correct or delete the personal data we
hold about them. Drafted 13 Oct 2026. **Draft until the CEO has agreed it.**

Both laws that apply to us give people these rights: Singapore's PDPA and the
EU's GDPR. When the two differ, follow the stricter one; this procedure does.

## What people can ask for

| They ask to | GDPR article | In plain words |
|---|---|---|
| See their data | 15 | "What do you have on me, and what do you do with it?" |
| Correct it | 16 | "My email is wrong." |
| Delete it | 17 | "Forget me." |
| Limit its use | 18 | "Keep it, but stop using it while we sort this out." |
| Take a copy | 20 | "Send me my data in a file." |
| Object | 21 | "Stop using my data for that." |
| Withdraw consent | 7(3) | "I said yes to cookies, now I say no." The site handles this itself through **Cookie settings** in the footer. |
| No marketing | 21(3) | "Stop emailing me." Always yes, at once. |

A request does not need the right words. "Please remove me from your list" is a
deletion request. It can arrive by email, through the contact form, on LinkedIn
or in person at a trade fair. All of them count.

## The deadline

**One month from the day it arrives.** GDPR allows two more months for a
complicated case, but only if we tell the person within the first month and say
why. PDPA asks for a reply as soon as reasonably possible and expects us to tell
the person if it will take more than 30 days. One month covers both.

No fee. The only exception is a request that is clearly unfounded or repeated
over and over, and that decision belongs to the DPO, in writing.

## Who does it

- **Handles requests:** the Data Protection Officer, _[role]_.
- **Backup:** _[role]_, if the DPO is away for more than a week.

Whoever receives a request forwards it to the DPO the same day, even if it
looks easy.

## Steps

1. **Log it.** Add a row to the request log on the private drive: date
   received, how it arrived, what they asked, the deadline (date + 1 month).
2. **Confirm it is them.** Proportionate, not paranoid. A reply from the same
   email address that is in HubSpot is normally enough. Never ask for a passport
   just to process a request; ask for more only if something looks wrong, and
   the deadline pauses while we wait.
3. **Acknowledge.** Reply within 3 working days: we have it, and the date they
   will hear back by.
4. **Search every place their data could be:**
   - **HubSpot:** search contacts by email. This holds form submissions and, if
     they accepted cookies, the pages they viewed.
   - **info@ mailbox:** search by email address and name, including
     internship applications.
   - **Personal inboxes and shared drives** of anyone who dealt with them.
   - **PostHog:** usually nothing we can find. Visitors are anonymous; PostHog
     only creates a person record for someone we identify, and the site never
     does. Say so in the reply rather than skipping it.
   - **Cloudflare, GitHub Pages:** aggregate statistics and server logs only,
     with no way to pick out one person. Say so in the reply.
5. **Do what they asked:**
   - **See or copy:** export their HubSpot record and copy the relevant emails.
     Send it with what we use it for, who else receives it (HubSpot, Google),
     where it is stored and how long we keep it. `docs/processing-record.md`
     has every one of those answers.
   - **Correct:** fix it in HubSpot and anywhere else it appears.
   - **Delete:** in HubSpot use the GDPR delete (it also blocks the email from
     being re-added; GDPR features need to be switched on in HubSpot's privacy
     settings once, *to confirm*). Delete their emails and attachments from the
     mailbox and personal inboxes, then empty the trash. We may keep something
     only if the law requires it, such as an invoice; if so, tell them what and
     why.
   - **Stop marketing:** unsubscribe them in HubSpot the same day.
6. **Reply** before the deadline, using a template below. Keep a copy.
7. **Close the log row:** date replied, what we did, anything we refused and why.

## If we refuse, or cannot find anything

Say so plainly, give the reason, and tell them they can complain:

- in Singapore, to the **Personal Data Protection Commission** (pdpc.gov.sg)
- in the EU, to the **data protection authority of their country**

GDPR requires us to mention this.

## Reply templates

**Acknowledgement**

> Thank you for your request about your personal data, received on [date]. We
> will reply by [date + 1 month]. If we need anything else from you to confirm
> it is you, we will ask within the next few days.

**Access: we found data**

> Attached is the personal data we hold about you: [list]. We use it to [reply
> to your enquiry / consider your application]. It is stored in [HubSpot /
> Google Workspace], which act for us under data processing agreements, and we
> keep it for [period]. Our website also uses anonymous analytics, which we
> cannot link to you. If anything is wrong you can ask us to correct it, and you
> can ask us to delete it. If you are unhappy with our answer you can complain
> to [the PDPC / your national data protection authority].

**Deletion: done**

> We have deleted the personal data we held about you from [systems], on
> [date]. [We have kept (item) because (legal reason) until (date).] If you
> contact us again we will start a new record.

**Nothing found**

> We have searched our contact records, email and analytics and hold no personal
> data that we can link to you. Our website analytics are anonymous and cannot
> be traced to an individual. If you are unhappy with our answer you can
> complain to [the PDPC / your national data protection authority].
