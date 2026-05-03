# Home Service Backend (NestJS)

Minimal backend scaffolded from the blueprint in `backend_blueprint (1).md`.

## Setup

1. Install dependencies:
   npm install
2. Copy env file:
   copy .env.example .env
3. Start in dev mode:
   npm run start:dev

## Implemented Modules

- auth
- users
- prestataires
- categories
- services
- service-requests
- reviews
- admin
- mail

## Notes

- Uses PostgreSQL via TypeORM.
- Uses JWT auth and role-based guards.
- Uses `synchronize: true` for fast iteration during development.
