import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { defineEntity, p, type MikroORM } from "@mikro-orm/core";
import { PlainYearMonthType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

const JsonSchema = defineEntity({
    name: "Json",
    embeddable: true,
    properties: {
        plainYearMonth: p.type(PlainYearMonthType).nullable(),
    },
});

class Json extends JsonSchema.class {
    public constructor(plainYearMonth: Temporal.PlainYearMonth | null) {
        super();
        this.plainYearMonth = plainYearMonth;
    }
}

JsonSchema.setClass(Json);

const PlainYearMonthEntitySchema = defineEntity({
    name: "PlainYearMonthEntity",
    properties: {
        id: p.integer().primary(),
        plainYearMonth: () => p.type(PlainYearMonthType).nullable(),
        json: () => p.embedded(JsonSchema).object(),
    },
});

class PlainYearMonthEntity extends PlainYearMonthEntitySchema.class {
    public constructor(id: number, plainYearMonth: Temporal.PlainYearMonth | null) {
        super();
        this.id = id;
        this.plainYearMonth = plainYearMonth;
        this.json = new Json(plainYearMonth);
    }
}

PlainYearMonthEntitySchema.setClass(PlainYearMonthEntity);

await describe("plain-year-month-type", async () => {
    await describeTestMatrix({ entities: [PlainYearMonthEntity] }, (initOrm) => {
        let orm: MikroORM;

        before(async () => {
            orm = await initOrm();
        });

        after(async () => {
            await orm.close(true);
        });

        it("Stores and retrieves date", async () => {
            const em = orm.em.fork();
            const time = Temporal.PlainYearMonth.from("2005-06");
            const entity = new PlainYearMonthEntity(1, time);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainYearMonthEntity, 1);
            assert.ok(fromDatabase.plainYearMonth?.equals(time));
            assert.ok(fromDatabase.json.plainYearMonth?.equals(time));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new PlainYearMonthEntity(2, null);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainYearMonthEntity, 2);
            assert.equal(fromDatabase.plainYearMonth, null);
            assert.equal(fromDatabase.json.plainYearMonth, null);
        });
    });
});
