// cPanel Passenger entry point for Next.js. Keep this file at the app root.
process.env.NODE_ENV = "production";
// Passenger may launch from another directory; keep SQLite/media paths stable.
process.chdir(__dirname);
const http = require("node:http");
const next = require("next");

const app = next({ dev: false, dir: __dirname });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => handler(req, res));
  const rawPort = process.env.PORT || "3000";
  const port = /^\d+$/.test(rawPort) ? Number(rawPort) : rawPort;
  server.listen(port, () => console.log(`Reign in Wealth ready on ${port}`));
}).catch((error) => {
  console.error("Unable to start Next.js", error);
  process.exit(1);
});
