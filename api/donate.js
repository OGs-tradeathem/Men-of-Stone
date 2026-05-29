const fundraiserUrl =
  "https://www.gofundme.com/f/donate-in-memory-of-phil-stone?attribution_id=sl%3Aa049a459-4be5-4363-b083-1979c5566c78&lang=en_GB&ts=1779604869&utm_campaign=fp_sharesheet&utm_content=amp20_t1&utm_medium=customer&utm_source=copy_link&fbclid=IwY2xjawSGNVlleHRuA2FlbQIxMABicmlkETFHNENMYVVsUGZ2TFZFamdCc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHgAHdok4IPNnlNmOjFonKvXZIJkLftoFTp6uajleuK8gK97kVjBeihvaqwOD_aem_qHyDX9gk7Ny4wmt8KqzgOQ&utm_id=97757_v0_s00_e227_tv0";

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
