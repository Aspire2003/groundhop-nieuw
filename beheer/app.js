// Groundhop Beheer -- the private admin dashboard for in-app reports (public.reports). Talks to
// Supabase directly with the publishable key; every read/write beyond INSERT is gated server-side
// by RLS (supabase/migrations/20260927130000_reports_admin.sql) to aiden.zaak@gmail.com's own
// signed-in session -- this script never checks who is admin itself, it just shows whatever comes
// back, which is nothing at all for anyone else's session.
(function () {
  'use strict';

  var SUPABASE_URL = 'https://rutgdyltxhbswxvcvljf.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_fmL24fFmcfUbpzy0UiDHpg_AlOr_YZc';
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var KIND_LABEL = {
    correction: 'Correctie',
    manual_match: 'Zelf toegevoegd',
    search_miss: 'Niets gevonden',
    ground_missing: 'Stadion ontbreekt',
    import_problem: 'Import-probleem',
    error: 'Foutmelding',
    feedback: 'Feedback',
  };
  var FIELD_LABEL = { score: 'Score', ground: 'Stadion', date: 'Datum', clubs: 'Clubs', lineup: 'Opstelling', competition: 'Competitie', other: 'Iets anders' };
  var STATUS_LABEL = { open: 'Open', bezig: 'Bezig', opgelost: 'Opgelost', genegeerd: 'Genegeerd' };
  var STATUSES = ['open', 'bezig', 'opgelost', 'genegeerd'];
  var KIND_ORDER = ['correction', 'manual_match', 'search_miss', 'ground_missing', 'import_problem', 'error', 'feedback'];

  var $ = function (id) { return document.getElementById(id); };
  var allReports = [];
  var groupsByKey = {};
  var pendingStatus = {}; // report id -> status the admin picked but has not saved yet

  function fmtDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtDateTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  /** A match summary from a report's own fields -- never falls back to a search query, which is
   * not a match and gets its own label in the detail card. */
  function matchLabel(r) {
    if (r.home && r.away) return r.home + ' – ' + r.away;
    if (r.kind !== 'search_miss' && r.kind !== 'ground_missing' && r.query) return r.query;
    return r.competition || '';
  }

  /** Identical problems collapse: same fixture+field, same search query, same ground name, ... */
  function groupKey(r) {
    if (r.kind === 'correction') return 'correction|' + (r.fixture_id || r.ground_id || 'x') + '|' + (r.field || 'x');
    if (r.kind === 'search_miss' || r.kind === 'ground_missing') return r.kind + '|' + (r.query || '').trim().toLowerCase();
    if (r.kind === 'manual_match') return 'manual_match|' + (r.home || '').trim().toLowerCase() + '|' + (r.away || '').trim().toLowerCase() + '|' + (r.match_date || '');
    return r.kind + '|' + (r.message || '').trim().toLowerCase().slice(0, 160);
  }

  function groupTitle(sample) {
    switch (sample.kind) {
      case 'correction':
        return (matchLabel(sample) || 'Onbekende wedstrijd') + ' · ' + (FIELD_LABEL[sample.field] || sample.field || '');
      case 'manual_match':
        return matchLabel(sample) || 'Wedstrijd zonder naam';
      case 'search_miss':
        return 'Zoekopdracht: "' + (sample.query || '') + '"';
      case 'ground_missing':
        return 'Stadion niet gevonden: "' + (sample.query || '') + '"';
      default:
        return sample.message || KIND_LABEL[sample.kind] || sample.kind;
    }
  }

  function buildGroups(reports) {
    var byKey = {};
    reports.forEach(function (r) {
      var k = groupKey(r);
      (byKey[k] = byKey[k] || []).push(r);
    });
    return Object.keys(byKey).map(function (k) {
      var members = byKey[k].sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      return { key: k, members: members, sample: members[0], count: members.length, since: members[members.length - 1].created_at, latest: members[0].created_at };
    }).sort(function (a, b) { return b.count - a.count || new Date(b.latest) - new Date(a.latest); });
  }

  function renderStats() {
    var el = $('stats');
    var open = allReports.filter(function (r) { return r.status === 'open'; });
    var byKind = {};
    open.forEach(function (r) { byKind[r.kind] = (byKind[r.kind] || 0) + 1; });
    var html = KIND_ORDER.filter(function (k) { return byKind[k] > 0; }).map(function (k) {
      return '<div class="stat"><span class="n">' + byKind[k] + '</span><span class="label">' + esc(KIND_LABEL[k]) + '</span></div>';
    }).join('');
    el.innerHTML = html || '<div class="stat"><span class="n">0</span><span class="label">Open meldingen</span></div>';
  }

  function currentFilters() {
    return { status: $('filter-status').value, kind: $('filter-kind').value };
  }

  function renderList() {
    renderStats();
    var f = currentFilters();
    var filtered = allReports.filter(function (r) {
      return (f.status === 'all' || r.status === f.status) && (f.kind === 'all' || r.kind === f.kind);
    });
    var groups = buildGroups(filtered);
    groupsByKey = {};
    groups.forEach(function (g) { groupsByKey[g.key] = g; });

    var listEl = $('groups');
    var emptyEl = $('empty');
    if (allReports.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');
    if (groups.length === 0) {
      listEl.innerHTML = '<p class="muted" style="padding:12px 4px;">Geen meldingen voor dit filter.</p>';
      return;
    }
    listEl.innerHTML = groups.map(function (g) {
      var since = g.count > 1 ? g.count + ' keer · sinds ' + fmtDate(g.since) : '1 keer · ' + fmtDate(g.since);
      return (
        '<div class="card group" data-key="' + esc(g.key) + '">' +
        '<div class="row1"><div class="title"><span class="kind-badge">' + esc(KIND_LABEL[g.sample.kind] || g.sample.kind) + '</span>' + esc(groupTitle(g.sample)) + '</div></div>' +
        '<div class="meta">' + since + '</div>' +
        '</div>'
      );
    }).join('');
    Array.prototype.forEach.call(listEl.querySelectorAll('.group'), function (card) {
      card.addEventListener('click', function () { openGroup(card.getAttribute('data-key')); });
    });
  }

  function diffLine(label, before, after) {
    if (before === after || (before == null && after == null)) return '';
    return '<div class="field"><b>' + esc(label) + ':</b> <span class="diff"><span class="from">' + esc(before == null ? '–' : before) + '</span> → <span class="to">' + esc(after == null ? '–' : after) + '</span></span></div>';
  }

  function renderCorrectionDiff(r) {
    var o = r.original || {};
    var c = r.correction || {};
    var lines = '';
    if ('homeGoals' in o || 'homeGoals' in c) lines += diffLine('Score', (o.homeGoals ?? '') + '–' + (o.awayGoals ?? ''), (c.homeGoals ?? '') + '–' + (c.awayGoals ?? ''));
    if ('groundName' in o || 'groundName' in c) lines += diffLine('Stadion', o.groundName, c.groundName);
    if ('date' in o || 'date' in c) lines += diffLine('Datum', o.date, c.date);
    if ('home' in o || 'home' in c) lines += diffLine('Thuis', o.home, c.home) + diffLine('Uit', o.away, c.away);
    if ('competition' in o || 'competition' in c) lines += diffLine('Competitie', o.competition, c.competition);
    return lines;
  }

  function reportCard(r) {
    var status = pendingStatus[r.id] || r.status;
    var chips = STATUSES.map(function (s) {
      return '<button type="button" class="status-chip' + (s === status ? ' active' : '') + '" data-status="' + s + '" data-id="' + r.id + '">' + STATUS_LABEL[s] + '</button>';
    }).join('');
    var matchBits = [matchLabel(r), matchLabel(r) !== r.competition ? r.competition : null, fmtDate(r.match_date)].filter(Boolean).join(' · ');
    return (
      '<div class="card report" data-id="' + r.id + '">' +
      (matchBits ? '<div class="field"><b>Wedstrijd:</b> ' + esc(matchBits) + '</div>' : '') +
      (r.kind === 'search_miss' || r.kind === 'ground_missing' ? '<div class="field"><b>Zoekopdracht:</b> "' + esc(r.query) + '"</div>' : '') +
      (r.field ? '<div class="field"><b>Wat klopt niet:</b> ' + esc(FIELD_LABEL[r.field] || r.field) + '</div>' : '') +
      renderCorrectionDiff(r) +
      (r.message ? '<div class="field"><b>Bericht:</b> ' + esc(r.message) + '</div>' : '') +
      '<div class="field muted">v' + esc(r.app_version) + ' · ' + esc(r.platform) + ' · ' + esc(r.locale) + ' · ' + fmtDateTime(r.created_at) + '</div>' +
      '<div class="status-row">' + chips + '</div>' +
      '<textarea placeholder="Notitie voor jezelf (optioneel)" data-note="' + r.id + '">' + esc(r.admin_note || '') + '</textarea>' +
      '<div style="margin-top:8px;"><button class="small" data-save="' + r.id + '">Opslaan</button> <span class="muted" data-saved="' + r.id + '" style="font-size:12px;"></span></div>' +
      '</div>'
    );
  }

  function openGroup(key) {
    var g = groupsByKey[key];
    if (!g) return;
    $('view-list').classList.add('hidden');
    $('view-detail').classList.remove('hidden');
    pendingStatus = {};
    $('detail-reports').innerHTML = g.members.map(reportCard).join('');
    wireDetailEvents();
  }

  function wireDetailEvents() {
    var root = $('detail-reports');
    Array.prototype.forEach.call(root.querySelectorAll('.status-chip'), function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        pendingStatus[id] = btn.getAttribute('data-status');
        Array.prototype.forEach.call(root.querySelectorAll('.status-chip[data-id="' + id + '"]'), function (b) {
          b.classList.toggle('active', b.getAttribute('data-status') === pendingStatus[id]);
        });
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-save]'), function (btn) {
      btn.addEventListener('click', function () { void saveReport(btn.getAttribute('data-save')); });
    });
  }

  async function saveReport(id) {
    var card = document.querySelector('.report[data-id="' + id + '"]');
    var note = card.querySelector('[data-note="' + id + '"]').value.trim();
    var status = pendingStatus[id] || (allReports.find(function (r) { return String(r.id) === String(id); }) || {}).status || 'open';
    var patch = { status: status, admin_note: note || null, resolved_at: status === 'opgelost' ? new Date().toISOString() : null };
    var saveBtn = card.querySelector('[data-save="' + id + '"]');
    saveBtn.disabled = true;
    var { error } = await sb.from('reports').update(patch).eq('id', id);
    saveBtn.disabled = false;
    var savedEl = card.querySelector('[data-saved="' + id + '"]');
    if (error) {
      savedEl.textContent = 'Opslaan mislukt.';
      return;
    }
    savedEl.textContent = 'Opgeslagen.';
    var idx = allReports.findIndex(function (r) { return String(r.id) === String(id); });
    if (idx >= 0) allReports[idx] = Object.assign({}, allReports[idx], patch);
  }

  async function loadReports() {
    var { data, error } = await sb.from('reports').select('*').order('created_at', { ascending: false }).limit(5000);
    if (error) {
      $('groups').innerHTML = '';
      $('empty').classList.remove('hidden');
      $('empty').querySelector('h2').textContent = 'Kon meldingen niet laden';
      return;
    }
    allReports = data || [];
    renderList();
  }

  // ---------- "Geleerd": learned mappings (supabase/migrations/20260928090000_learned_mappings.sql) ----------
  // One card per distinct mapping (kind + folded key + target), however many phones sent it. Approve
  // and revert act on every row of that mapping at once; the database's own vote trigger keeps a
  // revert in place when more votes arrive later.

  var MAPPING_KIND_LABEL = { ground_alias: 'Stadionnaam', new_ground: 'Nieuw stadion', club_alias: 'Clubnaam', score: 'Uitslag', match_ground: 'Stadion van een wedstrijd' };
  var MAPPING_STATUS_LABEL = { pending: 'Wacht', approved: 'Goedgekeurd', reverted: 'Teruggedraaid' };
  var APPROVED_BY_LABEL = { votes: '3 toestellen', admin: 'jij', agent: 'ground-finder' };
  var allMappings = [];
  var mappingGroups = {};

  function goalsText(g) {
    return g ? g.home + '–' + g.away : 'geen uitslag';
  }

  /** What the mapping says, in words: "Sportpark Noord → osm-way-1 (Sportpark Noord, Utrecht)". */
  function mappingTarget(m) {
    var v = m.value || {};
    switch (m.kind) {
      case 'score':
        return goalsText(v.from) + ' → ' + goalsText(v.to);
      case 'club_alias':
        return v.name || m.target_key;
      case 'match_ground':
        return (v.from || '?') + ' → ' + (m.target_id || '');
      case 'new_ground':
        return [v.name, v.kind, v.address, v.city, v.country].filter(Boolean).join(' · ');
      default:
        return m.target_id || m.target_key;
    }
  }

  /** The status a group shows: approved if any row is, else reverted if any row is, else pending. */
  function groupStatus(rows) {
    if (rows.some(function (r) { return r.status === 'approved'; })) return 'approved';
    if (rows.some(function (r) { return r.status === 'reverted'; })) return 'reverted';
    return 'pending';
  }

  function buildMappingGroups(rows) {
    var byKey = {};
    rows.forEach(function (r) {
      var k = r.kind + '|' + r.key_norm + '|' + r.target_key;
      (byKey[k] = byKey[k] || []).push(r);
    });
    return Object.keys(byKey).map(function (k) {
      var members = byKey[k];
      var devices = {};
      members.forEach(function (r) { if (r.device_id) devices[r.device_id] = true; });
      var approvedRow = members.find(function (r) { return r.status === 'approved'; });
      var agentRow = members.find(function (r) { return r.origin === 'agent'; });
      return {
        key: k,
        sample: agentRow || members[0],
        members: members,
        devices: Object.keys(devices).length,
        status: groupStatus(members),
        approvedBy: approvedRow ? approvedRow.approved_by : null,
        latest: members.reduce(function (a, r) { return a > r.created_at ? a : r.created_at; }, ''),
      };
    }).sort(function (a, b) { return b.devices - a.devices || (b.latest > a.latest ? 1 : -1); });
  }

  function renderMappingStats() {
    var groups = buildMappingGroups(allMappings);
    var count = { pending: 0, approved: 0, reverted: 0 };
    groups.forEach(function (g) { count[g.status] += 1; });
    $('mapping-stats').innerHTML = ['pending', 'approved', 'reverted'].map(function (s) {
      return '<div class="stat"><span class="n">' + count[s] + '</span><span class="label">' + esc(MAPPING_STATUS_LABEL[s]) + '</span></div>';
    }).join('');
  }

  function mappingCard(g) {
    var m = g.sample;
    var who = g.status === 'approved' ? 'goedgekeurd door ' + (APPROVED_BY_LABEL[g.approvedBy] || g.approvedBy || '?')
      : g.devices === 0 ? 'van de ground-finder'
      : g.devices + (g.devices === 1 ? ' toestel' : ' toestellen');
    var osm = /^osm-(node|way|relation)-(\d+)$/.exec(m.target_id || '');
    var agentBits = m.origin === 'agent'
      ? '<div class="field muted">Ground-finder · zekerheid ' + esc(m.confidence == null ? '?' : Math.round(m.confidence * 100) + '%') +
        (m.source_url ? ' · <a href="' + esc(m.source_url) + '" target="_blank" rel="noopener noreferrer">bron</a>' : '') + '</div>'
      : '';
    var coords = m.kind === 'new_ground' && m.value && typeof m.value.lat === 'number'
      ? '<div class="field muted"><a href="https://www.openstreetmap.org/?mlat=' + m.value.lat + '&mlon=' + m.value.lon + '#map=17/' + m.value.lat + '/' + m.value.lon + '" target="_blank" rel="noopener noreferrer">' + m.value.lat.toFixed(5) + ', ' + m.value.lon.toFixed(5) + '</a></div>'
      : '';
    var note = g.members.map(function (r) { return r.admin_note; }).filter(Boolean)[0];
    var actions = (g.status !== 'approved' ? '<button type="button" class="approve" data-approve="' + esc(g.key) + '">Goedkeuren</button>' : '') +
      (g.status !== 'reverted' ? '<button type="button" class="revert" data-revert="' + esc(g.key) + '">Terugdraaien</button>' : '');
    return (
      '<div class="card report mapping">' +
      '<div class="row1"><div class="title"><span class="kind-badge">' + esc(MAPPING_KIND_LABEL[m.kind] || m.kind) + '</span>' +
      esc(m.key_text) + '<span class="arrow">→</span>' + esc(mappingTarget(m)) + '</div></div>' +
      (m.match_date ? '<div class="field muted">Wedstrijd van ' + esc(fmtDate(m.match_date)) + '</div>' : '') +
      (osm ? '<div class="field muted"><a href="https://www.openstreetmap.org/' + osm[1] + '/' + osm[2] + '" target="_blank" rel="noopener noreferrer">' + esc(m.target_id) + ' op de kaart</a></div>' : '') +
      coords + agentBits +
      (note ? '<div class="field"><b>Notitie:</b> ' + esc(note) + '</div>' : '') +
      '<div class="field muted"><span class="status-badge ' + g.status + '">' + esc(MAPPING_STATUS_LABEL[g.status]) + '</span> · ' + esc(who) + ' · laatst ' + esc(fmtDate(g.latest)) + '</div>' +
      '<div class="actions">' + actions + '<span class="muted" data-mapping-msg style="font-size:13px;align-self:center;"></span></div>' +
      '</div>'
    );
  }

  function renderMappings() {
    renderMappingStats();
    var status = $('mapping-status').value;
    var kind = $('mapping-kind').value;
    var groups = buildMappingGroups(allMappings).filter(function (g) {
      return (status === 'all' || g.status === status) && (kind === 'all' || g.sample.kind === kind);
    });
    mappingGroups = {};
    groups.forEach(function (g) { mappingGroups[g.key] = g; });
    $('mappings-empty').classList.toggle('hidden', allMappings.length > 0);
    if (allMappings.length === 0) {
      $('mappings').innerHTML = '';
      return;
    }
    $('mappings').innerHTML = groups.length
      ? '<div class="card">' + groups.map(mappingCard).join('') + '</div>'
      : '<p class="muted" style="padding:12px 4px;">Niets voor dit filter.</p>';
    Array.prototype.forEach.call($('mappings').querySelectorAll('[data-approve]'), function (btn) {
      btn.addEventListener('click', function () { void setMappingStatus(btn, btn.getAttribute('data-approve'), 'approved'); });
    });
    Array.prototype.forEach.call($('mappings').querySelectorAll('[data-revert]'), function (btn) {
      btn.addEventListener('click', function () { void setMappingStatus(btn, btn.getAttribute('data-revert'), 'reverted'); });
    });
  }

  async function setMappingStatus(btn, key, status) {
    var g = mappingGroups[key];
    if (!g) return;
    var m = g.sample;
    var patch = status === 'approved'
      ? { status: 'approved', approved_by: 'admin', approved_at: new Date().toISOString() }
      : { status: 'reverted', approved_by: null, approved_at: null };
    var msg = btn.parentNode.querySelector('[data-mapping-msg]');
    btn.disabled = true;
    var { error } = await sb.from('learned_mappings').update(patch).eq('kind', m.kind).eq('key_norm', m.key_norm).eq('target_key', m.target_key);
    btn.disabled = false;
    if (error) {
      msg.textContent = 'Opslaan mislukt.';
      return;
    }
    g.members.forEach(function (r) { Object.assign(r, patch); });
    renderMappings();
  }

  async function loadMappings() {
    var { data, error } = await sb.from('learned_mappings').select('*').order('created_at', { ascending: false }).limit(10000);
    if (error) {
      $('mappings').innerHTML = '';
      $('mappings-empty').classList.remove('hidden');
      $('mappings-empty').querySelector('h2').textContent = 'Kon geleerde koppelingen niet laden';
      return;
    }
    allMappings = data || [];
    renderMappings();
  }

  function showTab(which) {
    var mappings = which === 'mappings';
    $('tab-reports').classList.toggle('active', !mappings);
    $('tab-mappings').classList.toggle('active', mappings);
    $('view-mappings').classList.toggle('hidden', !mappings);
    $('view-detail').classList.add('hidden');
    $('view-list').classList.toggle('hidden', mappings);
    if (mappings) void loadMappings();
    else void loadReports();
  }

  function showApp(email) {
    $('view-login').classList.add('hidden');
    $('view-app').classList.remove('hidden');
    $('who').classList.remove('hidden');
    $('who-email').textContent = email || '';
    void loadReports();
  }

  function showLogin() {
    $('view-app').classList.add('hidden');
    $('view-login').classList.remove('hidden');
    $('who').classList.add('hidden');
  }

  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('login-email').value.trim();
    var msg = $('msg');
    var btn = $('login-submit');
    btn.disabled = true;
    msg.className = '';
    msg.textContent = 'Bezig met versturen...';
    sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.href.split('#')[0].split('?')[0] } }).then(function (res) {
      btn.disabled = false;
      if (res.error) {
        msg.className = 'error';
        msg.textContent = res.error.message;
        return;
      }
      msg.textContent = 'Check je e-mail voor de inloglink.';
    });
  });

  $('signout-btn').addEventListener('click', function () { void sb.auth.signOut(); });
  $('refresh-btn').addEventListener('click', function () { void loadReports(); });
  $('filter-status').addEventListener('change', renderList);
  $('filter-kind').addEventListener('change', renderList);
  $('tab-reports').addEventListener('click', function () { showTab('reports'); });
  $('tab-mappings').addEventListener('click', function () { showTab('mappings'); });
  $('mapping-refresh').addEventListener('click', function () { void loadMappings(); });
  $('mapping-status').addEventListener('change', renderMappings);
  $('mapping-kind').addEventListener('change', renderMappings);
  $('back-btn').addEventListener('click', function () {
    $('view-detail').classList.add('hidden');
    $('view-list').classList.remove('hidden');
    void loadReports();
  });

  sb.auth.onAuthStateChange(function (_event, session) {
    if (session && session.user) showApp(session.user.email);
    else showLogin();
  });
  sb.auth.getSession().then(function (res) {
    var session = res.data && res.data.session;
    if (session && session.user) showApp(session.user.email);
    else showLogin();
  });
})();
