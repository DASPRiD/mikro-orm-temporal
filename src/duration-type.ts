import { type EntityProperty, type Platform, Type } from "@mikro-orm/core";
import { isPostgres } from "./utils.js";

type PostgresInterval = {
    toISO: () => string;
};

export class DurationType extends Type<Temporal.Duration | null, string | number | null> {
    public convertToDatabaseValue(value: Temporal.Duration | null): string | number | null {
        if (value === null) {
            return null;
        }

        return value.toString();
    }

    public convertToJSValue(
        value: string | number | null,
        platform: Platform,
    ): Temporal.Duration | null {
        /* node:coverage disable */
        if (value === null) {
            return null;
        }

        if (typeof value === "number") {
            return Temporal.Duration.from({ seconds: value });
        }
        /* node:coverage enable */

        if (value.startsWith("P")) {
            return Temporal.Duration.from(value);
        }

        if (isPostgres(platform)) {
            const interval = platform.convertIntervalToJSValue(value) as PostgresInterval;
            return Temporal.Duration.from(interval.toISO());
        }

        /* node:coverage disable */
        throw new Error(`Unexpected interval value: ${value}`);
        /* node:coverage enable */
    }

    /* node:coverage disable */
    public override toJSON(value: Temporal.Duration | null): string | null {
        return value ? value.toString() : null;
    }
    /* node:coverage enable */

    public override getColumnType(_prop: EntityProperty, platform: Platform): string {
        if (isPostgres(platform)) {
            // Postgres has a true single-purpose column type for intervals.
            return platform.getIntervalTypeDeclarationSQL({});
        }

        // For all other platforms we store the duration as string in ISO format.
        return platform.getVarcharTypeDeclarationSQL({});
    }
}
