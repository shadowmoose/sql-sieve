import {Table, Row} from "../src";

const t = new Table(`
    CREATE TABLE USERS (
        id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        xpk INT(6) NOT NULL,
        firstname VARCHAR(30) NOT NULL,
        lastname VARCHAR(30) NOT NULL,
        email VARCHAR(50),
        FOREIGN KEY (xpk) REFERENCES FAKE_TABLE(userID)
    )
`);

const t2 = new Table(`
    CREATE TABLE SECOND_TABLE (
        id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        xfirstname VARCHAR(30) NOT NULL,
        xlastname VARCHAR(30) NOT NULL,
        FOREIGN KEY (xfirstname, xlastname) REFERENCES USERS(firstname, lastname),
        FOREIGN KEY (xlastname) REFERENCES USERS(lastname)
    )
`);

describe("Row tests", () => {
    it("linksUp should work", () => {
        const data = {
            id: 1,
            xpk: 12,
            firstname: 'first',
            lastname: 'last',
            email: 'test@email.com',
        };
        const r = new Row(t, t.uniqueRowID(data), data);
        expect(r.linksUp()).toMatchObject([ { tableName: 'FAKE_TABLE', where: { userID: 12 } } ]);
    });

    it("linksDown should work", () => {
        const data = {
            id: 1,
            xpk: 12,
            firstname: 'xfirstval',
            lastname: 'xlastval',
            email: 'test@email.com',
        };
        const r = new Row(t, t.uniqueRowID(data), data);
        expect(r.linksDown([t, t2])).toMatchObject([
            {
                tableName: 'SECOND_TABLE',
                where: {
                    xfirstname: 'xfirstval',
                    xlastname: 'xlastval',
                }
            },
            {
                tableName: 'SECOND_TABLE',
                where: {
                    xlastname: 'xlastval'
                }
            }
        ]);
    });

    it("Empty values should be flagged", () => {
        const data = {
            id: 1,
            xpk: null,
            firstname: 'first',
            lastname: null,
            email: 'test@email.com',
        };
        const r = new Row(t, t.uniqueRowID(data), data);
        expect(r.linksUp()[0].hasNull).toEqual(true);

        // @ts-ignore
        data.xpk = 0;
        expect(r.linksUp()[0].hasNull).toEqual(false);  // no longer missing xpk.

        expect(r.linksDown([t, t2])[0].hasNull).toEqual(true); // Missing lastname for FK.
    });
});
