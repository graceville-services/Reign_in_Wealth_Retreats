// cPanel Passenger entry point for Next.js. Keep this file at the app root.
const http = require("node:http");
const next = require("next");

const app = next({ dev: false, dir: __dirname });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => handler(req, res));
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Reign in Wealth ready on ${port}`));
}).catch((error) => {
  console.error("Unable to start Next.js", error);
  process.exit(1);
});
