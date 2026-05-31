const repo = process.env.GITHUB_WALL_REPO || "OGs-tradeathem/Men-of-Stone";
const issueNumber = process.env.GITHUB_WALL_ISSUE || "1";
const githubToken = (process.env.GITHUB_TOKEN || "").trim();

const allowedFonts = new Map([
  ["strong", "Strong"],
  ["classic", "Classic"],
  ["handwritten", "Handwritten"],
  ["quiet", "Quiet"],
]);

module.exports = async function handler(request, response) {
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "GET") {
    const messages = await getMessages();
    response.end(JSON.stringify({ ok: true, messages }));
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    response.statusCode = 405;
    response.end(JSON.stringify({ ok: false, error: "Method Not Allowed" }));
    return;
  }

  if (!githubToken) {
    response.statusCode = 503;
    response.end(JSON.stringify({ ok: false, error: "Memorial wall storage is not configured yet." }));
    return;
  }

  const params = await parseBody(request);
  if (String(params.get("_honey") || "").trim()) {
    response.end(JSON.stringify({ ok: true, message: null }));
    return;
  }

  const message = {
    id: cryptoRandomId(),
    name: cleanText(params.get("name"), 60),
    comment: cleanText(params.get("comment"), 800),
    font: allowedFonts.has(params.get("font")) ? params.get("font") : "strong",
    submittedAt: new Date().toISOString(),
  };

  if (!message.name || !message.comment) {
    response.statusCode = 400;
    response.end(JSON.stringify({ ok: false, error: "Please add your name and message." }));
    return;
  }

  await postMessage(message);
  response.end(JSON.stringify({ ok: true, message }));
};

async function getMessages() {
  const comments = await githubRequest(`/repos/${repo}/issues/${issueNumber}/comments?per_page=100`);
  return comments
    .map((comment) => parseWallComment(comment.body, comment.id))
    .filter(Boolean)
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
}

async function postMessage(message) {
  const label = allowedFonts.get(message.font) || "Strong";
  const body = [
    "<!-- memorial-wall:v1",
    JSON.stringify(message),
    "-->",
    `**${message.name}**`,
    "",
    message.comment,
    "",
    `_Font: ${label}. Submitted: ${message.submittedAt}_`,
  ].join("\n");

  await githubRequest(`/repos/${repo}/issues/${issueNumber}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

async function githubRequest(path, options = {}) {
  if (!githubToken) {
    return [];
  }

  const result = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
      "User-Agent": "men-of-stone-memorial-wall",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });

  if (!result.ok) {
    const errorText = await result.text();
    throw new Error(`GitHub API failed: ${result.status} ${errorText}`);
  }

  return result.status === 204 ? null : result.json();
}

async function parseBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const bodyText = Buffer.concat(chunks).toString("utf8");
  const contentType = request.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    const json = JSON.parse(bodyText || "{}");
    const params = new URLSearchParams();
    Object.entries(json).forEach(([key, value]) => params.set(key, String(value ?? "")));
    return params;
  }

  return new URLSearchParams(bodyText);
}

function parseWallComment(body, fallbackId) {
  const match = String(body || "").match(/<!-- memorial-wall:v1\s*([\s\S]*?)\s*-->/);
  if (!match) {
    return null;
  }

  try {
    const parsed = JSON.parse(match[1]);
    return {
      id: String(parsed.id || fallbackId),
      name: cleanText(parsed.name, 60),
      comment: cleanText(parsed.comment, 800),
      font: allowedFonts.has(parsed.font) ? parsed.font : "strong",
      submittedAt: parsed.submittedAt || new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

function cryptoRandomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
