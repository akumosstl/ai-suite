const fs = require('fs');
const path = require('path');

const userHome = process.env.HOME || process.env.USERPROFILE;
const configPath = path.join(userHome, '.agentic', 'agentic.json');
const proxyPath = path.join(__dirname, 'proxy.conf.json');

let port = 1488;

if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    port = config.port || port;
    console.log(`📌 Using port from ${configPath}: ${port}`);
  } catch (e) {
    console.warn('Could not parse agentic.json, using default port:', port);
  }
} else {
  console.warn(`⚠️ agentic.json not found at ${configPath}, using default port: ${port}`);
}

const proxyConfig = {
  "/api": {
    "target": `http://localhost:${port}`,
    "secure": false,
    "changeOrigin": true
  }
};

fs.writeFileSync(proxyPath, JSON.stringify(proxyConfig, null, 2));
console.log(`✅ proxy.conf.json updated to use http://localhost:${port}`);