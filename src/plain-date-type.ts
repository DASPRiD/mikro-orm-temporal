import { type EntityProperty, type Platform, Type } from "@mikro-orm/core";

export class PlainDateType extends Type<Temporal.PlainDate | null, string | Date | null> {
    public convertToDatabaseValue(value: Temporal.PlainDate | null): string | null {
        if (!value) {
            return null;
        }

        return value.toString();
    }

    public convertToJSValue(value: string | Date | null): Temporal.PlainDate | null {
        /* node:coverage disable */
        if (!value) {
            return null;
        }
        /* node:coverage enable */

        if (value instanceof Date) {
            return Temporal.PlainDate.from({
                year: value.getFullYear(),
                month: value.getMonth() + 1,
                day: value.getDate(),
            });
        }

        return Temporal.PlainDate.from(value);
    }

    public override compareAsType(): string {
        return "string";
    }

    /* node:coverage disable */
    public override toJSON(value: Temporal.PlainDate | null): string | null {
        return value ? value.toString() : null;
    }
    /* node:coverage enable */

    public override getColumnType(prop: EntityProperty, platform: Platform): string {
        return platform.getDateTypeDeclarationSQL(prop.length);
    }
}
