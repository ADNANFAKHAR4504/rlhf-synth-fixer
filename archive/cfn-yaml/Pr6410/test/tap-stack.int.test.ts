import fs from 'fs';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const lambdaClient = new LambdaClient({ region });
const kmsClient = new KMSClient({ region });
const configClient = new ConfigServiceClient({ region });

describe('Compliance Analysis System Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.ComplianceReportsBucketName).toBeDefined();
      expect(outputs.ComplianceReportsBucketArn).toBeDefined();
      expect(outputs.ComplianceAlertTopicArn).toBeDefined();
      expect(outputs.ComplianceAnalysisFunctionArn).toBeDefined();
      expect(outputs.ComplianceKMSKeyId).toBeDefined();
      expect(outputs.ComplianceDashboardURL).toBeDefined();
      expect(outputs.StackName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });

    test('outputs should include environment suffix', () => {
      expect(outputs.ComplianceReportsBucketName).toContain(
        outputs.EnvironmentSuffix
      );
      expect(outputs.ComplianceAlertTopicArn).toContain(outputs.EnvironmentSuffix);
      expect(outputs.ComplianceAnalysisFunctionArn).toContain(
        outputs.EnvironmentSuffix
      );
    });
  });

  describe('S3 Bucket - Compliance Reports', () => {
    test('bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.ComplianceReportsBucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.ComplianceReportsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('bucket should have encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.ComplianceReportsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('bucket should have lifecycle policy configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.ComplianceReportsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      const deleteRule = response.Rules?.find(
        rule => rule.Status === 'Enabled' && rule.Expiration
      );
      expect(deleteRule).toBeDefined();
      expect(deleteRule?.Expiration?.Days).toBeDefined();
    });
  });

  describe('SNS Topic - Compliance Alerts', () => {
    test('topic should exist and be accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.ComplianceAlertTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    test('topic should have KMS encryption enabled', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.ComplianceAlertTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes?.KmsMasterKeyId).toContain(
        outputs.ComplianceKMSKeyId
      );
    });

    test('topic DisplayName should be set', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.ComplianceAlertTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes?.DisplayName).toBe(
        'Infrastructure Compliance Alerts'
      );
    });
  });

  describe('Lambda Function - Compliance Analysis', () => {
    test('function should exist and be accessible', async () => {
      const functionName = outputs.ComplianceAnalysisFunctionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
    });

    test('function should have correct memory configuration', async () => {
      const functionName = outputs.ComplianceAnalysisFunctionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.MemorySize).toBe(256);
    });

    test('function should have environment variables configured', async () => {
      const functionName = outputs.ComplianceAnalysisFunctionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.REPORT_BUCKET
      ).toBe(outputs.ComplianceReportsBucketName);
      expect(
        response.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN
      ).toBe(outputs.ComplianceAlertTopicArn);
    });

    test('function runtime should be Python 3.11', async () => {
      const functionName = outputs.ComplianceAnalysisFunctionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Runtime).toBe('python3.11');
    });
  });

  describe('KMS Key - Compliance Encryption', () => {
    test('KMS key should exist and be enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.ComplianceKMSKeyId,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.Enabled).toBe(true);
    });

    test('KMS key should be a customer managed key', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.ComplianceKMSKeyId,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyManager).toBe('CUSTOMER');
    });
  });

  describe('AWS Config Rules - Compliance Monitoring', () => {
    test('RequiredTagsRule should be active', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`required-tags-${outputs.EnvironmentSuffix}`],
      });

      const response = await configClient.send(command);
      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules?.length).toBe(1);
      expect(response.ConfigRules?.[0].ConfigRuleState).toBe('ACTIVE');
    });

    test('EncryptedVolumesRule should be active', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`encrypted-volumes-${outputs.EnvironmentSuffix}`],
      });

      const response = await configClient.send(command);
      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules?.length).toBe(1);
      expect(response.ConfigRules?.[0].ConfigRuleState).toBe('ACTIVE');
    });

    test('S3BucketEncryptionRule should be active', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`s3-bucket-encryption-${outputs.EnvironmentSuffix}`],
      });

      const response = await configClient.send(command);
      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules?.length).toBe(1);
      expect(response.ConfigRules?.[0].ConfigRuleState).toBe('ACTIVE');
    });

    test('SecurityGroupRestrictedRule should be active', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`security-group-restricted-${outputs.EnvironmentSuffix}`],
      });

      const response = await configClient.send(command);
      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules?.length).toBe(1);
      expect(response.ConfigRules?.[0].ConfigRuleState).toBe('ACTIVE');
    });

    test('all Config rules should use AWS managed rule sources', async () => {
      const ruleNames = [
        `required-tags-${outputs.EnvironmentSuffix}`,
        `encrypted-volumes-${outputs.EnvironmentSuffix}`,
        `s3-bucket-encryption-${outputs.EnvironmentSuffix}`,
        `security-group-restricted-${outputs.EnvironmentSuffix}`,
      ];

      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: ruleNames,
      });

      const response = await configClient.send(command);
      expect(response.ConfigRules?.length).toBe(4);

      response.ConfigRules?.forEach(rule => {
        expect(rule.Source?.Owner).toBe('AWS');
        expect(rule.Source?.SourceIdentifier).toBeDefined();
      });
    });
  });

  describe('EventBridge Rule - Compliance Schedule', () => {
    test('Lambda function should be configured for EventBridge invocation', async () => {
      const functionName = outputs.ComplianceAnalysisFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain('compliance-analyzer');
    });
  });

  describe('CloudWatch Dashboard - Compliance Metrics', () => {
    test('dashboard URL should be available in outputs', () => {
      expect(outputs.ComplianceDashboardURL).toBeDefined();
      expect(outputs.ComplianceDashboardURL).toContain('cloudwatch');
      expect(outputs.ComplianceDashboardURL).toContain('dashboards');
      expect(outputs.ComplianceDashboardURL).toContain(
        `compliance-dashboard-${outputs.EnvironmentSuffix}`
      );
    });
  });

  describe('End-to-End Compliance Workflow', () => {
    test('all compliance components should be interconnected', async () => {
      const functionName = outputs.ComplianceAnalysisFunctionArn.split(':').pop();
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      expect(
        lambdaResponse.Configuration?.Environment?.Variables?.REPORT_BUCKET
      ).toBe(outputs.ComplianceReportsBucketName);
      expect(
        lambdaResponse.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN
      ).toBe(outputs.ComplianceAlertTopicArn);
    });

    test('system should be configured for multi-region analysis', async () => {
      const functionName = outputs.ComplianceAnalysisFunctionArn.split(':').pop();
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      const secondaryRegions =
        lambdaResponse.Configuration?.Environment?.Variables?.SECONDARY_REGIONS;
      expect(secondaryRegions).toBeDefined();
      expect(secondaryRegions).toContain('us-west-2');
      expect(secondaryRegions).toContain('eu-west-1');
    });
  });

  describe('Resource Naming Consistency', () => {
    test('all resources should follow naming convention with environment suffix', () => {
      expect(outputs.ComplianceReportsBucketName).toMatch(
        new RegExp(`-${outputs.EnvironmentSuffix}$`)
      );
      expect(outputs.ComplianceAlertTopicArn).toContain(
        `compliance-alerts-${outputs.EnvironmentSuffix}`
      );
      expect(outputs.ComplianceAnalysisFunctionArn).toContain(
        `compliance-analyzer-${outputs.EnvironmentSuffix}`
      );
    });
  });
});
