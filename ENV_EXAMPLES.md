# Storage Map Environment Variable Examples

## 1. Multiple Storage Configuration (Recommended)

```bash
# MySQL Database
STORAGE_MYSQL_TYPE=mysql
STORAGE_MYSQL_HOST=localhost
STORAGE_MYSQL_PORT=3306
STORAGE_MYSQL_USER=root
STORAGE_MYSQL_PASSWORD=password
STORAGE_MYSQL_DATABASE=myapp
STORAGE_MYSQL_WRITE_MODE=true

# PostgreSQL Analytics
STORAGE_POSTGRES_TYPE=postgresql
STORAGE_POSTGRES_HOST=analytics.example.com
STORAGE_POSTGRES_PORT=5432
STORAGE_POSTGRES_USER=analyst
STORAGE_POSTGRES_PASSWORD=secret
STORAGE_POSTGRES_DATABASE=analytics
STORAGE_POSTGRES_WRITE_MODE=false

# MongoDB Logs
STORAGE_MONGO_TYPE=mongodb
STORAGE_MONGO_URI=mongodb://localhost:27017/logs
STORAGE_MONGO_WRITE_MODE=true

# AWS Athena
STORAGE_ATHENA_TYPE=athena
STORAGE_ATHENA_REGION=us-east-1
STORAGE_ATHENA_S3_OUTPUT_LOCATION=s3://my-bucket/athena-results/
STORAGE_ATHENA_WORKGROUP=primary
STORAGE_ATHENA_DATABASE=datalake
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
    "id": "mongo-logs",
    "type": "mongodb",
    "writeMode": false,
    "connection": {
      "uri": "mongodb://localhost:27017/logs"
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
      "command": "npx",
      "args": ["tsx", "/path/to/storage-map/src/server.ts"],
      "env": {
        "STORAGE_MYSQL_TYPE": "mysql",
        "STORAGE_MYSQL_HOST": "localhost",
        "STORAGE_MYSQL_USER": "root",
        "STORAGE_MYSQL_PASSWORD": "password",
        "STORAGE_MYSQL_DATABASE": "myapp",
        "STORAGE_MYSQL_WRITE_MODE": "true",
        
        "STORAGE_MONGO_TYPE": "mongodb",
        "STORAGE_MONGO_URI": "mongodb://localhost:27017/logs"
      }
    }
  }
}
```

## Environment Variable Patterns

### Pattern: `STORAGE_<ID>_<PROPERTY>`

- `<ID>`: Unique identifier for the storage (e.g., MYSQL, POSTGRES, MONGO)
- `<PROPERTY>`: Configuration property
  - `TYPE`: Storage type (mysql, postgresql, mongodb, athena, etc.)
  - `HOST`: Database host
  - `PORT`: Database port
  - `USER`: Username
  - `PASSWORD`: Password
  - `DATABASE`: Database name
  - `WRITE_MODE`: Enable write operations (true/false)
  - `URI`: Connection URI (for MongoDB)
  - `REGION`: AWS region (for Athena)
  - `S3_OUTPUT_LOCATION`: S3 output location (for Athena)
  - `WORKGROUP`: Athena workgroup
  - `PROJECT_ID`: GCP project ID (for BigQuery)
  - `DATASET_ID`: BigQuery dataset ID
  - `KEY_FILE_PATH`: Service account key path (for BigQuery)

### Storage IDs
- IDs are converted to lowercase and underscores to hyphens
- `STORAGE_MYSQL_MAIN_*` becomes storage ID `mysql-main`
- `STORAGE_POSTGRES_ANALYTICS_*` becomes storage ID `postgres-analytics`