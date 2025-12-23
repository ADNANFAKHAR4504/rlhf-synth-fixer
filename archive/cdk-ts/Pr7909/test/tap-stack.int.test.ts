// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListTagsForResourceCommand,
} from '@aws-sdk/client-sns';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'g8p3k6t7';

const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const configClient = new ConfigServiceClient({ region });

describe('Compliance Monitoring System Integration Tests', () => {
  describe('S3 Configuration Bucket', () => {
    test('bucket exists and is accessible', async () => {
      const bucketName = outputs.ConfigBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(environmentSuffix);

      const command = new HeadBucketCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('bucket has encryption enabled', async () => {
      const bucketName = outputs.ConfigBucketName;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.length
      ).toBeGreaterThan(0);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('bucket has versioning enabled', async () => {
      const bucketName = outputs.ConfigBucketName;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });
  });

  describe('Compliance Lambda Function', () => {
    test('Lambda function exists and is configured correctly', async () => {
      const lambdaArn = outputs.ComplianceLambdaArn;
      expect(lambdaArn).toBeDefined();
      expect(lambdaArn).toContain(environmentSuffix);

      const functionName = lambdaArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.FunctionName).toContain(environmentSuffix);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(300);
    });

    test('Lambda has required environment variables', async () => {
      const lambdaArn = outputs.ComplianceLambdaArn;
      const functionName = lambdaArn.split(':').pop();
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      const envVars = response.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars?.ENVIRONMENT_SUFFIX).toBe(environmentSuffix);
      expect(envVars?.CRITICAL_TOPIC_ARN).toBeDefined();
      expect(envVars?.HIGH_TOPIC_ARN).toBeDefined();
      expect(envVars?.MEDIUM_TOPIC_ARN).toBeDefined();
      expect(envVars?.LOW_TOPIC_ARN).toBeDefined();
    });
  });

  describe('SNS Compliance Topics', () => {
    test('critical topic exists and is accessible', async () => {
      const topicArn = outputs.CriticalTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain(environmentSuffix);

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes?.TopicArn).toBe(topicArn);
      expect(response.Attributes?.DisplayName).toBe(
        'Critical Compliance Violations'
      );
    });

    test('critical topic has correct tags', async () => {
      const topicArn = outputs.CriticalTopicArn;
      const command = new ListTagsForResourceCommand({
        ResourceArn: topicArn,
      });
      const response = await snsClient.send(command);

      const tags = response.Tags || [];
      expect(tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'CostCenter', Value: 'Security' }),
          expect.objectContaining({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
          expect.objectContaining({
            Key: 'ComplianceLevel',
            Value: 'High',
          }),
        ])
      );
    });
  });

  describe('AWS Config Rules', () => {
    test('S3 encryption rule exists', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`s3-bucket-encryption-${environmentSuffix}`],
      });
      const response = await configClient.send(command);

      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules?.length).toBe(1);
      expect(response.ConfigRules?.[0]?.ConfigRuleName).toBe(
        `s3-bucket-encryption-${environmentSuffix}`
      );
      expect(response.ConfigRules?.[0]?.Source?.Owner).toBe('AWS');
      expect(response.ConfigRules?.[0]?.Source?.SourceIdentifier).toBe(
        'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
      );
    });

    test('EC2 instance type rule exists', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`ec2-instance-type-${environmentSuffix}`],
      });
      const response = await configClient.send(command);

      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules?.length).toBe(1);
      expect(response.ConfigRules?.[0]?.ConfigRuleName).toBe(
        `ec2-instance-type-${environmentSuffix}`
      );
    });

    test('RDS backup retention rule exists', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`rds-backup-retention-${environmentSuffix}`],
      });
      const response = await configClient.send(command);

      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules?.length).toBe(1);
      expect(response.ConfigRules?.[0]?.ConfigRuleName).toBe(
        `rds-backup-retention-${environmentSuffix}`
      );
      expect(response.ConfigRules?.[0]?.Source?.Owner).toBe('AWS');
      expect(response.ConfigRules?.[0]?.Source?.SourceIdentifier).toBe(
        'DB_INSTANCE_BACKUP_ENABLED'
      );
    });
  });

  describe('End-to-End Compliance Workflow', () => {
    test('all components are properly connected', async () => {
      // Verify S3 bucket exists
      const bucketName = outputs.ConfigBucketName;
      const bucketCommand = new HeadBucketCommand({ Bucket: bucketName });
      const bucketResponse = await s3Client.send(bucketCommand);
      expect(bucketResponse.$metadata.httpStatusCode).toBe(200);

      // Verify Lambda exists
      const lambdaArn = outputs.ComplianceLambdaArn;
      const functionName = lambdaArn.split(':').pop();
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      expect(lambdaResponse.Configuration?.FunctionName).toBeDefined();

      // Verify SNS topic exists
      const topicArn = outputs.CriticalTopicArn;
      const snsCommand = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const snsResponse = await snsClient.send(snsCommand);
      expect(snsResponse.Attributes?.TopicArn).toBe(topicArn);

      // Verify Config rules exist by querying them directly
      const s3RuleCommand = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`s3-bucket-encryption-${environmentSuffix}`],
      });
      const s3RuleResponse = await configClient.send(s3RuleCommand);
      expect(s3RuleResponse.ConfigRules?.length).toBe(1);

      const ec2RuleCommand = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`ec2-instance-type-${environmentSuffix}`],
      });
      const ec2RuleResponse = await configClient.send(ec2RuleCommand);
      expect(ec2RuleResponse.ConfigRules?.length).toBe(1);

      const rdsRuleCommand = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`rds-backup-retention-${environmentSuffix}`],
      });
      const rdsRuleResponse = await configClient.send(rdsRuleCommand);
      expect(rdsRuleResponse.ConfigRules?.length).toBe(1);
    });
  });
});
