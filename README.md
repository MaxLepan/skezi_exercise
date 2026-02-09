# Skezi Exercise

## Description

This is an exercise for Skezi, during the interview process. The goal is to create an API to manage meeting rooms and their reservations.

## Technologies used

- NestJS
- Prisma ORM
- PostgreSQL

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

### Start PostgreSQL with Docker

```bash
docker compose up -d
```

> Make sure PostgreSQL is running on port `5432`

### Configure environment variables

Create a `.env` file in the root of the project with the following content (or see the `.env.example` file and adjust the values as needed):

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/skezi?schema=public"
JWT_SECRET=dev-secret
```

### Install and run the project

```bash
# install dependencies
npm install

# generate Prisma client
npx prisma generate

# run database migrations
npx prisma migrate dev

# seed the database
npm run db:seed

# start the server
npm run start:dev
```

## Compile and run the project

```bash
# development
npm run start

# watch mode
npm run start:dev
```

## Run tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e
```
