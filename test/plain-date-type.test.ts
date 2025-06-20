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
import { PlainDateType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

@Embeddable()
class Json {
    @Property({ type: PlainDateType })
    public plainDate: Temporal.PlainDate | null;

    public constructor(plainDate: Temporal.PlainDate | null) {
        this.plainDate = plainDate;
    }
}

@Entity()
class PlainDateEntity {
    @PrimaryKey({ type: t.integer })
    public id: number;

    @Property({ type: PlainDateType, nullable: true })
    public plainDate: Temporal.PlainDate | null;

    @Embedded(() => Json, { object: true })
    public json: Json;

    public constructor(id: number, plainDate: Temporal.PlainDate | null) {
        this.id = id;
        this.plainDate = plainDate;
        this.json = new Json(plainDate);
    }
}

await describe("plain-date-type", async () => {
    await describeTestMatrix({ entities: [PlainDateEntity] }, (initOrm) => {
        let orm: MikroORM;

        before(async () => {
            orm = await initOrm();
        });

        after(async () => {
            await orm.close(true);
        });

        it("Stores and retrieves date", async () => {
            const em = orm.em.fork();
            const time = Temporal.PlainDate.from("2005-06-17");
            const entity = new PlainDateEntity(1, time);

            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainDateEntity, 1);
            assert.ok(fromDatabase.plainDate?.equals(time));
            assert.ok(fromDatabase.json.plainDate?.equals(time));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new PlainDateEntity(2, null);
            await em.persistAndFlush(entity);
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainDateEntity, 2);
            assert.equal(fromDatabase.plainDate, null);
            assert.equal(fromDatabase.json.plainDate, null);
        });
    });
});
