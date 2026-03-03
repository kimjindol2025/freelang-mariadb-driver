import * as mysql from 'mysql2/promise';
import { MariaDBConfig, PoolStats } from './types';
/**
 * Wrapper around mysql2 connection pool
 * Provides simplified pool management
 */
export declare class MariaDBPool {
    private pool;
    constructor(config: MariaDBConfig);
    /**
     * Execute query (pool.query returns [rows, fields])
     */
    query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
    /**
     * Get single row from query
     */
    get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;
    /**
     * Execute INSERT/UPDATE/DELETE (pool.execute returns [result, fields])
     */
    run(sql: string, params?: unknown[]): Promise<{
        insertId: number;
        affectedRows: number;
        warningCount: number;
    }>;
    /**
     * Get connection for manual transaction handling
     */
    getConnection(): Promise<mysql.PoolConnection>;
    /**
     * Close pool (end all connections)
     */
    end(): Promise<void>;
    /**
     * Ping database (connection health check)
     */
    ping(): Promise<boolean>;
    /**
     * Get pool statistics
     */
    stats(): PoolStats;
}
//# sourceMappingURL=pool.d.ts.map