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
import { PlainYearMonthType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

@Embeddable()
class Json {
    @Property({ type: PlainYearMonthType })
    public plainYearMonth: Temporal.PlainYearMonth | null;

    public constructor(plainYearMonth: Temporal.PlainYearMonth | null) {
        this.plainYearMonth = plainYearMonth;
    }
}

@Entity()
class PlainYearMonthEntity {
    @PrimaryKey({ type: t.integer })
    public id: number;

    @Property({ type: PlainYearMonthType, nullable: true })
    public plainYearMonth: Temporal.PlainYearMonth | null;

    @Embedded(() => Json, { object: true })
    public json: Json;

    public constructor(id: number, plainYearMonth: Temporal.PlainYearMonth | null) {
        this.id = id;
        this.plainYearMonth = plainYearMonth;
        this.json = new Json(plainYearMonth);
    }
}

await describe("plain-year-month-type", async () => {
    await describeTestMatrix({ entities: [PlainYearMonthEntity] }, (initOrm) => {
        let orm: MikroORM;

        before(async () => {
            orm = await initOrm();
        });

        after(async () => {
            await orm.close(true);
        });

        it("Stores and retrieves date", async () => {
            const em = orm.em.fork();
            const time = Temporal.PlainYearMonth.from("2005-06");
            const entity = new PlainYearMonthEntity(1, time);

            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainYearMonthEntity, 1);
            assert.ok(fromDatabase.plainYearMonth?.equals(time));
            assert.ok(fromDatabase.json.plainYearMonth?.equals(time));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new PlainYearMonthEntity(2, null);
            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainYearMonthEntity, 2);
            assert.equal(fromDatabase.plainYearMonth, null);
            assert.equal(fromDatabase.json.plainYearMonth, null);
        });
    });
});
