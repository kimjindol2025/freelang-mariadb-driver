"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = void 0;
/**
 * Fluent SQL Query Builder
 * No external dependencies
 * (MariaDB compatible - uses ? placeholders)
 */
class QueryBuilder {
    constructor(table) {
        this.selectedColumns = ['*'];
        this.whereConditions = [];
        this.orderByClause = '';
        this.limitValue = null;
        this.offsetValue = null;
        this.params = [];
        if (!table || !table.trim()) {
            throw new Error('Table name is required');
        }
        this.table = table;
    }
    /**
     * SELECT clause
     */
    select(columns) {
        if (columns && columns.length > 0) {
            this.selectedColumns = columns;
        }
        else {
            this.selectedColumns = ['*'];
        }
        return this;
    }
    /**
     * WHERE clause (can be called multiple times for AND conditions)
     */
    where(field, operator, value) {
        if (!field || !operator) {
            throw new Error('Field and operator are required');
        }
        this.whereConditions.push({
            field,
            operator,
            value,
        });
        return this;
    }
    /**
     * ORDER BY clause
     */
    orderBy(field, ascending = true) {
        if (!field) {
            throw new Error('Field is required');
        }
        const direction = ascending ? 'ASC' : 'DESC';
        this.orderByClause = `ORDER BY ${field} ${direction}`;
        return this;
    }
    /**
     * LIMIT clause
     */
    limit(count) {
        if (count < 0) {
            throw new Error('Limit must be >= 0');
        }
        this.limitValue = count;
        return this;
    }
    /**
     * OFFSET clause
     */
    offset(count) {
        if (count < 0) {
            throw new Error('Offset must be >= 0');
        }
        this.offsetValue = count;
        return this;
    }
    /**
     * Build SQL query
     */
    build() {
        this.params = [];
        // SELECT part
        let sql = `SELECT ${this.selectedColumns.join(', ')} FROM ${this.table}`;
        // WHERE part
        if (this.whereConditions.length > 0) {
            const whereParts = this.whereConditions.map((condition) => {
                const placeholder = '?';
                this.params.push(condition.value);
                return `${condition.field} ${condition.operator} ${placeholder}`;
            });
            sql += ` WHERE ${whereParts.join(' AND ')}`;
        }
        // ORDER BY part
        if (this.orderByClause) {
            sql += ` ${this.orderByClause}`;
        }
        // LIMIT part
        if (this.limitValue !== null) {
            sql += ` LIMIT ${this.limitValue}`;
        }
        // OFFSET part
        if (this.offsetValue !== null) {
            sql += ` OFFSET ${this.offsetValue}`;
        }
        return { sql, params: this.params };
    }
    /**
     * Reset builder for reuse
     */
    reset() {
        this.selectedColumns = ['*'];
        this.whereConditions = [];
        this.orderByClause = '';
        this.limitValue = null;
        this.offsetValue = null;
        this.params = [];
    }
    /**
     * Get current table
     */
    getTable() {
        return this.table;
    }
}
exports.QueryBuilder = QueryBuilder;
//# sourceMappingURL=query-builder.js.map