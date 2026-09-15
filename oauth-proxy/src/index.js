/**
 * Minimal GitHub OAuth proxy for Decap CMS, running on Cloudflare Workers.
 *
 * Flow:
 *   1. Decap CMS opens a popup at  GET /auth
 *   2. We redirect the popup to GitHub's authorize screen
 *   3. GitHub redirects back to  GET /callback?code=...&state=...
 *   4. We exchange the code for an access token (server-side, using the
 *      client secret, which must never be exposed to the browser)
 *   5. We reply with a tiny HTML page that posts the token back to the
 *      window that opened the popup (Decap CMS listens for this message)
 */

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

function randomState() {
  return crypto.randomUUID();
}

function htmlResponse(body) {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function handleAuth(request, env) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") || "repo,user";
  const state = randomState();

  const redirectUri = `${url.origin}/callback`;
  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);

  const response = Response.redirect(authorizeUrl.toString(), 302);
  const headers = new Headers(response.headers);
  // Stash state in a short-lived cookie so /callback can check it (basic CSRF guard).
  headers.append(
    "Set-Cookie",
    `oauth_state=${state}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`
  );
  return new Response(null, { status: 302, headers });
}

function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

async function handleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = getCookie(request, "oauth_state");

  if (!code) {
    return htmlResponse(renderResult("error", "Missing code from GitHub."));
  }
  if (!state || !expectedState || state !== expectedState) {
    return htmlResponse(renderResult("error", "State mismatch — possible CSRF, please retry."));
  }

  const tokenRes = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/callback`,
    }),
  });

  const tokenJson = await tokenRes.json();

  if (tokenJson.error || !tokenJson.access_token) {
    return htmlResponse(
      renderResult("error", tokenJson.error_description || "Token exchange failed.")
    );
  }

  return htmlResponse(renderResult("success", { token: tokenJson.access_token, provider: "github" }));
}

function renderResult(status, payload) {
  // Decap CMS listens for a window.postMessage in this exact "authorization:github:..." format.
  const message =
    status === "success"
      ? `authorization:github:success:${JSON.stringify(payload)}`
      : `authorization:github:error:${JSON.stringify({ message: payload })}`;

  return `<!DOCTYPE html>
<html>
<body>
<script>
  (function () {
    function receiveMessage(e) {
      window.opener.postMessage(${JSON.stringify(message)}, e.origin);
      window.removeEventListener("message", receiveMessage, false);
    }
    window.addEventListener("message", receiveMessage, false);
    window.opener.postMessage("authorizing:github", "*");
  })();
</script>
<p>${status === "success" ? "Login successful — you can close this window." : "Login failed: " + payload}</p>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      return handleAuth(request, env);
    }
    if (url.pathname === "/callback") {
      return handleCallback(request, env);
    }
    return new Response("HS Portfolio OAuth proxy is running.", { status: 200 });
  },
};
