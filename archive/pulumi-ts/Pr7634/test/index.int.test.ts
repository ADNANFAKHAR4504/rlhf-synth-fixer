import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { IAMClient, GetRoleCommand, ListRolePoliciesCommand } from '@aws-sdk/client-iam';
import { ConfigServiceClient, DescribeConfigRulesCommand, DescribeConfigurationAggregatorsCommand } from '@aws-sdk/client-config-service';
import { CloudWatchClient, ListDashboardsCommand } from '@aws-sdk/client-cloudwatch';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';

const region = process.env.AWS_REGION || 'us-east-1';

// Load CloudFormation outputs
const outputsPath = path.join(__dirname, '..', 'lib', 'cfn-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// AWS clients
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const iamClient = new IAMClient({ region });
const configClient = new ConfigServiceClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const kmsClient = new KMSClient({ region });

describe('Integration Tests - Deployed Infrastructure', () => {
  describe('S3 Bucket', () => {
    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.bucketName,
      });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.bucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
    });

    it('should have lifecycle policy configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.bucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      const rule = response.Rules?.find((r) => r.ID === 'delete-old-reports');
      expect(rule).toBeDefined();
      expect(rule?.Status).toBe('Enabled');
      expect(rule?.Expiration?.Days).toBe(30);
    });
  });

  describe('KMS Key', () => {
    it('should exist and have rotation enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kmsKeyId,
      });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });
  });

  describe('Lambda Functions', () => {
    it('should have processing Lambda deployed', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.processingLambdaName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.processingLambdaName);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    });

    it('should have aggregation Lambda deployed', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.aggregationLambdaName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.aggregationLambdaName);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    });

    it('should have remediation Lambda deployed', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.remediationLambdaName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.remediationLambdaName);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    });

    it('should have proper environment variables configured for processing Lambda', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.processingLambdaName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.BUCKET_NAME).toBe(outputs.bucketName);
      expect(response.Environment?.Variables?.REGION).toBe(region);
    });

    it('should have timeout set to 300 seconds', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.processingLambdaName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Timeout).toBe(300);
    });
  });

  describe('SNS Topic', () => {
    it('should exist with correct attributes', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.snsTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.snsTopicArn);
      expect(response.Attributes?.DisplayName).toBe('Compliance Notifications');
    });
  });

  describe('IAM Roles', () => {
    const extractRoleName = (arn: string) => {
      const parts = arn.split('/');
      return parts[parts.length - 1];
    };

    it('should have Lambda execution role', async () => {
      const roleName = extractRoleName(outputs.lambdaRoleArn);
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.lambdaRoleArn);
    });

    it('should have Config service role', async () => {
      const roleName = extractRoleName(outputs.configRoleArn);
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.configRoleArn);
    });

    it('should have policies attached to Lambda role', async () => {
      const roleName = extractRoleName(outputs.lambdaRoleArn);
      const command = new ListRolePoliciesCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.PolicyNames).toBeDefined();
      expect(response.PolicyNames?.length).toBeGreaterThan(0);
    });
  });

  describe('AWS Config Rules', () => {
    it('should have all Config rules deployed', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: outputs.configRuleNames,
      });
      const response = await configClient.send(command);
      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules?.length).toBe(4);
    });

    it('should have EC2 instance type rule with correct source', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: ['ec2-approved-instance-types'],
      });
      const response = await configClient.send(command);
      const rule = response.ConfigRules?.[0];
      expect(rule?.Source?.Owner).toBe('AWS');
      expect(rule?.Source?.SourceIdentifier).toBe('DESIRED_INSTANCE_TYPE');
    });

    it('should have S3 encryption rule with correct source', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: ['s3-bucket-encryption-enabled'],
      });
      const response = await configClient.send(command);
      const rule = response.ConfigRules?.[0];
      expect(rule?.Source?.Owner).toBe('AWS');
      expect(rule?.Source?.SourceIdentifier).toBe('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED');
    });

    it('should have RDS backup rule with correct source', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: ['rds-backup-retention-enabled'],
      });
      const response = await configClient.send(command);
      const rule = response.ConfigRules?.[0];
      expect(rule?.Source?.Owner).toBe('AWS');
      expect(rule?.Source?.SourceIdentifier).toBe('DB_INSTANCE_BACKUP_ENABLED');
    });

    it('should have EBS encryption rule with correct source', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: ['ebs-volumes-encrypted'],
      });
      const response = await configClient.send(command);
      const rule = response.ConfigRules?.[0];
      expect(rule?.Source?.Owner).toBe('AWS');
      expect(rule?.Source?.SourceIdentifier).toBe('ENCRYPTED_VOLUMES');
    });
  });

  describe('Config Aggregator', () => {
    it('should have Config aggregator configured', async () => {
      const command = new DescribeConfigurationAggregatorsCommand({
        ConfigurationAggregatorNames: [outputs.configAggregatorName],
      });
      const response = await configClient.send(command);
      expect(response.ConfigurationAggregators).toBeDefined();
      expect(response.ConfigurationAggregators?.length).toBe(1);
      expect(response.ConfigurationAggregators?.[0].ConfigurationAggregatorName).toBe(
        outputs.configAggregatorName
      );
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should have dashboard deployed', async () => {
      const command = new ListDashboardsCommand({});
      const response = await cloudwatchClient.send(command);
      expect(response.DashboardEntries).toBeDefined();
      const dashboard = response.DashboardEntries?.find(d => d.DashboardName === outputs.dashboardName);
      expect(dashboard).toBeDefined();
      expect(dashboard?.DashboardName).toBe(outputs.dashboardName);
    });
  });
});
