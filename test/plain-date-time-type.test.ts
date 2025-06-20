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
import { PlainDateTimeType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

@Embeddable()
class Json {
    @Property({ type: PlainDateTimeType })
    public plainDateTime: Temporal.PlainDateTime | null;

    public constructor(plainDateTime: Temporal.PlainDateTime | null) {
        this.plainDateTime = plainDateTime;
    }
}

@Entity()
class PlainDateTimeEntity {
    @PrimaryKey({ type: t.integer })
    public id: number;

    @Property({ type: PlainDateTimeType, nullable: true })
    public plainDateTime: Temporal.PlainDateTime | null;

    @Embedded(() => Json, { object: true })
    public json: Json;

    public constructor(id: number, plainDateTime: Temporal.PlainDateTime | null) {
        this.id = id;
        this.plainDateTime = plainDateTime;
        this.json = new Json(plainDateTime);
    }
}

await describe("plain-date-time-type", async () => {
    await describeTestMatrix({ entities: [PlainDateTimeEntity] }, (initOrm) => {
        let orm: MikroORM;

        before(async () => {
            orm = await initOrm();
        });

        after(async () => {
            await orm.close(true);
        });

        it("Stores and retrieves date", async () => {
            const em = orm.em.fork();
            const time = Temporal.PlainDateTime.from("2005-06-17T13:00:00");
            const entity = new PlainDateTimeEntity(1, time);

            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainDateTimeEntity, 1);
            assert.ok(fromDatabase.plainDateTime?.equals(time));
            assert.ok(fromDatabase.json.plainDateTime?.equals(time));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new PlainDateTimeEntity(2, null);
            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainDateTimeEntity, 2);
            assert.equal(fromDatabase.plainDateTime, null);
            assert.equal(fromDatabase.json.plainDateTime, null);
        });
    });
});
