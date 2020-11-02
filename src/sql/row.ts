import {Table} from "./table";

/**
 * Wrapper for a single MySQL Row.
 */
export class Row {
    /** Each Row holds a reference to its source Table only for ease of access. */
    public readonly table: Table;
    public readonly data: Record<string, any>;
    public readonly id: string;

    constructor(tableFrom: Table, id: string, data: Record<string, any>) {
        this.table = tableFrom;
        this.id = id;
        this.data = data;
    }

    /**
     * Get a {@link RowLink} object for each foreign key reference this Row depends on.
     */
    linksUp(): RowLink[] {
        return this.table.foreignKeyRefs.map(fk => {
            const valMap = fk.refFields.reduce((agg: object, key: string, idx: number)=>{
                return { ...agg, [key]: this.data[fk.internalFields[idx]] }
            }, {});
            return new RowLink(fk.refTable, valMap)
        })
    }

    /**
     * Get a {@link RowLink} object for each foreign key reference TO this specific Row, coming from any of the given tables.
     */
    linksDown(tables: Table[]): RowLink[] {
        let ret: RowLink[] = [];

        tables.map(t => {
            for (const fk of t.foreignKeyRefs) {
                if (fk.refTable !== this.table.name) return;
                const valMap = fk.internalFields.reduce((agg: object, key: string, idx: number)=>{
                    return { ...agg, [key]: this.data[fk.refFields[idx]] }
                }, {});

                ret.push(new RowLink(t.name, valMap));
            }
        })

        return ret;
    }
}


/**
 * Represents a link between a fetched Row, and other potential Rows that connect to this one via Foreign Key.
 *
 * Unlike {@link TableReference}, this object contains the actual data needed to perform a search.
 * @internal
 */
export class RowLink {
    /** Map of `['column_name'] = ['value']` relations, for looking Rows up in the given table. */
    public readonly where: Record<string, any>;
    public readonly tableName: string;

    constructor(tableName: string, where: Record<string, any>) {
        this.tableName = tableName;
        this.where = where;
    }

    /**
     * Checks if this Link has a null value. Nulls should indicate the link cannot be made in MySQL.
     */
    get hasNull(): boolean {
        return Object.values(this.where).some(v => v === null || v === undefined);
    }
}
