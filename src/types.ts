/**
 * Async-compatible database interface
 * (compatible with MariaDB/MySQL via mysql2/promise)
 */
export interface IAsyncDatabase {
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

/**
 * Transaction callback signature
 */
export type AsyncTransactionCallback<T> = (tx: AsyncTransaction) => Promise<T>;

/**
 * Transaction interface (for queries within a transaction)
 */
export interface AsyncTransaction {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;
  run(sql: string, params?: unknown[]): Promise<MariaDBRunResult>;
}

/**
 * SQL Operator type
 */
export type SQLOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN';

/**
 * SQL Condition for QueryBuilder
 */
export interface SQLCondition {
  field: string;
  operator: SQLOperator;
  value: unknown;
}

/**
 * MariaDB/MySQL configuration
 */
export interface MariaDBConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;  // Default: 10
  charset?: string;          // Default: utf8mb4 (한글 지원)
  timezone?: string;         // Default: local
}

/**
 * Result metadata from run() (INSERT/UPDATE/DELETE)
 */
export interface MariaDBRunResult {
  insertId: number;
  affectedRows: number;
  warningCount: number;
}

/**
 * Connection pool statistics
 */
export interface PoolStats {
  poolSize: number;
  idleConnections: number;
  allConnections: number;
  queueSize: number;
}
