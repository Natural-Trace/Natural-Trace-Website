/* Scroll-reveal animations were removed on 6 Aug 2026. Sections are painted by
   the browser on load rather than faded in by JavaScript as you scroll. */

/* The splash intro was removed on 7 Aug 2026. The home page opens on the
   hero. */

/* Active nav state */
/* Whether this is the home page comes from the body class the template sets,
   not from the URL.

   It used to be worked out by taking the last segment of the path, and that is
   wrong the moment the site is not served from the root. In production it is
   served from /Natural-Trace-Website/, so the last segment of the home page URL
   is "Natural-Trace-Website", which is neither "home" nor empty. The navigation
   therefore loaded in its scrolled state on the home page: a white bar on the
   dark hero, every time, for anyone arriving from another page.

   Then the scroll handler, whose own path test did match, removed the class on
   the first scroll event and put it back at 60px. That was the flicker.

   Both faults came from the same line, and neither could be reproduced locally,
   where the site is served from the root and the last segment is empty. The
   body class is set by base.njk from page.url against sitePathPrefix, so it is
   right wherever the site is served from. */
window.addEventListener('DOMContentLoaded', function() {
  var isHome = document.body.classList.contains('page-home');
  var navbar = document.getElementById('navbar');

  var path = window.location.pathname.replace(/\/$/, '');
  var pageName = isHome ? 'home' : (path.split('/').pop() || 'home');
  document.querySelectorAll('.nav-links a[data-page]').forEach(function(a) {
    if (a.getAttribute('data-page') === pageName) a.classList.add('active');
  });

  /* Every page but the home page opens on a pale section, so the navigation
     starts in its scrolled colours and stays there. */
  if (!isHome) {
    if (navbar) navbar.classList.add('scrolled');
    return;
  }

  /* On the home page it follows the scroll. Registered here rather than at the
     top level so it is never attached on a page that does not use it, and
     passive because it only reads scrollY. */
  var onScroll = function() {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  /* A reload partway down the page restores the scroll position before this
     runs, so the state has to be set once rather than waited for. */
  onScroll();
});

/* Parallax hero and the scroll-driven counter were removed on 6 Aug 2026.
   The parallax wrote a transform on every scroll event with no throttling, and
   nothing on the site uses the .count element the counter observed. */

/* Contact form
 *
 * Where a submission goes is configured in src/_data/integrations.yml and
 * handed to this file on the form's data- attributes, so turning HubSpot on is
 * a config change and needs no code change here.
 *
 * Until HubSpot is configured, or if a HubSpot request fails, the message is
 * handed to the visitor's email client. An inquiry is never silently dropped.
 */
function readContactConfig(form) {
  var d = form.dataset;
  var map = {};
  try { map = JSON.parse(d.hsMap || '{}') || {}; } catch (err) { map = {}; }
  var portal = (d.hsPortal || '').trim();
  var guid = (d.hsForm || '').trim();
  return {
    hubspotReady: d.hsEnabled === 'true' && !!portal && !!guid,
    portal: portal,
    guid: guid,
    region: (d.hsRegion || 'na1').trim() || 'na1',
    map: map,
    email: (d.fallbackEmail || '').trim(),
    subject: (d.fallbackSubject || 'Website inquiry').trim()
  };
}

function contactFormEndpoint(cfg) {
  var host = cfg.region === 'na1' ? 'api.hsforms.com' : 'api-' + cfg.region + '.hsforms.com';
  return 'https://' + host + '/submissions/v3/integration/submit/' + cfg.portal + '/' + cfg.guid;
}

function showContactState(id) {
  var form = document.getElementById('contactForm');
  if (form) form.style.display = 'none';
  ['formSuccess', 'formFallback', 'formError'].forEach(function(stateId) {
    var el = document.getElementById(stateId);
    if (el) el.style.display = (stateId === id) ? 'block' : 'none';
  });
}

function submitContactViaEmail(cfg, data) {
  if (!cfg.email) { showContactState('formError'); return; }
  var name = [data.get('firstName'), data.get('lastName')].filter(Boolean).join(' ');
  var body = [
    'Name: ' + name,
    'Email: ' + (data.get('email') || ''),
    'Company: ' + (data.get('company') || ''),
    'Job title: ' + (data.get('jobTitle') || ''),
    'Inquiry type: ' + (data.get('inquiryType') || ''),
    '',
    data.get('message') || ''
  ].join('\n');
  window.location.href = 'mailto:' + cfg.email +
    '?subject=' + encodeURIComponent(cfg.subject + (name ? ' - ' + name : '')) +
    '&body=' + encodeURIComponent(body);
  showContactState('formFallback');
}

function submitContactToHubspot(cfg, data, form) {
  var fields = [];
  Object.keys(cfg.map).forEach(function(field) {
    var property = (cfg.map[field] || '').trim();
    var value = data.get(field);
    // An empty mapping in integrations.yml means "do not send this field".
    if (!property || !value) return;
    fields.push({ objectTypeId: '0-1', name: property, value: String(value) });
  });

  var btn = form.querySelector('.form-submit');
  if (btn) btn.disabled = true;

  fetch(contactFormEndpoint(cfg), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submittedAt: Date.now(),
      fields: fields,
      context: { pageUri: window.location.href, pageName: document.title }
    })
  }).then(function(res) {
    if (!res.ok) throw new Error('HubSpot responded ' + res.status);
    showContactState('formSuccess');
  }).catch(function(err) {
    if (window.console) console.error('Contact form: HubSpot submission failed.', err);
    submitContactViaEmail(cfg, data);
  }).then(function() {
    if (btn) btn.disabled = false;
  });
}

function handleContactSubmit(e) {
  e.preventDefault();
  var form = document.getElementById('contactForm');
  if (!form) return false;
  var data = new FormData(form);

  // Honeypot: only a bot fills a field a human cannot see. Show the normal
  // success state so the bot learns nothing, and send nothing.
  if (data.get('_botcheck')) { showContactState('formSuccess'); return false; }

  var cfg = readContactConfig(form);
  if (cfg.hubspotReady) { submitContactToHubspot(cfg, data, form); }
  else { submitContactViaEmail(cfg, data); }
  return false;
}

function switchCareersTab(tab) {
  document.querySelectorAll('.careers-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.careers-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('careers-' + tab).classList.add('active');
  event.target.classList.add('active');
}

function handleInternshipSubmit(e) {
  e.preventDefault();
  var form = document.getElementById('internshipForm');
  var data = new FormData(form);
  /* Address and subject come from _data/integrations.yml via the form's data
     attributes, so they can be changed in the CMS without touching this file.
     The fallback here is only a guard against the attribute going missing. */
  var to = (form.dataset.internshipEmail || '').trim() || 'info@natural-trace.com';
  var subjectPrefix = (form.dataset.internshipSubject || '').trim() || 'Internship Application';
  var body = 'New internship application from ' + data.get('firstName') + ' ' + data.get('lastName') +
    '%0D%0AEmail: ' + data.get('email') +
    '%0D%0AUniversity: ' + data.get('university') +
    '%0D%0AArea of Interest: ' + data.get('interest') +
    '%0D%0A%0D%0A' + data.get('message');
  window.location.href = 'mailto:' + to + '?subject=' +
    encodeURIComponent(subjectPrefix + ' - ' + data.get('firstName') + ' ' + data.get('lastName')) +
    '&body=' + body;
  form.style.display = 'none';
  document.getElementById('internshipSuccess').style.display = 'block';
  return false;
}

/* Team modal: data injected from team.json via template on team page */
function openTeamModal(idx) {
  if (typeof teamData === 'undefined' || !teamData[idx]) return;
  var d = teamData[idx];
  document.getElementById('modalName').textContent = d.name;
  document.getElementById('modalRole').textContent = d.role;
  document.getElementById('modalLoc').textContent = d.location || '';
  var prefix = (typeof basePrefix !== 'undefined' && basePrefix !== '/') ? basePrefix.replace(/\/$/, '') : '';
  document.getElementById('modalPhoto').src = d.photo.startsWith('/') ? prefix + d.photo : d.photo;
  var ll = document.getElementById('modalLinkedin');
  if (d.linkedin) { ll.href = d.linkedin; ll.style.display = ''; } else { ll.style.display = 'none'; }
  var eduHtml = '';
  if (d.education && d.education.length) {
    d.education.forEach(function(e) { eduHtml += '<span class="tm-edu-item">' + e + '</span>'; });
  }
  // No placeholder. A profile with no education listed simply shows nothing,
  // rather than telling the reader to go and look somewhere else.
  document.getElementById('modalEdu').innerHTML = eduHtml;
  var bioHtml = '';
  if (d.bio && d.bio.length) d.bio.forEach(function(b) { bioHtml += '<li>' + b + '</li>'; });
  document.getElementById('modalBio').innerHTML = bioHtml;
  document.getElementById('teamModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeTeamModal() {
  document.getElementById('teamModal').classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeTeamModal(); });
var teamModalEl = document.getElementById('teamModal');
if (teamModalEl) teamModalEl.addEventListener('click', function(e) { if (e.target === this) closeTeamModal(); });

/* FAQ functions */
function toggleFaqItem(btn) {
  var item = btn.parentElement;
  var wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(function(el) { el.classList.remove('open'); });
  if (!wasOpen) item.classList.add('open');
}

function filterFaq(cat) {
  document.querySelectorAll('.faq-cat-btn').forEach(function(b) { b.classList.remove('active'); });
  event.target.classList.add('active');
  document.querySelectorAll('.faq-item').forEach(function(item) {
    if (cat === 'all' || item.dataset.cat === cat) { item.style.display = ''; }
    else { item.style.display = 'none'; }
  });
}

/* ===== Compatibility Quiz ===== */
(function() {
  var state = { step: 0, category: null, formulations: [], temp: null, ph: null };

  var categories = [
    { id: 'vitamins', name: 'Vitamins & Minerals', icon: '<svg viewBox="0 0 40 40" width="32" height="32"><rect x="14" y="6" width="12" height="28" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><line x1="14" y1="20" x2="26" y2="20" stroke="currentColor" stroke-width="2"/></svg>' },
    { id: 'omega', name: 'Omega-3 & Fish Oil', icon: '<svg viewBox="0 0 40 40" width="32" height="32"><ellipse cx="20" cy="20" rx="14" ry="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="3" fill="currentColor"/></svg>' },
    { id: 'probiotics', name: 'Probiotics & Gut Health', icon: '<svg viewBox="0 0 40 40" width="32" height="32"><circle cx="15" cy="18" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="25" cy="22" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="13" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>' },
    { id: 'joint', name: 'Joint & Bone', icon: '<svg viewBox="0 0 40 40" width="32" height="32"><line x1="12" y1="28" x2="28" y2="12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="10" cy="30" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="30" cy="10" r="4" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
    { id: 'collagen', name: 'Collagen & Beauty', icon: '<svg viewBox="0 0 40 40" width="32" height="32"><path d="M20 6 C10 10, 10 30, 20 34 C30 30, 30 10, 20 6Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
    { id: 'herbal', name: 'Herbal & Botanical', icon: '<svg viewBox="0 0 40 40" width="32" height="32"><path d="M20 34 V18 M14 22 Q20 14, 26 22 M10 28 Q20 18, 30 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' },
    { id: 'sports', name: 'Sports Nutrition', icon: '<svg viewBox="0 0 40 40" width="32" height="32"><circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8" y1="20" x2="32" y2="20" stroke="currentColor" stroke-width="2"/><line x1="20" y1="8" x2="20" y2="32" stroke="currentColor" stroke-width="2"/></svg>' },
    { id: 'immune', name: 'Immune Support', icon: '<svg viewBox="0 0 40 40" width="32" height="32"><path d="M20 8 L22 16 L30 16 L24 21 L26 29 L20 24 L14 29 L16 21 L10 16 L18 16Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
    { id: 'weight', name: 'Weight Management', icon: '<svg viewBox="0 0 40 40" width="32" height="32"><rect x="10" y="14" width="20" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 14 V10 Q20 6, 25 10 V14" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
    { id: 'ingredients', name: 'Specialty Food Ingredients', icon: '<svg viewBox="0 0 40 40" width="32" height="32"><path d="M8 26 L20 10 L32 26Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="8" y1="30" x2="32" y2="30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' },
    { id: 'specialty', name: 'Specialty Health', icon: '<svg viewBox="0 0 40 40" width="32" height="32"><path d="M14 18 Q20 10, 26 18 Q26 26, 20 32 Q14 26, 14 18Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
    { id: 'functional', name: 'Functional Foods', icon: '<svg viewBox="0 0 40 40" width="32" height="32"><path d="M12 28 Q12 16, 20 12 Q28 16, 28 28Z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="20" y1="12" x2="20" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' }
  ];

  var formulations = [
    { id: 'tablet', name: 'Compressed Tablet' },
    { id: 'capsule', name: 'Hard Capsule' },
    { id: 'softgel', name: 'Softgel' },
    { id: 'gummy', name: 'Gummy' },
    { id: 'chewable', name: 'Chewable' },
    { id: 'powder', name: 'Powder / Sachet' },
    { id: 'liquid', name: 'Liquid / Syrup' },
    { id: 'effervescent', name: 'Effervescent' },
    { id: 'lozenge', name: 'Lozenge' },
    { id: 'bar', name: 'Bar' },
    { id: 'rtd', name: 'RTD Beverage' },
    { id: 'drops', name: 'Drops' }
  ];

  /* Which forms each category offers.

     Two gaps were found on 11 Aug by testing the evidence rows against it
     rather than by reading it. Vitamins & Minerals did not offer liquid or
     drops, which rules out children's D3 drops, B12 liquid and every vitamin
     syrup, and Specialty Health did not offer effervescent. Both are ordinary
     products, both have been through the lab, and neither could be described
     in the quiz. */
  var catFormMap = {
    vitamins: ['tablet','capsule','softgel','gummy','chewable','powder','effervescent','liquid','drops'],
    omega: ['softgel','capsule','liquid','gummy','drops'],
    probiotics: ['capsule','powder','chewable','liquid','gummy'],
    joint: ['tablet','capsule','softgel','powder','liquid'],
    collagen: ['powder','liquid','capsule','gummy'],
    herbal: ['capsule','tablet','liquid','powder','drops'],
    sports: ['powder','capsule','bar','rtd','tablet'],
    immune: ['tablet','capsule','gummy','effervescent','lozenge','liquid'],
    weight: ['powder','capsule','bar','rtd','liquid'],
    ingredients: ['powder','liquid','capsule','tablet','bar','rtd'],
    specialty: ['capsule','tablet','softgel','liquid','gummy','effervescent','powder'],
    functional: ['powder','liquid','bar','rtd','gummy','capsule']
  };

  /* The temperature and pH bands used to be written here: below 40, 40-65,
     65-100, above 100, and neutral / mildly acidic / very acidic / alkaline.
     They were not the bands the compatibility guide screens on, and two of
     them straddled a threshold, so "very acidic, pH under 4" covered both a pH
     the guide calls medium risk and one it calls high. There was no honest way
     to score an answer like that. The bands now match the guide exactly and
     come from src/_data/assess.yml with the rest of the content.

     Everything degrades gracefully. No model in the page, and the quiz behaves
     as it did before: it collects the answers and thanks you for them. */
  var model = null;
  try {
    var raw = document.getElementById('compatModel');
    if (raw) model = JSON.parse(raw.textContent);
  } catch (e) { model = null; }

  var tempOptions = (model && model.temp) || [
    { label: 'Below 60°C' }, { label: '60 to 100°C' }, { label: 'Above 100°C' }
  ];
  var phOptions = (model && model.ph) || [
    { label: 'pH 5 to 9' }, { label: 'pH 3 to 5, or 9 to 11' }, { label: 'Below pH 3, or above pH 11' }
  ];
  var formulationRisk = (model && model.formulationRisk) || {};
  var evidence = (model && model.evidence) || [];

  function el(id) { return document.getElementById(id); }

  function renderCategories() {
    var grid = el('compatCategories');
    if (!grid) return;
    grid.innerHTML = '';
    categories.forEach(function(cat) {
      var card = document.createElement('div');
      card.className = 'compat-card';
      card.setAttribute('data-id', cat.id);
      card.innerHTML = '<div class="compat-card-icon">' + cat.icon + '</div><span class="compat-card-label">' + cat.name + '</span>';
      card.onclick = function() { selectCard('compatCategories', cat.id); state.category = cat.id; el('compatNext1').classList.add('visible'); };
      grid.appendChild(card);
    });
  }

  function renderFormulations() {
    var grid = el('compatFormulations');
    if (!grid) return;
    var allowed = catFormMap[state.category] || formulations.map(function(f) { return f.id; });
    grid.innerHTML = '';
    state.formulations = [];
    formulations.forEach(function(form) {
      if (allowed.indexOf(form.id) < 0) return;
      var card = document.createElement('div');
      card.className = 'compat-card';
      card.setAttribute('data-id', form.id);
      card.innerHTML = '<span class="compat-card-label">' + form.name + '</span>';
      card.onclick = function() {
        card.classList.toggle('selected');
        var idx = state.formulations.indexOf(form.id);
        if (idx >= 0) { state.formulations.splice(idx, 1); } else { state.formulations.push(form.id); }
        if (state.formulations.length > 0) { el('compatNext2').classList.add('visible'); } else { el('compatNext2').classList.remove('visible'); }
      };
      grid.appendChild(card);
    });
  }

  function renderConditions() {
    var tg = el('compatTempOptions'); var pg = el('compatPhOptions');
    if (!tg || !pg) return;
    tg.innerHTML = ''; pg.innerHTML = '';
    tempOptions.forEach(function(opt, i) {
      var btn = document.createElement('button');
      btn.className = 'compat-condition-btn';
      btn.textContent = opt.label;
      btn.onclick = function() { selectCondition('compatTempOptions', i); state.temp = i; checkStep3Ready(); };
      tg.appendChild(btn);
    });
    phOptions.forEach(function(opt, i) {
      var btn = document.createElement('button');
      btn.className = 'compat-condition-btn';
      btn.textContent = opt.label;
      btn.onclick = function() { selectCondition('compatPhOptions', i); state.ph = i; checkStep3Ready(); };
      pg.appendChild(btn);
    });
  }

  function selectCard(gridId, id) {
    var cards = el(gridId).querySelectorAll('.compat-card');
    cards.forEach(function(c) { c.classList.remove('selected'); });
    var target = el(gridId).querySelector('[data-id="' + id + '"]');
    if (target) target.classList.add('selected');
  }

  function selectCondition(groupId, idx) {
    var btns = el(groupId).querySelectorAll('.compat-condition-btn');
    btns.forEach(function(b) { b.classList.remove('selected'); });
    btns[idx].classList.add('selected');
  }

  function checkStep3Ready() {
    if (state.temp !== null && state.ph !== null) {
      el('compatNext3').classList.add('visible');
    }
  }

  function showScreen(id) {
    var screens = document.querySelectorAll('.compat-screen');
    screens.forEach(function(s) { s.classList.remove('active'); });
    var target = el(id);
    if (target) target.classList.add('active');
  }

  window.compatStart = function() {
    el('compatProgress').style.display = 'flex';
    renderCategories();
    showScreen('compatStep1');
    updateProgress(1);
  };

  window.compatGoStep = function(step) {
    if (step === 1) {
      showScreen('compatStep1');
      updateProgress(1);
    } else if (step === 2) {
      renderFormulations();
      el('compatNext2').classList.remove('visible');
      showScreen('compatStep2');
      updateProgress(2);
    } else if (step === 3) {
      renderConditions();
      el('compatNext3').classList.remove('visible');
      showScreen('compatStep3');
      updateProgress(3);
    }
  };

  /* The verdict.

     Worst case wins, and a second medium is enough to move a product down a
     band. That is deliberate. Two separate things that each stress DNA are not
     the same risk as one, and the guide's own answer to a flagged product is to
     test it rather than to reason about it.

     There is no "not compatible" outcome. Not because it cannot happen: the
     guide is explicit that below pH 3 the tag is likely incompatible. It is
     because a website that has never seen the formulation is not in a position
     to say so, and because the honest version of that answer is the same
     action either way, which is send us a sample. The bottom band says the
     thing that stresses DNA is there and that it needs testing. */
  function verdict() {
    var counts = { low: 0, medium: 0, high: 0 };

    /* This used to collect the labels as well and publish them under "What
       drove this". It counts only now: the visitor gets a verdict and a next
       step, not a list of what is wrong with their product. Removed 11 Aug
       2026 on request. */
    function note(opt) {
      if (!opt) return;
      var risk = opt.risk || 'low';
      counts[risk] = (counts[risk] || 0) + 1;
    }

    note(tempOptions[state.temp]);
    note(phOptions[state.ph]);
    /* Worst of the selected forms, not an average. A product made in four
       formats is only as straightforward as its hardest one. */
    var order = { low: 0, medium: 1, high: 2 };
    var worstForm = null;
    (state.formulations || []).forEach(function(fid) {
      var r = formulationRisk[fid];
      if (!r) return;
      if (worstForm === null || order[r] > order[worstForm]) worstForm = r;
    });
    if (worstForm) note({ risk: worstForm });

    var key = 'compatible';
    if (counts.high > 0 || counts.medium > 1) { key = 'testing'; }
    else if (counts.medium === 1) { key = 'conditions'; }

    /* Evidence beats inference.

       The bands above are a screen: they reason from pH, heat and product form
       to a likely answer. An entry in the evidence list is not a screen, it is
       a product in this category and this format that went through the lab and
       either worked or did not. Where one exists it should move the answer,
       because a tested result is better information than a rule.

       A pass lifts a "compatible with conditions" to compatible. It does not
       lift a "testing required": something in that answer is at high risk or
       two things are at medium, and one adjacent success is not enough to
       wave that through.

       A failure drops the answer to "testing required" whatever the bands
       said. That direction is not symmetric on purpose. Being wrong about a
       yes costs a client a failed trial; being wrong about a no costs a
       conversation. */
    var proven = null;
    for (var i = 0; i < evidence.length; i++) {
      var e = evidence[i];
      if (e.category !== state.category) continue;
      if (!e.forms || !e.forms.some(function(f) { return state.formulations.indexOf(f) >= 0; })) continue;
      if (e.outcome === 'not-compatible') { proven = 'not-compatible'; break; }
      if (e.outcome === 'compatible') { proven = 'compatible'; }
    }
    if (proven === 'not-compatible') { key = 'testing'; }
    else if (proven === 'compatible' && key === 'conditions') { key = 'compatible'; }

    return { key: key, proven: proven };
  }

  window.compatShowResult = function() {
    var out = verdict();
    var outcomes = (model && model.outcomes) || {};
    var o = outcomes[out.key];
    el('compatProgress').style.display = 'none';

    if (!o) {
      /* No model, so no verdict. Falls back to the screen that was here
         before rather than showing an empty result. */
      showScreen('compatResult');
      return;
    }

    var badge = el('compatResultBadge');
    badge.textContent = o.label;
    badge.className = 'compat-badge compat-badge-' + out.key;
    el('compatResultTitle').textContent = o.title;
    el('compatResultBody').textContent = o.body;

    var ev = el('compatResultEvidence');
    if (ev) {
      var labels = (model && model.evidenceLabels) || {};
      if (out.proven === 'compatible') { ev.textContent = labels.compatible || ''; ev.className = 'compat-evidence compat-evidence-yes'; }
      else if (out.proven === 'not-compatible') { ev.textContent = labels.notCompatible || ''; ev.className = 'compat-evidence compat-evidence-no'; }
      else { ev.textContent = ''; ev.className = 'compat-evidence'; }
    }
    showScreen('compatResult');
  };

  function updateProgress(step) {
    el('compatStepLabel').textContent = 'Step ' + step + ' of 3';
    el('compatProgressFill').style.width = (step * 33) + '%';
  }

  // Initialize
  renderCategories();
})();


/* Autoplaying video, for people who have asked for less of it.

   The NaturalCloud panel loops an eleven second recording with no controls,
   which is what was asked for and is also, for anyone sensitive to motion,
   eleven seconds of movement they cannot stop. WCAG 2.2.2 asks that anything
   moving for more than five seconds can be paused.

   So the operating system setting decides. Nobody who has not asked for
   reduced motion notices this code at all; anyone who has gets the first
   frame, a play button, and the choice. The check is live rather than
   read-once, because the setting can be changed while the page is open.

   Attributes rather than a class, because autoplay and controls are what the
   browser actually reads. */
window.addEventListener('DOMContentLoaded', function() {
  var videos = document.querySelectorAll('video[autoplay]');
  if (!videos.length || !window.matchMedia) return;
  var query = window.matchMedia('(prefers-reduced-motion: reduce)');

  function apply() {
    for (var i = 0; i < videos.length; i++) {
      var v = videos[i];
      if (query.matches) {
        v.autoplay = false;
        v.controls = true;
        v.pause();
      } else {
        v.controls = false;
        /* play() rejects when a browser blocks autoplay for its own reasons.
           Nothing to do about that here, and an unhandled rejection in the
           console helps nobody. */
        var p = v.play();
        if (p && p.catch) p.catch(function() {});
      }
    }
  }

  apply();
  if (query.addEventListener) query.addEventListener('change', apply);
  else if (query.addListener) query.addListener(apply);
});
