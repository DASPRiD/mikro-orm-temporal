import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { defineEntity, type MikroORM, p } from "@mikro-orm/core";
import { InstantType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

const JsonSchema = defineEntity({
    name: "Json",
    embeddable: true,
    properties: {
        instant: p.type(InstantType).nullable(),
    },
});

class Json extends JsonSchema.class {
    public constructor(instant: Temporal.Instant | null) {
        super();
        this.instant = instant;
    }
}

JsonSchema.setClass(Json);

const InstantEntitySchema = defineEntity({
    name: "InstantEntity",
    properties: {
        id: p.integer().primary(),
        instant: () => p.type(InstantType).nullable(),
        json: () => p.embedded(JsonSchema).object(),
    },
});

class InstantEntity extends InstantEntitySchema.class {
    public constructor(id: number, instant: Temporal.Instant | null) {
        super();
        this.id = id;
        this.instant = instant;
        this.json = new Json(instant);
    }
}

InstantEntitySchema.setClass(InstantEntity);

await describe("instant-type", async () => {
    describeTestMatrix({ entities: [InstantEntity] }, (initOrm) => {
        let orm: MikroORM;

        before(async () => {
            orm = await initOrm();
        });

        after(async () => {
            await orm.close(true);
        });

        it("Stores and retrieves date", async () => {
            const em = orm.em.fork();
            const time = Temporal.Instant.from("2005-06-17T13:00:00Z");
            const entity = new InstantEntity(1, time);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(InstantEntity, 1);
            assert.ok(fromDatabase.instant?.equals(time));
            assert.ok(fromDatabase.json.instant?.equals(time));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new InstantEntity(2, null);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(InstantEntity, 2);
            assert.equal(fromDatabase.instant, null);
            assert.equal(fromDatabase.json.instant, null);
        });
    });
});
