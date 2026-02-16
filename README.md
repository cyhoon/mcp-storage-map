# MCP Storage Map

![License](https://img.shields.io/github/license/cyhoon/mcp-storage-map)
![Node Version](https://img.shields.io/badge/node-%3E%3D24.13.1-brightgreen)

Model Context Protocol (MCP) server for unified database and storage access. Query multiple databases (MySQL, AWS Athena, and more) through a single, consistent interface.

## Quick Start

### 1. Installation

```bash
pnpm add -g @storage-map/mcp-server
```

Or run directly with pnpm dlx:
```bash
pnpm dlx @storage-map/mcp-server
```

### 2. Configure Your IDE

Add to your Claude Desktop or Cursor MCP configuration.

**Single Database Example:**

```json
{
  "mcpServers": {
    "storage-map": {
      "command": "pnpm",
      "args": ["dlx", "@storage-map/mcp-server"],
      "env": {
        "STORAGE_MYSQL_TYPE": "mysql",
        "STORAGE_MYSQL_HOST": "localhost",
        "STORAGE_MYSQL_PORT": "3306",
        "STORAGE_MYSQL_USER": "root",
        "STORAGE_MYSQL_PASSWORD": "password",
        "STORAGE_MYSQL_DATABASE": "myapp",
        "STORAGE_MYSQL_WRITE_MODE": "false"
      }
    }
  }
}
```

**Multiple Databases Example:**

```json
{
  "mcpServers": {
    "storage-map": {
      "command": "pnpm",
      "args": ["dlx", "@storage-map/mcp-server"],
      "env": {
        "STORAGE_PROD_TYPE": "mysql",
        "STORAGE_PROD_HOST": "prod-db.example.com",
        "STORAGE_PROD_PORT": "3306",
        "STORAGE_PROD_USER": "readonly",
        "STORAGE_PROD_PASSWORD": "secret",
        "STORAGE_PROD_DATABASE": "production",

        "STORAGE_STAGING_TYPE": "mysql",
        "STORAGE_STAGING_HOST": "staging-db.example.com",
        "STORAGE_STAGING_PORT": "3306",
        "STORAGE_STAGING_USER": "admin",
        "STORAGE_STAGING_PASSWORD": "secret",
        "STORAGE_STAGING_DATABASE": "staging",
        "STORAGE_STAGING_WRITE_MODE": "true",

        "STORAGE_ANALYTICS_TYPE": "athena",
        "STORAGE_ANALYTICS_REGION": "us-west-2",
        "STORAGE_ANALYTICS_DATABASE": "analytics",
        "STORAGE_ANALYTICS_S3_OUTPUT_LOCATION": "s3://analytics-results/"
      }
    }
  }
}
```

> **Tip**: Each database connection needs a unique ID (the part after `STORAGE_` and before the property name). In the examples above: `MYSQL`, `PROD`, `STAGING`, and `ANALYTICS` are the IDs.

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

- `<ID>`: Unique identifier for your storage connection (e.g., `MYSQL`, `PROD`, `STAGING`, `ANALYTICS`)
  - Use descriptive names to identify each connection
  - Same database type can have multiple IDs (e.g., `PROD_DB` and `STAGING_DB` for different MySQL servers)
- `<PROPERTY>`: Configuration property (e.g., `TYPE`, `HOST`, `PORT`)

**Common Properties**:
- `TYPE`: Database type (`mysql`, `athena`, `postgresql`, etc.) - **Required**
- `WRITE_MODE`: Enable write operations (`true` or `false`, default: `false`)

**MySQL/PostgreSQL**:
- `HOST`: Database host - **Required**
- `PORT`: Database port (default: `3306` for MySQL, `5432` for PostgreSQL)
- `USER`: Username - **Required**
- `PASSWORD`: Password - **Required**
- `DATABASE`: Database name - **Required**

**AWS Athena**:
- `REGION`: AWS region (default: `us-east-1`)
- `DATABASE`: Athena database/catalog (default: `default`)
- `S3_OUTPUT_LOCATION`: S3 path for query results - **Required**
- `WORKGROUP`: Athena workgroup (default: `primary`)

### Configuration Examples

**Example 1: Single MySQL Database**

```bash
STORAGE_MYSQL_TYPE=mysql
STORAGE_MYSQL_HOST=localhost
STORAGE_MYSQL_PORT=3306
STORAGE_MYSQL_USER=root
STORAGE_MYSQL_PASSWORD=password
STORAGE_MYSQL_DATABASE=myapp
```

**Example 2: Multiple MySQL Databases (Prod + Staging)**

```bash
# Production (read-only)
STORAGE_PROD_TYPE=mysql
STORAGE_PROD_HOST=prod-db.example.com
STORAGE_PROD_PORT=3306
STORAGE_PROD_USER=readonly
STORAGE_PROD_PASSWORD=secret
STORAGE_PROD_DATABASE=production

# Staging (read-write)
STORAGE_STAGING_TYPE=mysql
STORAGE_STAGING_HOST=staging-db.example.com
STORAGE_STAGING_PORT=3306
STORAGE_STAGING_USER=admin
STORAGE_STAGING_PASSWORD=secret
STORAGE_STAGING_DATABASE=staging
STORAGE_STAGING_WRITE_MODE=true
```

**Example 3: MySQL + Athena**

```bash
# MySQL for operational data
STORAGE_DB_TYPE=mysql
STORAGE_DB_HOST=localhost
STORAGE_DB_PORT=3306
STORAGE_DB_USER=admin
STORAGE_DB_PASSWORD=password
STORAGE_DB_DATABASE=myapp

# Athena for analytics
STORAGE_ANALYTICS_TYPE=athena
STORAGE_ANALYTICS_REGION=us-west-2
STORAGE_ANALYTICS_DATABASE=analytics
STORAGE_ANALYTICS_S3_OUTPUT_LOCATION=s3://my-bucket/athena-results/
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
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## License

MIT - See [LICENSE](LICENSE)
