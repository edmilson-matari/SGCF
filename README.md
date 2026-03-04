# SGCF — Sistema de Gestão do Centro de Formação

Aplicação web full-stack para gestão de cursos, formandos, instrutores, matrículas e pagamentos.

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2.20

---

## Estrutura do projecto

```
SGCF/
├── backend/          # API REST (Node.js + TypeScript)
├── frontend/         # Interface web (React + Vite)
├── db-init/
│   └── formation_center.sql   # Script de inicialização da base de dados
└── docker-compose.yaml
```

---

## Arrancar o projecto

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd SGCF
```

### 2. Configurar as variáveis de ambiente

Certifique-se de que os seguintes ficheiros existem antes de iniciar:

| Ficheiro               | Utilização                        |
| ---------------------- | --------------------------------- |
| `backend/.env.docker`  | Variáveis de ambiente do backend  |
| `frontend/.env.docker` | Variáveis de ambiente do frontend |

> Pode copiar os ficheiros de exemplo caso existam (`.env.example`) e ajustar os valores.

### 3. Construir e iniciar os contentores

```bash
docker compose up --build
```

Isto irá:

- Construir as imagens do **backend** e do **frontend**
- Iniciar o **PostgreSQL** (`postgres-db`) na porta `5432`
- Iniciar o **backend** (`back`) na porta `3000` — aguarda o PostgreSQL ficar saudável
- Iniciar o **frontend** (`front`) na porta `5173`

> Para correr em segundo plano (modo detached), adicione a flag `-d`:
>
> ```bash
> docker compose up --build -d
> ```

---

## Importar a base de dados

Após os contentores estarem a correr, execute os seguintes comandos para importar o esquema e os dados iniciais:

### 1. Copiar o ficheiro SQL para o contentor

```bash
docker cp ./db-init/formation_center.sql postgres-db:/tmp/formation_center.sql
```

### 2. Executar o script na base de dados

```bash
docker exec -i postgres-db psql -U postgres -d formation_center -f /tmp/formation_center.sql
```

> Estes dois passos são necessários apenas na **primeira vez** ou sempre que quiser reinicializar a base de dados.

---

## Aceder à aplicação

| Serviço    | URL                         |
| ---------- | --------------------------- |
| Frontend   | http://localhost:5173       |
| Backend    | http://localhost:3000       |
| PostgreSQL | `localhost:5432` (opcional) |

---

## Parar os contentores

```bash
docker compose down
```

Para remover também o volume da base de dados (apaga todos os dados):

```bash
docker compose down -v
```

---

## Serviços e portas

| Contentor     | Imagem             | Porta exposta |
| ------------- | ------------------ | ------------- |
| `front`       | build ./frontend   | 5173          |
| `back`        | build ./backend    | 3000          |
| `postgres-db` | postgres:18-alpine | 5432          |

---

## Rede interna

Todos os serviços comunicam através da rede interna `backend-net`. O backend liga-se à base de dados pelo hostname `db` e aguarda que o healthcheck do PostgreSQL passe antes de iniciar.
