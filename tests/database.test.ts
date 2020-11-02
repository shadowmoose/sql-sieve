import { Database } from "../src";
import { Trigger } from "../src/sql/triggers";
const config = require('./setup/test-db-config');

let db = new Database({
    database: config.DB_NAME,
    password: config.PASSWORD,
    user: config.USER,
});


describe("Database tests", () => {
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

    afterAll(() => {
        db.disconnect()
    });
});
