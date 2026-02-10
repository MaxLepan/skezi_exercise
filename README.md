# Skezi Exercise

## Description

This is an exercise for Skezi, during the interview process. The goal is to create an API to manage meeting rooms and their reservations.
There is also a frontend part to manage the rooms and reservations, and to show some statistics.

## Technologies used

- NestJS
- Prisma ORM
- PostgreSQL
- Nuxt 4

## Requirements

### Features

- Create, read, update, and delete meeting rooms
- Create, read, update, and delete reservations for meeting rooms
- Each room has a name and a maximum capacity
- A user can only reserve a room if it is available for the desired time slot
- It is not possible to reserve a room in the past
- A room cannot have overlapping reservations
- Reservation operations should be atomic

### Additional Statistics API Endpoints

- Occupancy rate of a room for a given time period (daily, weekly, monthly)
- Top 3 most reserved rooms
- Average reservation duration

### Automated Tests

- Necessary unit tests
- At least one integration test AND/OR end-to-end test

## Project setup & quick start

### Backend (NestJS + Prisma)

#### Start PostgreSQL with Docker

```bash
docker compose up -d
```

> Make sure PostgreSQL is running on port `5432`

#### Configure environment variables

Create a `.env` file in the root of the project with the following content (or see the `.env.example` file and adjust the values as needed):

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/skezi?schema=public"
JWT_SECRET=dev-secret
```

#### Install and run the project

```bash
# install dependencies
npm install

# generate Prisma client
npx prisma generate

# run database migrations
npx prisma migrate dev

# seed the database
npm run db:seed
```

### Frontend (Nuxt 4)

#### Install and run the frontend

```bash
# go to frontend directory
cd frontend

# install dependencies
npm install
```

The frontend runs on [http://localhost:3001](http://localhost:3001) and connects to the backend API on [http://localhost:3000](http://localhost:3000).

### Run backend and frontend in development mode

```bash
# in the root directory, you can start both backend and frontend with:
npm run dev

# or start them separately in their respective directories:
# in the root directory for backend
npm run start:dev

# in the frontend directory for frontend
cd frontend
npm run dev
```

### Seeded users

After running the seed, the following users are available:

- <user1@test.com> / password123
- <user2@test.com> / password123

## Run tests

Note: Tests use a dedicated Prisma schema (`schema.test.prisma`) to work around a [known NestJS + Prisma TypeScript issue](https://github.com/nestjs/nest/issues/16051).

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e
```

## Authentication

The API uses JWT-based authentication. To authenticate, send a `POST` request to `/auth/login` with the user's email and password. The response will include a JWT token that must be included in the `Authorization` header of subsequent requests to protected endpoints.

## Main API Endpoints

### Auth

- `POST /auth/login`: Authenticate a user and return a JWT token.
- `POST /auth/register`: Register a new user.

### Rooms

- `POST /rooms`: Create a new meeting room.
- `GET /rooms`: Get a list of all meeting rooms.
- `GET /rooms/:id`: Get details of a specific meeting room.

### Reservations

- `POST /reservations`: Create a new reservation for a meeting room.
- `GET /reservations/me`: Get a list of reservations for the authenticated user.
- `PATCH /reservations/:id`: Update an existing reservation.
- `DELETE /reservations/:id`: Cancel a reservation.

### Statistics

- `GET /stats/occupancy`: Get the occupancy rate of a room for a given time period.
- `GET /stats/top-rooms`: Get the top 3 most reserved rooms.
- `GET /stats/average-duration`: Get the average reservation duration.

## Technical Notes

- Reservation creation and updates are executed inside database transactions.
- Row-level locking (`SELECT ... FOR UPDATE`) is used to prevent concurrent overlapping reservations.
