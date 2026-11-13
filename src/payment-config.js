'use strict';

// The key is read from the environment at runtime and is never committed.
// Local dev: put PAYMENT_API_KEY in your git-ignored .env file.
// CI/CD:     store it as a GitHub Actions secret and map it in the workflow:
//              env:
//                PAYMENT_API_KEY: ${{ secrets.PAYMENT_API_KEY }}
const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY;

module.exports = { PAYMENT_API_KEY };
