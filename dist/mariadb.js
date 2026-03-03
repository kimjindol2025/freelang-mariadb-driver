"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MariaDBDatabase = void 0;
const pool_1 = require("./pool");
/**
 * MariaDB/MySQL async database wrapper
 * Implements IAsyncDatabase using mysql2/promise
 */
class MariaDBDatabase {
    constructor(config) {
        this.config = config;
        this.pool = new pool_1.MariaDBPool(config);
    }
    /**
     * Execute query and return multiple rows
     */
    async query(sql, params) {
        return await this.pool.query(sql, params);
    }
    /**
     * Execute query and return single row or undefined
     */
    async get(sql, params) {
        return await this.pool.get(sql, params);
    }
    /**
     * Execute INSERT/UPDATE/DELETE and return metadata
     */
    async run(sql, params) {
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
    async transaction(callback) {
        const conn = await this.pool.getConnection();
        try {
            await conn.beginTransaction();
            // Create transaction object with query methods
            const tx = {
                query: async (sql, params) => {
                    const [rows] = await conn.query(sql, (params || []));
                    return rows;
                },
                get: async (sql, params) => {
                    const [rows] = await conn.query(sql, (params || []));
                    const rows_arr = rows;
                    return rows_arr[0];
                },
                run: async (sql, params) => {
                    const [result] = await conn.execute(sql, (params || []));
                    const meta = result;
                    return {
                        insertId: meta.insertId || 0,
                        affectedRows: meta.affectedRows || 0,
                        warningCount: meta.warningCount || 0,
                    };
                },
            };
            const result = await callback(tx);
            await conn.commit();
            return result;
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
    }
    /**
     * Close connection pool
     */
    async close() {
        await this.pool.end();
    }
    /**
     * Ping database (connection health check)
     */
    async ping() {
        return await this.pool.ping();
    }
    /**
     * Check if table exists
     */
    async tableExists(tableName) {
        try {
            const result = await this.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`, [this.config.database, tableName]);
            return result.length > 0;
        }
        catch {
            return false;
        }
    }
    /**
     * Get pool statistics
     */
    stats() {
        return this.pool.stats();
    }
}
exports.MariaDBDatabase = MariaDBDatabase;
//# sourceMappingURL=mariadb.js.map