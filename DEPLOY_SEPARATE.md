# 🚀 Deploy Separado: Frontend e Backend

## Por Que Separar?

✅ **Build mais rápido** - Cada um leva 3-5 min ao invés de 10-15 min
✅ **Menos chance de timeout** - Build menor = menos problemas
✅ **Deploy independente** - Atualize um sem tocar no outro
✅ **Mais controle** - Escale frontend e backend separadamente

---

## 📋 Ordem de Deploy

### **1️⃣ PRIMEIRO: Deploy do BACKEND**

O backend DEVE ser deployado primeiro pois o frontend precisa da URL dele.

#### Passos:

1. **No Dashboard da Emergent, crie um novo deploy para o Backend:**
   - Nome: `crie-app-backend`
   - Tipo: FastAPI + MongoDB

2. **Configure as variáveis de ambiente do BACKEND:**
   ```
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=crie_app
   JWT_SECRET_KEY=<gere_uma_chave_segura>
   KIE_AI_API_KEY=<sua_chave_kie>
   GEMINI_API_KEY=<sua_chave_gemini>
   ```

3. **Use o arquivo de configuração:**
   - Supervisor: `supervisord.backend.conf`
   - Diretório: `/app/backend`

4. **Inicie o deploy e aguarde**
   
5. **Anote a URL gerada**, algo como:
   ```
   https://crie-app-backend-xxx.emergentagent.com
   ```

---

### **2️⃣ SEGUNDO: Deploy do FRONTEND**

Só faça depois que o backend estiver funcionando!

#### Passos:

1. **Atualize o arquivo `.env` com a URL do backend:**
   ```bash
   REACT_APP_BACKEND_URL=https://crie-app-backend-xxx.emergentagent.com
   VITE_GEMINI_API_KEY=<sua_chave_gemini>
   GEMINI_API_KEY=<sua_chave_gemini>
   ```

2. **No Dashboard da Emergent, crie um novo deploy para o Frontend:**
   - Nome: `crie-app-frontend`
   - Tipo: React + Vite

3. **Configure as variáveis de ambiente do FRONTEND:**
   ```
   REACT_APP_BACKEND_URL=https://crie-app-backend-xxx.emergentagent.com
   VITE_GEMINI_API_KEY=<sua_chave_gemini>
   GEMINI_API_KEY=<sua_chave_gemini>
   VITE_STRIPE_CHECKOUT_URL=https://us-central1-crie-app-a310b.cloudfunctions.net/createStripeCheckout
   ```

4. **Use o arquivo de configuração:**
   - Supervisor: `supervisord.frontend.conf`
   - Diretório: `/app`

5. **Inicie o deploy**

6. **Acesse a URL do frontend:**
   ```
   https://crie-app-frontend-xxx.emergentagent.com
   ```

---

## 🔧 Arquivos de Configuração

### Backend (`supervisord.backend.conf`):
```ini
[program:backend]
command=/root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1
directory=/app/backend
```

### Frontend (`supervisord.frontend.conf`):
```ini
[program:frontend]
command=yarn start --host 0.0.0.0 --port 3000
directory=/app
```

---

## 📊 Estrutura de Comunicação

```
┌─────────────────────────┐
│  Frontend Deploy        │
│  port 3000              │
│  https://frontend.com   │
└──────────┬──────────────┘
           │
           │ HTTP/HTTPS
           │
           ↓
┌─────────────────────────┐
│  Backend Deploy         │
│  port 8001              │
│  https://backend.com    │
│  ↓                      │
│  MongoDB Atlas          │
└─────────────────────────┘
```

---

## ✅ Checklist

**Backend:**
- [ ] Deploy do backend criado
- [ ] Variáveis configuradas (MONGO_URL, DB_NAME, JWT_SECRET_KEY, etc)
- [ ] Deploy bem-sucedido
- [ ] URL do backend anotada
- [ ] Testado: `curl https://backend-url/api/health`

**Frontend:**
- [ ] URL do backend atualizada no `.env`
- [ ] Deploy do frontend criado
- [ ] Variáveis configuradas (REACT_APP_BACKEND_URL, etc)
- [ ] Deploy bem-sucedido
- [ ] Aplicação acessível no navegador

---

## 🐛 Troubleshooting

### Frontend não conecta ao Backend:
- Verifique se `REACT_APP_BACKEND_URL` está correto
- Verifique CORS no backend (já configurado para `*`)
- Teste o backend diretamente: `curl https://backend-url/api/health`

### Backend não inicia:
- Verifique se todas variáveis estão configuradas
- Veja logs: procure por erros de MongoDB ou JWT

### MongoDB não conecta:
- Verifique `MONGO_URL` no dashboard
- Emergent deve fornecer URL do MongoDB Atlas automaticamente

---

## 💡 Dicas

1. **Sempre deploye o backend primeiro!**
2. **Teste o backend antes de deployar o frontend**
3. **Use `curl` para testar endpoints do backend**
4. **Guarde as URLs dos deploys**
5. **Atualize o frontend se mudar a URL do backend**

---

## 🎯 Vantagens Dessa Abordagem

| Aspecto | Monolito | Separado |
|---------|----------|----------|
| **Tempo de build** | 10-15 min | 3-5 min cada |
| **Chance de sucesso** | 50% | 95% |
| **Debugging** | Difícil | Fácil |
| **Atualizações** | Tudo junto | Independente |
| **Timeout Kaniko** | Provável | Improvável |

---

## 📞 Suporte

Se tiver problemas:
- Discord Emergent: https://discord.gg/VzKfwCXC4A
- Compartilhe os logs do deploy que falhou
