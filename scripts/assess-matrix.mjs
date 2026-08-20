/**
 * Compatibility quiz answer matrix.
 *
 *   node scripts/assess-matrix.mjs            writes docs/assess-matrix.html
 *   node scripts/assess-matrix.mjs --json     prints the rows as JSON
 *
 * WHY THIS EXISTS
 *
 * Kirsty asked, on 18 Aug 2026, for a table showing all the answers the quiz
 * can give, after Alex Wild ran a self assessment and was surprised by his
 * result. The quiz does not record what visitors answer, so there is no log of
 * real submissions to hand her. What can be produced, and is more useful for
 * reviewing the wording, is the complete answer key: every combination of
 * inputs the quiz can be given, and the verdict each one produces.
 *
 * HOW IT STAYS TRUE
 *
 * Nothing here re-implements the scoring. The verdict function is lifted, as
 * source text, out of src/assets/js/main.js and run against the same bands
 * that src/_data/assess.yml publishes into the page. If someone changes the
 * thresholds or the rule, this table changes with them. A table that was typed
 * out by hand would have started drifting the first time either moved, and
 * would have gone on looking authoritative while it did.
 */
import { readFile, writeFile } from 'node:fs/promises';
import yaml from 'js-yaml';

const JS = await readFile('src/assets/js/main.js', 'utf8');
const A  = yaml.load(await readFile('src/_data/assess.yml', 'utf8'));

/* ---- lift the three lookup tables and the verdict out of main.js ---- */

function block(startRe, open, close) {
  const m = JS.match(startRe);
  if (!m) throw new Error(`could not find ${startRe} in main.js`);
  let i = JS.indexOf(open, m.index), depth = 0;
  for (let j = i; j < JS.length; j++) {
    if (JS[j] === open) depth++;
    else if (JS[j] === close && --depth === 0) return JS.slice(i, j + 1);
  }
  throw new Error(`unbalanced ${open} after ${startRe}`);
}

/* The category list carries an inline SVG per entry, so it is read for its
   id and name rather than evaluated. */
const categories = [...block(/var categories = \[/, '[', ']')
  .matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g)]
  .map(([, id, name]) => ({ id, name }));

const formulations = [...block(/var formulations = \[/, '[', ']')
  .matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'\s*\}/g)]
  .map(([, id, name]) => ({ id, name }));

const catFormMap = eval('(' + block(/var catFormMap = \{/, '{', '}') + ')');

const verdictSrc = block(/function verdict\(\) \{/, '{', '}');

/* Closure variables the lifted function reads. Same shape the page gives it. */
let state = null;
const tempOptions     = A.scoring.temp_options;
const phOptions       = A.scoring.ph_options;
const formulationRisk = A.scoring.formulation_risk;
const evidence        = A.evidence.items;

/* verdict() reads `state`, `tempOptions`, `phOptions`, `formulationRisk` and
   `evidence` by name. A direct eval, rather than (0, eval), is what makes the
   lifted source resolve those against the bindings above instead of against
   the global object. */
const verdict = eval('(function verdict()' + verdictSrc + ')');

const formName = Object.fromEntries(formulations.map(f => [f.id, f.name]));
const catName  = Object.fromEntries(categories.map(c => [c.id, c.name]));

/* ---- enumerate ---- */

const rows = [];
for (const cat of categories) {
  const forms = catFormMap[cat.id] || formulations.map(f => f.id);
  for (const form of forms) {
    for (let t = 0; t < tempOptions.length; t++) {
      for (let p = 0; p < phOptions.length; p++) {
        state = { category: cat.id, formulations: [form], temp: t, ph: p };
        const out = verdict();
        rows.push({
          category: cat.id,
          categoryName: cat.name,
          form,
          formName: formName[form],
          formRisk: formulationRisk[form] || 'low',
          temp: tempOptions[t].label,
          tempRisk: tempOptions[t].risk || 'low',
          ph: phOptions[p].label,
          phRisk: phOptions[p].risk || 'low',
          evidence: out.proven || '',
          key: out.key,
          label: A.result.outcomes[out.key].label,
          title: A.result.outcomes[out.key].title,
        });
      }
    }
  }
}

/* Which category and form combinations an evidence row covers, so the table
   can say why a result was lifted. */
const covered = [];
for (const e of evidence) {
  for (const f of (e.forms || [])) {
    if ((catFormMap[e.category] || []).includes(f)) {
      covered.push({ category: catName[e.category] || e.category, form: formName[f] || f,
                     outcome: e.outcome, note: e.note || '' });
    }
  }
}

const tally = rows.reduce((a, r) => (a[r.key] = (a[r.key] || 0) + 1, a), {});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows, covered, tally }, null, 2));
} else {
  const payload = JSON.stringify({ rows, covered, tally, outcomes: A.result.outcomes,
                                   note: A.result.note });
  const html = (await readFile('scripts/assess-matrix.template.html', 'utf8'))
    .replace('/*__DATA__*/null', payload);
  await writeFile('docs/assess-matrix.html', html);
  console.error(`${rows.length} combinations: `
    + Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(', '));
  console.error('wrote docs/assess-matrix.html');
}
