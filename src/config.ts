/* eslint-disable */

export interface StorageConfig {
  id: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'athena' | 'bigquery' | 'redis';
  writeMode?: boolean;
  connection: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
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
  const storageEnvs: { [id: string]: any } = {};
  
  for (const [key, value] of Object.entries(process.env)) {
    const match = key.match(/^STORAGE_([^_]+)_(.+)$/);

    if (!match) {
      continue;
    }

    const [, id, property] = match;

    if (!id || !property) {
      continue;
    }

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

  for (const config of Object.values(storageEnvs)) {
    if (config.type && config.connection) {
      configs.push(config as StorageConfig);
    }
  }

  return configs;
}
