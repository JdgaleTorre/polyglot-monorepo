# polyglot-monorepo

A small practice repo for getting comfortable with a **Python gRPC + SQLAlchemy
backend** alongside a **TypeScript/React frontend**, orchestrated by
**moonrepo** and **pnpm**. Built to rehearse the toolchain itself — not to be
a production app — so you can hit the ground running when the clock starts on
a timed assessment using this same stack.

It's a single feature (a task list) implemented vertically through every
layer:

```
React (Vite) ──fetch/JSON──▶ FastAPI gateway ──gRPC──▶ TaskService ──SQLAlchemy──▶ SQLite
   apps/web                      apps/api/app/gateway.py        apps/api/app/services
```

> **Why a gateway?** Browsers can't speak raw gRPC (HTTP/2 trailers aren't
> exposed to `fetch`/XHR). Real setups either run `grpc-web` behind an Envoy
> proxy, or front the gRPC service with a small HTTP gateway. This repo uses
> the latter (a thin FastAPI app) to stay dependency-light while still
> exercising real gRPC underneath. If your actual assessment uses grpc-web
> instead, the `apps/api/app/services` and `apps/api/app/proto` layers are
> what transfer directly — swap the gateway for whatever transport they use.

## Prerequisites

- Python 3.12+ (`python3 --version`)
- Node.js v22+ (`node --version`)
- pnpm (`npm install -g pnpm && pnpm --version`)
- moon v2+ (`npm install -g @moonrepo/cli && moon --version`, or the install
  script at https://moonrepo.dev/docs/install)
- Git

> **Note on moon's toolchain system:** `.moon/toolchains.yml` is deliberately
> left minimal. moon v2 can manage tool versions itself (Node, pnpm, Python,
> etc.) via downloadable WASM plugins, but that requires network access to
> `ghcr.io`. This repo instead assumes Python/Node/pnpm are already installed
> and on your `PATH` (per the prerequisites above), and JS tasks invoke `pnpm
> exec <tool>` so binaries resolve from the local workspace without moon's
> toolchain plugins. If you'd rather have moon manage versions for you, see
> https://moonrepo.dev/docs/config/toolchains.

## First-time setup

```bash
git clone <your-repo-url>
cd polyglot-monorepo

# Install JS workspace deps
pnpm install

# Set up the Python venv and install backend deps
cd apps/api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

## Generate the gRPC stubs

The generated `*_pb2.py` / `*_pb2_grpc.py` files are **not** committed
(they're build output from `app/proto/task.proto`) — generate them once
before running anything backend-related:

```bash
moon run api:gen-proto
```

This also runs automatically as a dependency of `api:dev`, `api:test`, etc.,
so in practice you rarely need to call it directly — but it's worth running
once manually so you understand what moon is doing under the hood.

## Running everything

Each piece runs in its own terminal:

```bash
# Terminal 1 — gRPC server (port 50051)
moon run api:dev

# Terminal 2 — HTTP gateway in front of it (port 8000)
moon run api:dev-gateway

# Terminal 3 — React app (port 5173)
moon run web:dev
```

Then open http://localhost:5173 — you should be able to add tasks and mark
them complete, round-tripping through gRPC and SQLAlchemy.

## Useful moon commands

```bash
moon run :test          # run tests in every project
moon run :lint          # lint every project
moon check --all        # run all the things moon knows about, project by project
moon run api:test       # just the backend tests
moon run web:test       # just the frontend tests
moon project-graph       # visualize how projects relate
```

`moon.yml` in each `apps/*` folder defines that project's tasks — start there
if a command above doesn't do what you expect.

## Project layout

```
.
├── .moon/
│   ├── workspace.yml      # registers apps/* as moon projects
│   └── toolchain.yml      # pins Node/pnpm and Python versions
├── apps/
│   ├── api/                          # Python: gRPC + SQLAlchemy
│   │   ├── app/
│   │   │   ├── proto/task.proto      # service + message definitions
│   │   │   ├── models/task.py        # SQLAlchemy model + session
│   │   │   ├── services/task_service.py  # gRPC servicer implementation
│   │   │   ├── server.py             # gRPC server entrypoint
│   │   │   └── gateway.py            # FastAPI HTTP gateway for the browser
│   │   ├── tests/test_task_service.py
│   │   ├── requirements.txt
│   │   └── moon.yml
│   └── web/                          # TypeScript: React + Vite
│       ├── src/
│       │   ├── App.tsx
│       │   ├── App.test.tsx
│       │   └── lib/api.ts            # typed fetch client for the gateway
│       ├── package.json
│       └── moon.yml
├── package.json
├── pnpm-workspace.yaml
└── .gitignore
```

## What to practice here

- Reading `.moon/workspace.yml` and each `moon.yml` to understand task
  dependency chains (`gen-proto` → `dev`/`test`) before you need to add a new
  task under time pressure.
- Editing `app/proto/task.proto`, regenerating stubs, and threading a new
  field through the servicer → gateway → React client.
- Adding a new SQLAlchemy column/model and a matching migration-free
  `Base.metadata.create_all` change (this repo doesn't use Alembic — keep it
  simple unless your assessment specifically wants migrations).
- Writing a new gRPC method end-to-end with a test, mirroring
  `tests/test_task_service.py`.
- Running `pnpm` workspace commands from the root vs. from `apps/web`.

## Known simplifications (vs. a "real" assessment repo)

- No Alembic migrations — schema is created with `Base.metadata.create_all`.
- No auth.
- SQLite instead of Postgres, for zero external setup.
- The FastAPI gateway is a stand-in for whatever transport the real
  assessment uses to get gRPC into a browser (grpc-web/Envoy, a BFF, etc.) —
  adapt as needed.
