const fundraiserUrl =
  "https://www.gofundme.com/f/a-farewell-for-phil-stone?attribution_id=sl:31c75a13-1790-4652-a3f5-86b54fec34ea&lang=en_GB&ts=1779568085&utm_campaign=pd_ss_icons&utm_content=amp20_control&utm_medium=customer&utm_source=facebook";

module.exports = function handler(request, response) {
  const forwardedFor = request.headers["x-forwarded-for"] || "";
  const firstIp = String(forwardedFor).split(",")[0].trim();
  const event = {
    event: "fundraiser_click",
    fundraiser: "A farewell for Phil Stone",
    timestamp: new Date().toISOString(),
    ip: firstIp || request.socket?.remoteAddress || "",
    userAgent: request.headers["user-agent"] || "",
    referer: request.headers.referer || "",
  };

  console.log(JSON.stringify(event));
  response.setHeader("Cache-Control", "no-store");
  response.writeHead(302, { Location: fundraiserUrl });
  response.end();
};
