import {Table} from "./table";
import { Row } from "./row";
import * as mysql2 from 'mysql2/promise';
import { Trigger } from "./triggers";
import {DBConnection} from "./dbconnection";

/**
 * The core wrapper for MySQL access.
 */
export class Database {
    public readonly tables: Record<string, Table> = {};
    public readonly triggers: Record<string, Trigger> = {};
    public readonly connection: DBConnection;
    public readonly database: string;

    constructor(opts: mysql2.ConnectionOptions | DBConnection) {
        if (!opts.database) throw Error('Database name is required when connecting!');
        if (opts instanceof DBConnection) {
            this.connection = opts;
            this.database = opts.database;
        } else {
            this.connection = new DBConnection({
                waitForConnections: true,
                connectionLimit: 10,
                ...opts,
            });
            this.database = opts.database;
        }
    }

    /**
     * Kill all open connections to this Database. Make sure you call this before exit.
     */
    public async disconnect() {
        return this.connection.end();
    }

    /**
     * Load all Tables/Triggers from the SQL database.
     */
    public async loadAll() {
        return Promise.all([
            this.loadTables(),
            this.loadTriggers()
        ])
    }

    /**
     * Adds a new Table object to this tracker.
     */
    public addTable(table: Table) {
        if (this.tables[table.name]) throw Error('Cannot add the same table more than once!')
        this.tables[table.name] = table;
        table.dbConn = this.connection;

        return table;
    }

    /**
     * Load all the Tables this connection has access to, directly from the Database.
     */
    public async loadTables() {
        const [names]: any[] = await this.connection.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = '${this.database}'`);

        await Promise.all(names.map(async (t: any) => {
            const [def]: any[] = await this.connection.query(`SHOW CREATE TABLE ${t.TABLE_NAME}`);
            this.addTableSQL(def[0]['Create Table']);
        }));
    }

    /**
     * Create and add a new {@link Table} object, using taw SQL from a "CREATE TABLE" statement.
     * @param tableSQL
     */
    public addTableSQL(tableSQL: string) {
        return this.addTable(new Table(tableSQL));
    }

    /**
     * From a given list of Rows, find all Rows (including the original) that these Rows depend on (via Foreign keys).
     *
     * If `travelDown` is enabled, also locates all Rows in other tables that have foreign key references to the located Rows.
     *
     * Either way, the result is an exhaustive list of all Rows required to stage a viable database containing the given input Rows.
     * @param rows The Rows to start searching from.
     * @param travelDown If Rows should be included when they reference located Rows, but are not required.
     */
    async findTree(rows: Row[], travelDown: boolean): Promise<Record<string, Row[]>> {
        const foundState: FoundRowState = {};
        const ret: Record<string, Row[]> = {};

        await Promise.all(rows.map(async row => this.branchFind(row, travelDown, foundState)));

        // Unpack from nested objects, not that Row ID lookup speed is not important:
        for (const tblName of Object.keys(foundState)) {
            ret[tblName] = ret[tblName] || [];
            for (const r of Object.values(foundState[tblName])) {
                ret[tblName].push(r);
            }
        }

        return ret;
    }

    /**
     * Finds all the Rows that link to/from the given Row. Mutates the `found` object state to include these rows.
     * @private
     */
    private async branchFind(row: Row, travelDown: boolean, foundState: FoundRowState) {
        if (foundState[row.table.name] && foundState[row.table.name][row.id]) return;  // Skip processing this Row if we've already seen it.

        foundState[row.table.name] = foundState[row.table.name] || {};
        foundState[row.table.name][row.id] = row;

        let links = row.linksUp();

        if(travelDown) links = links.concat(row.linksDown(Object.values(this.tables)));

        // TODO: Check for duplicate table+WHERE clauses, and skip them. Have to be sure both WHEREs indicate distinct rows indexes, though.

        const linkProms = links.filter(r=>!r.hasNull).map(async link => {
            const tbl = this.tables[link.tableName];
            if (!tbl) throw Error(`Unknown table name referenced in row: "${link.tableName}"!`);
            const newRows = await tbl.select(link.where);
            // NOTE: possibly add sanity limiter here, checking against (newRows.length * links per row)

            return Promise.all(newRows.map(newRow => this.branchFind(newRow, travelDown, foundState)));
        });

        await Promise.all(linkProms);
    }

    /**
     * Adds a new Trigger object to this tracker.
     */
    public addTrigger(trigger: Trigger) {
        if (this.triggers[trigger.name]) throw Error('Cannot add the same trigger more than once!');
        return this.triggers[trigger.name] = trigger;
    }

    /**
     * Loads all Triggers that this connection has access to read, directly from the database.
     */
    public async loadTriggers() {
        const [triggers]: any[] = await this.connection.query('SHOW TRIGGERS');
        const names: string[] = triggers.map((t: any) => t.Trigger);

        await Promise.all(names.map( async trigger => {
            const [res]: any[] = await this.connection.query(`SHOW CREATE TRIGGER ${trigger}`);
            const sql = res[0]['SQL Original Statement'];
            this.addTrigger(new Trigger(trigger, sql));
        }))
    }
}

/**
 * Structure for: `[tableName][rowID] = row`.
 * @internal
 */
interface FoundRowState {
    [tableName: string]: {
        [rowID: string]: Row;
    }
}
