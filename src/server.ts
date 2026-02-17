import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parseStorageConfigs, StorageConfig } from "./config.js";
import { registry } from "./mcp-connectors/index.js";
import { MySQLConnector, AthenaConnector, MongoDBConnector } from "./clients/index.js";

let storageConfigs: StorageConfig[] = [];

const mcpServer = new McpServer({
  name: "storage-map",
  version: "0.0.1",
});

mcpServer.registerTool(
  "list_storages",
  {
    description: "List all configured storage connections (RDB, NoSQL, Athena, etc.)",
    inputSchema: {},
  },
  () => {
    const result = {
      storages: storageConfigs.map(config => ({
        id: config.id,
        type: config.type,
        writeMode: config.writeMode || false,
        status: "configured",
      }))
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// @ts-ignore - Type instantiation depth issue with MCP SDK
mcpServer.registerTool(
  "query",
  {
    description: "Execute a query on any storage (SQL for RDB/Athena, NoSQL query for MongoDB, etc.)",
    inputSchema: {
      storage_id: z.string().describe("Storage connection ID to use"),
      query: z.string().describe("Query to execute (SQL, MongoDB query JSON, etc.)"),
      parameters: z.any().optional().describe("Optional query parameters"),
    },
  },
  async ({ storage_id, query, parameters }) => {
    const config = storageConfigs.find(c => c.id === storage_id);
    if (!config) {
      throw new Error(`Storage ${storage_id} not found`);
    }
    
    const connector = registry.getConnector(storage_id, config);
    const result = await connector.query(query, parameters);
    
    return {
      content: [{
        type: "text" as const,
        text: result.text,
      }],
    };
  }
);

// @ts-ignore - Type instantiation depth issue with MCP SDK
mcpServer.registerTool(
  "execute",
  {
    description: "Execute write operations (INSERT, UPDATE, DELETE for SQL; insert, update for NoSQL)",
    inputSchema: {
      storage_id: z.string().describe("Storage connection ID to use"),
      operation: z.string().describe("Operation to execute (SQL statement or NoSQL operation)"),
      parameters: z.any().optional().describe("Optional operation parameters"),
    },
  },
  async ({ storage_id, operation, parameters }) => {
    const config = storageConfigs.find(c => c.id === storage_id);
    if (!config) {
      throw new Error(`Storage ${storage_id} not found`);
    }
    
    const connector = registry.getConnector(storage_id, config);
    const result = await connector.execute(operation, parameters);
    
    return {
      content: [{
        type: "text" as const,
        text: result.text,
      }],
    };
  }
);

// @ts-ignore - Type instantiation depth issue with MCP SDK
mcpServer.registerTool(
  "list_collections",
  {
    description: "List collections/tables/datasets in a storage (tables for RDB, collections for NoSQL, datasets for Athena)",
    inputSchema: {
      storage_id: z.string().describe("Storage connection ID"),
      schema: z.string().optional().describe("Schema/database name (optional, for RDB/Athena)"),
    },
  },
  async ({ storage_id, schema }) => {
    const config = storageConfigs.find(c => c.id === storage_id);
    if (!config) {
      throw new Error(`Storage ${storage_id} not found`);
    }
    
    const connector = registry.getConnector(storage_id, config);
    const result = await connector.listCollections(schema);
    
    return {
      content: [{
        type: "text" as const,
        text: result.text,
      }],
    };
  }
);

// @ts-ignore - Type instantiation depth issue with MCP SDK
mcpServer.registerTool(
  "describe_collection",
  {
    description: "Get schema/structure information for a collection/table",
    inputSchema: {
      storage_id: z.string().describe("Storage connection ID"),
      collection: z.string().describe("Collection/table name"),
      schema: z.string().optional().describe("Schema/database name (optional)"),
    },
  },
  async ({ storage_id, collection, schema }) => {
    const config = storageConfigs.find(c => c.id === storage_id);
    if (!config) {
      throw new Error(`Storage ${storage_id} not found`);
    }
    
    const connector = registry.getConnector(storage_id, config);
    const result = await connector.describeCollection(collection, schema);
    
    return {
      content: [{
        type: "text" as const,
        text: result.text,
      }],
    };
  }
);

// @ts-ignore - Type instantiation depth issue with MCP SDK
mcpServer.registerTool(
  "get_storage_info",
  {
    description: "Get detailed information about a specific storage connection",
    inputSchema: {
      storage_id: z.string().describe("Storage connection ID"),
    },
  },
  async ({ storage_id }) => {
    const config = storageConfigs.find(c => c.id === storage_id);
    if (!config) {
      throw new Error(`Storage ${storage_id} not found`);
    }
    
    const result = {
      id: config.id,
      type: config.type,
      writeMode: config.writeMode || false,
      connection: {
        host: config.connection?.host,
        port: config.connection?.port,
        database: config.connection?.database,
      }
    };
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

function initializeStorages() {
  storageConfigs = parseStorageConfigs();
  
  if (storageConfigs.length === 0) {
    console.error("Warning: No storage configurations found.");
    console.error("Configure using environment variables:");
    console.error("  STORAGE_<ID>_TYPE, STORAGE_<ID>_HOST, etc.");
    console.error("  Or STORAGE_CONFIG with JSON array");
    console.error("  Or simple DB_TYPE, DB_HOST, etc.");
    return;
  }

  registry.register('mysql', MySQLConnector);
  registry.register('athena', AthenaConnector);
  registry.register('mongodb', MongoDBConnector);
  
  storageConfigs.forEach(config => {
    console.error(`  - ${config.id} (${config.type}) writeMode=${config.writeMode || false}`);
  });
}

export async function startServer() {
  try {
    initializeStorages();

    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
  } catch (error) {
    console.error("Error starting server:", error);
    throw error;
  }
}
