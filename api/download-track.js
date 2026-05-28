const trackUrl =
  "https://github.com/OGs-tradeathem/Men-of-Stone/releases/download/forever-unforgettable-track/WoBBoB.-.Forever.Unforgettable.mp3";

module.exports = function handler(request, response) {
  const forwardedFor = request.headers["x-forwarded-for"] || "";
  const firstIp = String(forwardedFor).split(",")[0].trim();
  const event = {
    event: "track_download",
    track: "WoBBoB - Forever Unforgettable",
    timestamp: new Date().toISOString(),
    ip: firstIp || request.socket?.remoteAddress || "",
    userAgent: request.headers["user-agent"] || "",
    referer: request.headers.referer || "",
  };

  console.log(JSON.stringify(event));
  response.setHeader("Cache-Control", "no-store");
  response.writeHead(302, { Location: trackUrl });
  response.end();
};
