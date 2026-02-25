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
import { InstantType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

@Embeddable()
class Json {
    @Property({ type: InstantType })
    public instant: Temporal.Instant | null;

    public constructor(instant: Temporal.Instant | null) {
        this.instant = instant;
    }
}

@Entity()
class InstantEntity {
    @PrimaryKey({ type: t.integer })
    public id: number;

    @Property({ type: InstantType, nullable: true })
    public instant: Temporal.Instant | null;

    @Embedded(() => Json, { object: true })
    public json: Json;

    public constructor(id: number, instant: Temporal.Instant | null) {
        this.id = id;
        this.instant = instant;
        this.json = new Json(instant);
    }
}

await describe("instant-type", async () => {
    await describeTestMatrix({ entities: [InstantEntity] }, (initOrm) => {
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

            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(InstantEntity, 1);
            assert.ok(fromDatabase.instant?.equals(time));
            assert.ok(fromDatabase.json.instant?.equals(time));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new InstantEntity(2, null);
            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(InstantEntity, 2);
            assert.equal(fromDatabase.instant, null);
            assert.equal(fromDatabase.json.instant, null);
        });
    });
});
