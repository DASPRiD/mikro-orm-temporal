# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MikroORM custom type library that maps TC39 Temporal API objects to database columns across five platforms: SQLite, MySQL, MariaDB, PostgreSQL, and MSSQL.

## Commands

- **Build:** `pnpm build`
- **Test all:** `pnpm test` (runs all `test/*.test.ts` files via `tsx --test` with c8 coverage)
- **Test single file:** `pnpm exec tsx --test test/plain-date-type.test.ts`
- **Lint/format:** `pnpm check` (biome check with auto-fix)
- **Format only:** `pnpm format`

## Architecture

Each exported type (e.g. `PlainDateType`, `DurationType`, `OffsetDateTimeType`) extends MikroORM's `Type` base class and implements:

- `convertToDatabaseValue()` — Temporal object to DB-compatible string/value
- `convertToJSValue()` — DB value back to Temporal object
- `getColumnType()` — platform-specific DDL (uses helpers in `src/utils.ts` to detect Postgres/MySQL/MSSQL)
- `toJSON()` — serialization to ISO string
- `compareAsType()` — tells MikroORM how to compare values

Platform-specific behavior is significant: MySQL uses space-separated datetime format, Postgres uses native INTERVAL for durations, MSSQL uses DATETIMEOFFSET and VARCHAR(19) for PlainDateTime. See the README caveats section.

## Testing

Tests use Node's built-in `node:test` runner (not Jest/Vitest). Each test file defines an entity, then uses `describeTestMatrix()` from `test/matrix.ts` to run the same assertions against all five database platforms. SQLite runs in-memory; other databases require running instances on specific ports (MySQL: 5001, MariaDB: 5002, Postgres: 5003, MSSQL: 5004). The Temporal polyfill is auto-loaded if `Temporal` is not globally available.

## Code Style

- Biome for linting and formatting (4-space indent, 100-char line width)
- Shorthand array syntax (`string[]` not `Array<string>`)
- Commits follow Conventional Commits (enforced by commitlint via lefthook pre-commit hook)
- ESM only (`"type": "module"`, `.js` extensions in imports)
