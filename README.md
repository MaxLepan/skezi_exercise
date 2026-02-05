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

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
