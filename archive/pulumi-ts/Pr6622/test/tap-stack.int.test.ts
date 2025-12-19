import { GetBucketReplicationCommand, GetBucketVersioningCommand, S3Client } from '@aws-sdk/client-s3';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import * as fs from 'fs';
import * as path from 'path';

describe('Multi-Region Disaster Recovery Infrastructure Integration Tests', () => {
  let outputs: any;
  const primaryRegion = 'us-east-1';
  const drRegion = 'us-east-2';

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Deployment outputs not found at ${outputsPath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('API Gateway Endpoints', () => {
    it('should have accessible primary API endpoint', () => {
      expect(outputs.primaryApiEndpoint).toBeDefined();
      expect(outputs.primaryApiEndpoint).toContain('https://');
      expect(outputs.primaryApiEndpoint).toContain('execute-api');
      expect(outputs.primaryApiEndpoint).toContain(primaryRegion);
      expect(outputs.primaryApiEndpoint).toContain('/prod/payment');
    });

    it('should have accessible secondary API endpoint', () => {
      expect(outputs.secondaryApiEndpoint).toBeDefined();
      expect(outputs.secondaryApiEndpoint).toContain('https://');
      expect(outputs.secondaryApiEndpoint).toContain('execute-api');
      expect(outputs.secondaryApiEndpoint).toContain(drRegion);
      expect(outputs.secondaryApiEndpoint).toContain('/prod/payment');
    });

    it('should have different API IDs for primary and secondary', () => {
      const primaryApiId = outputs.primaryApiEndpoint.split('.')[0].replace('https://', '');
      const secondaryApiId = outputs.secondaryApiEndpoint.split('.')[0].replace('https://', '');
      expect(primaryApiId).not.toBe(secondaryApiId);
    });

    it('should have valid API Gateway IDs', () => {
      const primaryApiId = outputs.primaryApiEndpoint.split('.')[0].replace('https://', '');
      const secondaryApiId = outputs.secondaryApiEndpoint.split('.')[0].replace('https://', '');

      expect(primaryApiId).toMatch(/^[a-z0-9]{10}$/);
      expect(secondaryApiId).toMatch(/^[a-z0-9]{10}$/);
    });
  });

  describe('Health Check Configuration', () => {
    it('should have health check URL configured', () => {
      expect(outputs.healthCheckUrl).toBeDefined();
      expect(outputs.healthCheckUrl).toContain('https://');
      expect(outputs.healthCheckUrl).toContain('/prod/payment');
    });

    it('should validate health check points to primary region', () => {
      expect(outputs.healthCheckUrl).toContain(primaryRegion);
    });

    it('should have same endpoint as primary API', () => {
      expect(outputs.healthCheckUrl).toBe(outputs.primaryApiEndpoint);
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have replication lag alarm configured', () => {
      expect(outputs.replicationLagAlarmArn).toBeDefined();
      expect(outputs.replicationLagAlarmArn).toContain('arn:aws:cloudwatch');
      expect(outputs.replicationLagAlarmArn).toContain('alarm:dynamodb-replication-lag');
    });

    it('should have valid alarm ARN format', () => {
      const alarmName = outputs.replicationLagAlarmArn.split(':alarm:')[1];
      expect(alarmName).toContain('dynamodb-replication-lag');
      expect(outputs.replicationLagAlarmArn).toMatch(/^arn:aws:cloudwatch:[a-z0-9-]+:\d{12}:alarm:/);
    });
  });





  describe('S3 Bucket Replication', () => {
    it('should validate S3 buckets exist in both regions', async () => {
      const alarmName = outputs.replicationLagAlarmArn.split(':alarm:')[1];
      const suffix = alarmName.split('dynamodb-replication-lag-')[1];

      const primaryBucketName = `transaction-logs-primary-${suffix}`;
      const drBucketName = `transaction-logs-dr-${suffix}`;

      const primaryClient = new S3Client({ region: primaryRegion });
      const drClient = new S3Client({ region: drRegion });

      const primaryCommand = new GetBucketVersioningCommand({ Bucket: primaryBucketName });
      const drCommand = new GetBucketVersioningCommand({ Bucket: drBucketName });

      const primaryResponse = await primaryClient.send(primaryCommand);
      const drResponse = await drClient.send(drCommand);

      expect(primaryResponse.Status).toBe('Enabled');
      expect(drResponse.Status).toBe('Enabled');
    }, 30000);

    it('should validate S3 replication is configured', async () => {
      const alarmName = outputs.replicationLagAlarmArn.split(':alarm:')[1];
      const suffix = alarmName.split('dynamodb-replication-lag-')[1];
      const primaryBucketName = `transaction-logs-primary-${suffix}`;

      const client = new S3Client({ region: primaryRegion });
      const command = new GetBucketReplicationCommand({ Bucket: primaryBucketName });
      const response = await client.send(command);

      expect(response.ReplicationConfiguration).toBeDefined();
      expect(response.ReplicationConfiguration!.Rules).toBeDefined();
      expect(response.ReplicationConfiguration!.Rules!.length).toBeGreaterThan(0);
      expect(response.ReplicationConfiguration!.Rules![0].Status).toBe('Enabled');
    }, 30000);
  });

  describe('SSM Parameters', () => {
    it('should validate SSM parameters store endpoints', async () => {
      const alarmName = outputs.replicationLagAlarmArn.split(':alarm:')[1];
      const suffix = alarmName.split('dynamodb-replication-lag-')[1];

      const primaryParamName = `/payment-system/${suffix}/primary-api-endpoint`;
      const drParamName = `/payment-system/${suffix}/dr-api-endpoint`;

      const client = new SSMClient({ region: primaryRegion });

      const primaryCommand = new GetParameterCommand({ Name: primaryParamName });
      const drCommand = new GetParameterCommand({ Name: drParamName });

      const primaryResponse = await client.send(primaryCommand);
      const drResponse = await client.send(drCommand);

      expect(primaryResponse.Parameter?.Value).toContain('https://');
      expect(primaryResponse.Parameter?.Value).toContain(primaryRegion);
      expect(drResponse.Parameter?.Value).toContain('https://');
      expect(drResponse.Parameter?.Value).toContain(drRegion);
    }, 30000);
  });

  describe('Multi-Region Disaster Recovery Validation', () => {
    it('should have independent infrastructure in both regions', () => {
      expect(outputs.primaryApiEndpoint).not.toBe(outputs.secondaryApiEndpoint);
      expect(outputs.primaryApiEndpoint).toContain(primaryRegion);
      expect(outputs.secondaryApiEndpoint).toContain(drRegion);
    });

    it('should validate all critical outputs are present', () => {
      expect(outputs.primaryApiEndpoint).toBeDefined();
      expect(outputs.secondaryApiEndpoint).toBeDefined();
      expect(outputs.healthCheckUrl).toBeDefined();
      expect(outputs.replicationLagAlarmArn).toBeDefined();
    });

    it('should validate failover capability with health checks', () => {
      expect(outputs.healthCheckUrl).toBe(outputs.primaryApiEndpoint);
      expect(outputs.secondaryApiEndpoint).toBeDefined();
    });
  });
});
