'use strict';

const express = require('express');
const { rateLimit } = require('express-rate-limit');
const db = require('./db');

function createApp() {
  const app = express();
  app.use(express.json({ limit: '10kb' }));

  // Basic abuse protection: at most 100 requests per minute per client IP.
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 100 }));

  // In-memory store for the "items" endpoints (keeps the demo self-contained).
  const items = [
    { id: 1, name: 'Notebook', price: 3.5 },
    { id: 2, name: 'Pen', price: 1.2 },
  ];
  let nextId = 3;

  // Health check: used by the build/smoke check and by load balancers.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // List all items.
  app.get('/api/items', (req, res) => {
    res.json(items);
  });

  // Get one item by id.
  app.get('/api/items/:id', (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const item = items.find((i) => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    return res.json(item);
  });

  // Create an item, with basic input validation.
  app.post('/api/items', (req, res) => {
    const { name, price } = req.body || {};
    if (typeof name !== 'string' || name.trim() === '' || name.length > 100) {
      return res.status(400).json({ error: 'name must be a non-empty string (max 100 chars)' });
    }
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      return res.status(400).json({ error: 'price must be a non-negative number' });
    }
    const item = { id: nextId++, name: name.trim(), price };
    items.push(item);
    return res.status(201).json(item);
  });

  // Search users in PostgreSQL by name.
  app.get('/api/users/search', async (req, res) => {
    const name = req.query.name;
    if (typeof name !== 'string' || name.length === 0) {
      return res.status(400).json({ error: 'name query parameter is required' });
    }
    if (!db.isConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    try {
      // Parameterized query: the input is sent separately from the SQL text,
      // so it can never change the structure of the query.
      const result = await db.pool.query(
        'SELECT id, name, email FROM users WHERE name = $1',
        [name],
      );
      return res.json(result.rows);
    } catch {
      return res.status(500).json({ error: 'Database error' });
    }
  });

  // Look up a user by e-mail address.
  app.get('/api/users/by-email', async (req, res) => {
    const email = req.query.email;
    if (typeof email !== 'string' || email.length === 0) {
      return res.status(400).json({ error: 'email query parameter is required' });
    }
    if (!db.isConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    try {
      // INSECURE: user input is glued straight into the SQL text.
      const result = await db.pool.query(
        "SELECT id, name, email FROM users WHERE email = '" + email + "'",
      );
      return res.json(result.rows);
    } catch {
      return res.status(500).json({ error: 'Database error' });
    }
  });
  return app;
}

module.exports = { createApp };
