/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import mysql from 'mysql2/promise';
import { StorageConfig } from '../../config.js';
import { McpConnector, McpConnectorResult } from '../../mcp-connectors/index.js';

export class MySQLConnector implements McpConnector {
  private pool: mysql.Pool | null = null;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  private connect(): void {
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

  async query(query: string, params?: any): Promise<McpConnectorResult> {
    try {
      if (!this.pool) {
        this.connect();
      }

      const [rows] = await this.pool!.execute(query, params);
      return {
        type: 'text',
        text: JSON.stringify({
          rows,
          rowCount: Array.isArray(rows) ? rows.length : 0
        }, null, 2)
      };
    } catch (error: any) {
      return {
        type: 'error',
        text: JSON.stringify({
          error: error.message || 'Unknown error occurred',
          query
        }, null, 2)
      };
    }
  }

  async execute(operation: string, params?: any): Promise<McpConnectorResult> {
    try {
      if (!this.config.writeMode) {
        throw new Error('Write operations are not allowed for this connection');
      }

      if (!this.pool) {
        this.connect();
      }

      const [result] = await this.pool!.execute(operation, params) as any;
      return {
        type: 'text',
        text: JSON.stringify({
          affectedRows: result.affectedRows || 0,
          insertId: result.insertId,
          message: result.message
        }, null, 2)
      };
    } catch (error: any) {
      return {
        type: 'error',
        text: JSON.stringify({
          error: error.message || 'Unknown error occurred',
          operation
        }, null, 2)
      };
    }
  }

  async listCollections(schema?: string): Promise<McpConnectorResult> {
    try {
      if (!this.pool) {
        this.connect();
      }

      const database = schema || this.config.connection?.database;
      const sqlQuery = database 
        ? 'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?'
        : 'SHOW TABLES';
      
      const [rows] = await this.pool!.execute(sqlQuery, database ? [database] : undefined);
      const tables = (rows as any[]).map((row) => Object.values(row)[0] as string);
      
      return {
        type: 'text',
        text: JSON.stringify({
          tables,
          count: tables.length,
          database: database
        }, null, 2)
      };
    } catch (error: any) {
      return {
        type: 'error',
        text: JSON.stringify({
          error: error.message || 'Unknown error occurred',
          schema
        }, null, 2)
      };
    }
  }

  async describeCollection(collection: string, schema?: string): Promise<McpConnectorResult> {
    try {
      if (!this.pool) {
        this.connect();
      }

      const database = schema || this.config.connection?.database;
      const fullTableName = database ? `${database}.${collection}` : collection;
      
      const [columns] = await this.pool!.execute(`DESCRIBE ${fullTableName}`);
      
      return {
        type: 'text',
        text: JSON.stringify({
          table: collection,
          columns,
          database: database
        }, null, 2)
      };
    } catch (error: any) {
      return {
        type: 'error',
        text: JSON.stringify({
          error: error.message || 'Unknown error occurred',
          table: collection,
          schema
        }, null, 2)
      };
    }
  }

  async disconnect(): Promise<void> {
    if (!this.pool) {
      return;
    }

    await this.pool.end();
    this.pool = null;
  }
}
