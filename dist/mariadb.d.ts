import { IAsyncDatabase, MariaDBConfig, MariaDBRunResult, AsyncTransactionCallback, PoolStats } from './types';
/**
 * MariaDB/MySQL async database wrapper
 * Implements IAsyncDatabase using mysql2/promise
 */
export declare class MariaDBDatabase implements IAsyncDatabase {
    private pool;
    private config;
    constructor(config: MariaDBConfig);
    /**
     * Execute query and return multiple rows
     */
    query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
    /**
     * Execute query and return single row or undefined
     */
    get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;
    /**
     * Execute INSERT/UPDATE/DELETE and return metadata
     */
    run(sql: string, params?: unknown[]): Promise<MariaDBRunResult>;
    /**
     * Execute multiple queries in a transaction
     * Automatically BEGIN/COMMIT/ROLLBACK
     */
    transaction<T>(callback: AsyncTransactionCallback<T>): Promise<T>;
    /**
     * Close connection pool
     */
    close(): Promise<void>;
    /**
     * Ping database (connection health check)
     */
    ping(): Promise<boolean>;
    /**
     * Check if table exists
     */
    tableExists(tableName: string): Promise<boolean>;
    /**
     * Get pool statistics
     */
    stats(): PoolStats;
}
//# sourceMappingURL=mariadb.d.ts.map