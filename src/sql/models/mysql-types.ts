import {ColumnRef, From} from "node-sql-parser";


/**
 * AST format for a new table CREATE.
 * @internal
 */
export interface CreateTableAst {
    as: string|null;
    /** All the new columns or constraints being created for this table. */
    create_definitions: (CreateColDefAst|CreateConstraintDefAst)[];
    if_not_exists: boolean|null;
    ignore_replace: boolean|null;
    keyword: 'table';
    query_expr: null;
    table: From[];
    table_options: null;
    temporary: boolean|null;
    type: 'create'|'update';
}

/**
 * AST format for a new Column that is being created in a new Table.
 * @internal
 */
export interface CreateColDefAst {
    auto_increment: 'auto_increment'|null;
    collate: null|string;
    column: ColumnRef;
    column_format: null;
    comment: string|null;
    default_val: null|{
        type: 'default';
        value: {
            type: string,
            /** Currently also contains "on update" string, if applicable. */
            value: any
        }
    };
    definition: CreateColDetailsAst;
    nullable: null|boolean;
    reference_definition: any; // Unknown atm.
    resource: 'column';
    storage: any;  // Unknown.
    unique_or_primary: string|null;
}

/**
 * A constraint for a column within a given table.
 * @internal
 */
export interface CreateConstraintDefAst {
    constraint: any;
    constraint_type: 'FOREIGN KEY'|'UNIQUE'|'primary key';
    /** The local table column names. */
    definition: string[];
    index: null|'unique_index';
    index_options: null;
    keyword: null;
    reference_definition: {
        /** The parent table column names. */
        definition: string[];
        table: From[];
        keyword: 'references';
        match: null;
        on_delete: null|string;
        on_update: null|string;
    };
    resource: 'constraint';
}

/**
 * Extra details about a column, including type/length/etc.
 * @internal
 */
export interface CreateColDetailsAst {
    dataType: string;
    length: number;
    parentheses: boolean;
    scale: any;
}
