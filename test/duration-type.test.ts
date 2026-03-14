import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { defineEntity, p, type MikroORM } from "@mikro-orm/core";
import { DurationType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

const JsonSchema = defineEntity({
    name: "Json",
    embeddable: true,
    properties: {
        duration: p.type(DurationType).nullable(),
    },
});

class Json extends JsonSchema.class {
    public constructor(duration: Temporal.Duration | null) {
        super();
        this.duration = duration;
    }
}

JsonSchema.setClass(Json);

const DurationEntitySchema = defineEntity({
    name: "DurationEntity",
    properties: {
        id: p.integer().primary(),
        duration: () => p.type(DurationType).nullable(),
        json: () => p.embedded(JsonSchema).object(),
    },
});

class DurationEntity extends DurationEntitySchema.class {
    public constructor(id: number, duration: Temporal.Duration | null) {
        super();
        this.id = id;
        this.duration = duration;
        this.json = new Json(duration);
    }
}

DurationEntitySchema.setClass(DurationEntity);

await describe("duration-type", async () => {
    await describeTestMatrix({ entities: [DurationEntity] }, (initOrm) => {
        let orm: MikroORM;

        before(async () => {
            orm = await initOrm();
        });

        after(async () => {
            await orm.close(true);
        });

        it("stores and retrieves duration", async () => {
            const em = orm.em.fork();
            const duration = Temporal.Duration.from("P1D");
            const entity = new DurationEntity(1, duration);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(DurationEntity, 1);
            assert.equal(
                fromDatabase.duration?.total({ unit: "seconds" }),
                duration.total({ unit: "seconds" }),
            );
            assert.equal(
                fromDatabase.json.duration?.total({ unit: "seconds" }),
                duration.total({ unit: "seconds" }),
            );
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new DurationEntity(2, null);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(DurationEntity, 2);
            assert.equal(fromDatabase.duration, null);
            assert.equal(fromDatabase.json.duration, null);
        });
    });
});
