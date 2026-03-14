import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { defineEntity, type MikroORM, p } from "@mikro-orm/core";
import { PlainDateTimeType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

const JsonSchema = defineEntity({
    name: "Json",
    embeddable: true,
    properties: {
        plainDateTime: p.type(PlainDateTimeType).nullable(),
    },
});

class Json extends JsonSchema.class {
    public constructor(plainDateTime: Temporal.PlainDateTime | null) {
        super();
        this.plainDateTime = plainDateTime;
    }
}

JsonSchema.setClass(Json);

const PlainDateTimeEntitySchema = defineEntity({
    name: "PlainDateTimeEntity",
    properties: {
        id: p.integer().primary(),
        plainDateTime: () => p.type(PlainDateTimeType).nullable(),
        json: () => p.embedded(JsonSchema).object(),
    },
});

class PlainDateTimeEntity extends PlainDateTimeEntitySchema.class {
    public constructor(id: number, plainDateTime: Temporal.PlainDateTime | null) {
        super();
        this.id = id;
        this.plainDateTime = plainDateTime;
        this.json = new Json(plainDateTime);
    }
}

PlainDateTimeEntitySchema.setClass(PlainDateTimeEntity);

await describe("plain-date-time-type", async () => {
    await describeTestMatrix({ entities: [PlainDateTimeEntity] }, (initOrm) => {
        let orm: MikroORM;

        before(async () => {
            orm = await initOrm();
        });

        after(async () => {
            await orm.close(true);
        });

        it("Stores and retrieves date", async () => {
            const em = orm.em.fork();
            const time = Temporal.PlainDateTime.from("2005-06-17T13:00:00");
            const entity = new PlainDateTimeEntity(1, time);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainDateTimeEntity, 1);
            assert.ok(fromDatabase.plainDateTime?.equals(time));
            assert.ok(fromDatabase.json.plainDateTime?.equals(time));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new PlainDateTimeEntity(2, null);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainDateTimeEntity, 2);
            assert.equal(fromDatabase.plainDateTime, null);
            assert.equal(fromDatabase.json.plainDateTime, null);
        });
    });
});
