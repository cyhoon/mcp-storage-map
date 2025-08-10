export interface StorageConfig {
  id: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'athena' | 'bigquery' | 'dynamodb' | 'redis';
  writeMode?: boolean;
  connection: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    // MongoDB specific
    uri?: string;
    // Athena specific
    region?: string;
    s3OutputLocation?: string;
    workgroup?: string;
    // BigQuery specific
    projectId?: string;
    datasetId?: string;
    keyFilePath?: string;
  };
}

export function parseStorageConfigs(): StorageConfig[] {
  const configs: StorageConfig[] = [];
  
  // Pattern: STORAGE_<ID>_<PROPERTY>
  // Example: 
  //   STORAGE_MYSQL_MAIN_TYPE=mysql
  //   STORAGE_MYSQL_MAIN_HOST=localhost
  //   STORAGE_MYSQL_MAIN_PORT=3306
  //   STORAGE_MYSQL_MAIN_USER=root
  //   STORAGE_MYSQL_MAIN_PASSWORD=password
  //   STORAGE_MYSQL_MAIN_DATABASE=mydb
  //   STORAGE_MYSQL_MAIN_WRITE_MODE=true
  
  const storageEnvs: { [id: string]: any } = {};
  
  // Group environment variables by storage ID
  for (const [key, value] of Object.entries(process.env)) {
    const match = key.match(/^STORAGE_([^_]+)_(.+)$/);
    if (match) {
      const [, id, property] = match;
      const storageId = id.toLowerCase().replace(/_/g, '-');
      
      if (!storageEnvs[storageId]) {
        storageEnvs[storageId] = { id: storageId };
      }
      
      const propName = property.toLowerCase();
      
      if (propName === 'type') {
        storageEnvs[storageId].type = value?.toLowerCase();
      } else if (propName === 'write_mode') {
        storageEnvs[storageId].writeMode = value === 'true';
      } else if (propName === 'host') {
        storageEnvs[storageId].connection = storageEnvs[storageId].connection || {};
        storageEnvs[storageId].connection.host = value;
      } else if (propName === 'port') {
        storageEnvs[storageId].connection = storageEnvs[storageId].connection || {};
        storageEnvs[storageId].connection.port = parseInt(value || '0');
      } else if (propName === 'user') {
        storageEnvs[storageId].connection = storageEnvs[storageId].connection || {};
        storageEnvs[storageId].connection.user = value;
      } else if (propName === 'password') {
        storageEnvs[storageId].connection = storageEnvs[storageId].connection || {};
        storageEnvs[storageId].connection.password = value;
      } else if (propName === 'database') {
        storageEnvs[storageId].connection = storageEnvs[storageId].connection || {};
        storageEnvs[storageId].connection.database = value;
      } else if (propName === 'uri') {
        storageEnvs[storageId].connection = storageEnvs[storageId].connection || {};
        storageEnvs[storageId].connection.uri = value;
      } else if (propName === 'region') {
        storageEnvs[storageId].connection = storageEnvs[storageId].connection || {};
        storageEnvs[storageId].connection.region = value;
      } else if (propName === 's3_output_location') {
        storageEnvs[storageId].connection = storageEnvs[storageId].connection || {};
        storageEnvs[storageId].connection.s3OutputLocation = value;
      } else if (propName === 'workgroup') {
        storageEnvs[storageId].connection = storageEnvs[storageId].connection || {};
        storageEnvs[storageId].connection.workgroup = value;
      } else if (propName === 'project_id') {
        storageEnvs[storageId].connection = storageEnvs[storageId].connection || {};
        storageEnvs[storageId].connection.projectId = value;
      } else if (propName === 'dataset_id') {
        storageEnvs[storageId].connection = storageEnvs[storageId].connection || {};
        storageEnvs[storageId].connection.datasetId = value;
      } else if (propName === 'key_file_path') {
        storageEnvs[storageId].connection = storageEnvs[storageId].connection || {};
        storageEnvs[storageId].connection.keyFilePath = value;
      }
    }
  }
  
  // Alternative: JSON configuration in a single env variable
  if (process.env.STORAGE_CONFIG) {
    try {
      const jsonConfig = JSON.parse(process.env.STORAGE_CONFIG);
      if (Array.isArray(jsonConfig)) {
        configs.push(...jsonConfig);
      }
    } catch (e) {
      console.error('Failed to parse STORAGE_CONFIG:', e);
    }
  }
  
  // Convert grouped envs to StorageConfig array
  for (const config of Object.values(storageEnvs)) {
    if (config.type && config.connection) {
      configs.push(config as StorageConfig);
    }
  }
  
  // Fallback: Simple single database configuration
  if (configs.length === 0) {
    if (process.env.DB_TYPE && process.env.DB_HOST) {
      configs.push({
        id: 'default',
        type: process.env.DB_TYPE.toLowerCase() as any,
        writeMode: process.env.DB_WRITE_MODE === 'true',
        connection: {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
        }
      });
    }
  }
  
  return configs;
}