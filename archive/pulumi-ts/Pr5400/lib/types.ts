export interface EnvironmentConfig {
  environment: string;
  environmentSuffix: string;
  region: string;
  tags: {
    Environment: string;
    Project: string;
    ManagedBy: string;
    [key: string]: string;
  };
}

export interface ReplicationEvent {
  source: string;
  detailType: string;
  detail: {
    eventSource: string;
    eventName: string;
    requestParameters: {
      bucketName?: string;
      tableName?: string;
      key?: string;
    };
  };
}

export interface ReplicationResult {
  success: boolean;
  environment: string;
  resourceType: string;
  resourceId: string;
  timestamp: number;
  error?: string;
}
