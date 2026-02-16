# MCP Storage Map

![License](https://img.shields.io/github/license/cyhoon/mcp-storage-map)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

Model Context Protocol (MCP) server for unified database and storage access. Query multiple databases (MySQL, AWS Athena, and more) through a single, consistent interface.

## Quick Start

### 1. Installation

```bash
npm install -g @storage-map/mcp-server
```

Or run directly with npx:
```bash
npx @storage-map/mcp-server
```

### 2. Configure Your IDE

Add to your Claude Desktop or Cursor MCP configuration:

```json
{
  "mcpServers": {
    "storage-map": {
      "command": "npx",
      "args": ["@storage-map/mcp-server"],
      "env": {
        "STORAGE_MYSQL_TYPE": "mysql",
        "STORAGE_MYSQL_HOST": "localhost",
        "STORAGE_MYSQL_PORT": "3306",
        "STORAGE_MYSQL_USER": "your_username",
        "STORAGE_MYSQL_PASSWORD": "your_password",
        "STORAGE_MYSQL_DATABASE": "your_database",
        "STORAGE_MYSQL_WRITE_MODE": "false",

        "STORAGE_ATHENA_TYPE": "athena",
        "STORAGE_ATHENA_REGION": "us-east-1",
        "STORAGE_ATHENA_DATABASE": "your_database",
        "STORAGE_ATHENA_S3_OUTPUT_LOCATION": "s3://your-bucket/query-results/",
        "STORAGE_ATHENA_WORKGROUP": "primary"
      }
    }
  }
}
```

### 3. Start Using

Ask your AI assistant to:
- **"List all my configured databases"**
- **"Query the users table from my MySQL database"**
- **"Show me tables in my Athena database"**
- **"Get the schema for the orders table"**
- **"Execute SELECT * FROM products LIMIT 10 on mysql storage"**

## Compatibility

| Database | Status | Version |
|----------|--------|---------|
| MySQL | ✅ Fully supported | 5.7+ |
| AWS Athena | ✅ Fully supported | All versions |
| PostgreSQL | 🔄 Planned | - |
| MongoDB | 🔄 Planned | - |
| BigQuery | 🔄 Planned | - |
| Redis | 🔄 Planned | - |

## Key Tools

| Tool | Description |
|------|-------------|
| `list_storages` | List all configured storage connections |
| `query` | Execute read queries (SELECT, etc.) |
| `execute` | Execute write operations (INSERT, UPDATE, DELETE) |
| `list_collections` | List tables/collections in a storage |
| `describe_collection` | Get schema information for a table/collection |
| `get_storage_info` | Get detailed connection information |

## Configuration

### Environment Variables

Storage Map uses a flexible configuration system with environment variables:

**Pattern**: `STORAGE_<ID>_<PROPERTY>`

- `<ID>`: Unique identifier for your storage (e.g., `MYSQL`, `ATHENA`, `PROD_DB`)
- `<PROPERTY>`: Configuration property (e.g., `TYPE`, `HOST`, `PORT`)

**Common Properties**:
- `TYPE`: Database type (`mysql`, `athena`, `postgresql`, etc.)
- `WRITE_MODE`: Enable write operations (`true` or `false`, default: `false`)

**MySQL/PostgreSQL**:
- `HOST`: Database host
- `PORT`: Database port
- `USER`: Username
- `PASSWORD`: Password
- `DATABASE`: Database name

**AWS Athena**:
- `REGION`: AWS region
- `DATABASE`: Athena database/catalog
- `S3_OUTPUT_LOCATION`: S3 path for query results (required)
- `WORKGROUP`: Athena workgroup (default: `primary`)

### Example: Multiple Databases

```json
{
  "env": {
    "STORAGE_PROD_MYSQL_TYPE": "mysql",
    "STORAGE_PROD_MYSQL_HOST": "prod-db.example.com",
    "STORAGE_PROD_MYSQL_USER": "readonly",

    "STORAGE_ANALYTICS_TYPE": "athena",
    "STORAGE_ANALYTICS_REGION": "us-west-2",
    "STORAGE_ANALYTICS_DATABASE": "analytics",
    "STORAGE_ANALYTICS_S3_OUTPUT_LOCATION": "s3://analytics-results/"
  }
}
```

## Features

### Unified Interface
Query different databases using the same MCP tools, regardless of the underlying technology.

### Read-Only by Default
All connections are read-only by default. Explicitly enable `WRITE_MODE` for write operations.

### Multiple Connections
Configure multiple databases of the same or different types simultaneously.

### Type-Safe
Built with TypeScript, providing type safety and better developer experience.

### Extensible Architecture
Easy to add new database connectors with the `McpConnector` interface.

## Architecture

```
┌─────────────────────────────────────────┐
│         MCP Server (server.ts)          │
├─────────────────────────────────────────┤
│  MCP Tools: query, execute, list, etc.  │
└─────────────┬───────────────────────────┘
              │
      ┌───────┴────────┐
      │   Registry     │
      └───────┬────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼──────┐      ┌─────▼─────┐
│  MySQL   │      │  Athena   │
│Connector │      │ Connector │
└──────────┘      └───────────┘
```

Each connector implements the `McpConnector` interface:
- `query()` - Execute read queries
- `execute()` - Execute write operations
- `listCollections()` - List tables/collections
- `describeCollection()` - Get schema information

## Security

- Never commit credentials or API tokens to version control
- Use environment variables for sensitive configuration
- Keep `WRITE_MODE` disabled unless absolutely necessary
- Review queries before execution, especially with write access enabled

## Development

```bash
# Clone the repository
git clone https://github.com/cyhoon/mcp-storage-map.git
cd mcp-storage-map

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## License

MIT - See [LICENSE](LICENSE)
