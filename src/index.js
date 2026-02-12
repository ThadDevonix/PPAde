// Lightweight static server to host the plan picker page.
// Run with `npm start` then open http://localhost:3000

import { createServer } from "http";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "home");
const upstreamEnergyApi = "https://solarmdb.devonix.co.th/api/energy";
const upstreamSitesApi = "https://solarmdb.devonix.co.th/api/sites";
const upstreamDevicesApi = "https://solarmdb.devonix.co.th/api/devices";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const mime = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    default:
      return "text/plain; charset=utf-8";
  }
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const isApiPath =
      url.pathname === "/api/energy" ||
      url.pathname === "/api/sites" ||
      url.pathname.startsWith("/api/sites/") ||
      url.pathname === "/api/devices" ||
      url.pathname.startsWith("/api/devices/");
    if (req.method === "OPTIONS" && isApiPath) {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    if (url.pathname === "/api/energy") {
      const upstreamUrl = `${upstreamEnergyApi}${url.search}`;
      const upstreamRes = await fetch(upstreamUrl, { method: "GET" });
      const body = await upstreamRes.text();
      res.writeHead(upstreamRes.status, {
        ...corsHeaders,
        "Content-Type":
          upstreamRes.headers.get("content-type") || "application/json; charset=utf-8"
      });
      res.end(body);
      return;
    }

    if (url.pathname === "/api/sites" || url.pathname.startsWith("/api/sites/")) {
      const suffix = url.pathname.slice("/api/sites".length);
      const upstreamUrl = `${upstreamSitesApi}${suffix}${url.search}`;
      const method = req.method || "GET";
      const bodyChunks = [];
      if (method !== "GET" && method !== "HEAD") {
        for await (const chunk of req) bodyChunks.push(chunk);
      }
      const upstreamRes = await fetch(upstreamUrl, {
        method,
        headers: {
          Accept: req.headers.accept || "application/json",
          "Content-Type": req.headers["content-type"] || "application/json"
        },
        body:
          method === "GET" || method === "HEAD"
            ? undefined
            : Buffer.concat(bodyChunks)
      });
      const body = await upstreamRes.text();
      res.writeHead(upstreamRes.status, {
        ...corsHeaders,
        "Content-Type":
          upstreamRes.headers.get("content-type") || "application/json; charset=utf-8"
      });
      res.end(body);
      return;
    }

    if (url.pathname === "/api/devices" || url.pathname.startsWith("/api/devices/")) {
      const suffix = url.pathname.slice("/api/devices".length);
      const upstreamUrl = `${upstreamDevicesApi}${suffix}${url.search}`;
      const method = req.method || "GET";
      const bodyChunks = [];
      if (method !== "GET" && method !== "HEAD") {
        for await (const chunk of req) bodyChunks.push(chunk);
      }
      const upstreamRes = await fetch(upstreamUrl, {
        method,
        headers: {
          Accept: req.headers.accept || "application/json",
          "Content-Type": req.headers["content-type"] || "application/json"
        },
        body:
          method === "GET" || method === "HEAD"
            ? undefined
            : Buffer.concat(bodyChunks)
      });
      const body = await upstreamRes.text();
      res.writeHead(upstreamRes.status, {
        ...corsHeaders,
        "Content-Type":
          upstreamRes.headers.get("content-type") || "application/json; charset=utf-8"
      });
      res.end(body);
      return;
    }

    const relPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const safePath = path.normalize(relPath).replace(/^(\.\.[\\/])+/, "");
    const filePath = path.join(publicDir, safePath);
    const data = await readFile(filePath);

    res.writeHead(200, { "Content-Type": mime(filePath) });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("ไม่พบไฟล์ที่ร้องขอ");
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Plan picker พร้อมใช้งานที่ http://localhost:${port}`);
});
