import { randomUUID } from "node:crypto";
import { describe } from "node:test";
import { MikroORM as SqliteMikroORM } from "@mikro-orm/better-sqlite";
import type { AnyEntity, EntityClass, MikroORM } from "@mikro-orm/core";
import { MikroORM as MariadbMikroORM } from "@mikro-orm/mariadb";
import { MikroORM as MssqlMikroORM } from "@mikro-orm/mssql";
import { MikroORM as MysqlMikroORM } from "@mikro-orm/mysql";
import { MikroORM as PostgresMikroORM } from "@mikro-orm/postgresql";

if (typeof Temporal === "undefined") {
    await import("temporal-polyfill/global");
}

type Runner = (initOrm: () => Promise<MikroORM>) => void;

type MatrixOptions = {
    entities: EntityClass<AnyEntity>[];
};

export const describeTestMatrix = async ({ entities }: MatrixOptions, runner: Runner) => {
    describe("SQLite", () => {
        runner(() =>
            prepareOrm(
                SqliteMikroORM.init({
                    dbName: ":memory:",
                    entities,
                    discovery: {
                        warnWhenNoEntities: false,
                    },
                }),
            ),
        );
    });

    describe("MySQL", () => {
        runner(() =>
            prepareOrm(
                MysqlMikroORM.init({
                    dbName: `mikro_orm_test_${randomUUID().replace(/-/g, "_")}`,
                    port: 5001,
                    entities,
                    discovery: {
                        warnWhenNoEntities: false,
                    },
                }),
            ),
        );
    });

    describe("MariaDB", () => {
        runner(() =>
            prepareOrm(
                MariadbMikroORM.init({
                    dbName: `mikro_orm_test_${randomUUID().replace(/-/g, "_")}`,
                    port: 5002,
                    entities,
                    discovery: {
                        warnWhenNoEntities: false,
                    },
                }),
            ),
        );
    });

    describe("Postgres", () => {
        runner(() =>
            prepareOrm(
                PostgresMikroORM.init({
                    dbName: `mikro_orm_test_${randomUUID().replace(/-/g, "_")}`,
                    port: 5003,
                    entities,
                    discovery: {
                        warnWhenNoEntities: false,
                    },
                }),
            ),
        );
    });

    describe("MSSQL", () => {
        runner(() =>
            prepareOrm(
                MssqlMikroORM.init({
                    dbName: `mikro_orm_test_${randomUUID().replace(/-/g, "_")}`,
                    port: 5004,
                    user: "sa",
                    password: "Root.Root",
                    entities,
                    discovery: {
                        warnWhenNoEntities: false,
                    },
                }),
            ),
        );
    });
};

const prepareOrm = async (ormPromise: Promise<MikroORM>): Promise<MikroORM> => {
    const orm = await ormPromise;

    try {
        await orm.schema.ensureDatabase();
        await orm.schema.dropSchema();
        await orm.schema.createSchema();
    } catch (error) {
        await orm.close(true);
        throw error;
    }

    return orm;
};
