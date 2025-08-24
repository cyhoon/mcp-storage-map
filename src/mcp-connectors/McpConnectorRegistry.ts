/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { StorageConfig } from '../config.js';
import { McpConnector, McpConnectorConstructor } from './McpConnector';

class McpConnectorRegistry {

  private connectorConstructors = new Map<string, McpConnectorConstructor>();
  private connectorInstances = new Map<string, McpConnector>();

  register(storageType: string, ConnectorClass: McpConnectorConstructor): void {
    const normalizedType = storageType.toLowerCase();
    this.connectorConstructors.set(normalizedType, ConnectorClass);
  }
  
  getConnector(storageId: string, config: StorageConfig): McpConnector {
    if (this.connectorInstances.has(storageId)) {
      return this.connectorInstances.get(storageId)!;
    }

    const storageType = config.type.toLowerCase();
    const ConnectorClass = this.connectorConstructors.get(storageType);
    
    if (!ConnectorClass) {
      const availableTypes = Array.from(this.connectorConstructors.keys());
      throw new Error(
        `Unsupported storage type: ${config.type}. ` +
        `Available types: ${availableTypes.join(', ') || 'none'}`
      );
    }

    const instance = new ConnectorClass(config);
    this.connectorInstances.set(storageId, instance);
    
    return instance;
  }

  getSupportedTypes(): string[] {
    return Array.from(this.connectorConstructors.keys());
  }

  hasConnector(storageId: string): boolean {
    return this.connectorInstances.has(storageId);
  }

  isTypeSupported(storageType: string): boolean {
    return this.connectorConstructors.has(storageType.toLowerCase());
  }

  removeConnector(storageId: string): void {
    this.connectorInstances.delete(storageId);
    console.error(`Removed connector instance for ${storageId}`);
  }

  clearInstances(): void {
    this.connectorInstances.clear();
    console.error('Cleared all connector instances');
  }

  getActiveStorageIds(): string[] {
    return Array.from(this.connectorInstances.keys());
  }
}

const registry = new McpConnectorRegistry();

export { McpConnectorRegistry, registry };
