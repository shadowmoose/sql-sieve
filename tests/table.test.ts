import {Table} from "../src";

describe("Base tests", () => {
  it("Table parser should work", () => {
    const t = new Table(`
      CREATE TABLE TEST (
        id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        firstname VARCHAR(30) NOT NULL,
        lastname VARCHAR(30) NOT NULL,
        email VARCHAR(50),
        reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (XPersonID) REFERENCES Persons(PersonID)
      )
    `);

    expect(t.columns.length).toEqual(5);
    expect(t.constraints.length).toEqual(1);
    expect(t.requiredTableNames.sort()).toEqual(['Persons'].sort());

    expect(t.uniqueRowID({id: 1337, fake: 'field'})).toEqual('[1337]');
  });

  it("Compound unique index should hash", () => {
    const tst = new Table(`
      CREATE TABLE TEST (
        id INT(6) UNSIGNED,
        firstname VARCHAR(30) NOT NULL,
        lastname VARCHAR(30) NOT NULL,
        email VARCHAR(50),
        reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (XPersonID) REFERENCES Persons(PersonID),
        UNIQUE KEY(firstname, lastname)
      )
    `);

    expect(tst.uniqueRowID({id: 1337, firstname: 'first', lastname: 'last'})).toEqual(`["first","last"]`);
  });

  it("Null values should be unique", () => {
    const tst = new Table(`
      CREATE TABLE TEST (
        firstname VARCHAR(30) NOT NULL,
        lastname VARCHAR(30) NOT NULL,
        UNIQUE KEY(firstname, lastname)
      )
    `);

    const id1 = tst.uniqueRowID({firstname: 'first', lastname: null});
    const id2 = tst.uniqueRowID({firstname: 'first', lastname: null});

    expect(id1).not.toEqual(id2);
  });
});
