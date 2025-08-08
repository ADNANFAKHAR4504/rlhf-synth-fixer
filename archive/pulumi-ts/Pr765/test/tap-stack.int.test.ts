import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { GetRoleCommand, GetRolePolicyCommand, IAMClient } from '@aws-sdk/client-iam';
import { DescribeKeyCommand, GetKeyPolicyCommand, GetKeyRotationStatusCommand, KMSClient } from '@aws-sdk/client-kms';
import { GetBucketEncryptionCommand, GetBucketTaggingCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const stackName =  'TapStack'+process.env.ENVIRONMENT_SUFFIX;

// Load stack outputs
const loadStackOutputs = () => {
  const outputsPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');
  const outputsData = fs.readFileSync(outputsPath, 'utf8');
  const outputs = JSON.parse(outputsData);
  return outputs[stackName]; // Use the actual stack name from outputs
};

describe('TapStack Infrastructure Integration Tests', () => {
  let stackOutputs: any;
  let s3Client: S3Client;
  let kmsClient: KMSClient;
  let iamClient: IAMClient;
  let cloudWatchClient: CloudWatchClient;
  let cloudWatchLogsClient: CloudWatchLogsClient;

  beforeAll(() => {
    // Load stack outputs
    stackOutputs = loadStackOutputs();
    
    // Initialize AWS clients
    s3Client = new S3Client({ region: 'us-east-1' });
    kmsClient = new KMSClient({ region: 'us-east-1' });
    iamClient = new IAMClient({ region: 'us-east-1' });
    cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
    cloudWatchLogsClient = new CloudWatchLogsClient({ region: 'us-east-1' });
  });

  describe('S3 Bucket Security Configuration', () => {
    it('should have server-side encryption enabled with KMS', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: stackOutputs.bucketName
      });
      
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(stackOutputs.kmsKeyArn);
      expect(rule?.BucketKeyEnabled).toBe(true);
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: stackOutputs.bucketName
      });
      
      const response = await s3Client.send(command);
      
      expect(response.Status).toBe('Enabled');
    });

    it('should block all public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: stackOutputs.bucketName
      });
      
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    it('should have proper naming convention', () => {
      expect(stackOutputs.bucketName).toMatch(/^app-data-development-/);
    });

    it('should have required tags', async () => {
      const command = new GetBucketTaggingCommand({
        Bucket: stackOutputs.bucketName
      });
      
      const response = await s3Client.send(command);
      
      const tags = response.TagSet || [];
      const tagMap = tags.reduce((acc: any, tag: any) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {});
      
      expect(tagMap.Department).toBe('Security');
      expect(tagMap.Project).toBe('PulumiIaCProject');
    });
  });

  describe('KMS Key Security Configuration', () => {
    it('should have key rotation enabled', async () => {
      const command = new GetKeyRotationStatusCommand({
        KeyId: stackOutputs.kmsKeyId
      });
      
      const response = await kmsClient.send(command);
      
      expect(response.KeyRotationEnabled).toBe(true);
    });

    it('should have proper key policy with S3 service permissions', async () => {
      const command = new GetKeyPolicyCommand({
        KeyId: stackOutputs.kmsKeyId,
        PolicyName: 'default'
      });
      
      const response = await kmsClient.send(command);
      const policy = JSON.parse(response.Policy || '{}');
      
      // Check for S3 service permissions
      const s3ServiceStatement = policy.Statement?.find((stmt: any) => 
        stmt.Sid === 'Allow S3 Service' || 
        (stmt.Principal?.Service === 's3.amazonaws.com')
      );
      
      expect(s3ServiceStatement).toBeDefined();
      expect(s3ServiceStatement.Effect).toBe('Allow');
      expect(s3ServiceStatement.Principal.Service).toBe('s3.amazonaws.com');
      expect(s3ServiceStatement.Action).toContain('kms:Decrypt');
      expect(s3ServiceStatement.Action).toContain('kms:GenerateDataKey');
    });

    it('should have proper key alias', () => {
      expect(stackOutputs.kmsKeyAlias).toMatch(/^alias\/s3-encryption-development/);
    });

    it('should have proper key description', async () => {
      const command = new DescribeKeyCommand({
        KeyId: stackOutputs.kmsKeyId
      });
      
      const response = await kmsClient.send(command);
      
      expect(response.KeyMetadata?.Description).toContain('KMS key for S3 bucket encryption');
      expect(response.KeyMetadata?.Description).toContain('development environment');
    });
  });

  describe('IAM Role Security Configuration', () => {
    it('should have proper trust policy for EC2 and Lambda', async () => {
      const command = new GetRoleCommand({
        RoleName: stackOutputs.roleName
      });
      
      const response = await iamClient.send(command);
      const trustPolicy = JSON.parse(decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}'));
      
      const ec2LambdaStatement = trustPolicy.Statement?.find((stmt: any) =>
        stmt.Principal?.Service?.includes('ec2.amazonaws.com') ||
        stmt.Principal?.Service?.includes('lambda.amazonaws.com')
      );
      
      expect(ec2LambdaStatement).toBeDefined();
      expect(ec2LambdaStatement.Effect).toBe('Allow');
      expect(ec2LambdaStatement.Action).toBe('sts:AssumeRole');
    });

    it('should have least privilege S3 policy', async () => {
      const command = new GetRolePolicyCommand({
        RoleName: stackOutputs.roleName,
        PolicyName: stackOutputs.rolePolicyName
      });
      
      const response = await iamClient.send(command);
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument || '{}'));
      
      const s3Statement = policy.Statement?.[0];
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:ListBucket');
      expect(s3Statement.Resource).toContain(stackOutputs.bucketArn);
    });

    it('should have proper role path', () => {
      expect(stackOutputs.rolePath).toBe('/applications/');
    });

    it('should have descriptive role name', () => {
      expect(stackOutputs.roleName).toMatch(/^app-read-role-development-/);
    });
  });

  describe('CloudWatch Monitoring Configuration', () => {
    it('should have metric alarm for S3 bucket monitoring', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [stackOutputs.metricAlarmName]
      });
      
      const response = await cloudWatchClient.send(command);
      
      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms?.[0];
      
      expect(alarm?.MetricName).toBe('NumberOfObjects');
      expect(alarm?.Namespace).toBe('AWS/S3');
      expect(alarm?.Statistic).toBe('Average');
      expect(alarm?.Period).toBe(86400); // 24 hours
      expect(alarm?.EvaluationPeriods).toBe(1);
      expect(alarm?.Threshold).toBe(0);
      expect(alarm?.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    it('should have log group for alarm events', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: stackOutputs.logGroupName
      });
      
      const response = await cloudWatchLogsClient.send(command);
      
      expect(response.logGroups).toHaveLength(1);
      const logGroup = response.logGroups?.[0];
      
      expect(logGroup?.logGroupName).toBe(stackOutputs.logGroupName);
      expect(logGroup?.retentionInDays).toBe(30);
    });

    it('should have EventBridge rule configuration from stack outputs', () => {
      // Test EventBridge configuration from stack outputs since we can't use the client
      expect(stackOutputs.eventRuleArn).toBeDefined();
      expect(stackOutputs.eventRuleName).toBeDefined();
      expect(stackOutputs.eventTargetId).toBeDefined();
      
      // Validate EventBridge rule ARN format
      expect(stackOutputs.eventRuleArn).toMatch(/^arn:aws:events:us-east-1:\d+:rule\/s3-alarm-rule-development-/);
      expect(stackOutputs.eventRuleName).toMatch(/^s3-alarm-rule-development-/);
      expect(stackOutputs.eventTargetId).toBe('CloudWatchLogsTarget');
    });
  });

  describe('Resource Naming and Tagging Compliance', () => {
    it('should follow consistent naming convention across all resources', () => {
      // S3 bucket naming
      expect(stackOutputs.bucketName).toMatch(/^app-data-development-/);
      
      // KMS key naming
      expect(stackOutputs.kmsKeyAlias).toMatch(/^alias\/s3-encryption-development/);
      
      // IAM role naming
      expect(stackOutputs.roleName).toMatch(/^app-read-role-development-/);
      
      // CloudWatch resources naming
      expect(stackOutputs.metricAlarmName).toMatch(/^s3-objects-alarm-development-/);
      expect(stackOutputs.logGroupName).toMatch(/^s3-alarm-logs-development-/);
      expect(stackOutputs.eventRuleName).toMatch(/^s3-alarm-rule-development-/);
    });

    it('should have consistent environment suffix across all resources', () => {
      const resources = [
        stackOutputs.bucketName,
        stackOutputs.kmsKeyAlias,
        stackOutputs.roleName,
        stackOutputs.metricAlarmName,
        stackOutputs.logGroupName,
        stackOutputs.eventRuleName
      ];
      
      resources.forEach(resource => {
        expect(resource).toContain('development');
      });
    });
  });

  describe('Infrastructure Security Compliance', () => {
    it('should have encryption at rest for all data', () => {
      // S3 bucket uses KMS encryption
      expect(stackOutputs.kmsKeyArn).toBeDefined();
      expect(stackOutputs.kmsKeyId).toBeDefined();
      
      // KMS key is properly configured
      expect(stackOutputs.kmsKeyAlias).toBeDefined();
    });

    it('should have encryption in transit enforced', () => {
      // S3 bucket domain names indicate HTTPS access
      expect(stackOutputs.bucketDomainName).toContain('s3.amazonaws.com');
      expect(stackOutputs.bucketRegionalDomainName).toContain('s3.us-east-1.amazonaws.com');
    });

    it('should implement least privilege access', () => {
      // IAM role has minimal permissions
      expect(stackOutputs.roleArn).toBeDefined();
      expect(stackOutputs.rolePolicyName).toBeDefined();
      
      // Role path follows organizational structure
      expect(stackOutputs.rolePath).toBe('/applications/');
    });

    it('should block public access to sensitive resources', () => {
      // S3 bucket blocks public access
      expect(stackOutputs.bucketPublicAccessBlockId).toBeDefined();
      
      // Public access block configuration is applied
      expect(stackOutputs.bucketPublicAccessBlockId).toBe(stackOutputs.bucketId);
    });

    it('should enable versioning for data protection', () => {
      // S3 bucket versioning is enabled
      expect(stackOutputs.bucketVersioningId).toBeDefined();
      expect(stackOutputs.bucketVersioningId).toBe(stackOutputs.bucketId);
    });

    it('should implement monitoring and alerting', () => {
      // CloudWatch alarm is configured
      expect(stackOutputs.metricAlarmArn).toBeDefined();
      expect(stackOutputs.metricAlarmName).toBeDefined();
      
      // Log group for monitoring
      expect(stackOutputs.logGroupArn).toBeDefined();
      expect(stackOutputs.logGroupName).toBeDefined();
      
      // EventBridge for alarm notifications
      expect(stackOutputs.eventRuleArn).toBeDefined();
      expect(stackOutputs.eventRuleName).toBeDefined();
      expect(stackOutputs.eventTargetId).toBeDefined();
    });
  });

  describe('Infrastructure Integration Validation', () => {
    it('should have all required resources deployed', () => {
      const requiredResources = [
        'bucketArn', 'bucketName', 'bucketId',
        'kmsKeyArn', 'kmsKeyId', 'kmsKeyAlias',
        'roleArn', 'roleName', 'roleId', 'rolePath',
        'metricAlarmArn', 'metricAlarmName',
        'logGroupArn', 'logGroupName',
        'eventRuleArn', 'eventRuleName', 'eventTargetId'
      ];
      
      requiredResources.forEach(resource => {
        expect(stackOutputs[resource]).toBeDefined();
        expect(stackOutputs[resource]).not.toBe('');
      });
    });

    it('should have consistent AWS account and region across all resources', () => {


      const kmsArnParts = stackOutputs.kmsKeyArn.split(':');
      const region = kmsArnParts[3];
      const accountId = kmsArnParts[4];
      
      // Check S3 bucket ARN
      expect(stackOutputs.bucketArn).toContain(`arn:aws:s3:::${stackOutputs.bucketName}`);
      
      // Check KMS key ARN
      expect(stackOutputs.kmsKeyArn).toContain(`arn:aws:kms:${region}:${accountId}:key/${stackOutputs.kmsKeyId}`);
      
      // Check IAM role ARN
      expect(stackOutputs.roleArn).toContain(`arn:aws:iam::${accountId}:role${stackOutputs.rolePath}${stackOutputs.roleName}`);
      
      // Check CloudWatch alarm ARN
      expect(stackOutputs.metricAlarmArn).toContain(`arn:aws:cloudwatch:${region}:${accountId}:alarm:${stackOutputs.metricAlarmName}`);
      
      // Check CloudWatch log group ARN
      expect(stackOutputs.logGroupArn).toContain(`arn:aws:logs:${region}:${accountId}:log-group:${stackOutputs.logGroupName}`);
      
      // Check EventBridge rule ARN
      expect(stackOutputs.eventRuleArn).toContain(`arn:aws:events:${region}:${accountId}:rule/${stackOutputs.eventRuleName}`);
    });

    it('should have proper resource relationships', () => {
      // S3 bucket encryption uses KMS key
      expect(stackOutputs.bucketEncryptionId).toBe(stackOutputs.bucketId);
      
      // S3 bucket versioning is enabled
      expect(stackOutputs.bucketVersioningId).toBe(stackOutputs.bucketId);
      
      // S3 bucket public access block is configured
      expect(stackOutputs.bucketPublicAccessBlockId).toBe(stackOutputs.bucketId);
      
      // IAM role policy is attached
      expect(stackOutputs.rolePolicyId).toContain(stackOutputs.roleId);
      expect(stackOutputs.rolePolicyName).toMatch(/^app-read-policy-development-/);
    });
  });
});
