import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { defineEntity, p, type MikroORM } from "@mikro-orm/core";
import { PlainTimeType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

const JsonSchema = defineEntity({
    name: "Json",
    embeddable: true,
    properties: {
        plainTime: p.type(PlainTimeType).nullable(),
    },
});

class Json extends JsonSchema.class {
    public constructor(plainTime: Temporal.PlainTime | null) {
        super();
        this.plainTime = plainTime;
    }
}

JsonSchema.setClass(Json);

const PlainTimeEntitySchema = defineEntity({
    name: "PlainTimeEntity",
    properties: {
        id: p.integer().primary(),
        plainTime: () => p.type(PlainTimeType).nullable(),
        json: () => p.embedded(JsonSchema).object(),
    },
});

class PlainTimeEntity extends PlainTimeEntitySchema.class {
    public constructor(id: number, plainTime: Temporal.PlainTime | null) {
        super();
        this.id = id;
        this.plainTime = plainTime;
        this.json = new Json(plainTime);
    }
}

PlainTimeEntitySchema.setClass(PlainTimeEntity);

await describe("plain-time-type", async () => {
    await describeTestMatrix({ entities: [PlainTimeEntity] }, (initOrm) => {
        let orm: MikroORM;

        before(async () => {
            orm = await initOrm();
        });

        after(async () => {
            await orm.close(true);
        });

        it("Stores and retrieves time", async () => {
            const em = orm.em.fork();
            const time = Temporal.PlainTime.from("12:30:29");
            const entity = new PlainTimeEntity(1, time);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainTimeEntity, 1);
            assert.ok(fromDatabase.plainTime?.equals(time));
            assert.ok(fromDatabase.json.plainTime?.equals(time));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new PlainTimeEntity(2, null);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainTimeEntity, 2);
            assert.equal(fromDatabase.plainTime, null);
            assert.equal(fromDatabase.json.plainTime, null);
        });
    });
});
