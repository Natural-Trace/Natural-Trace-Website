/**
 * Claim review check. No dependencies beyond the js-yaml the site already uses.
 *
 *   node scripts/claim-check.mjs
 *   node scripts/claim-check.mjs --published   (also reports which built pages
 *                                               carry each open claim)
 *
 * WHAT THIS IS FOR
 *
 * Flagged claims used to be recorded as "# CLAIM REVIEW" comments above the
 * line they applied to. On 18 August 2026 a routine settings edit through the
 * CMS rewrote src/_data/site.yml and removed all 76 of its comment lines in a
 * single commit, because Decap parses YAML into data and writes it back out,
 * and a comment is not data. The values survived; the record of what had not
 * been signed off would not have, had the same edit landed on about.yml.
 *
 * So the record lives in docs/claim-review.yml, which the CMS cannot reach, and
 * this script holds it to reality. A comment can be deleted by accident. A
 * failing build cannot.
 *
 * WHAT IT ENFORCES
 *
 *   open / signed_off   the phrase must still be present in its source file.
 *                       Gone means someone reworded a claim without going
 *                       through review, or the register has drifted. Either
 *                       way a person needs to look.
 *
 *   withdrawn           the phrase must be absent. Present means it was put
 *                       back, or never actually removed.
 *
 *   field-scoped        entries with no phrase name a field instead. The field
 *                       must still exist in the parsed file.
 *
 * Rewording a flagged claim fails the build on purpose. A reworded claim is a
 * new claim and has not been reviewed. Update the phrase in the register in the
 * same commit that changes the wording.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

const REGISTER = 'docs/claim-review.yml';
const SHOW_PUBLISHED = process.argv.includes('--published');
const problems = [];
const notes = [];

if (!existsSync(REGISTER)) {
  console.error(`missing ${REGISTER}. The claim register is not optional; it is
the only durable record of which claims have not been signed off.`);
  process.exit(1);
}

const register = yaml.load(await readFile(REGISTER, 'utf8'));
const claims = register?.claims || [];

if (!claims.length) {
  console.error(`${REGISTER} has no claims in it. If every claim really has been
resolved, say so explicitly with status: withdrawn or signed_off rather than by
emptying the file, or the next person cannot tell the difference between "all
clear" and "someone deleted the register".`);
  process.exit(1);
}

/* Read each source file once. A claim register with twenty entries across six
   files should not open the same file twenty times. */
const sources = new Map();
async function source(path) {
  if (!sources.has(path)) {
    if (!existsSync(path)) { sources.set(path, null); }
    else sources.set(path, await readFile(path, 'utf8'));
  }
  return sources.get(path);
}

/* Straight and curly apostrophes are the same apostrophe as far as a person is
   concerned, and which one lands in a file depends on who typed it and in what.
   Comparing them literally produces failures that teach editors to distrust the
   check, which is worse than not having it. */
const normalise = (s) => String(s)
  .replace(/[‘’ʼ]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[–—]/g, '-')
  .replace(/\s+/g, ' ')
  .trim();

const VALID = new Set(['open', 'signed_off', 'withdrawn']);

const counts = { open: 0, signed_off: 0, withdrawn: 0 };

for (const c of claims) {
  const id = c.id || '(no id)';

  if (!VALID.has(c.status)) {
    problems.push(`${id}: status "${c.status}" is not one of open, signed_off, withdrawn`);
    continue;
  }
  counts[c.status]++;

  if (c.status === 'signed_off' && !(c.signed_off_by && c.signed_off_on)) {
    problems.push(`${id}: marked signed_off without signed_off_by and signed_off_on. `
      + `A sign-off nobody's name is on is not a sign-off.`);
  }

  if (!c.source) { problems.push(`${id}: no source file given`); continue; }

  const text = await source(c.source);
  if (text === null) {
    problems.push(`${id}: source file ${c.source} does not exist. `
      + `Either it moved and the register is stale, or the claim went with it.`);
    continue;
  }

  if (c.phrase) {
    const present = normalise(text).includes(normalise(c.phrase));
    if (c.status === 'withdrawn' && present) {
      problems.push(`${id}: marked withdrawn but the phrase is still in ${c.source}:\n`
        + `        "${c.phrase}"`);
    }
    if (c.status !== 'withdrawn' && !present) {
      problems.push(`${id}: the phrase is no longer in ${c.source}:\n`
        + `        "${c.phrase}"\n`
        + `        Either it was reworded, in which case it is a new claim and needs\n`
        + `        reviewing again, or it was removed, in which case set status: withdrawn.`);
    }
  }

  /* The field says where in the file the claim lives. Dotted, since the data
     files were regrouped into sections on 20 August 2026: choose.groups rather
     than choose_groups.

     This used to be an `else if` on the phrase check, so an entry carrying both
     a phrase and a field only ever had its phrase looked at. Two entries had
     been pointing at keys that did not exist — detect-coa-wording and
     detect-standards named `capabilities`, tag-robust-stability and tag-facility
     named `benefits` — and neither the build nor anybody reading the register
     had any way to notice. Checking both is what makes the field mean something
     rather than being a comment that happens to be indented. */
  if (c.field && c.status !== 'withdrawn') {
    let parsed = null;
    try { parsed = yaml.load(text); } catch { /* markdown front matter, skip */ }
    if (parsed && typeof parsed === 'object') {
      let node = parsed, missing = null, walked = [];
      for (const seg of String(c.field).split('.')) {
        if (node && typeof node === 'object' && !Array.isArray(node) && seg in node) {
          node = node[seg]; walked.push(seg);
        } else { missing = seg; break; }
      }
      if (missing !== null) {
        problems.push(`${id}: field "${c.field}" is not in ${c.source}`
          + (walked.length ? `\n        "${walked.join('.')}" resolves, "${missing}" under it does not.` : '')
          + `\n        Either the file was regrouped and this path is stale, or the claim moved.`);
      }
    }
  }

  if (!c.phrase && !c.field) {
    problems.push(`${id}: needs either a phrase or a field to check against`);
  }
}

/* Which built pages actually carry an open claim. Informational: the point is
   to show how exposed each one is, not to fail on it. */
if (SHOW_PUBLISHED && existsSync('_site')) {
  const pages = [];
  (function walk(d) {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.html') && !p.replace(/\\/g, '/').includes('_site/admin/')) pages.push(p);
    }
  })('_site');

  for (const c of claims) {
    if (c.status !== 'open' || !c.phrase) continue;
    const hits = [];
    for (const f of pages) {
      const html = normalise((await readFile(f, 'utf8')).replace(/<[^>]+>/g, ' '));
      if (html.includes(normalise(c.phrase))) {
        hits.push('/' + f.replace(/\\/g, '/').replace(/^_site\//, '').replace(/index\.html$/, ''));
      }
    }
    if (hits.length) notes.push(`${c.id} is live on ${hits.length} page(s): ${hits.slice(0, 4).join(', ')}`);
  }
}

console.log(`claim register: ${counts.open} open, ${counts.signed_off} signed off, `
  + `${counts.withdrawn} withdrawn, ${claims.length} total`);

if (notes.length) {
  console.log('');
  for (const n of notes) console.log('  ' + n);
}

if (counts.open) {
  console.log('');
  console.log(`${counts.open} claim(s) are published and not signed off. That is a`);
  console.log('commercial decision, not a build error, so it does not fail here.');
  console.log(`The list is in ${REGISTER} with an owner against each one.`);
}

if (problems.length) {
  console.log('');
  console.error(`${problems.length} problem(s) with the register:`);
  for (const p of problems) console.error('  - ' + p);
  console.error('');
  console.error('The register and the site disagree. Fix whichever one is wrong.');
  process.exit(1);
}

console.log('');
console.log('register and site agree.');
