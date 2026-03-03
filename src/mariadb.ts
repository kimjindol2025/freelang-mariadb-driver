import * as mysql from 'mysql2/promise';
import {
  IAsyncDatabase,
  MariaDBConfig,
  MariaDBRunResult,
  AsyncTransactionCallback,
  PoolStats,
} from './types';
import { MariaDBPool } from './pool';

/**
 * MariaDB/MySQL async database wrapper
 * Implements IAsyncDatabase using mysql2/promise
 */
export class MariaDBDatabase implements IAsyncDatabase {
  private pool: MariaDBPool;
  private config: MariaDBConfig;

  constructor(config: MariaDBConfig) {
    this.config = config;
    this.pool = new MariaDBPool(config);
  }

  /**
   * Execute query and return multiple rows
   */
  async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
    return await this.pool.query<T>(sql, params);
  }

  /**
   * Execute query and return single row or undefined
   */
  async get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined> {
    return await this.pool.get<T>(sql, params);
  }

  /**
   * Execute INSERT/UPDATE/DELETE and return metadata
   */
  async run(sql: string, params?: unknown[]): Promise<MariaDBRunResult> {
    const result = await this.pool.run(sql, params);
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows,
      warningCount: result.warningCount,
    };
  }

  /**
   * Execute multiple queries in a transaction
   * Automatically BEGIN/COMMIT/ROLLBACK
   */
  async transaction<T>(callback: AsyncTransactionCallback<T>): Promise<T> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      // Create transaction object with query methods
      const tx = {
        query: async <R = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<R[]> => {
          const [rows] = await conn.query(sql, (params || []) as any);
          return rows as R[];
        },
        get: async <R = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<R | undefined> => {
          const [rows] = await conn.query(sql, (params || []) as any);
          const rows_arr = rows as R[];
          return rows_arr[0];
        },
        run: async (sql: string, params?: unknown[]): Promise<MariaDBRunResult> => {
          const [result] = await conn.execute(sql, (params || []) as any);
          const meta = result as mysql.ResultSetHeader;
          return {
            insertId: meta.insertId || 0,
            affectedRows: meta.affectedRows || 0,
            warningCount: (meta as any).warningCount || 0,
          };
        },
      };

      const result = await callback(tx);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Ping database (connection health check)
   */
  async ping(): Promise<boolean> {
    return await this.pool.ping();
  }

  /**
   * Check if table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.query<{ TABLE_NAME: string }>(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [this.config.database, tableName],
      );
      return result.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get pool statistics
   */
  stats(): PoolStats {
    return this.pool.stats();
  }
}
