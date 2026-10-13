/**
 * GitHub OAuth handler for Decap CMS.
 *
 * Decap's GitHub backend cannot talk to GitHub directly, because exchanging an
 * OAuth code for a token requires a client secret and a browser cannot hold one.
 * Netlify used to run this for us as Git Gateway. Git Gateway is deprecated, so
 * we run the exchange ourselves. This is the whole of it.
 *
 * Two routes, and that is the entire contract Decap expects:
 *
 *   GET /auth      Decap opens this in a popup. We redirect to GitHub.
 *   GET /callback  GitHub sends the visitor back here with a code. We swap the
 *                  code for a token and hand it to the CMS window by postMessage.
 *
 * Deploy: see docs/cms-auth-setup.md. Needs three values, none of which are in
 * this repository:
 *   GITHUB_CLIENT_ID      plain var, safe to be public
 *   GITHUB_CLIENT_SECRET  secret, set with `wrangler secret put`, never committed
 *   ALLOWED_ORIGINS       comma-separated list of sites allowed to receive a token
 */

const PROVIDER = "github";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") return startLogin(url, env);
    if (url.pathname === "/callback") return finishLogin(url, request, env);
    if (url.pathname === "/") return new Response("Natural Trace CMS auth. Nothing to see here.", { status: 200 });
    return new Response("Not found", { status: 404 });
  },
};

/* Step 1. Send the editor to GitHub to approve access. */
function startLogin(url, env) {
  // state is a one-time value we hand to GitHub and check on the way back. It is
  // what stops someone else's callback being replayed against our handler.
  const state = crypto.randomUUID();

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  // The scope is fixed here, not taken from the query string. It used to be
  // whatever the popup URL asked for, defaulting to "repo,user", so a crafted
  // link could ask GitHub for more than the CMS needs. Decap's GitHub backend
  // needs repo and nothing else. 13 Oct 2026.
  authorize.searchParams.set("scope", "repo");
  authorize.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      // HttpOnly so page scripts cannot read it, SameSite=Lax so it survives the
      // redirect back from github.com. Ten minutes is plenty to click Authorize.
      "Set-Cookie": `nt_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    },
  });
}

/* Step 2. GitHub sends the editor back with a code. Swap it for a token. */
async function finishLogin(url, request, env) {
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const cookie = (request.headers.get("Cookie") || "")
    .split(";").map(s => s.trim())
    .find(s => s.startsWith("nt_oauth_state="));
  const stored = cookie ? cookie.slice("nt_oauth_state=".length) : null;

  if (!code) return fail("GitHub did not send a code back.", env);
  if (!stored || stored !== returnedState) {
    return fail("Login state did not match. Start again from the admin page.", env);
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!data.access_token) {
    return fail(data.error_description || "GitHub refused to issue a token.", env);
  }

  return handToCms("success", { token: data.access_token, provider: PROVIDER }, env);
}

function fail(message, env) {
  return handToCms("error", { message }, env);
}

/*
 * Hand the result to the CMS window.
 *
 * Decap listens for a message, replies, and we then post the token back to the
 * origin it replied from. We only answer origins on the allow list, so this
 * cannot be used as an open token dispenser for someone else's site.
 */
function handToCms(status, payload, env) {
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",").map(s => s.trim()).filter(Boolean);

  // Fail closed. An empty ALLOWED_ORIGINS used to mean "answer anyone", which
  // turns this into a token dispenser for any site that opens the popup. With
  // no allow list there is now nobody to hand a token to. 13 Oct 2026.
  if (!allowed.length) {
    return new Response("CMS sign-in is not configured: ALLOWED_ORIGINS is empty.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  // Both values are written into an inline script. JSON.stringify does not
  // escape "<", so a payload containing "</script>" (an error description, in
  // practice) could close the tag early. The six characters \u003c are not
  // markup, and the script still reads them as "<".
  const js = v => JSON.stringify(v).replace(/</g, "\\u003c");

  const body = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Signing you in</title></head>
<body style="font-family:system-ui,sans-serif;padding:2rem;color:#2C3345">
<p>Signing you in, this window closes itself.</p>
<script>
(function () {
  var allowed = ${js(allowed)};
  var message = 'authorization:${PROVIDER}:${status}:' + ${js(JSON.stringify(payload))};
  function reply(e) {
    if (allowed.indexOf(e.origin) === -1) return;
    window.opener.postMessage(message, e.origin);
    window.removeEventListener('message', reply, false);
  }
  window.addEventListener('message', reply, false);
  window.opener.postMessage('authorizing:${PROVIDER}', '*');
})();
</script>
</body></html>`;

  return new Response(body, {
    status: status === "success" ? 200 : 400,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // The token is in this document. It must never be cached anywhere.
      "Cache-Control": "no-store",
      "Set-Cookie": "nt_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    },
  });
}
