import { type EntityProperty, type Platform, Type } from "@mikro-orm/core";

export class PlainTimeType extends Type<Temporal.PlainTime | null, string | null> {
    public convertToDatabaseValue(value: Temporal.PlainTime | null): string | null {
        if (value === null) {
            return null;
        }

        return value.toString();
    }

    public convertToJSValue(value: Date | string | null): Temporal.PlainTime | null {
        /* node:coverage disable */
        if (value === null) {
            return null;
        }
        /* node:coverage enable */

        if (value instanceof Date) {
            return Temporal.PlainTime.from({
                hour: value.getHours(),
                minute: value.getMinutes(),
                second: value.getSeconds(),
                millisecond: value.getMilliseconds(),
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
