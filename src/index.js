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

  playerByTag(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/players/${encodeURIComponent(tag)}`
    }));
  }
}

// Routes
app.get('/', (req, res) => {
  res.send('COC Proxy is running! Use /player/:tag or /checkip');
});

app.get('/checkip', (req, res) => {
  res.json({ ip: getClientIp(req) });
});

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Proxy running on ${PORT}`);
});
