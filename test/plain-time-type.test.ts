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
import { PlainTimeType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

@Embeddable()
class Json {
    @Property({ type: PlainTimeType })
    public plainTime: Temporal.PlainTime | null;

    public constructor(plainTime: Temporal.PlainTime | null) {
        this.plainTime = plainTime;
    }
}

@Entity()
class PlainTimeEntity {
    @PrimaryKey({ type: t.integer })
    public id: number;

    @Property({ type: PlainTimeType, nullable: true })
    public plainTime: Temporal.PlainTime | null;

    @Embedded(() => Json, { object: true })
    public json: Json;

    public constructor(id: number, plainTime: Temporal.PlainTime | null) {
        this.id = id;
        this.plainTime = plainTime;
        this.json = new Json(plainTime);
    }
}

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

            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainTimeEntity, 1);
            assert.ok(fromDatabase.plainTime?.equals(time));
            assert.ok(fromDatabase.json.plainTime?.equals(time));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new PlainTimeEntity(2, null);
            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainTimeEntity, 2);
            assert.equal(fromDatabase.plainTime, null);
            assert.equal(fromDatabase.json.plainTime, null);
        });
    });
});
