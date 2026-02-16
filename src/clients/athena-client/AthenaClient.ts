/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  QueryExecutionState,
  ListTableMetadataCommand,
  GetTableMetadataCommand,
} from '@aws-sdk/client-athena';
import { StorageConfig } from '../../config.js';
import { McpConnector, McpConnectorResult } from '../../mcp-connectors/index.js';

export class AthenaConnector implements McpConnector {
  private client: AthenaClient;
  private config: StorageConfig;
  private outputLocation: string;
  private database: string;
  private workGroup: string;

  constructor(config: StorageConfig) {
    this.config = config;

    const region = config.connection?.region || process.env.AWS_REGION || 'us-east-1';
    this.outputLocation = config.connection?.s3OutputLocation || process.env.ATHENA_S3_OUTPUT || '';
    this.database = config.connection?.database || process.env.ATHENA_DATABASE || 'default';
    this.workGroup = config.connection?.workgroup || process.env.ATHENA_WORKGROUP || 'primary';

    if (!this.outputLocation) {
      throw new Error('Athena S3 output location is required (s3OutputLocation or ATHENA_S3_OUTPUT)');
    }

    this.client = new AthenaClient({
      region,
    });
  }

  async query(query: string, _params?: any): Promise<McpConnectorResult> {
    try {
      // Start query execution
      const startCommand = new StartQueryExecutionCommand({
        QueryString: query,
        QueryExecutionContext: {
          Database: this.database,
        },
        ResultConfiguration: {
          OutputLocation: this.outputLocation,
        },
        WorkGroup: this.workGroup,
      });

      const { QueryExecutionId } = await this.client.send(startCommand);
      if (!QueryExecutionId) {
        throw new Error('Failed to start query execution');
      }

      // Wait for query completion
      await this.waitForQueryCompletion(QueryExecutionId);

      // Get query results
      const resultsCommand = new GetQueryResultsCommand({
        QueryExecutionId,
      });

      const results = await this.client.send(resultsCommand);

      // Convert Athena results to standard JSON format
      const rows = this.formatResults(results.ResultSet);

      return {
        type: 'text',
        text: JSON.stringify({
          rows,
          rowCount: rows.length,
          queryExecutionId: QueryExecutionId,
        }, null, 2)
      };
    } catch (error: any) {
      return {
        type: 'error',
        text: JSON.stringify({
          error: error.message || 'Unknown error occurred',
          query,
          database: this.database,
        }, null, 2)
      };
    }
  }

  async execute(operation: string, params?: any): Promise<McpConnectorResult> {
    // Athena is read-only by default, only DDL operations are allowed
    try {
      if (!this.config.writeMode) {
        throw new Error('Write operations are not allowed for this connection');
      }

      // DDL operations like CREATE TABLE, ALTER TABLE are processed same as query
      return await this.query(operation, params);
    } catch (error: any) {
      return {
        type: 'error',
        text: JSON.stringify({
          error: error.message || 'Unknown error occurred',
          operation,
        }, null, 2)
      };
    }
  }

  async listCollections(schema?: string): Promise<McpConnectorResult> {
    try {
      const targetDatabase = schema || this.database;

      // Get list of tables
      const command = new ListTableMetadataCommand({
        CatalogName: 'AwsDataCatalog',
        DatabaseName: targetDatabase,
      });

      const response = await this.client.send(command);
      const tables = response.TableMetadataList?.map(table => table.Name!) || [];

      return {
        type: 'text',
        text: JSON.stringify({
          tables,
          count: tables.length,
          database: targetDatabase,
        }, null, 2)
      };
    } catch (error: any) {
      return {
        type: 'error',
        text: JSON.stringify({
          error: error.message || 'Unknown error occurred',
          database: schema || this.database,
        }, null, 2)
      };
    }
  }

  async describeCollection(collection: string, schema?: string): Promise<McpConnectorResult> {
    try {
      const targetDatabase = schema || this.database;

      // Get table metadata
      const command = new GetTableMetadataCommand({
        CatalogName: 'AwsDataCatalog',
        DatabaseName: targetDatabase,
        TableName: collection,
      });

      const response = await this.client.send(command);
      const columns = response.TableMetadata?.Columns?.map(col => ({
        name: col.Name,
        type: col.Type,
        comment: col.Comment,
      })) || [];

      const partitionKeys = response.TableMetadata?.PartitionKeys?.map(key => ({
        name: key.Name,
        type: key.Type,
      })) || [];

      return {
        type: 'text',
        text: JSON.stringify({
          table: collection,
          database: targetDatabase,
          columns,
          partitionKeys,
          tableType: response.TableMetadata?.TableType,
          location: response.TableMetadata?.Parameters?.['location'],
        }, null, 2)
      };
    } catch (error: any) {
      return {
        type: 'error',
        text: JSON.stringify({
          error: error.message || 'Unknown error occurred',
          table: collection,
          database: schema || this.database,
        }, null, 2)
      };
    }
  }

  private async waitForQueryCompletion(queryExecutionId: string): Promise<void> {
    const maxAttempts = 100;
    const delayMs = 1000;

    for (let i = 0; i < maxAttempts; i++) {
      const command = new GetQueryExecutionCommand({
        QueryExecutionId: queryExecutionId,
      });

      const response = await this.client.send(command);
      const state = response.QueryExecution?.Status?.State;

      switch (state) {
        case QueryExecutionState.SUCCEEDED:
          return;
        case QueryExecutionState.FAILED:
          throw new Error(`Query failed: ${response.QueryExecution?.Status?.StateChangeReason}`);
        case QueryExecutionState.CANCELLED:
          throw new Error('Query was cancelled');
        default:
          // QUEUED or RUNNING - continue waiting
          await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    throw new Error('Query timeout - exceeded maximum wait time');
  }

  private formatResults(resultSet: any): any[] {
    if (!resultSet?.Rows || resultSet.Rows.length === 0) {
      return [];
    }

    // First row contains column headers
    const firstRow = resultSet.Rows[0];
    const headers: string[] = [];
    if (firstRow?.Data && Array.isArray(firstRow.Data)) {
      (firstRow.Data as any[]).forEach((col: any) => {
        headers.push(col.VarCharValue as string);
      });
    }

    // Convert remaining rows to objects
    const rows = [];
    for (let i = 1; i < resultSet.Rows.length; i++) {
      const row = resultSet.Rows[i];
      const obj: any = {};

      if (row.Data && Array.isArray(row.Data)) {
        (row.Data as any[]).forEach((cell: any, index: number) => {
          const header = headers[index];
          if (header) {
            obj[header] = cell.VarCharValue || null;
          }
        });
      }

      rows.push(obj);
    }

    return rows;
  }
}
