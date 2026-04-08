import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { defineEntity, type MikroORM, p } from "@mikro-orm/core";
import { PlainTimeType } from "../src/index.js";
import { describeTestMatrix } from "./matrix.js";

const JsonSchema = defineEntity({
    name: "Json",
    embeddable: true,
    properties: {
        plainTime: p.type(PlainTimeType).nullable(),
    },
});

class Json extends JsonSchema.class {
    public constructor(plainTime: Temporal.PlainTime | null) {
        super();
        this.plainTime = plainTime;
    }
}

JsonSchema.setClass(Json);

const PlainTimeEntitySchema = defineEntity({
    name: "PlainTimeEntity",
    properties: {
        id: p.integer().primary(),
        plainTime: () => p.type(PlainTimeType).nullable(),
        json: () => p.embedded(JsonSchema).object(),
    },
});

class PlainTimeEntity extends PlainTimeEntitySchema.class {
    public constructor(id: number, plainTime: Temporal.PlainTime | null) {
        super();
        this.id = id;
        this.plainTime = plainTime;
        this.json = new Json(plainTime);
    }
}

PlainTimeEntitySchema.setClass(PlainTimeEntity);

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
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainTimeEntity, 1);
            assert.ok(fromDatabase.plainTime?.equals(time));
            assert.ok(fromDatabase.json.plainTime?.equals(time));
        });

        it("accepts null", async () => {
            const em = orm.em.fork();
            const entity = new PlainTimeEntity(2, null);
            await em.persist(entity).flush();
            em.clear();

            const fromDatabase = await em.findOneOrFail(PlainTimeEntity, 2);
            assert.equal(fromDatabase.plainTime, null);
            assert.equal(fromDatabase.json.plainTime, null);
        });

        it("uses local timezone when forceUtcTimezone is disabled", () => {
            const type = new PlainTimeType();
            const date = new Date("1970-01-01T03:04:05.006Z");
            const oldTZ = process.env.TZ;
            process.env.TZ = "America/Chicago";
            const platform = {
                getConfig: () => ({
                    get: (key: string, defaultValue: boolean) =>
                        key === "forceUtcTimezone" ? false : defaultValue,
                }),
            } as never;

            const time = type.convertToJSValue(date, platform);
            const expectedTime = Temporal.PlainTime.from("21:05.006");

            process.env.TZ = oldTZ;
            assert.ok(time?.equals(expectedTime));
        });

        it("uses UTC timezone when forceUtcTimezone is enabled", () => {
            const type = new PlainTimeType();
            const date = new Date("1970-01-01T03:04:05.006Z");
            const platform = {
                getConfig: () => ({
                    get: (key: string, defaultValue: boolean) =>
                        key === "forceUtcTimezone" ? true : defaultValue,
                }),
            } as never;

            const time = type.convertToJSValue(date, platform);

            assert.ok(time?.equals(Temporal.PlainTime.from("03:04:05.006")));
        });
    });
});
