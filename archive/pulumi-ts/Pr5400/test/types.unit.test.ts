import { EnvironmentConfig, ReplicationEvent, ReplicationResult } from '../lib/types';

describe('TypeScript Interfaces', () => {
  describe('EnvironmentConfig', () => {
    it('defines correct structure for environment configuration', () => {
      const config: EnvironmentConfig = {
        environment: 'dev',
        environmentSuffix: 'test123',
        region: 'us-east-1',
        tags: {
          Environment: 'dev',
          Project: 'TestProject',
          ManagedBy: 'Pulumi',
        },
      };

      expect(config.environment).toBe('dev');
      expect(config.environmentSuffix).toBe('test123');
      expect(config.region).toBe('us-east-1');
      expect(config.tags.Environment).toBe('dev');
    });

    it('allows additional custom tags', () => {
      const config: EnvironmentConfig = {
        environment: 'prod',
        environmentSuffix: 'xyz',
        region: 'us-west-2',
        tags: {
          Environment: 'prod',
          Project: 'CustomProject',
          ManagedBy: 'Pulumi',
          CustomTag: 'CustomValue',
        },
      };

      expect(config.tags.CustomTag).toBe('CustomValue');
    });

    it('requires all mandatory fields', () => {
      const config: EnvironmentConfig = {
        environment: 'staging',
        environmentSuffix: 'abc',
        region: 'eu-west-1',
        tags: {
          Environment: 'staging',
          Project: 'Test',
          ManagedBy: 'Pulumi',
        },
      };

      expect(config.environment).toBeDefined();
      expect(config.environmentSuffix).toBeDefined();
      expect(config.region).toBeDefined();
      expect(config.tags).toBeDefined();
    });
  });

  describe('ReplicationEvent', () => {
    it('defines structure for S3 replication events', () => {
      const event: ReplicationEvent = {
        source: 'aws.s3',
        detailType: 'AWS API Call via CloudTrail',
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutObject',
          requestParameters: {
            bucketName: 'test-bucket',
            key: 'test-key.json',
          },
        },
      };

      expect(event.source).toBe('aws.s3');
      expect(event.detail.eventSource).toBe('s3.amazonaws.com');
      expect(event.detail.requestParameters.key).toBe('test-key.json');
    });

    it('defines structure for DynamoDB replication events', () => {
      const event: ReplicationEvent = {
        source: 'aws.dynamodb',
        detailType: 'AWS API Call via CloudTrail',
        detail: {
          eventSource: 'dynamodb.amazonaws.com',
          eventName: 'PutItem',
          requestParameters: {
            tableName: 'test-table',
          },
        },
      };

      expect(event.source).toBe('aws.dynamodb');
      expect(event.detail.eventSource).toBe('dynamodb.amazonaws.com');
      expect(event.detail.requestParameters.tableName).toBe('test-table');
    });

    it('allows optional request parameters', () => {
      const event: ReplicationEvent = {
        source: 'aws.s3',
        detailType: 'AWS API Call via CloudTrail',
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'ListBucket',
          requestParameters: {},
        },
      };

      expect(event.detail.requestParameters.key).toBeUndefined();
      expect(event.detail.requestParameters.bucketName).toBeUndefined();
    });
  });

  describe('ReplicationResult', () => {
    it('defines structure for successful replication', () => {
      const result: ReplicationResult = {
        success: true,
        environment: 'dev',
        resourceType: 's3',
        resourceId: 'test-bucket/test-key',
        timestamp: Date.now(),
      };

      expect(result.success).toBe(true);
      expect(result.environment).toBe('dev');
      expect(result.error).toBeUndefined();
    });

    it('defines structure for failed replication with error', () => {
      const result: ReplicationResult = {
        success: false,
        environment: 'staging',
        resourceType: 'dynamodb',
        resourceId: 'test-table',
        timestamp: Date.now(),
        error: 'Connection timeout',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timeout');
    });

    it('includes timestamp for all results', () => {
      const timestamp = Date.now();
      const result: ReplicationResult = {
        success: true,
        environment: 'prod',
        resourceType: 's3',
        resourceId: 'bucket/key',
        timestamp,
      };

      expect(result.timestamp).toBe(timestamp);
      expect(result.timestamp).toBeGreaterThan(0);
    });
  });
});
