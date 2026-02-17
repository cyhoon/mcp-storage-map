# MCP Storage Map

![License](https://img.shields.io/github/license/cyhoon/mcp-storage-map)
![Node Version](https://img.shields.io/badge/node-%3E%3D24.13.1-brightgreen)

Model Context Protocol (MCP) server for unified database and storage access. Query multiple databases (MySQL, MongoDB, AWS Athena, and more) through a single, consistent interface.

## Quick Start

### 1. Installation

```bash
npm install -g storage-map-mcp
```

Or run directly with npx:
```bash
npx storage-map-mcp
```

### 2. Configure Your IDE

Add to your Claude Desktop, Claude Code, or Cursor MCP configuration.

#### Option A: Using Claude CLI (Recommended)

**Single Database Example:**

```bash
claude mcp add storage-map \
  -e STORAGE_LOCAL_TYPE=mysql \
  -e STORAGE_LOCAL_HOST=localhost \
  -e STORAGE_LOCAL_PORT=3306 \
  -e STORAGE_LOCAL_USER=root \
  -e STORAGE_LOCAL_PASSWORD=your_password \
  -e STORAGE_LOCAL_DATABASE=your_database \
  -e STORAGE_LOCAL_WRITE_MODE=true \
  -- npx storage-map-mcp
```

**MongoDB Example:**

```bash
claude mcp add storage-map \
  -e STORAGE_MONGO_TYPE=mongodb \
  -e STORAGE_MONGO_URI=mongodb://localhost:27017/myapp \
  -e STORAGE_MONGO_DATABASE=myapp \
  -- npx storage-map-mcp
```

**Multiple Databases Example:**

```bash
claude mcp add storage-map \
  -e STORAGE_PROD_TYPE=mysql \
  -e STORAGE_PROD_HOST=prod-db.example.com \
  -e STORAGE_PROD_PORT=3306 \
  -e STORAGE_PROD_USER=readonly \
  -e STORAGE_PROD_PASSWORD=secret \
  -e STORAGE_PROD_DATABASE=production \
  -e STORAGE_STAGING_TYPE=mysql \
  -e STORAGE_STAGING_HOST=staging-db.example.com \
  -e STORAGE_STAGING_PORT=3306 \
  -e STORAGE_STAGING_USER=admin \
  -e STORAGE_STAGING_PASSWORD=secret \
  -e STORAGE_STAGING_DATABASE=staging \
  -e STORAGE_STAGING_WRITE_MODE=true \
  -- npx storage-map-mcp
```

#### Option B: Manual JSON Configuration

**Single Database Example:**

```json
{
  "mcpServers": {
    "storage-map": {
      "command": "npx",
      "args": ["storage-map-mcp"],
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

**MongoDB Example:**

```json
{
  "mcpServers": {
    "storage-map": {
      "command": "npx",
      "args": ["storage-map-mcp"],
      "env": {
        "STORAGE_MONGO_TYPE": "mongodb",
        "STORAGE_MONGO_URI": "mongodb://localhost:27017/myapp",
        "STORAGE_MONGO_DATABASE": "myapp"
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
      "command": "npx",
      "args": ["storage-map-mcp"],
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
- **"Find users older than 25 in MongoDB"**
- **"Show me tables in my Athena database"**
- **"Get the schema for the orders collection"**
- **"Execute SELECT * FROM products LIMIT 10 on mysql storage"**

## Compatibility

| Database | Status | Version |
|----------|--------|---------|
| MySQL | ✅ Fully supported | 5.7+ |
| MongoDB | ✅ Fully supported | 4.4+ |
| AWS Athena | ✅ Fully supported | All versions |

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
- `TYPE`: Database type (`mysql`, `mongodb`, `athena`) - **Required**
- `WRITE_MODE`: Enable write operations (`true` or `false`, default: `false`)

**MySQL**:
- `HOST`: Database host - **Required**
- `PORT`: Database port (default: `3306`)
- `USER`: Username - **Required**
- `PASSWORD`: Password - **Required**
- `DATABASE`: Database name - **Required**

**MongoDB**:
- `URI`: Full connection string (e.g., `mongodb://localhost:27017/mydb`) - Use this **or** HOST/PORT
- `HOST`: MongoDB host (default: `localhost`)
- `PORT`: MongoDB port (default: `27017`)
- `USER`: Username (optional)
- `PASSWORD`: Password (optional)
- `DATABASE`: Database name - **Required**
- `AUTH_SOURCE`: Authentication database (optional)
- `REPLICA_SET`: Replica set name (optional)

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

**Example 3: MongoDB (URI)**

```bash
STORAGE_MONGO_TYPE=mongodb
STORAGE_MONGO_URI=mongodb://localhost:27017/myapp
STORAGE_MONGO_DATABASE=myapp
```

**Example 4: MongoDB (Host/Port with Auth)**

```bash
STORAGE_MONGO_TYPE=mongodb
STORAGE_MONGO_HOST=mongo.example.com
STORAGE_MONGO_PORT=27017
STORAGE_MONGO_USER=admin
STORAGE_MONGO_PASSWORD=secret
STORAGE_MONGO_DATABASE=myapp
STORAGE_MONGO_AUTH_SOURCE=admin
STORAGE_MONGO_WRITE_MODE=true
```

**Example 5: MySQL + MongoDB + Athena**

```bash
# MySQL for operational data
STORAGE_DB_TYPE=mysql
STORAGE_DB_HOST=localhost
STORAGE_DB_PORT=3306
STORAGE_DB_USER=admin
STORAGE_DB_PASSWORD=password
STORAGE_DB_DATABASE=myapp

# MongoDB for document store
STORAGE_MONGO_TYPE=mongodb
STORAGE_MONGO_URI=mongodb://localhost:27017/documents
STORAGE_MONGO_DATABASE=documents

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
    ┌─────────┼──────────────────┐
    │         │                  │
┌───▼──────┐ ┌▼────────┐ ┌─────▼─────┐
│  MySQL   │ │ MongoDB │ │  Athena   │
│Connector │ │Connector│ │ Connector │
└──────────┘ └─────────┘ └───────────┘
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
