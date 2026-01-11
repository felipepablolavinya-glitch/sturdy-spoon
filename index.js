const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const { run, get, all } = require('./db')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => res.json({ ok: true, msg: 'sturdy-spoon API' }))

// Auth
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  try {
    const user = await get('SELECT id, email, password_hash, name FROM usuarios WHERE email = ?', [email])
    if (!user) return res.status(401).json({ error: 'invalid credentials' })
    const ok = bcrypt.compareSync(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'invalid credentials' })
    delete user.password_hash
    return res.json({ token: 'dev-token', user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// Users CRUD
app.post('/users', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  try {
    const pwHash = bcrypt.hashSync(password, 10)
    const r = await run('INSERT INTO usuarios (email, password_hash, name) VALUES (?, ?, ?)', [email, pwHash, name || null])
    const user = await get('SELECT id, email, name, created_at FROM usuarios WHERE id = ?', [r.lastID])
    res.status(201).json(user)
  } catch (err) {
    if (err && err.message && err.message.includes('UNIQUE')) return res.status(409).json({ error: 'email already exists' })
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

app.get('/users', async (req, res) => {
  try {
    const rows = await all('SELECT id, email, name, created_at FROM usuarios')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

app.get('/users/:id', async (req, res) => {
  try {
    const user = await get('SELECT id, email, name, created_at FROM usuarios WHERE id = ?', [req.params.id])
    if (!user) return res.status(404).json({ error: 'not found' })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

app.put('/users/:id', async (req, res) => {
  const { name, password } = req.body
  try {
    const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.params.id])
    if (!user) return res.status(404).json({ error: 'not found' })
    if (password) {
      const pwHash = bcrypt.hashSync(password, 10)
      await run('UPDATE usuarios SET password_hash = ?, name = ? WHERE id = ?', [pwHash, name || user.name, req.params.id])
    } else {
      await run('UPDATE usuarios SET name = ? WHERE id = ?', [name || user.name, req.params.id])
    }
    const updated = await get('SELECT id, email, name, created_at FROM usuarios WHERE id = ?', [req.params.id])
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

app.delete('/users/:id', async (req, res) => {
  try {
    await run('DELETE FROM usuarios WHERE id = ?', [req.params.id])
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
