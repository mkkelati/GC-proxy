const express = require("express");
const httpProxy = require("http-proxy");

const app = express();
const proxy = httpProxy.createProxyServer({ 
  changeOrigin: true,
  secure: false  // Accept self-signed certificates
});

// VPS or backend with SSL WebSocket/SSH support
const TARGET = "wss://172.236.172.178:443";

// Only handle /app130 path and forward to /ss-ws
app.all("/app130", (req, res) => {
  console.log("Incoming request to /app130");
  // Rewrite the path: /app130 -> /ss-ws for Shadowsocks WebSocket
  req.url = req.url.replace(/^\/app130/, '/ss-ws');
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
const server = app.listen(PORT, () => {
  console.log("Proxy for /app130 running on port " + PORT);
});

// Handle WebSocket upgrade requests
server.on("upgrade", (req, socket, head) => {
  console.log("WebSocket upgrade request to:", req.url);
  console.log("Original headers:", req.headers);
  
  if (req.url.startsWith("/app130")) {
    // Rewrite the URL: /app130 -> /ss-ws for Shadowsocks WebSocket
    req.url = req.url.replace(/^\/app130/, '/ss-ws');
    console.log("Proxying to VPS:", TARGET + req.url);
    
    proxy.ws(req, socket, head, { 
      target: TARGET,
      secure: false,  // Accept self-signed certs
      changeOrigin: true,
      ws: true
    }, (err) => {
      console.error("WebSocket proxy error:", err);
      socket.destroy();
    });
  } else {
    console.log("Rejected non-/app130 request");
    socket.destroy();
  }
});
