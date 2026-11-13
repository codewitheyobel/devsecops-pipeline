'use strict';

const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const db = require('../src/db');
const { createApp } = require('../src/app');

// Replace the real database with a fake that records the queries it receives.
// No real DATABASE_URL is ever needed to run the tests.
let calls;
beforeEach(() => {
  calls = [];
  process.env.DATABASE_URL = 'postgres://fake-user:fake-password@localhost:5432/fake'; // invented test value
  mock.method(db.pool, 'query', async (text, params) => {
    calls.push({ text, params });
    return { rows: [{ id: 1, name: 'alice', email: 'alice@example.com' }] };
  });
});
afterEach(() => {
  mock.restoreAll();
  delete process.env.DATABASE_URL;
});

test('GET /health returns ok', async () => {
  const res = await request(createApp()).get('/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('GET /api/items returns the item list', async () => {
  const res = await request(createApp()).get('/api/items');
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 2);
});

test('GET /api/items/:id returns 404 for a missing item', async () => {
  const res = await request(createApp()).get('/api/items/999');
  assert.equal(res.status, 404);
});

test('POST /api/items creates an item', async () => {
  const res = await request(createApp())
    .post('/api/items')
    .send({ name: 'Stapler', price: 7 });
  assert.equal(res.status, 201);
  assert.equal(res.body.name, 'Stapler');
});

test('POST /api/items rejects invalid input', async () => {
  const res = await request(createApp())
    .post('/api/items')
    .send({ name: '', price: -1 });
  assert.equal(res.status, 400);
});

test('GET /api/users/search sends user input as a parameter, never inside the SQL', async () => {
  const evil = "alice' OR '1'='1";
  const res = await request(createApp()).get('/api/users/search').query({ name: evil });
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.ok(!calls[0].text.includes(evil), 'user input must not be inside the SQL text');
  assert.deepEqual(calls[0].params, [evil]);
});
