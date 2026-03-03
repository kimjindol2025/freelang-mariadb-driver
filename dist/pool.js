"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MariaDBPool = void 0;
const mysql = __importStar(require("mysql2/promise"));
/**
 * Wrapper around mysql2 connection pool
 * Provides simplified pool management
 */
class MariaDBPool {
    constructor(config) {
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
        });
    }
    /**
     * Execute query (pool.query returns [rows, fields])
     */
    async query(sql, params) {
        const [rows] = await this.pool.query(sql, (params || []));
        return rows;
    }
    /**
     * Get single row from query
     */
    async get(sql, params) {
        const rows = await this.query(sql, params);
        return rows[0];
    }
    /**
     * Execute INSERT/UPDATE/DELETE (pool.execute returns [result, fields])
     */
    async run(sql, params) {
        const [result] = await this.pool.execute(sql, (params || []));
        const meta = result;
        return {
            insertId: meta.insertId || 0,
            affectedRows: meta.affectedRows || 0,
            warningCount: meta.warningCount || 0,
        };
    }
    /**
     * Get connection for manual transaction handling
     */
    async getConnection() {
        return await this.pool.getConnection();
    }
    /**
     * Close pool (end all connections)
     */
    async end() {
        await this.pool.end();
    }
    /**
     * Ping database (connection health check)
     */
    async ping() {
        try {
            await this.pool.ping();
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get pool statistics
     */
    stats() {
        const poolAny = this.pool;
        return {
            poolSize: poolAny._allConnections?.length || 0,
            idleConnections: poolAny._freeConnections?.length || 0,
            allConnections: poolAny._allConnections?.length || 0,
            queueSize: poolAny._connectionQueue?.length || 0,
        };
    }
}
exports.MariaDBPool = MariaDBPool;
//# sourceMappingURL=pool.js.map