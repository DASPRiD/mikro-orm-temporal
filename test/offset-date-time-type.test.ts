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
import { OffsetDateTimeType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

@Embeddable()
class Json {
    @Property({ type: OffsetDateTimeType })
    public offsetDateTime: Temporal.ZonedDateTime | null;

    public constructor(offsetDateTime: Temporal.ZonedDateTime | null) {
        this.offsetDateTime = offsetDateTime;
    }
}

@Entity()
class OffsetDateTimeEntity {
    @PrimaryKey({ type: t.integer })
    public id: number;

    @Property({ type: OffsetDateTimeType, nullable: true })
    public offsetDateTime: Temporal.ZonedDateTime | null;

    @Embedded(() => Json, { object: true })
    public json: Json;

    public constructor(id: number, offsetDateTime: Temporal.ZonedDateTime | null) {
        this.id = id;
        this.offsetDateTime = offsetDateTime;
        this.json = new Json(offsetDateTime);
    }
}

await describe("offset-date-time-type", async () => {
    await describeTestMatrix({ entities: [OffsetDateTimeEntity] }, (initOrm) => {
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

            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(OffsetDateTimeEntity, 1);
            assert.ok(fromDatabase.offsetDateTime?.toInstant().equals(time.toInstant()));
            assert.ok(fromDatabase.json.offsetDateTime?.toInstant().equals(time.toInstant()));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new OffsetDateTimeEntity(2, null);
            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(OffsetDateTimeEntity, 2);
            assert.equal(fromDatabase.offsetDateTime, null);
            assert.equal(fromDatabase.json.offsetDateTime, null);
        });
    });
});
