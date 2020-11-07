import * as mysql2 from 'mysql2/promise';

export class DBConnection {
    private readonly pool: mysql2.Pool;
    public readonly database: string|undefined;
    private readonly locks: Record<string, mysql2.Connection> = {};

    constructor(opts: mysql2.ConnectionOptions) {
        this.database = opts.database;
        this.pool = mysql2.createPool({
            waitForConnections: true,
            connectionLimit: 10,
            ...opts,
        });
    }

    public async query(sql: string, opts?: any) {
        return this.pool.query(sql, opts);
    }

    public async execute(sql: string, opts?: any) {
        return this.pool.execute(sql, opts);
    }

    public async end() {
        return this.pool.end();
    }

    /**
     * Manually acquire a named Lock, which no other connection to the database can share until it is released.
     * @param name
     * @param timeout
     * @see {@link withLock}, {@link releaseLock}
     */
    public async getLock(name: string = 'db-tool-lock', timeout: number = -1): Promise<number|null> {
        await this.releaseLock(name);
        const conn = await this.pool.getConnection();
        this.locks[name] = conn;
        const [res]: any[] = await conn.query(`SELECT GET_LOCK(?, ?) as "Lock"`, [name, timeout]);
        return res[0].Lock;
    }

    /**
     * Release a named lock, if it is currently being held by this wrapper.
     * @param name
     */
    public async releaseLock(name: string = 'db-tool-lock') {
        const lock = this.locks[name];
        if (lock) {
            delete this.locks[name];
            await lock.query(`SELECT RELEASE_LOCK(?)`, [name]);
            // @ts-ignore
            await lock.release();
            return true;
        }
        return false;
    }

    /**
     * Runs the given callback inside a Lock, preventing any other clients from using the same lock name database-wide.
     * Releases the lock automatically once the callback finishes, even if an error is raised.
     * @param cb The callback to run once inside the lock. Can be async.
     * @param lockName The lock name, if a specific lock is desired.
     * @param timeout The timeout, if one is desired. Defaults to infinite time (any negative value).
     * @returns The result of running the given callback.
     * @see {@link getLock}
     */
    public async withLock(cb: Function, lockName: string = 'db-tool-lock', timeout: number = -1) {
        try {
            await this.getLock(lockName, timeout);
            return await cb();
        } finally {
            await this.releaseLock(lockName);
        }
    }

    /**
     * Sanitize the name of a table or column, so that it can be safely inserted into SQL strings.
     * @param name
     */
    public escapeID(name: string): string {
        // @ts-ignore
        return this.pool.escapeId(name);
    }

    /**
     * Converts the given map of key->value into a valid, sanitized SQL WHERE clause.
     * @param where
     * @private
     */
    private parseWhere(where: Record<string, any>) {
        const st = Object.keys(where).map(k => {
            const eq = (where[k] === null || where[k] === undefined) ? 'is' : '=';
            return `${this.escapeID(k)} ${eq} ?`
        }).join(' AND ');

        return {
            sql: Object.keys(where).length ? `WHERE ${st}` : '',
            params: Object.values(where)
        }
    }

    public async select(tableName: string, where: Record<string, any> = {}): Promise<any[]> {
        const w = this.parseWhere(where);
        const sql = `SELECT * FROM ${this.escapeID(tableName)} ${w.sql}`;
        const [ret]: any[][] = await this.pool.query(sql, w.params);
        return ret;
    }
}
