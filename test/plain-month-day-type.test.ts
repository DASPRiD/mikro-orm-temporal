import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { defineEntity, p, type MikroORM } from "@mikro-orm/core";
import { PlainMonthDayType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

const JsonSchema = defineEntity({
    name: "Json",
    embeddable: true,
    properties: {
        plainMonthDay: p.type(PlainMonthDayType).nullable(),
    },
});

class Json extends JsonSchema.class {
    public constructor(plainMonthDay: Temporal.PlainMonthDay | null) {
        super();
        this.plainMonthDay = plainMonthDay;
    }
}

JsonSchema.setClass(Json);

const PlainMonthDayEntitySchema = defineEntity({
    name: "PlainMonthDayEntity",
    properties: {
        id: p.integer().primary(),
        plainMonthDay: () => p.type(PlainMonthDayType).nullable(),
        json: () => p.embedded(JsonSchema).object(),
    },
});

class PlainMonthDayEntity extends PlainMonthDayEntitySchema.class {
    public constructor(id: number, plainMonthDay: Temporal.PlainMonthDay | null) {
        super();
        this.id = id;
        this.plainMonthDay = plainMonthDay;
        this.json = new Json(plainMonthDay);
    }
}

PlainMonthDayEntitySchema.setClass(PlainMonthDayEntity);

await describe("plain-month-day-type", async () => {
    await describeTestMatrix({ entities: [PlainMonthDayEntity] }, (initOrm) => {
        let orm: MikroORM;

        before(async () => {
            orm = await initOrm();
        });

        after(async () => {
            await orm.close(true);
        });

        it("Stores and retrieves date", async () => {
            const em = orm.em.fork();
            const time = Temporal.PlainMonthDay.from("12-30");
            const entity = new PlainMonthDayEntity(1, time);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainMonthDayEntity, 1);
            assert.ok(fromDatabase.plainMonthDay?.equals(time));
            assert.ok(fromDatabase.json.plainMonthDay?.equals(time));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new PlainMonthDayEntity(2, null);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainMonthDayEntity, 2);
            assert.equal(fromDatabase.plainMonthDay, null);
            assert.equal(fromDatabase.json.plainMonthDay, null);
        });
    });
});
