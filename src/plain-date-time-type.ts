import { type EntityProperty, type Platform, Type } from "@mikro-orm/core";
import { isMsSql, isMySql, isPostgres } from "./utils.js";

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
        value: string | null,
        platform: Platform,
    ): Temporal.PlainDateTime | null {
        /* node:coverage disable */
        if (value === null) {
            return null;
        }
        /* node:coverage enable */

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

        if (isMsSql(platform)) {
            // While MSSQL does have a `datetime2` column, tedious tries to convert it to a `Date` and interprets it
            // as local time, which causes an unwanted time shift.
            return "VARCHAR(19)";
        }

        return platform.getDateTimeTypeDeclarationSQL({ length: prop.length });
    }
}
