import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parseStorageConfigs, StorageConfig } from "./config.js";
import { MySQLClient } from "./clients/mysql.js";

let storageConfigs: StorageConfig[] = [];
const storageClients = new Map<string, MySQLClient>();

const mcpServer = new McpServer({
  name: "storage-map",
  version: "0.0.1",
});

mcpServer.tool(
  "list_storages",
  "List all configured storage connections (RDB, NoSQL, Athena, etc.)",
  {},
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

mcpServer.tool(
  "query",
  "Execute a query on any storage (SQL for RDB/Athena, NoSQL query for MongoDB, etc.)",
  {
    storage_id: z.string().describe("Storage connection ID to use"),
    query: z.string().describe("Query to execute (SQL, MongoDB query JSON, etc.)"),
    parameters: z.object({}).passthrough().optional().describe("Optional query parameters"),
  },
  async ({ storage_id, query, parameters }) => {
    const config = storageConfigs.find(c => c.id === storage_id);

    if (!config) {
      throw new Error(`Storage ${storage_id} not found`);
    }
    
    let result;

    if (config.type === 'mysql') {
      const client = storageClients.get(storage_id);

      if (!client) {
        throw new Error(`MySQL client not initialized for ${storage_id}`);
      }

      const rows = await client.query(query, parameters);

      result = { rows, rowCount: Array.isArray(rows) ? rows.length : 0 };
    } else {
      result = { message: `Query not implemented for ${config.type}` };
    }
    
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

mcpServer.tool(
  "execute",
  "Execute write operations (INSERT, UPDATE, DELETE for SQL; insert, update for NoSQL)",
  {
    storage_id: z.string().describe("Storage connection ID to use"),
    operation: z.string().describe("Operation to execute (SQL statement or NoSQL operation)"),
    parameters: z.object({}).passthrough().optional().describe("Optional operation parameters"),
  },
  async ({ storage_id, operation, parameters }) => {
    const config = storageConfigs.find(c => c.id === storage_id);
    if (!config) {
      throw new Error(`Storage ${storage_id} not found`);
    }
    
    let result;

    if (config.type === 'mysql') {
      const client = storageClients.get(storage_id);

      if (!client) {
        throw new Error(`MySQL client not initialized for ${storage_id}`);
      }

      const execResult = await client.execute(operation, parameters) as unknown as {
        affectedRows: number;
        insertId?: number;
      };

      result = { affectedRows: execResult.affectedRows, insertId: execResult.insertId };
    } else {
      result = { message: `Execute not implemented for ${config.type}` };
    }
    
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

// Tool: list_collections
mcpServer.tool(
  "list_collections",
  "List collections/tables/datasets in a storage (tables for RDB, collections for NoSQL, datasets for Athena)",
  {
    storage_id: z.string().describe("Storage connection ID"),
    schema: z.string().optional().describe("Schema/database name (optional, for RDB/Athena)"),
  },
  async ({ storage_id, schema }) => {
    const config = storageConfigs.find(c => c.id === storage_id);
    if (!config) {
      throw new Error(`Storage ${storage_id} not found`);
    }
    
    let result;
    if (config.type === 'mysql') {
      const client = storageClients.get(storage_id);
      if (!client) {
        throw new Error(`MySQL client not initialized for ${storage_id}`);
      }
      const tables = await client.listTables(schema);
      result = { tables };
    } else {
      result = { message: `List collections not implemented for ${config.type}` };
    }
    
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

// Tool: describe_collection
mcpServer.tool(
  "describe_collection",
  "Get schema/structure information for a collection/table",
  {
    storage_id: z.string().describe("Storage connection ID"),
    collection: z.string().describe("Collection/table name"),
    schema: z.string().optional().describe("Schema/database name (optional)"),
  },
  async ({ storage_id, collection, schema }) => {
    const config = storageConfigs.find(c => c.id === storage_id);
    if (!config) {
      throw new Error(`Storage ${storage_id} not found`);
    }
    
    let result;
    if (config.type === 'mysql') {
      const client = storageClients.get(storage_id);
      if (!client) {
        throw new Error(`MySQL client not initialized for ${storage_id}`);
      }
      const columns = await client.describeTable(collection, schema);
      result = { columns };
    } else {
      result = { message: `Describe collection not implemented for ${config.type}` };
    }
    
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

// Tool: get_storage_info
mcpServer.tool(
  "get_storage_info",
  "Get detailed information about a specific storage connection",
  {
    storage_id: z.string().describe("Storage connection ID"),
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
    return
  }

  storageConfigs.forEach(config => {
    if (config.type === 'mysql') {
      storageClients.set(config.id, new MySQLClient(config));
    }
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
