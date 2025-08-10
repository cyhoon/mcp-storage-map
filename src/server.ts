import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { parseStorageConfigs, StorageConfig } from "./config.js";

const server = new Server(
  {
    name: "storage-map",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions for multi-storage support
const tools = [
  {
    name: "list_storages",
    description: "List all configured storage connections (RDB, NoSQL, Athena, etc.)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "query",
    description: "Execute a query on any storage (SQL for RDB/Athena, NoSQL query for MongoDB, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        storage_id: {
          type: "string",
          description: "Storage connection ID to use",
        },
        query: {
          type: "string",
          description: "Query to execute (SQL, MongoDB query JSON, etc.)",
        },
        parameters: {
          type: "object",
          description: "Optional query parameters",
          additionalProperties: true,
        },
      },
      required: ["storage_id", "query"],
    },
  },
  {
    name: "execute",
    description: "Execute write operations (INSERT, UPDATE, DELETE for SQL; insert, update for NoSQL)",
    inputSchema: {
      type: "object",
      properties: {
        storage_id: {
          type: "string",
          description: "Storage connection ID to use",
        },
        operation: {
          type: "string",
          description: "Operation to execute (SQL statement or NoSQL operation)",
        },
        parameters: {
          type: "object",
          description: "Optional operation parameters",
          additionalProperties: true,
        },
      },
      required: ["storage_id", "operation"],
    },
  },
  {
    name: "list_collections",
    description: "List collections/tables/datasets in a storage (tables for RDB, collections for NoSQL, datasets for Athena)",
    inputSchema: {
      type: "object",
      properties: {
        storage_id: {
          type: "string",
          description: "Storage connection ID",
        },
        schema: {
          type: "string",
          description: "Schema/database name (optional, for RDB/Athena)",
        },
      },
      required: ["storage_id"],
    },
  },
  {
    name: "describe_collection",
    description: "Get schema/structure information for a collection/table",
    inputSchema: {
      type: "object",
      properties: {
        storage_id: {
          type: "string",
          description: "Storage connection ID",
        },
        collection: {
          type: "string",
          description: "Collection/table name",
        },
        schema: {
          type: "string",
          description: "Schema/database name (optional)",
        },
      },
      required: ["storage_id", "collection"],
    },
  },
  {
    name: "get_storage_info",
    description: "Get detailed information about a specific storage connection",
    inputSchema: {
      type: "object",
      properties: {
        storage_id: {
          type: "string",
          description: "Storage connection ID",
        },
      },
      required: ["storage_id"],
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case "list_storages":
        result = { 
          storages: storageConfigs.map(config => ({
            id: config.id,
            type: config.type,
            writeMode: config.writeMode || false,
            status: "configured" // Will be "connected" once we implement actual connections
          }))
        };
        break;

      case "query":
        // TODO: Route to appropriate storage adapter
        result = { message: "Query tool not yet implemented", args };
        break;

      case "execute":
        // TODO: Route to appropriate storage adapter with write check
        result = { message: "Execute tool not yet implemented", args };
        break;

      case "list_collections":
        // TODO: Get collections/tables from specified storage
        result = { message: "List collections tool not yet implemented", args };
        break;

      case "describe_collection":
        // TODO: Get schema from specified storage
        result = { message: "Describe collection tool not yet implemented", args };
        break;

      case "get_storage_info":
        // TODO: Get detailed storage connection info
        result = { message: "Get storage info tool not yet implemented", args };
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Global storage configurations
let storageConfigs: StorageConfig[] = [];

// Initialize storage configurations
function initializeStorages() {
  storageConfigs = parseStorageConfigs();
  console.error(`Loaded ${storageConfigs.length} storage configuration(s)`);
  
  if (storageConfigs.length === 0) {
    console.error("Warning: No storage configurations found.");
    console.error("Configure using environment variables:");
    console.error("  STORAGE_<ID>_TYPE, STORAGE_<ID>_HOST, etc.");
    console.error("  Or STORAGE_CONFIG with JSON array");
    console.error("  Or simple DB_TYPE, DB_HOST, etc.");
  } else {
    console.error("Configured storages:");
    storageConfigs.forEach(config => {
      console.error(`  - ${config.id} (${config.type}) writeMode=${config.writeMode || false}`);
    });
  }
}

export async function startServer() {
  initializeStorages();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Storage Map MCP Server running on stdio");
}
