import type { Platform } from "@mikro-orm/core";

export const isPostgres = (platform: Platform): boolean =>
    platform.constructor.name === "PostgreSqlPlatform";

export const isMySql = (platform: Platform): boolean =>
    platform.constructor.name === "MySqlPlatform" ||
    platform.constructor.name === "MariaDbPlatform";

export const isMsSql = (platform: Platform): boolean =>
    platform.constructor.name === "MsSqlPlatform";
