/* eslint-disable @typescript-eslint/no-explicit-any */
import { StorageConfig } from '../config.js';

type McpConnectorResult = {
  type: string;
  text: string;
}

type McpConnectorConstructor = new (config: StorageConfig) => McpConnector;

interface McpConnector {
  query(query: string, params?: any): Promise<McpConnectorResult>;
  execute(query: string, params?: any): Promise<McpConnectorResult>;
  listCollections(schema?: string): Promise<McpConnectorResult>;
  describeCollection(collection: string, schema?: string): Promise<McpConnectorResult>;
}

export {
  McpConnectorResult,
  McpConnector,
  McpConnectorConstructor,
};
