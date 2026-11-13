'use strict';

const { Pool } = require('pg');

// The connection string is NEVER written in the code.
// - Local development: DATABASE_URL comes from a git-ignored .env file / shell.
// - GitHub Actions:   DATABASE_URL comes from an Actions secret
//                     (secrets.DATABASE_URL), scoped to an environment.
// The pool does not connect until the first query, so the app (and the tests)
// can start without a database.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function isConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

module.exports = { pool, isConfigured };
