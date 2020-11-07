import { Parser} from "node-sql-parser";
import { CreateColDefAst, CreateConstraintDefAst, CreateTableAst} from "./models/mysql-types";
import { memoize } from "../util/decorators";
import { createHash } from 'crypto';
import { v4 } from 'uuid';
import { Row } from "./row";
import {DBConnection} from "./dbconnection";

/**
 * Wrapper for a Table within the Database.
 *
 * This object is always generated from a real MySQL `CREATE TABLE` string.
 */
export class Table {
    private readonly parser: Parser;
    private ast: CreateTableAst;
    public dbConn: DBConnection|null = null;

    constructor(sql: string) {
        this.parser = new Parser();
        // @ts-ignore
        this.ast = this.parser.astify(sql);
    }

    get name(): string {
        return this.ast.table[0].table;
    }

    @memoize()
    get columns(): CreateColDefAst[] {
        // @ts-ignore
        return this.ast.create_definitions.filter(c => c.resource === 'column');
    }

    @memoize()
    get constraints(): CreateConstraintDefAst[] {
        // @ts-ignore
        return this.ast.create_definitions.filter(c => c.resource === 'constraint');
    }

    /**
     * A list of all table names that this table references as foreign keys.
     * All these tables need to exist before this one may be created.
     */
    @memoize()
    get requiredTableNames(): string[] {
        const r =  this.constraints.map(c => c.reference_definition.table.map(t => t.table));
        return r.reduce((acc, val) => acc.concat(val), []);  // Flatten, preserving types.
    }

    @memoize()
    get foreignKeyRefs(): TableReference[] {
        let ret: TableReference[] = [];
        this.constraints.filter(c=>c.constraint_type.toLowerCase().startsWith('foreign')).map(c => {
            c.reference_definition.table.map(tbl => {
                ret.push({
                    refTable: tbl.table,
                    refFields: c.reference_definition.definition,
                    internalTable: this.name,
                    internalFields: c.definition
                })
            })
        })

        return ret;
    }

    @memoize()
    private get primaryKey() {
        const pk = this.columns.find(r => r.unique_or_primary);
        if (pk) return pk;
        for (const con of this.constraints) {
            if (con.constraint_type.toLowerCase().startsWith('primary')) {
                return this.columns.find(c => c.column.column === con.definition[0]);
            }
        }
    }

    /**
     * A custom function that converts a row (for this table) into a Unique ID.
     *
     * This is generated on the initial call, and varies based off which unique constraints/PKs are available.
     */
    @memoize()
    get uniqueRowID() {
        let cols: string[] = [];
        let pk = this.primaryKey;

        if (pk) {
            cols.push(pk.column.column);
        } else {
            const uniques = this.constraints.filter(c => c.constraint_type.toLowerCase().startsWith('unique'));
            const smallest = uniques.sort((a, b) => a.definition.length - b.definition.length)[0];
            if (smallest) {
                cols = smallest.definition
            }
        }

        if (!cols.length) {
            console.warn(`Unable to locate suitably unique index in table "${this.name}". Duplicates may appear.`);
        }

        return (rowData: any): string => {
            // MySQL considers nulls as distinct from other nulls, so replace nulls here with UUIDs.
            const dat = cols.map(c => rowData[c] !== null ? rowData[c] : v4());
            const enc = dat.length ? JSON.stringify(dat) : v4();

            // Hash if the ID will otherwise be extremely long:
            return enc.length <= 40 ? enc : createHash('sha1').update(enc).digest("hex");
        }
    }

    /**
     * Select Row(s) from this Table, restricting by the given WHERE column->values.
     * @param where
     */
    async select(where: Record<string, any>): Promise<Row[]> {
        if (!this.dbConn) throw Error('Tried to query without Pool!');

        const rows = await this.dbConn.select(this.name, where);

        return rows.map((data: object) => {
            return new Row(this, this.uniqueRowID(data), data);
        })
    }
}

/**
 * Defines an (internally used) link between one table ("internal") and another table ("external").
 * Contains the internal and field name mappings, ordered so they should match 1:1.
 *
 * @internal
 */
export interface TableReference {
    /** The external, referenced Table name. */
    refTable: string;
    /** The external, referenced column names. */
    refFields: string[];
    /** The name of the Table this reference originated from. */
    internalTable: string;
    /** The column names from the Table this reference originated from. */
    internalFields: string[];
}
