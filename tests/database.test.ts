import { Database } from "../src";
import { Trigger } from "../src/sql/triggers";

let db = new Database({
    database: 'testdb',
    password: 'dbtest',
    user: 'root',
});


describe("Database tests", () => {
    beforeAll(async () => {
        await db.loadAll();
    });

    it('Lookup should work', async () => {
        const row = await db.tables['USERS'].select({ id: 1 });
        const tree = await db.findTree(row, true);

        expect(tree['SECOND_TABLE'][0].id).toEqual('[2]');
        console.log(tree);
    });

    it('Triggers should load', async () => {
        const trig: Trigger = db.triggers['test_trigger'];
        expect(trig.toSQL()).toContain(trig.name);
    });

    afterAll(() => {
        db.disconnect()
    });
});
