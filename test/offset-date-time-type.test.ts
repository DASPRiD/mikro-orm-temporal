import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { defineEntity, type MikroORM, p } from "@mikro-orm/core";
import { OffsetDateTimeType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

const JsonSchema = defineEntity({
    name: "Json",
    embeddable: true,
    properties: {
        offsetDateTime: p.type(OffsetDateTimeType).nullable(),
    },
});

class Json extends JsonSchema.class {
    public constructor(offsetDateTime: Temporal.ZonedDateTime | null) {
        super();
        this.offsetDateTime = offsetDateTime;
    }
}

JsonSchema.setClass(Json);

const OffsetDateTimeEntitySchema = defineEntity({
    name: "OffsetDateTimeEntity",
    properties: {
        id: p.integer().primary(),
        offsetDateTime: () => p.type(OffsetDateTimeType).nullable(),
        json: () => p.embedded(JsonSchema).object(),
    },
});

class OffsetDateTimeEntity extends OffsetDateTimeEntitySchema.class {
    public constructor(id: number, offsetDateTime: Temporal.ZonedDateTime | null) {
        super();
        this.id = id;
        this.offsetDateTime = offsetDateTime;
        this.json = new Json(offsetDateTime);
    }
}

OffsetDateTimeEntitySchema.setClass(OffsetDateTimeEntity);

await describe("offset-date-time-type", async () => {
    describeTestMatrix({ entities: [OffsetDateTimeEntity] }, (initOrm) => {
        let orm: MikroORM;

        before(async () => {
            orm = await initOrm();
        });

        after(async () => {
            await orm.close(true);
        });

        it("Stores and retrieves date", async () => {
            const em = orm.em.fork();
            const time = Temporal.ZonedDateTime.from("2005-06-17T13:00:00+02:00[Europe/Berlin]");
            const entity = new OffsetDateTimeEntity(1, time);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(OffsetDateTimeEntity, 1);
            assert.ok(fromDatabase.offsetDateTime?.toInstant().equals(time.toInstant()));
            assert.ok(fromDatabase.json.offsetDateTime?.toInstant().equals(time.toInstant()));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new OffsetDateTimeEntity(2, null);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(OffsetDateTimeEntity, 2);
            assert.equal(fromDatabase.offsetDateTime, null);
            assert.equal(fromDatabase.json.offsetDateTime, null);
        });
    });
});
