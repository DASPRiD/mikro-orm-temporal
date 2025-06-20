import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
    Embeddable,
    Embedded,
    Entity,
    type MikroORM,
    PrimaryKey,
    Property,
    t,
} from "@mikro-orm/core";
import { DurationType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

@Embeddable()
class Json {
    @Property({ type: DurationType })
    public duration: Temporal.Duration | null;

    public constructor(duration: Temporal.Duration | null) {
        this.duration = duration;
    }
}

@Entity()
class DurationEntity {
    @PrimaryKey({ type: t.integer })
    public id: number;

    @Property({ type: DurationType, nullable: true })
    public duration: Temporal.Duration | null;

    @Embedded(() => Json, { object: true })
    public json: Json;

    public constructor(id: number, duration: Temporal.Duration | null) {
        this.id = id;
        this.duration = duration;
        this.json = new Json(duration);
    }
}

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
            await em.persistAndFlush(entity);
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
            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(DurationEntity, 2);
            assert.equal(fromDatabase.duration, null);
            assert.equal(fromDatabase.json.duration, null);
        });
    });
});
