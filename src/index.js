import express from 'express';
import request from 'request-promise';
import lodash from 'lodash';
import config from './config.js';
const { merge } = lodash;

const app = express();
const PORT = process.env.PORT || 10000;

const env = process.env;

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.substr(1);
}

class ClashApi {
  constructor({ uri, token, request: req } = {}) {
    this.token = token || env.COC_API_TOKEN;
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

// ✅ Routes
app.get('/', (req, res) => {
  res.send('COC Proxy is running! Use /player/:tag or /checkip');
});

app.get('/checkip', (req, res) => {
  res.json({ ip: req.ip });
});

app.get('/player/:tag', async (req, res) => {
  try {
    const client = new ClashApi();
    const data = await client.playerByTag(req.params.tag);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Proxy running on ${PORT}`);
});
