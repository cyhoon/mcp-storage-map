# Storage Map Environment Variable Examples

## 1. Multiple Storage Configuration (Recommended)

```bash
# MySQL Production Database (read-only)
STORAGE_PROD_TYPE=mysql
STORAGE_PROD_HOST=prod-db.example.com
STORAGE_PROD_PORT=3306
STORAGE_PROD_USER=readonly
STORAGE_PROD_PASSWORD=secret
STORAGE_PROD_DATABASE=production
STORAGE_PROD_WRITE_MODE=false

# MySQL Staging Database (read-write)
STORAGE_STAGING_TYPE=mysql
STORAGE_STAGING_HOST=staging-db.example.com
STORAGE_STAGING_PORT=3306
STORAGE_STAGING_USER=admin
STORAGE_STAGING_PASSWORD=secret
STORAGE_STAGING_DATABASE=staging
STORAGE_STAGING_WRITE_MODE=true

# AWS Athena Analytics
STORAGE_ATHENA_TYPE=athena
STORAGE_ATHENA_REGION=us-west-2
STORAGE_ATHENA_S3_OUTPUT_LOCATION=s3://analytics-results/
STORAGE_ATHENA_WORKGROUP=primary
STORAGE_ATHENA_DATABASE=analytics
```

## 2. JSON Configuration

```bash
STORAGE_CONFIG='[
  {
    "id": "mysql-main",
    "type": "mysql",
    "writeMode": true,
    "connection": {
      "host": "localhost",
      "port": 3306,
      "user": "root",
      "password": "password",
      "database": "myapp"
    }
  },
  {
    "id": "athena-analytics",
    "type": "athena",
    "writeMode": false,
    "connection": {
      "region": "us-east-1",
      "s3OutputLocation": "s3://my-bucket/athena-results/",
      "workgroup": "primary",
      "database": "datalake"
    }
  }
]'
```

## 3. Simple Single Database

```bash
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_DATABASE=myapp
DB_WRITE_MODE=true
```

## Claude Desktop Configuration

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
        "STORAGE_MYSQL_WRITE_MODE": "true",

        "STORAGE_ATHENA_TYPE": "athena",
        "STORAGE_ATHENA_REGION": "us-west-2",
        "STORAGE_ATHENA_DATABASE": "analytics",
        "STORAGE_ATHENA_S3_OUTPUT_LOCATION": "s3://analytics-results/"
      }
    }
  }
}
```

## Environment Variable Patterns

### Pattern: `STORAGE_<ID>_<PROPERTY>`

- `<ID>`: Unique identifier for the storage (e.g., MYSQL, PROD, STAGING, ATHENA)
- `<PROPERTY>`: Configuration property
  - `TYPE`: Storage type (`mysql` or `athena`)
  - `WRITE_MODE`: Enable write operations (true/false)

  **MySQL Properties:**
  - `HOST`: Database host
  - `PORT`: Database port (default: 3306)
  - `USER`: Username
  - `PASSWORD`: Password
  - `DATABASE`: Database name

  **Athena Properties:**
  - `REGION`: AWS region (default: us-east-1)
  - `DATABASE`: Athena database/catalog (default: default)
  - `S3_OUTPUT_LOCATION`: S3 path for query results
  - `WORKGROUP`: Athena workgroup (default: primary)

### Storage IDs
- IDs are converted to lowercase and underscores to hyphens
- `STORAGE_MYSQL_MAIN_*` becomes storage ID `mysql-main`
- `STORAGE_ATHENA_ANALYTICS_*` becomes storage ID `athena-analytics`
