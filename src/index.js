import express from 'express';
import request from 'request-promise';
import lodash from 'lodash';
import config from './config.js';
const { merge } = lodash;

const app = express();
const PORT = process.env.PORT || 10000;

// DEBUG token check
if (!process.env.COC_API_TOKEN) {
  console.error('❌ ERROR: COC_API_TOKEN is missing in environment variables!');
} else {
  console.log('✅ COC_API_TOKEN is loaded!');
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
}

class ClashApi {
  constructor({ uri, token, request: req } = {}) {
    this.token = token || process.env.COC_API_TOKEN;
    this.uri = uri || config.uri;
    this._requestDefaults = req || {};
    if (!this.token) {
      throw new Error('Must define a token option or COC_API_TOKEN env variable');
    }
  }

  requestOptions(opts) {
    return merge({
      headers: {
        Accept: 'application/json',
        authorization: `Bearer ${this.token}`
      },
      json: true
    }, opts, this._requestDefaults);
  }

  // Player
  playerByTag(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/players/${encodeURIComponent(tag)}`
    }));
  }

  // Clan
  clanByTag(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/clans/${encodeURIComponent(tag)}`
    }));
  }
}

// Routes
app.get('/', (req, res) => {
  res.send('COC Proxy is running! Use /player/:tag, /clan/:tag, /v1/... or /checkip');
});

// Check IP (simple)
app.get('/checkip', (req, res) => {
  res.json({ ip: getClientIp(req) });
});

// Check IP (full debug)
app.get('/checkip/full', (req, res) => {
  res.json({
    ip: getClientIp(req),
    method: req.method,
    headers: req.headers,
    connection: {
      remoteAddress: req.connection.remoteAddress,
      remotePort: req.connection.remotePort
    }
  });
});

// Player route
app.get('/player/:tag', async (req, res) => {
  try {
    const client = new ClashApi();
    const data = await client.playerByTag(req.params.tag);
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.error || null
    });
  }
});

// Clan route
app.get('/clan/:tag', async (req, res) => {
  try {
    const client = new ClashApi();
    const data = await client.clanByTag(req.params.tag);
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.error || null
    });
  }
});

// Universal route: supports everything in Clash API
app.get('/v1/*', async (req, res) => {
  try {
    const url = `${config.uri}/v1/${req.params[0]}`;
    const data = await request({
      uri: url,
      headers: { Authorization: `Bearer ${process.env.COC_API_TOKEN}` },
      json: true
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.error || null
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Proxy running on ${PORT}`);
});
