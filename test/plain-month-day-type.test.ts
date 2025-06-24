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
import { PlainMonthDayType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

@Embeddable()
class Json {
    @Property({ type: PlainMonthDayType })
    public plainMonthDay: Temporal.PlainMonthDay | null;

    public constructor(plainMonthDay: Temporal.PlainMonthDay | null) {
        this.plainMonthDay = plainMonthDay;
    }
}

@Entity()
class PlainMonthDayEntity {
    @PrimaryKey({ type: t.integer })
    public id: number;

    @Property({ type: PlainMonthDayType, nullable: true })
    public plainMonthDay: Temporal.PlainMonthDay | null;

    @Embedded(() => Json, { object: true })
    public json: Json;

    public constructor(id: number, plainMonthDay: Temporal.PlainMonthDay | null) {
        this.id = id;
        this.plainMonthDay = plainMonthDay;
        this.json = new Json(plainMonthDay);
    }
}

await describe("plain-year-month-type", async () => {
    await describeTestMatrix({ entities: [PlainMonthDayEntity] }, (initOrm) => {
        let orm: MikroORM;

        before(async () => {
            orm = await initOrm();
        });

        after(async () => {
            await orm.close(true);
        });

        it("Stores and retrieves date", async () => {
            const em = orm.em.fork();
            const time = Temporal.PlainMonthDay.from("12-30");
            const entity = new PlainMonthDayEntity(1, time);

            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainMonthDayEntity, 1);
            assert.ok(fromDatabase.plainMonthDay?.equals(time));
            assert.ok(fromDatabase.json.plainMonthDay?.equals(time));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new PlainMonthDayEntity(2, null);
            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainMonthDayEntity, 2);
            assert.equal(fromDatabase.plainMonthDay, null);
            assert.equal(fromDatabase.json.plainMonthDay, null);
        });
    });
});
