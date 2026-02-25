import { type EntityProperty, type Platform, Type } from "@mikro-orm/core";
import { isMsSql, isMySql } from "./utils.js";

export class InstantType extends Type<Temporal.Instant | null, string | null> {
    public convertToDatabaseValue(
        value: Temporal.Instant | null,
        platform: Platform,
    ): string | null {
        if (value === null) {
            return null;
        }

        if (isMySql(platform)) {
            // Convert to MySQL format
            return value.toZonedDateTimeISO("UTC").toPlainDateTime().toString().replace("T", " ");
        }

        return value.toString();
    }

    public convertToJSValue(
        value: Date | string | null,
        platform: Platform,
    ): Temporal.Instant | null {
        /* node:coverage disable */
        if (value === null) {
            return null;
        }
        /* node:coverage enable */

        if (typeof value === "string") {
            if (isMySql(platform)) {
                // Convert to ISO format
                return Temporal.Instant.from(`${value.replace(" ", "T")}Z`);
            }

            return Temporal.Instant.from(value);
        }

        return Temporal.Instant.fromEpochMilliseconds(value.getTime());
    }

    public override compareAsType(): string {
        return "date";
    }

    /* node:coverage disable */
    public override toJSON(value: Temporal.Instant | null): string | null {
        return value ? value.toString() : null;
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
