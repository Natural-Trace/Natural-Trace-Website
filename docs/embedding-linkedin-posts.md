# Putting a LinkedIn post on the Insights page

For Kirsty. Written 24 August 2026.

## What this is

The companion to `publishing-to-linkedin.md`, running the other way. That one
takes an article written on the website and posts it to LinkedIn by itself.
This one takes a post that was only ever going to be a LinkedIn post — the
stand at a trade show, a new starter, a photograph, a reply to something going
round the industry — and puts it on the Insights page.

Both are wanted. An article belongs on our own domain where Google can find it
and nobody else can take it down. A photograph of a stand does not need to be
an article, and writing it up as one to get it on the site is the long way
round.

## What you need

An address, copied from the post. There is nothing to install, no account to
connect, and no key to give anybody. This does not use LinkedIn's API and it
does not read our company page — you choose the posts, one at a time.

## Adding one

About thirty seconds.

**1. Copy the address of the post.**

On LinkedIn, open the post itself. Click the three dots in its top corner and
choose **Copy link to post**.

It has to be the post's own address. Our company page address, the one ending
`/company/natural-trace/`, is not a post and will be refused.

**2. Paste it into the CMS.**

Go to `/admin/`, open **From our LinkedIn** in the left-hand list, and add an
entry under Posts. Two boxes:

| Box | What goes in it |
| --- | --- |
| Address of the post | What you copied, pasted whole |
| What the post is about | One line, e.g. "Our stand at Vitafoods 2026" |

That second line is not decoration. It is read out to anyone using a screen
reader, and it is what a visitor sees on the card before they decide whether to
load the post.

**3. Publish.**

The site rebuilds itself. Give it a few minutes, then look at the foot of
[natural-trace.com/insights/](https://natural-trace.com/insights/).

## Things worth knowing

**Only public posts work.** If a post is set so that only people signed in to
LinkedIn can read it, a visitor gets a LinkedIn sign-in box where the post
should be. Check the post is public before adding it. This is a LinkedIn
setting and nothing on our side can override it.

**Three at a time, newest at the top.** The list is capped at three and the
order in the panel is the order on the page. When a fourth is worth showing,
delete the oldest. A strip that grows is a second Insights page competing with
the first.

**Do not embed a post that came from an article.** The Zapier flow in
`publishing-to-linkedin.md` turns website articles into LinkedIn posts
automatically. Putting one of those back here means a visitor sees our own
article summarised inside a LinkedIn frame, a few inches below the article
itself. Embed only the posts that were written on LinkedIn.

**Nothing updates by itself.** Editing the post on LinkedIn afterwards changes
what visitors see, because the post is loaded live from LinkedIn. Deleting it
on LinkedIn leaves an empty frame on our page, so remove the entry here too.

**There is a button where you might expect the post.** Visitors see a card with
your one-line description and a "Show this post" button, and the post itself
loads when they press it. That is deliberate. Loading a LinkedIn post means
loading a LinkedIn page, which sets LinkedIn's cookies on the visitor — and our
consent bar asks about our own analytics, not about handing people to LinkedIn.
The button is how they are asked. It is also faster: three LinkedIn frames
loading at once would make the Insights page noticeably slower for everyone,
including the people who never look at them.

## If it does not appear

1. **The publish was refused in the CMS**, with a message about the address.
   The box only accepts a linkedin.com address. Re-copy it using the three-dots
   menu on the post.
2. **The publish went through but the site did not update.** The build checks
   the address a second time, more strictly, and stops if it cannot find a post
   ID in it — which usually means a company page or profile address got pasted
   rather than a post. Nothing on the live site changes when this happens; the
   site keeps showing the last good version. Ask whoever looks after the
   website and the message will name the address that stopped it.
3. **The section is not there at all.** With no posts in the list the whole
   section is hidden, on purpose. Add one and it comes back.
