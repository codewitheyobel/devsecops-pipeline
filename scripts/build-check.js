'use strict';

// This API is plain JavaScript, so there is no compile/bundle step.
// Instead, "build" is a smoke check: load the whole application, start it on a
// random free port, and confirm it actually answers /health. If any module
// fails to load or the server cannot start, this exits non-zero and fails CI.

const http = require('node:http');
const { createApp } = require('../src/app');

const server = createApp().listen(0, () => {
  const { port } = server.address();
  http
    .get({ host: '127.0.0.1', port, path: '/health' }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        server.close();
        if (res.statusCode === 200 && JSON.parse(body).status === 'ok') {
          console.log(`Build check passed: app started and /health returned ${body}`);
          process.exit(0);
        }
        console.error(`Build check FAILED: status ${res.statusCode}, body ${body}`);
        process.exit(1);
      });
    })
    .on('error', (err) => {
      console.error('Build check FAILED:', err.message);
      process.exit(1);
    });
});
