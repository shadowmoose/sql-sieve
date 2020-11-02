import {Table} from "../src";
import Row from "../src/sql/row";

/**
 * Create a mocked new Row object, in a more concise way.
 */
export function testRow(data: any, tableFor?: Table) {
    const tbl = tableFor || new Table('');
    return new Row(tbl, tbl.uniqueRowID(data), data);
}
