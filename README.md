# SQL Sieve
![Lines of Code](https://raw.githubusercontent.com/shadowmoose/sql-sieve/image-data/loc-badge.svg) [![npm](https://img.shields.io/npm/v/sql-sieve)](https://www.npmjs.com/package/sql-sieve)

This tool helps with Database access,
as well as providing powerful tools to recursively pick specific row data for staging and testing.

See [tests](./tests) for more.

```typescript
let db = new Database({
    database: 'test_db',
    password: 'password',
    user: 'root'
});

await db.loadAll();

const row = await db.tables['USERS'].select({ id: 1 });
const tree = await db.findTree(row, true);
// "tree" now contains a map of all the rows required to migrate the selected data into a fresh DB.

console.log(tree);
/*
Outputs something like:
{ USERS: [ Row { table: [Table], id: '[1]', data: [TextRow] } ],
      SECOND_TABLE: [ Row { table: [Table], id: '[2]', data: [TextRow] } ] }
*/
```
