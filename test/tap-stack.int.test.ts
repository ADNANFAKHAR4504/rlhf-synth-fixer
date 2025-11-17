// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import { RDSClient, DescribeDBClustersCommand } from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const kmsClient = new KMSClient({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const configClient = new ConfigServiceClient({ region });
const ssmClient = new SSMClient({ region });

describe('Security Infrastructure Baseline - Integration Tests', () => {
  describe('KMS Key Encryption', () => {
    test('should have KMS key with automatic rotation enabled', async () => {
      const keyId = outputs.KmsKeyId;
      expect(keyId).toBeDefined();

      const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
      const keyDetails = await kmsClient.send(describeCommand);

      expect(keyDetails.KeyMetadata).toBeDefined();
      expect(keyDetails.KeyMetadata?.KeyState).toBe('Enabled');

      const rotationCommand = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const rotationStatus = await kmsClient.send(rotationCommand);

      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);

    test('should have KMS key with correct description', async () => {
      const keyId = outputs.KmsKeyId;

      const command = new DescribeKeyCommand({ KeyId: keyId });
      const keyDetails = await kmsClient.send(command);

      expect(keyDetails.KeyMetadata?.Description).toBe(
        'Customer-managed key for encrypting all data at rest'
      );
    }, 30000);
  });

  describe('RDS Aurora MySQL Cluster', () => {
    test('should have Aurora cluster with encryption enabled', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();

      const clusterIdentifier = `aurora-mysql-${environmentSuffix}`;
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters?.[0];

      expect(cluster).toBeDefined();
      expect(cluster?.StorageEncrypted).toBe(true);
      expect(cluster?.Engine).toBe('aurora-mysql');
    }, 30000);

    test('should have deletion protection enabled', async () => {
      const clusterIdentifier = `aurora-mysql-${environmentSuffix}`;
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters?.[0];

      expect(cluster?.DeletionProtection).toBe(true);
    }, 30000);

    test('should have automated backups enabled with 30-day retention', async () => {
      const clusterIdentifier = `aurora-mysql-${environmentSuffix}`;
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters?.[0];

      expect(cluster?.BackupRetentionPeriod).toBeGreaterThanOrEqual(30);
    }, 30000);
  });

  describe('S3 Bucket Security', () => {
    test('should have app data bucket with encryption enabled', async () => {
      const bucketName = outputs.AppDataBucketName;
      expect(bucketName).toBeDefined();

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryption = await s3Client.send(command);

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
    }, 30000);

    test('should have app data bucket with versioning enabled', async () => {
      const bucketName = outputs.AppDataBucketName;

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioning = await s3Client.send(command);

      expect(versioning.Status).toBe('Enabled');
    }, 30000);

    test('should have audit logs bucket with encryption enabled', async () => {
      const bucketName = outputs.AuditLogsBucketName;
      expect(bucketName).toBeDefined();

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryption = await s3Client.send(command);

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
    }, 30000);

    test('should have flow logs bucket configured', async () => {
      const bucketName = outputs.FlowLogsBucketName;
      expect(bucketName).toBeDefined();

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryption = await s3Client.send(command);

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
    }, 30000);

    test('should have config bucket configured', async () => {
      const bucketName = outputs.ConfigBucketName;
      expect(bucketName).toBeDefined();

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryption = await s3Client.send(command);

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
    }, 30000);
  });

  describe('AWS Config Compliance', () => {
    test('should have AWS Config recorder configured', async () => {
      const command = new DescribeConfigurationRecordersCommand({});
      const response = await configClient.send(command);

      const recorder = response.ConfigurationRecorders?.find(
        r => r.name === `config-recorder-${environmentSuffix}`
      );

      expect(recorder).toBeDefined();
      expect(recorder?.recordingGroup?.allSupported).toBe(true);
      expect(recorder?.recordingGroup?.includeGlobalResourceTypes).toBe(true);
    }, 30000);

    test('should have all required AWS Config rules deployed', async () => {
      const command = new DescribeConfigRulesCommand({});
      const response = await configClient.send(command);

      const expectedRules = [
        `encrypted-volumes-${environmentSuffix}`,
        `s3-bucket-public-read-prohibited-${environmentSuffix}`,
        `s3-bucket-public-write-prohibited-${environmentSuffix}`,
        `rds-storage-encrypted-${environmentSuffix}`,
        `iam-password-policy-${environmentSuffix}`,
      ];

      const deployedRules =
        response.ConfigRules?.map(r => r.ConfigRuleName) || [];

      expectedRules.forEach(ruleName => {
        expect(deployedRules).toContain(ruleName);
      });
    }, 30000);
  });

  describe('Systems Manager Parameter Store', () => {
    test('should have database endpoint parameter', async () => {
      const parameterName = `/security-baseline/${environmentSuffix}/db-endpoint`;

      const command = new GetParameterCommand({ Name: parameterName });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter?.Value).toBe(outputs.DatabaseEndpoint);
    }, 30000);

    test('should have database port parameter', async () => {
      const parameterName = `/security-baseline/${environmentSuffix}/db-port`;

      const command = new GetParameterCommand({ Name: parameterName });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter?.Value).toBe(outputs.DatabasePort);
    }, 30000);

    test('should have app data bucket parameter', async () => {
      const parameterName = `/security-baseline/${environmentSuffix}/app-data-bucket`;

      const command = new GetParameterCommand({ Name: parameterName });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter?.Value).toBe(outputs.AppDataBucketName);
    }, 30000);
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required stack outputs', () => {
      expect(outputs.KmsKeyArn).toBeDefined();
      expect(outputs.KmsKeyId).toBeDefined();
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.PrivateSubnetIds).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabasePort).toBeDefined();
      expect(outputs.SecurityAlertTopicArn).toBeDefined();
      expect(outputs.AppDataBucketName).toBeDefined();
      expect(outputs.AuditLogsBucketName).toBeDefined();
      expect(outputs.FlowLogsBucketName).toBeDefined();
      expect(outputs.ConfigBucketName).toBeDefined();
      expect(outputs.SecurityLogGroup).toBeDefined();
      expect(outputs.AuditLogGroup).toBeDefined();
    });

    test('should have correct encrypted resources count', () => {
      expect(outputs.EncryptedResourcesCount).toBe('7');
    });

    test('should have compliance status indicating all controls implemented', () => {
      expect(outputs.ComplianceStatus).toBe(
        'All security controls implemented - Monitoring active via AWS Config'
      );
    });

    test('should have security features list in outputs', () => {
      const features = JSON.parse(outputs.SecurityFeaturesEnabled);
      expect(features).toContain('KMS Encryption with Auto-Rotation');
      expect(features).toContain('RDS Aurora Multi-AZ');
      expect(features).toContain('VPC Flow Logs');
      expect(features).toContain('S3 Versioning and Lifecycle');
      expect(features).toContain('CloudWatch Alarms for Security Events');
      expect(features).toContain('AWS Config Compliance Rules');
      expect(features).toContain('IAM MFA Requirements');
      expect(features).toContain('TLS 1.2+ Enforcement');
    });

    test('should have Config rules list in outputs', () => {
      const rules = JSON.parse(outputs.ConfigRulesDeployed);
      expect(rules).toContain('encrypted-volumes');
      expect(rules).toContain('s3-bucket-public-read-prohibited');
      expect(rules).toContain('s3-bucket-public-write-prohibited');
      expect(rules).toContain('rds-storage-encrypted');
      expect(rules).toContain('iam-password-policy');
    });
  });

  describe('Resource Naming Convention', () => {
    test('should follow naming convention with environment suffix', () => {
      expect(outputs.AppDataBucketName).toContain(environmentSuffix);
      expect(outputs.AuditLogsBucketName).toContain(environmentSuffix);
      expect(outputs.FlowLogsBucketName).toContain(environmentSuffix);
      expect(outputs.ConfigBucketName).toContain(environmentSuffix);
      expect(outputs.SecurityLogGroup).toContain(environmentSuffix);
      expect(outputs.AuditLogGroup).toContain(environmentSuffix);
    });
  });
});
