import { type EntityProperty, type Platform, Type } from "@mikro-orm/core";

export class PlainYearMonthType extends Type<Temporal.PlainYearMonth | null, string | null> {
    public convertToDatabaseValue(value: Temporal.PlainYearMonth | null): string | null {
        if (!value) {
            return null;
        }

        return value.toString();
    }

    public convertToJSValue(value: string | null): Temporal.PlainYearMonth | null {
        /* node:coverage disable */
        if (!value) {
            return null;
        }
        /* node:coverage enable */

        return Temporal.PlainYearMonth.from(value);
    }

    public override compareAsType(): string {
        return "string";
    }

    /* node:coverage disable */
    public override toJSON(value: Temporal.PlainYearMonth | null): string | null {
        return value ? value.toString() : null;
    }
    /* node:coverage enable */

    public override getColumnType(_prop: EntityProperty, platform: Platform): string {
        return platform.getCharTypeDeclarationSQL({ length: 7 });
    }
}
