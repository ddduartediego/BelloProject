# 🚀 Guia de Deploy - Sistema Bello MVP
*Fase 12: Deploy e Produção - Documentação Completa*

## 📋 Resumo da Fase 12

### ✅ **Configurações Realizadas**
- **Next.js Config**: Otimizado para produção com headers de segurança
- **Vercel Config**: Configuração específica para deploy na Vercel
- **Environment Variables**: Template completo com todas as variáveis necessárias
- **Build Optimization**: Bundle otimizado (102 kB shared JS)
- **Documentation**: README profissional e licença MIT

### 📊 **Métricas de Build**
- **Tempo de Build**: 10.0s
- **Páginas Geradas**: 13 páginas estáticas
- **Bundle Size**: 102 kB compartilhado
- **Maior Página**: /relatorios (416 kB First Load JS)
- **Warnings**: 4 warnings menores (TypeScript any)

---

## 🌐 Deploy na Vercel (Recomendado)

### 1. **Preparação do Repositório**

```bash
# Certifique-se de que está na branch principal
git checkout main
git merge develop

# Push para o repositório remoto
git push origin main
```

### 2. **Configuração na Vercel**

1. **Acesse [vercel.com](https://vercel.com)**
2. **Conecte seu repositório GitHub**
3. **Configure as variáveis de ambiente:**

```env
# Supabase (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Google OAuth (OBRIGATÓRIO)
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret

# Produção
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
NEXT_PUBLIC_APP_NAME=Sistema Bello
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
NEXTAUTH_URL=https://seu-dominio.vercel.app
NEXTAUTH_SECRET=seu_secret_super_seguro
```

### 3. **Deploy Automático**
- ✅ Deploy automático a cada push na branch `main`
- ✅ Preview deployments para PRs
- ✅ Rollback automático em caso de erro

---

## 🏗️ Deploy em Outras Plataformas

### **Netlify**
```bash
# Build command
npm run build

# Publish directory
.next

# Environment variables
# (mesmas da Vercel)
```

### **Railway**
```bash
# Dockerfile (criar se necessário)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### **Digital Ocean App Platform**
```yaml
# .do/app.yaml
name: sistema-bello
services:
- name: web
  source_dir: /
  github:
    repo: seu-usuario/sistema-bello-mvp
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
```

---

## 🔧 Configurações de Produção

### **Performance Otimizations**
- ✅ **Compressão gzip** habilitada
- ✅ **Bundle splitting** automático
- ✅ **Tree-shaking** ativo
- ✅ **Static generation** para 13 páginas
- ✅ **Image optimization** configurada

### **Security Headers**
```javascript
// Configurados no next.config.ts
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### **Caching Strategy**
```javascript
// API routes cache (vercel.json)
Cache-Control: s-maxage=86400
```

---

## 🗄️ Configuração do Banco de Dados

### **Supabase Setup**

1. **Crie um projeto no [Supabase](https://supabase.com)**
2. **Execute o schema SQL:**

```sql
-- Tabelas principais já criadas durante desenvolvimento
-- Verificar se todas as tabelas existem:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Deve retornar:
-- clientes, servicos, produtos, agendamentos, 
-- comandas, itens_comanda, movimentacoes_caixa
```

3. **Configure Row Level Security (RLS):**

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_comanda ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_caixa ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme necessário)
CREATE POLICY "Enable all for authenticated users" ON clientes
FOR ALL USING (auth.role() = 'authenticated');
```

4. **Configure Authentication:**
   - Habilite Google OAuth
   - Configure URLs de redirect
   - Defina políticas de senha

---

## 🔐 Configurações de Segurança

### **Environment Variables**
```bash
# Nunca commitar arquivos .env
echo ".env*" >> .gitignore

# Usar secrets management em produção
# Vercel: Environment Variables
# Railway: Variables
# Netlify: Environment Variables
```

### **HTTPS & SSL**
- ✅ **HTTPS obrigatório** em produção
- ✅ **SSL certificates** automáticos (Vercel/Netlify)
- ✅ **Secure cookies** configurados

### **API Security**
- ✅ **Rate limiting** (Supabase nativo)
- ✅ **CORS** configurado
- ✅ **Input validation** em todas as rotas

---

## 📊 Monitoramento e Analytics

### **Vercel Analytics**
```javascript
// Adicionar ao layout.tsx (futuro)
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### **Error Tracking**
```bash
# Sentry (futuro)
npm install @sentry/nextjs

# Configurar em next.config.ts
const { withSentryConfig } = require('@sentry/nextjs');
```

### **Performance Monitoring**
- **Vercel Speed Insights**
- **Core Web Vitals tracking**
- **Bundle analyzer** para otimizações

---

## 🧪 Testes de Produção

### **Checklist Pré-Deploy**
- [ ] Build local bem-sucedido
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Banco de dados configurado e populado
- [ ] Autenticação funcionando
- [ ] Todas as funcionalidades testadas
- [ ] Performance aceitável (Lighthouse > 90)

### **Testes Pós-Deploy**
```bash
# Lighthouse CI (futuro)
npm install -g @lhci/cli
lhci autorun --upload.target=temporary-public-storage

# Smoke tests
curl -f https://seu-dominio.vercel.app/api/health
```

---

## 🔄 CI/CD Pipeline

### **GitHub Actions** (futuro)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 📈 Otimizações Futuras

### **Performance**
- [ ] **Service Worker** para cache offline
- [ ] **PWA** completo com manifest
- [ ] **Image optimization** avançada
- [ ] **Code splitting** por rota

### **Features**
- [ ] **Real-time notifications**
- [ ] **Email templates**
- [ ] **Backup automático**
- [ ] **Multi-tenancy**

### **Monitoring**
- [ ] **Error tracking** (Sentry)
- [ ] **Performance monitoring** (New Relic)
- [ ] **User analytics** (Google Analytics)
- [ ] **Business metrics** dashboard

---

## 🎯 Status Final

### ✅ **Completado**
- **Build otimizado**: 10.0s, 102 kB shared
- **Configurações de produção**: Headers, redirects, compressão
- **Documentação completa**: README, guias, licença
- **Deploy ready**: Vercel config, environment template

### 🔄 **Próximos Passos**
1. **Deploy inicial** na Vercel
2. **Configuração do domínio** personalizado
3. **Testes de produção** completos
4. **Monitoramento** e analytics
5. **Backup strategy** implementação

---

## 📞 Suporte

Para dúvidas sobre deploy:
- **Email**: dd.duartediego@gmail.com
- **Documentação**: [step-by-step/desenvolvimento-bello-mvp.md](./desenvolvimento-bello-mvp.md)
- **Issues**: GitHub Issues do projeto

---

*Sistema Bello MVP - Deploy Guide v1.0*
*Criado em: Janeiro 2025* 