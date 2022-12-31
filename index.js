const app = require("./app");
const reload = require("reload");
const http = require("http");
const process = require("process");

if (process.env.NODE_ENV === "development") {
  const server = http.createServer(app);
  server.listen(3000, () => {
    console.log("Server listening on port 3000");
  });
  reload(app);
} else {
  app.listen(3000, () => {
    console.log("Server listening on port 3000");
  });
}