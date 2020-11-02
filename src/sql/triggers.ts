import {memoize} from "../util/decorators";

/**
 * Wrapper for a Trigger within the Database.
 */
export class Trigger {
    public readonly sql: string;
    public readonly name: string;

    constructor(name: string, sql: string) {
        this.name = name;
        this.sql = sql;
    }

    /**
     * Generates a delimiter string that will not interfere with the given SQL.
     */
    @memoize()
    private get delimiter() {
        let del = '$';
        while (this.sql.includes(del)) del += '$';
        return del;
    }

    toSQL(): string {
        return `delimiter ${this.delimiter}\n${this.sql}\ndelimiter ;`;
    }
}
