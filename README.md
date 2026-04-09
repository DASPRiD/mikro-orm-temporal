# Temporal for Mikro ORM

[![Release](https://github.com/DASPRiD/mikro-orm-temporal/actions/workflows/release.yml/badge.svg)](https://github.com/DASPRiD/mikro-orm-temporal/actions/workflows/release.yml)
[![codecov](https://codecov.io/gh/DASPRiD/mikro-orm-temporal/graph/badge.svg?token=s9yDuZeh7F)](https://codecov.io/gh/DASPRiD/mikro-orm-temporal)

This package provides [Mikro ORM](https://github.com/mikro-orm/mikro-orm) types for common
[Temporal](https://tc39.es/proposal-temporal/) objects.

The library exports the following types:

- `DurationType`
- `PlainDateType`
- `PlainDateTimeType`
- `PlainTimeType`
- `OffsetDateTimeType`
- `InstantType`
- `PlainMonthDayType`
- `PlainYearMonthType`

## Installation

Install via your favorite package manager:

```bash
npm install mikro-orm-temporal
# or
pnpm add mikro-orm-temporal
# or
yarn add mikro-orm-temporal
```

## Usage

### With `defineEntity` (recommended)

Use `p.type()` from `@mikro-orm/core` to wire up any temporal type, then chain modifiers like
`.nullable()` as needed:

```ts
import { defineEntity, p } from '@mikro-orm/core';
import { OffsetDateTimeType, PlainDateType } from 'mikro-orm-temporal';

const EventSchema = defineEntity({
    name: 'Event',
    properties: {
        id: p.integer().primary(),
        startsAt: p.type(OffsetDateTimeType),
        endsAt: () => p.type(OffsetDateTimeType).nullable(),
        date: p.type(PlainDateType),
    },
});

export class Event extends EventSchema.class {}
EventSchema.setClass(Event);
```

## Caveats

- Durations are stored as `INTERVAL` in Postgres and as `VARCHAR` (ISO string) on all other platforms.
