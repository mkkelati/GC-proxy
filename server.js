const express = require("express");
const httpProxy = require("http-proxy");

const app = express();
const proxy = httpProxy.createProxyServer({ 
  changeOrigin: true,
  secure: false  // Accept self-signed certificates
});

// VPS or backend with SSL WebSocket/SSH support
const TARGET = "https://172.236.172.178:443";

// Only handle /app130 path and strip it before forwarding
app.all("/app130", (req, res) => {
  console.log("Incoming request to /app130");
  // Rewrite the path: remove /app130 prefix, forward to root
  req.url = req.url.replace(/^\/app130/, '') || '/';
  proxy.web(req, res, { target: TARGET, ws: true }, (err) => {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy error: " + err.message);
  });
});

// Reject all other routes
app.use((req, res) => {
  res.status(404).send("Invalid path");
});

proxy.on("error", (err, req, res) => {
  if (!res.headersSent) {
    res.writeHead(500, { "Content-Type": "text/plain" });
  }
  res.end("Proxy failed: " + err.message);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Proxy for /app130 running on port " + PORT);
});
