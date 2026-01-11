# sturdy-spoon


Aplicação mínima para testes locais.

Rápido guia:

- Inicializar banco e seed:

```bash
npm install
npm run init-db
```

- Iniciar servidor:

```bash
npm start
```

API endpoints:

- `GET /` - status
- `POST /auth/login` - body: `{ "email": "usuario@gmail.com", "password": "123456" }`
- `POST /users` - criar usuário
- `GET /users` - listar usuários
- `GET /users/:id` - obter usuário
- `PUT /users/:id` - alterar usuário (aceita `name` e `password`)
- `DELETE /users/:id` - remover usuário

Para expor publicamente (opcional), use `npx localtunnel --port 3000` ou `ngrok`.
