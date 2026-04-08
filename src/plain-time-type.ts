import { type EntityProperty, type Platform, Type } from "@mikro-orm/core";

export class PlainTimeType extends Type<Temporal.PlainTime | null, string | null> {
    public convertToDatabaseValue(value: Temporal.PlainTime | null): string | null {
        if (value === null) {
            return null;
        }

        return value.toString();
    }

    public convertToJSValue(
        value: Date | string | null,
        platform: Platform,
    ): Temporal.PlainTime | null {
        /* node:coverage disable */
        if (value === null) {
            return null;
        }
        /* node:coverage enable */

        if (value instanceof Date) {
            const usesUtc = platform.getConfig().get("forceUtcTimezone", false);
            return Temporal.PlainTime.from({
                hour: usesUtc ? value.getUTCHours() : value.getHours(),
                minute: usesUtc ? value.getUTCMinutes() : value.getMinutes(),
                second: usesUtc ? value.getUTCMinutes() : value.getSeconds(),
                millisecond: usesUtc ? value.getUTCMilliseconds() : value.getMilliseconds(),
            });
        }

        return Temporal.PlainTime.from(value);
    }

    public override compareAsType(): string {
        return "string";
    }

    /* node:coverage disable */
    public override toJSON(value: Temporal.PlainTime | null): string | null {
        return value ? value.toString() : null;
    }
    /* node:coverage enable */

    public override getColumnType(prop: EntityProperty, platform: Platform): string {
        return platform.getTimeTypeDeclarationSQL(prop.length);
    }
}
