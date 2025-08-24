/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import mysql from 'mysql2/promise';
import type { StorageConfig } from '../config.js';

export class MySQLClient {
  private pool: mysql.Pool | null = null;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  connect(): void {
    if (!this.config.connection) {
      throw new Error('MySQL connection config is missing');
    }

    this.pool = mysql.createPool({
      host: this.config.connection.host,
      port: this.config.connection.port || 3306,
      user: this.config.connection.user,
      password: this.config.connection.password,
      database: this.config.connection.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  async query(sql: string, params?: any): Promise<mysql.QueryResult> {
    if (!this.pool) {
      this.connect();
    }

    const [rows] = await this.pool!.execute(sql, params);
    return rows;
  }

  async execute(sql: string, params?: any): Promise<mysql.QueryResult> {
    if (!this.config.writeMode) {
      throw new Error('Write operations are not allowed for this connection');
    }

    if (!this.pool) {
      this.connect();
    }

    const [result] = await this.pool!.execute(sql, params);
    return result;
  }

  async listTables(schema?: string): Promise<string[]> {
    if (!this.pool) {
      this.connect();
    }

    const database = schema || this.config.connection?.database;
    const query = database 
      ? 'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?'
      : 'SHOW TABLES';
    
    const rows = await this.query(query, database ? [database] : undefined);
    return (rows as never[]).map((row) => Object.values(row)[0] as string);
  }

  async describeTable(tableName: string, schema?: string): Promise<mysql.QueryResult> {
    if (!this.pool) {
      this.connect();
    }

    const database = schema || this.config.connection?.database;
    const fullTableName = database ? `${database}.${tableName}` : tableName;
    
    const columns = await this.query(`DESCRIBE ${fullTableName}`);
    return columns;
  }

  async disconnect(): Promise<void> {
    if (!this.pool) {
      return
    }

    await this.pool.end();
    this.pool = null;
  }
}
