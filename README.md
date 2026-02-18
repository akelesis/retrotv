# Retro TV

Monorepo para o projeto Retro TV - uma plataforma de streaming com interface nostálgica de TV antiga.

## Estrutura do Projeto

```
retrotv/
├── backend/
│   └── retrotv-api/      # API NestJS + TypeORM + PostgreSQL
├── retrotv/              # Frontend React + Vite + TypeScript + Tailwind
└── README.md
```

## Tecnologias

### Frontend (retrotv/)
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM

### Backend (backend/retrotv-api/)
- NestJS
- TypeORM
- PostgreSQL
- JWT Authentication
- AWS S3 (upload de arquivos)
- Swagger (documentação)

## Pré-requisitos

- Node.js 18+
- PostgreSQL
- npm ou yarn

## Instalação

### Backend

```bash
cd backend/retrotv-api
npm install
```

Configure as variáveis de ambiente criando um arquivo `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=retrotv

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1d

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket
```

### Frontend

```bash
cd retrotv
npm install
```

## Desenvolvimento

### Iniciar o Backend

```bash
cd backend/retrotv-api
npm run start:dev
```

A API estará disponível em `http://localhost:3000`

Documentação Swagger: `http://localhost:3000/api`

### Iniciar o Frontend

```bash
cd retrotv
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

## Build de Produção

### Backend

```bash
cd backend/retrotv-api
npm run build
npm run start:prod
```

### Frontend

```bash
cd retrotv
npm run build
```

Os arquivos de build estarão em `retrotv/dist/`

## Scripts Úteis

### Backend

- `npm run start:dev` - Inicia o servidor em modo desenvolvimento com hot reload
- `npm run build` - Compila o TypeScript para JavaScript
- `npm run start:prod` - Inicia o servidor em modo produção
- `npm run seed:categories` - Popula o banco com categorias iniciais

### Frontend

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria o build de produção
- `npm run preview` - Preview do build de produção

## Funcionalidades

- Autenticação JWT
- Upload de vídeos e imagens
- Gerenciamento de categorias
- Interface nostálgica de TV antiga
- Reprodução de vídeos
- Sistema de favoritos

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## Licença

Este projeto é privado.
