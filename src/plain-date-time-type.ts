import { type EntityProperty, type Platform, Type } from "@mikro-orm/core";
import { isMySql, isPostgres } from "./utils.js";

export class PlainDateTimeType extends Type<Temporal.PlainDateTime | null, string | null> {
    public convertToDatabaseValue(
        value: Temporal.PlainDateTime | null,
        platform: Platform,
    ): string | null {
        if (value === null) {
            return null;
        }

        if (isMySql(platform)) {
            // Convert to MySQL format
            return value.toString().replace("T", " ");
        }

        return value.toString();
    }

    public convertToJSValue(
        value: Date | string | null,
        platform: Platform,
    ): Temporal.PlainDateTime | null {
        /* node:coverage disable */
        if (value === null) {
            return null;
        }
        /* node:coverage enable */

        if (value instanceof Date) {
            if (platform.getTimezone() === "Z") {
                return Temporal.PlainDateTime.from({
                    year: value.getUTCFullYear(),
                    month: value.getUTCMonth() + 1,
                    day: value.getUTCDate(),
                    hour: value.getUTCHours(),
                    minute: value.getUTCMinutes(),
                    second: value.getUTCSeconds(),
                    millisecond: value.getUTCMilliseconds(),
                });
            }

            return Temporal.PlainDateTime.from({
                year: value.getFullYear(),
                month: value.getMonth() + 1,
                day: value.getDate(),
                hour: value.getHours(),
                minute: value.getMinutes(),
                second: value.getSeconds(),
                millisecond: value.getMilliseconds(),
            });
        }

        if (isMySql(platform)) {
            // Convert to ISO format
            return Temporal.PlainDateTime.from(value.replace(" ", "T"));
        }

        return Temporal.PlainDateTime.from(value);
    }

    public override compareAsType(): string {
        return "date";
    }

    /* node:coverage disable */
    public override toJSON(value: Temporal.PlainDateTime | null): string | null {
        return value ? value.toString() : null;
    }
    /* node:coverage enable */

    public override getColumnType(prop: EntityProperty, platform: Platform): string {
        if (isPostgres(platform)) {
            // Postgres has a true single-purpose column type for timestamps without timezone.
            return "TIMESTAMP";
        }

        return platform.getDateTimeTypeDeclarationSQL({ length: prop.length });
    }
}
