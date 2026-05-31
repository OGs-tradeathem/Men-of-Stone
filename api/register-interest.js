const nodemailer = require("nodemailer");

const mailTo = process.env.MAIL_TO || "men.of.stoneuk@gmail.com";
const smtpUser = process.env.SMTP_USER || "men.of.stoneuk@gmail.com";
const smtpPass = process.env.SMTP_PASS;

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
  const params = parseSubmissionBody(bodyText, request.headers["content-type"] || "");
  const forwardedFor = request.headers["x-forwarded-for"] || "";
  const firstIp = String(forwardedFor).split(",")[0].trim();
  const submission = {
    event: "interest_submission",
    timestamp: new Date().toISOString(),
    name: String(params.get("name") || "").trim(),
    email: String(params.get("email") || "").trim(),
    mobile: String(params.get("mobile") || "").trim(),
    contact: String(params.get("contact") || "").trim(),
    meetType: String(params.get("meetType") || "").trim(),
    message: String(params.get("message") || "").trim(),
    ip: firstIp || request.socket?.remoteAddress || "",
    userAgent: request.headers["user-agent"] || "",
    referer: request.headers.referer || "",
  };

  console.log(JSON.stringify(submission));

  if (!smtpPass) {
    console.error("SMTP_PASS is not configured; submission was logged only.");
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Cache-Control", "no-store");
    response.end(JSON.stringify({ ok: true, emailed: false }));
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: `"Men of Stone" <${smtpUser}>`,
    to: mailTo,
    replyTo: submission.email || smtpUser,
    subject: `New Men of Stone interest${submission.name ? ` - ${submission.name}` : ""}`,
    text: [
      "New Men of Stone interest",
      "",
      `Name: ${submission.name}`,
      `Email address: ${submission.email || submission.contact}`,
      `Mobile number: ${submission.mobile}`,
      `Preferred way to join: ${submission.meetType}`,
      `Submitted: ${submission.timestamp}`,
      "",
      "Message:",
      submission.message || "(No message provided)",
    ].join("\n"),
    html: `
      <h2>New Men of Stone interest</h2>
      <table cellpadding="8" cellspacing="0" border="0">
        <tr><td><strong>Name</strong></td><td>${escapeHtml(submission.name)}</td></tr>
        <tr><td><strong>Email address</strong></td><td>${escapeHtml(submission.email || submission.contact)}</td></tr>
        <tr><td><strong>Mobile number</strong></td><td>${escapeHtml(submission.mobile)}</td></tr>
        <tr><td><strong>Preferred way to join</strong></td><td>${escapeHtml(submission.meetType)}</td></tr>
        <tr><td><strong>Submitted</strong></td><td>${escapeHtml(submission.timestamp)}</td></tr>
      </table>
      <p><strong>Message</strong></p>
      <p>${escapeHtml(submission.message || "(No message provided)").replace(/\n/g, "<br>")}</p>
    `,
  });

  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify({ ok: true, emailed: true }));
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseSubmissionBody(bodyText, contentType) {
  if (!contentType.includes("multipart/form-data")) {
    return new URLSearchParams(bodyText);
  }

  const params = new URLSearchParams();
  const namePattern = /name="([^"]+)"\r?\n\r?\n([\s\S]*?)(?=\r?\n--)/g;
  let match;

  while ((match = namePattern.exec(bodyText)) !== null) {
    params.set(match[1], match[2].trim());
  }

  return params;
}
