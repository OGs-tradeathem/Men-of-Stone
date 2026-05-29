module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.statusCode = 405;
    response.end("Method Not Allowed");
    return;
  }

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const bodyText = Buffer.concat(chunks).toString("utf8");
  const params = new URLSearchParams(bodyText);
  const forwardedFor = request.headers["x-forwarded-for"] || "";
  const firstIp = String(forwardedFor).split(",")[0].trim();
  const submission = {
    event: "interest_submission",
    timestamp: new Date().toISOString(),
    name: String(params.get("name") || "").trim(),
    contact: String(params.get("contact") || "").trim(),
    meetType: String(params.get("meetType") || "").trim(),
    message: String(params.get("message") || "").trim(),
    ip: firstIp || request.socket?.remoteAddress || "",
    userAgent: request.headers["user-agent"] || "",
    referer: request.headers.referer || "",
  };

  console.log(JSON.stringify(submission));

  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify({ ok: true }));
};
