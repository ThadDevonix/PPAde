// Lightweight static server to host the plan picker page.
// Run with `npm start` then open http://localhost:3000

import { createServer } from "http";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "home");

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
    const relPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const safePath = path.normalize(relPath).replace(/^(\.\.[\\/])+/, "");
    const filePath = path.join(publicDir, safePath);
    const data = await readFile(filePath);

    res.writeHead(200, { "Content-Type": mime(filePath) });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("ไม่พบไฟล์ที่ร้องขอ");
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Plan picker พร้อมใช้งานที่ http://localhost:${port}`);
});
