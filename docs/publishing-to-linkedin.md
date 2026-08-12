# Writing once, and having it appear on LinkedIn

For Kirsty. Written 12 August 2026.

## What this changes

At the moment an article gets written twice. Once as a LinkedIn post, and once
again on the website. The website has never pulled from LinkedIn, despite
looking like it might: every news item on natural-trace.com was typed into
WordPress by hand.

This sets it up the other way round. You write the article once, on the
website. LinkedIn gets posted to automatically, with the headline, the summary,
the image and a link back.

The website becomes the version of record, which is the right way round for two
reasons. It is on a domain we own, so it cannot be changed or removed by
somebody else's product decision. And an article on our own site is something
Google can find, which a LinkedIn post is not.

## What you need

- Admin on the Natural Trace LinkedIn company page. Not just posting rights,
  admin. LinkedIn will not let anything connect otherwise.
- A Zapier account.

That is the whole list. **Nothing needs to be set up in the website itself, and
there is no API key or password to enter anywhere in the build.** Zapier holds
the LinkedIn connection on its own side and reads a public address on our site.
If anyone tells you they need a key added to the code for this, they have
misunderstood it.

## Why Zapier and not Buffer

Buffer was the first suggestion and it turns out not to do this. Buffer can
show you new articles in a list for you to click and share, which is still two
actions, and their own help pages point you at Zapier for anything automatic:

> If you're looking to automatically send posts from RSS feeds to your queue in
> Buffer, we recommend using Zapier with Buffer

Zapier posts to a LinkedIn company page directly, so Buffer is not needed in
the middle. Make.com and IFTTT do the same job if you would rather use one of
those.

## Setting it up

About ten minutes.

**1. Get the feed address.**

The website publishes a machine-readable list of articles at `/feed.xml`.
Today that is:

    https://natural-trace.github.io/Natural-Trace-Website/feed.xml

Once natural-trace.com points at the new site it becomes:

    https://natural-trace.com/feed.xml

See the timing note at the bottom before you decide which one to use.

**2. In Zapier, create a Zap with two steps.**

Trigger: **RSS by Zapier**, event **New Item in Feed**. Paste the feed address
into the Feed URL field. Zapier will show you the most recent article as a
test, which is how you know the address is right.

Action: **LinkedIn Pages**, event **Create Company Update**. Connect the
Natural Trace page when it asks. This is the step that needs your admin role.

**3. Write the post template.**

In the Comment field, build the post from the fields Zapier offers:

    {{Title}}

    {{Description}}

    {{Link}}

`Title` is the article headline, `Description` is the summary written in the
CMS, `Link` is the article's address. Set the URL field to `{{Link}}` as well
so LinkedIn draws the preview card.

**4. Turn it on, and publish something to test.**

Zapier checks the feed on a schedule rather than instantly, so allow up to
about fifteen minutes before the post appears.

## What controls how the LinkedIn post reads

Everything in the post comes from three fields in the CMS at `/admin`, under
Insights articles. What you type there is what LinkedIn shows.

| CMS field | Where it lands |
| --- | --- |
| Headline | The first line of the LinkedIn post |
| Summary | The body of the LinkedIn post |
| Header image | The picture on the preview card |

The Summary field is doing more work than it looks. It is the paragraph on the
article card, the description Google shows, and now the text of the LinkedIn
post. Two or three sentences that stand on their own is the right length.

## Things worth knowing before you start

**Only turn it on once.** Zapier decides what is new by the article's web
address. Those do not change after publishing, so an article cannot be posted
twice by accident. But if the Zap is switched on for the first time against a
feed with sixteen articles already in it, some tools will treat all sixteen as
new. Publish nothing for the first few minutes after enabling it, and watch
what happens before writing anything.

**Timing against the domain move.** The feed address changes when
natural-trace.com moves to the new site. Setting this up after the move is one
less thing to remember. If you want to try it before, use the github.io address
above and change that one field afterwards.

**Hashtags and mentions.** These are not in the CMS, because they belong to
LinkedIn and not to an article. Either add them to the template in Zapier, so
every post carries the same ones, or leave the Zap posting a clean version and
add anything specific by editing the post on LinkedIn afterwards.

**It is one direction only.** Editing the LinkedIn post afterwards does not
change the article, and editing the article does not change a LinkedIn post
that has already gone out.

## If nothing appears

In order, these are the things that are usually wrong.

1. Open the feed address in a browser. If it does not show a list of articles,
   the site has not rebuilt since the article was published. Give it a few
   minutes.
2. Check the Zap is on. Zapier turns Zaps off after repeated failures and the
   notification is easy to miss in email.
3. Open the Zap history in Zapier. A failed run says what LinkedIn objected to,
   which is nearly always the admin role having been changed on the page.

## Sources

- [Buffer, Automating RSS feeds using Zapier](https://support.buffer.com/article/613-automating-rss-feeds-using-feedly-and-zapier)
- [Zapier, How to get started with LinkedIn on Zapier](https://help.zapier.com/hc/en-us/articles/8495987891853-How-to-get-started-with-LinkedIn-on-Zapier)
