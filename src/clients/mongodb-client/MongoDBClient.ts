/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { MongoClient, Db } from 'mongodb';
import { StorageConfig } from '../../config.js';
import { McpConnector, McpConnectorResult } from '../../mcp-connectors/index.js';

export class MongoDBConnector implements McpConnector {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  private buildConnectionUri(): string {
    const conn = this.config.connection;
    if (conn.uri) {
      return conn.uri;
    }

    const user = conn.user ? encodeURIComponent(conn.user) : '';
    const password = conn.password ? encodeURIComponent(conn.password) : '';
    const host = conn.host || 'localhost';
    const port = conn.port || 27017;

    let uri = 'mongodb://';
    if (user && password) {
      uri += `${user}:${password}@`;
    }
    uri += `${host}:${port}`;

    const params: string[] = [];
    if (conn.authSource) {
      params.push(`authSource=${conn.authSource}`);
    }
    if (conn.replicaSet) {
      params.push(`replicaSet=${conn.replicaSet}`);
    }
    if (params.length > 0) {
      uri += `?${params.join('&')}`;
    }

    return uri;
  }

  private async connect(): Promise<void> {
    if (this.client) return;

    const uri = this.buildConnectionUri();
    this.client = new MongoClient(uri);
    await this.client.connect();

    const database = this.config.connection?.database || 'test';
    this.db = this.client.db(database);
  }

  private getDb(): Db {
    if (!this.db) {
      throw new Error('MongoDB not connected');
    }
    return this.db;
  }

  async query(query: string, _params?: any): Promise<McpConnectorResult> {
    try {
      await this.connect();

      const parsed = JSON.parse(query);
      const collection = parsed.collection;
      if (!collection) {
        throw new Error('Missing "collection" field in query');
      }

      const filter = parsed.filter || {};
      const limit = parsed.limit || 100;
      const skip = parsed.skip || 0;
      const sort = parsed.sort || {};
      const projection = parsed.projection || {};

      const cursor = this.getDb()
        .collection(collection)
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      if (Object.keys(projection).length > 0) {
        cursor.project(projection);
      }

      const rows = await cursor.toArray();

      return {
        type: 'text',
        text: JSON.stringify({
          rows,
          rowCount: rows.length,
          collection,
        }, null, 2),
      };
    } catch (error: any) {
      return {
        type: 'error',
        text: JSON.stringify({
          error: error.message || 'Unknown error occurred',
          query,
        }, null, 2),
      };
    }
  }

  async execute(operation: string, _params?: any): Promise<McpConnectorResult> {
    try {
      if (!this.config.writeMode) {
        throw new Error('Write operations are not allowed for this connection');
      }

      await this.connect();

      const parsed = JSON.parse(operation);
      const collection = parsed.collection;
      const op = parsed.operation;

      if (!collection) {
        throw new Error('Missing "collection" field in operation');
      }
      if (!op) {
        throw new Error('Missing "operation" field (insertOne, insertMany, updateOne, updateMany, deleteOne, deleteMany)');
      }

      const coll = this.getDb().collection(collection);
      let result: any;

      switch (op) {
        case 'insertOne':
          result = await coll.insertOne(parsed.document);
          break;
        case 'insertMany':
          result = await coll.insertMany(parsed.documents);
          break;
        case 'updateOne':
          result = await coll.updateOne(parsed.filter || {}, parsed.update);
          break;
        case 'updateMany':
          result = await coll.updateMany(parsed.filter || {}, parsed.update);
          break;
        case 'deleteOne':
          result = await coll.deleteOne(parsed.filter || {});
          break;
        case 'deleteMany':
          result = await coll.deleteMany(parsed.filter || {});
          break;
        default:
          throw new Error(`Unsupported operation: ${op}`);
      }

      return {
        type: 'text',
        text: JSON.stringify({
          operation: op,
          collection,
          result,
        }, null, 2),
      };
    } catch (error: any) {
      return {
        type: 'error',
        text: JSON.stringify({
          error: error.message || 'Unknown error occurred',
          operation,
        }, null, 2),
      };
    }
  }

  async listCollections(schema?: string): Promise<McpConnectorResult> {
    try {
      await this.connect();

      const db = schema ? this.client!.db(schema) : this.getDb();
      const collections = await db.listCollections().toArray();
      const names = collections.map(c => c.name);

      return {
        type: 'text',
        text: JSON.stringify({
          collections: names,
          count: names.length,
          database: db.databaseName,
        }, null, 2),
      };
    } catch (error: any) {
      return {
        type: 'error',
        text: JSON.stringify({
          error: error.message || 'Unknown error occurred',
          schema,
        }, null, 2),
      };
    }
  }

  async describeCollection(collection: string, schema?: string): Promise<McpConnectorResult> {
    try {
      await this.connect();

      const db = schema ? this.client!.db(schema) : this.getDb();
      const coll = db.collection(collection);

      const [sampleDocs, indexes] = await Promise.all([
        coll.find().limit(10).toArray(),
        coll.indexes(),
      ]);

      const fieldTypes: Record<string, Set<string>> = {};
      for (const doc of sampleDocs) {
        for (const [key, value] of Object.entries(doc)) {
          if (!fieldTypes[key]) {
            fieldTypes[key] = new Set();
          }
          if (value === null) {
            fieldTypes[key].add('null');
          } else if (Array.isArray(value)) {
            fieldTypes[key].add('array');
          } else {
            fieldTypes[key].add(typeof value);
          }
        }
      }

      const inferredSchema: Record<string, string[]> = {};
      for (const [key, types] of Object.entries(fieldTypes)) {
        inferredSchema[key] = Array.from(types);
      }

      const estimatedCount = await coll.estimatedDocumentCount();

      return {
        type: 'text',
        text: JSON.stringify({
          collection,
          database: db.databaseName,
          estimatedCount,
          inferredSchema,
          sampleSize: sampleDocs.length,
          indexes,
        }, null, 2),
      };
    } catch (error: any) {
      return {
        type: 'error',
        text: JSON.stringify({
          error: error.message || 'Unknown error occurred',
          collection,
          schema,
        }, null, 2),
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }
}
