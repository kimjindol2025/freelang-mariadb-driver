import { SQLOperator } from './types';
/**
 * Fluent SQL Query Builder
 * No external dependencies
 * (MariaDB compatible - uses ? placeholders)
 */
export declare class QueryBuilder {
    private table;
    private selectedColumns;
    private whereConditions;
    private orderByClause;
    private limitValue;
    private offsetValue;
    private params;
    constructor(table: string);
    /**
     * SELECT clause
     */
    select(columns?: string[]): this;
    /**
     * WHERE clause (can be called multiple times for AND conditions)
     */
    where(field: string, operator: SQLOperator, value: unknown): this;
    /**
     * ORDER BY clause
     */
    orderBy(field: string, ascending?: boolean): this;
    /**
     * LIMIT clause
     */
    limit(count: number): this;
    /**
     * OFFSET clause
     */
    offset(count: number): this;
    /**
     * Build SQL query
     */
    build(): {
        sql: string;
        params: unknown[];
    };
    /**
     * Reset builder for reuse
     */
    reset(): void;
    /**
     * Get current table
     */
    getTable(): string;
}
//# sourceMappingURL=query-builder.d.ts.map