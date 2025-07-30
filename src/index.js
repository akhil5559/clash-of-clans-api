import request from 'request-promise';
import config from './config.js';   // ✅ Now points to config in the same folder
import { merge } from 'lodash';

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

  clanByTag(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/clans/${encodeURIComponent(tag)}`,
    }));
  }

  clanMembersByTag(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/clans/${encodeURIComponent(tag)}/members`,
    }));
  }

  clanWarlogByTag(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/clans/${encodeURIComponent(tag)}/warlog`,
    }));
  }

  clanCurrentWarByTag(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/clans/${encodeURIComponent(tag)}/currentwar`,
    }));
  }

  clanLeague(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/clans/${encodeURIComponent(tag)}/currentwar/leaguegroup`,
    }));
  }

  clanLeagueWars(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/clanwarleagues/wars/${encodeURIComponent(tag)}`,
    }));
  }

  clans() {
    var qs = {};

    const dsl = [
      'name', 'warFrequency', 'locationId', 'minMembers', 'maxMembers',
      'minClanPoints', 'minClanLevel', 'limit', 'after', 'before'
    ].reduce((builder, field) => {
      builder[`with${capitalizeFirstLetter(field)}`] = (input) => {
        qs[field] = input;
        return builder;
      };
      return builder;
    }, {
      fetch: function () {
        return request(this.requestOptions({
          qs: qs,
          uri: `${this.uri}/clans`,
        }));
      }.bind(this)
    });

    return dsl;
  }

  locations() {
    const dsl = {
      fetch: function () {
        return request(this.requestOptions({
          uri: `${this.uri}/locations`,
        }));
      }.bind(this),
      withId: function (locId) {
        let rankId;

        const rankingDslMembers = {
          byClan: function () {
            rankId = 'clans';
            return rankingDsl;
          },
          byPlayer: function () {
            rankId = 'players';
            return rankingDsl;
          }
        };

        const rankingDsl = Object.assign({
          fetch: function () {
            return request(this.requestOptions({
              uri: `${this.uri}/locations/${encodeURIComponent(locId)}/rankings/${rankId}`,
            }));
          }.bind(this)
        }, rankingDslMembers);

        const locDsl = Object.assign({
          fetch: function () {
            return request(this.requestOptions({
              uri: `${this.uri}/locations/${encodeURIComponent(locId)}`,
            }));
          }
        }, rankingDslMembers);

        return locDsl;
      }.bind(this)
    };
    return dsl;
  }

  leagues() {
    return request(this.requestOptions({
      uri: `${this.uri}/leagues`,
    }));
  }

  playerByTag(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/players/${encodeURIComponent(tag)}`,
    }));
  }
}

const factory = function (config) {
  return new ClashApi(config);
};

factory.ClashApi = ClashApi;

export default factory;
