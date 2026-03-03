import * as mysql from 'mysql2/promise';
import { MariaDBConfig, PoolStats } from './types';

/**
 * Wrapper around mysql2 connection pool
 * Provides simplified pool management
 */
export class MariaDBPool {
  private pool: mysql.Pool;

  constructor(config: MariaDBConfig) {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: config.connectionLimit || 10,
      charset: config.charset || 'utf8mb4',
      timezone: config.timezone || 'local',
      waitForConnections: true,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    } as any);
  }

  /**
   * Execute query (pool.query returns [rows, fields])
   */
  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const [rows] = await this.pool.query(sql, (params || []) as any);
    return rows as T[];
  }

  /**
   * Get single row from query
   */
  async get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined> {
    const rows = await this.query<T>(sql, params);
    return rows[0];
  }

  /**
   * Execute INSERT/UPDATE/DELETE (pool.execute returns [result, fields])
   */
  async run(sql: string, params?: unknown[]): Promise<{ insertId: number; affectedRows: number; warningCount: number }> {
    const [result] = await this.pool.execute(sql, (params || []) as any);
    const meta = result as mysql.ResultSetHeader;
    return {
      insertId: meta.insertId || 0,
      affectedRows: meta.affectedRows || 0,
      warningCount: (meta as any).warningCount || 0,
    };
  }

  /**
   * Get connection for manual transaction handling
   */
  async getConnection(): Promise<mysql.PoolConnection> {
    return await this.pool.getConnection();
  }

  /**
   * Close pool (end all connections)
   */
  async end(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Ping database (connection health check)
   */
  async ping(): Promise<boolean> {
    try {
      await this.pool.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get pool statistics
   */
  stats(): PoolStats {
    const poolAny = this.pool as any;
    return {
      poolSize: poolAny._allConnections?.length || 0,
      idleConnections: poolAny._freeConnections?.length || 0,
      allConnections: poolAny._allConnections?.length || 0,
      queueSize: poolAny._connectionQueue?.length || 0,
    };
  }
}
