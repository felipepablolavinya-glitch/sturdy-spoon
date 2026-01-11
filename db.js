const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcryptjs')

const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)
const dbFile = path.join(dataDir, 'app.sqlite')

const db = new sqlite3.Database(dbFile)

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err)
      resolve(this)
    })
  })
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err)
      resolve(row)
    })
  })
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

async function init() {
  await run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  await run(`CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES usuarios(id)
  )`)

  // seed user if not exists
  const existing = await get('SELECT * FROM usuarios WHERE email = ?', ['usuario@gmail.com'])
  if (!existing) {
    const pwHash = bcrypt.hashSync('123456', 10)
    const res = await run('INSERT INTO usuarios (email, password_hash, name) VALUES (?, ?, ?)', ['usuario@gmail.com', pwHash, 'Usuário Teste'])
    const userId = res.lastID
    await run('INSERT INTO admin (user_id, role) VALUES (?, ?)', [userId, 'admin'])
    console.log('Seeded user usuario@gmail.com / 123456 (admin)')
  }
}

init().catch(err => console.error('DB init error', err))

module.exports = { db, run, get, all }
