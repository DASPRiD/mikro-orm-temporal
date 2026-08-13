import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { defineEntity, type MikroORM, p } from "@mikro-orm/core";
import { SqlitePlatform } from "@mikro-orm/sqlite";
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
    it("passes through an already-converted value", () => {
        const value = Temporal.Instant.from("2005-06-17T13:00:00Z");
        assert.equal(new InstantType().convertToJSValue(value, new SqlitePlatform()), value);
    });

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

        it("accepts an already-converted value in a cursor", async () => {
            const em = orm.em.fork();
            await em
                .persist([
                    new InstantEntity(3, Temporal.Instant.from("2005-06-17T13:00:00Z")),
                    new InstantEntity(4, Temporal.Instant.from("2005-06-18T13:00:00Z")),
                ])
                .flush();
            em.clear();

            const page = await em.findByCursor(InstantEntity, {
                where: {},
                orderBy: { instant: "asc", id: "asc" },
                first: 1,
                after: { instant: Temporal.Instant.from("2005-06-17T13:00:00Z"), id: 3 },
            });

            assert.equal(page.items.length, 1);
            assert.equal(page.items[0].id, 4);
        });
    });
});
