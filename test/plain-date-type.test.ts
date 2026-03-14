import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { defineEntity, type MikroORM, p } from "@mikro-orm/core";
import { PlainDateType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

const JsonSchema = defineEntity({
    name: "Json",
    embeddable: true,
    properties: {
        plainDate: p.type(PlainDateType).nullable(),
    },
});

class Json extends JsonSchema.class {
    public constructor(plainDate: Temporal.PlainDate | null) {
        super();
        this.plainDate = plainDate;
    }
}

JsonSchema.setClass(Json);

const PlainDateEntitySchema = defineEntity({
    name: "PlainDateEntity",
    properties: {
        id: p.integer().primary(),
        plainDate: () => p.type(PlainDateType).nullable(),
        json: () => p.embedded(JsonSchema).object(),
    },
});

class PlainDateEntity extends PlainDateEntitySchema.class {
    public constructor(id: number, plainDate: Temporal.PlainDate | null) {
        super();
        this.id = id;
        this.plainDate = plainDate;
        this.json = new Json(plainDate);
    }
}

PlainDateEntitySchema.setClass(PlainDateEntity);

await describe("plain-date-type", async () => {
    await describeTestMatrix({ entities: [PlainDateEntity] }, (initOrm) => {
        let orm: MikroORM;

        before(async () => {
            orm = await initOrm();
        });

        after(async () => {
            await orm.close(true);
        });

        it("Stores and retrieves date", async () => {
            const em = orm.em.fork();
            const time = Temporal.PlainDate.from("2005-06-17");
            const entity = new PlainDateEntity(1, time);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainDateEntity, 1);
            assert.ok(fromDatabase.plainDate?.equals(time));
            assert.ok(fromDatabase.json.plainDate?.equals(time));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new PlainDateEntity(2, null);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainDateEntity, 2);
            assert.equal(fromDatabase.plainDate, null);
            assert.equal(fromDatabase.json.plainDate, null);
        });
    });
});
