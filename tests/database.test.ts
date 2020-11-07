import { Database } from "../src";
import { Trigger } from "../src/sql/triggers";
import {DBConnection} from "../src/sql/dbconnection";
const config = require('./setup/test-db-config');

const conn = new DBConnection({
    database: config.DB_NAME,
    password: config.PASSWORD,
    user: config.USER,
});

let db = new Database(conn);


describe("Database & Connection Tests", () => {
    beforeAll(async () => {
        await db.loadAll();
    });

    it('Lookup should work', async () => {
        const row = await db.tables['USERS'].select({ id: 1 });
        const tree = await db.findTree(row, true);

        expect(tree['SECOND_TABLE'][0].id).toEqual('[2]');
    });

    it('Triggers should load', async () => {
        const trig: Trigger = db.triggers['test_trigger'];
        expect(trig.toSQL()).toContain(trig.name);
    });

    it('Locks should work', async () => {
        const res = await conn.withLock(() => {
            return 'OK'
        });
        expect(res).toEqual('OK');
    });

    it('Connection query should work', async () => {
        const res = await conn.select('USERS', { id: 1, firstname: 'first' });
        expect(res[0].id).toEqual(1);
    });

    afterAll(() => {
        db.disconnect()
    });
});
