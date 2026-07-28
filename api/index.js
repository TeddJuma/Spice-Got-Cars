import server from '../dist/server/server.js';

export default {
  async fetch(req, env, ctx) {
    return server.fetch(req, env, ctx);
  },
};
