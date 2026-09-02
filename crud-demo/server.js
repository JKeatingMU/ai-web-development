import 'dotenv/config';
import express from 'express';
import { query } from './db.js';
import authRouter from './auth.js';
import { authenticate } from './middleware/authenticate.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use('/auth', authRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ── List all books (optional ?status= filter) ─────────────────────────────────
app.get('/api/books', authenticate, async (req, res) => {
  const { status } = req.query;
  const result = status
    ? await query(
        'SELECT * FROM books WHERE status = $1 ORDER BY created_at DESC',
        [status]
      )
    : await query('SELECT * FROM books ORDER BY created_at DESC');
  res.json(result.rows);
});

// ── Get one book by id ────────────────────────────────────────────────────────
app.get('/api/books/:id', authenticate, async (req, res) => {
  const result = await query('SELECT * FROM books WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// ── Create a book ─────────────────────────────────────────────────────────────
app.post('/api/books', authenticate, async (req, res) => {
  const { title, author, genre, status, notes } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: 'title and author are required' });
  }
  const result = await query(
    `INSERT INTO books (title, author, genre, status, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, author, genre ?? null, status ?? 'want-to-read', notes ?? null]
  );
  res.status(201).json(result.rows[0]);
});

// ── Update a book (partial update) ───────────────────────────────────────────
app.patch('/api/books/:id', authenticate, async (req, res) => {
  const { title, author, genre, status, rating, notes } = req.body;
  const result = await query(
    `UPDATE books SET
       title  = COALESCE($2, title),
       author = COALESCE($3, author),
       genre  = COALESCE($4, genre),
       status = COALESCE($5, status),
       rating = COALESCE($6, rating),
       notes  = COALESCE($7, notes)
     WHERE id = $1
     RETURNING *`,
    [req.params.id, title, author, genre, status, rating, notes]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// ── Delete a book ─────────────────────────────────────────────────────────────
app.delete('/api/books/:id', authenticate, async (req, res) => {
  const result = await query(
    'DELETE FROM books WHERE id = $1 RETURNING id',
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: result.rows[0].id });
});

// ── Stats ─────────────────────────────────────────────────────────────────────
app.get('/api/books/stats', authenticate, async (_req, res) => {
  const result = await query(`
    SELECT
      COUNT(*)                                          AS total,
      COUNT(*) FILTER (WHERE status = 'want-to-read')  AS want_to_read,
      COUNT(*) FILTER (WHERE status = 'reading')       AS reading,
      COUNT(*) FILTER (WHERE status = 'done')          AS done,
      ROUND(AVG(rating) FILTER (WHERE status = 'done'), 1) AS avg_rating
    FROM books
  `);
  res.json(result.rows[0]);
});

app.listen(PORT, () => console.log(`Reading List API running on port ${PORT}`));
