import { type EntityProperty, type Platform, Type } from "@mikro-orm/core";
import { isMsSql, isMySql } from "./utils.js";

export class OffsetDateTimeType extends Type<Temporal.ZonedDateTime | null, string | null> {
    public convertToDatabaseValue(
        value: Temporal.ZonedDateTime | null,
        platform: Platform,
    ): string | null {
        if (value === null) {
            return null;
        }

        if (isMySql(platform)) {
            // Convert to MySQL format
            return value.withTimeZone("UTC").toPlainDateTime().toString().replace("T", " ");
        }

        return value.toInstant().toString();
    }

    public convertToJSValue(
        value: Date | string | null,
        platform: Platform,
    ): Temporal.ZonedDateTime | null {
        /* node:coverage disable */
        if (value === null) {
            return null;
        }
        /* node:coverage enable */

        if (typeof value === "string") {
            if (isMySql(platform)) {
                // Convert to ISO format
                return Temporal.Instant.from(`${value.replace(" ", "T")}Z`).toZonedDateTimeISO(
                    "UTC",
                );
            }

            return Temporal.Instant.from(value).toZonedDateTimeISO("UTC");
        }

        return Temporal.Instant.fromEpochMilliseconds(value.getTime()).toZonedDateTimeISO("UTC");
    }

    public override compareAsType(): string {
        return "date";
    }

    /* node:coverage disable */
    public override toJSON(value: Temporal.ZonedDateTime | null): string | null {
        return value ? value.toInstant().toString() : null;
    }
    /* node:coverage enable */

    public override getColumnType(prop: EntityProperty, platform: Platform): string {
        if (isMsSql(platform)) {
            // MSSQL has a true single-purpose column type for timestamps with offset.
            return "DATETIMEOFFSET";
        }

        return platform.getDateTimeTypeDeclarationSQL({ length: prop.length });
    }
}
