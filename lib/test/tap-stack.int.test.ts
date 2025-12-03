/**
 * Integration tests for the AWS Config compliance system.
 *
 * These tests verify that the deployed infrastructure works correctly
 * in a real AWS environment. They should be run after deployment.
 */
import * as AWS from 'aws-sdk';

describe('AWS Config Compliance System Integration Tests', () => {
  let configClient: AWS.ConfigService;
  let s3Client: AWS.S3;
  let snsClient: AWS.SNS;
  let lambdaClient: AWS.Lambda;
  let cloudWatchClient: AWS.CloudWatch;

  const environmentSuffix =
    process.env.ENVIRONMENT_SUFFIX || 'integration-test';
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Initialize AWS clients
    configClient = new AWS.ConfigService({ region });
    s3Client = new AWS.S3({ region });
    snsClient = new AWS.SNS({ region });
    lambdaClient = new AWS.Lambda({ region });
    cloudWatchClient = new AWS.CloudWatch({ region });
  });

  describe('S3 Bucket for Config Data', () => {
    const bucketName = `config-bucket-${environmentSuffix}`;

    it('should have Config bucket created', async () => {
      const result = await s3Client.headBucket({ Bucket: bucketName }).promise();
      expect(result).toBeDefined();
    });

    it('should have versioning enabled', async () => {
      const result = await s3Client
        .getBucketVersioning({ Bucket: bucketName })
        .promise();
      expect(result.Status).toBe('Enabled');
    });

    it('should have encryption enabled', async () => {
      const result = await s3Client
        .getBucketEncryption({ Bucket: bucketName })
        .promise();
      expect(result.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        result.ServerSideEncryptionConfiguration.Rules[0]
          .ApplyServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should have lifecycle policy configured', async () => {
      const result = await s3Client
        .getBucketLifecycleConfiguration({ Bucket: bucketName })
        .promise();
      expect(result.Rules).toBeDefined();
      expect(result.Rules.length).toBeGreaterThan(0);
      expect(result.Rules[0].Status).toBe('Enabled');
    });
  });

  describe('AWS Config Recorder', () => {
    const recorderName = `config-recorder-${environmentSuffix}`;

    it('should have Config recorder created', async () => {
      const result = await configClient
        .describeConfigurationRecorders({
          ConfigurationRecorderNames: [recorderName],
        })
        .promise();
      expect(result.ConfigurationRecorders).toBeDefined();
      expect(result.ConfigurationRecorders.length).toBe(1);
      expect(result.ConfigurationRecorders[0].name).toBe(recorderName);
    });

    it('should be recording all supported resource types', async () => {
      const result = await configClient
        .describeConfigurationRecorders({
          ConfigurationRecorderNames: [recorderName],
        })
        .promise();
      const recorder = result.ConfigurationRecorders[0];
      expect(recorder.recordingGroup.allSupported).toBe(true);
      expect(recorder.recordingGroup.includeGlobalResourceTypes).toBe(true);
    });

    it('should be enabled', async () => {
      const result = await configClient
        .describeConfigurationRecorderStatus({
          ConfigurationRecorderNames: [recorderName],
        })
        .promise();
      expect(result.ConfigurationRecordersStatus).toBeDefined();
      expect(result.ConfigurationRecordersStatus[0].recording).toBe(true);
    });
  });

  describe('AWS Config Delivery Channel', () => {
    const deliveryChannelName = `config-delivery-${environmentSuffix}`;
    const bucketName = `config-bucket-${environmentSuffix}`;

    it('should have delivery channel configured', async () => {
      const result = await configClient
        .describeDeliveryChannels({
          DeliveryChannelNames: [deliveryChannelName],
        })
        .promise();
      expect(result.DeliveryChannels).toBeDefined();
      expect(result.DeliveryChannels.length).toBe(1);
      expect(result.DeliveryChannels[0].s3BucketName).toBe(bucketName);
    });
  });

  describe('AWS Config Rules', () => {
    it('should have S3 encryption rule configured', async () => {
      const ruleName = `s3-bucket-encryption-${environmentSuffix}`;
      const result = await configClient
        .describeConfigRules({
          ConfigRuleNames: [ruleName],
        })
        .promise();
      expect(result.ConfigRules).toBeDefined();
      expect(result.ConfigRules.length).toBe(1);
      expect(result.ConfigRules[0].Source.SourceIdentifier).toBe(
        'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
      );
    });

    it('should have EC2 tags rule configured', async () => {
      const ruleName = `ec2-required-tags-${environmentSuffix}`;
      const result = await configClient
        .describeConfigRules({
          ConfigRuleNames: [ruleName],
        })
        .promise();
      expect(result.ConfigRules).toBeDefined();
      expect(result.ConfigRules.length).toBe(1);
      expect(result.ConfigRules[0].Source.SourceIdentifier).toBe(
        'REQUIRED_TAGS'
      );
    });
  });

  describe('Lambda Function for Compliance Reporting', () => {
    const functionName = `compliance-reporter-${environmentSuffix}`;

    it('should have Lambda function created', async () => {
      const result = await lambdaClient
        .getFunction({ FunctionName: functionName })
        .promise();
      expect(result.Configuration).toBeDefined();
      expect(result.Configuration.FunctionName).toBe(functionName);
    });

    it('should have correct runtime configuration', async () => {
      const result = await lambdaClient
        .getFunction({ FunctionName: functionName })
        .promise();
      expect(result.Configuration.Runtime).toContain('python');
      expect(result.Configuration.Timeout).toBe(300);
    });

    it('should have required environment variables', async () => {
      const result = await lambdaClient
        .getFunction({ FunctionName: functionName })
        .promise();
      expect(result.Configuration.Environment).toBeDefined();
      expect(result.Configuration.Environment.Variables.SNS_TOPIC_ARN).toBeDefined();
      expect(result.Configuration.Environment.Variables.S3_BUCKET).toBeDefined();
      expect(
        result.Configuration.Environment.Variables.ENVIRONMENT_SUFFIX
      ).toBe(environmentSuffix);
    });

    it('should be invokable and generate compliance report', async () => {
      const result = await lambdaClient
        .invoke({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
        })
        .promise();

      expect(result.StatusCode).toBe(200);
      const payload = JSON.parse(result.Payload as string);
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.message).toContain('Compliance report generated successfully');
      expect(body.summary).toBeDefined();
    }, 60000); // 60 second timeout for Lambda execution
  });

  describe('SNS Topic for Compliance Notifications', () => {
    const topicName = `compliance-notifications-${environmentSuffix}`;

    it('should have SNS topic created', async () => {
      const listResult = await snsClient.listTopics().promise();
      const topic = listResult.Topics.find((t) =>
        t.TopicArn.includes(topicName)
      );
      expect(topic).toBeDefined();
    });
  });

  describe('CloudWatch Dashboard', () => {
    const dashboardName = `compliance-metrics-${environmentSuffix}`;

    it('should have dashboard created', async () => {
      const result = await cloudWatchClient
        .getDashboard({ DashboardName: dashboardName })
        .promise();
      expect(result.DashboardName).toBe(dashboardName);
      expect(result.DashboardBody).toBeDefined();
    });

    it('should have compliance metrics widgets', async () => {
      const result = await cloudWatchClient
        .getDashboard({ DashboardName: dashboardName })
        .promise();
      const dashboard = JSON.parse(result.DashboardBody);
      expect(dashboard.widgets).toBeDefined();
      expect(dashboard.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('EventBridge Schedule', () => {
    const ruleName = `compliance-check-schedule-${environmentSuffix}`;

    it('should have EventBridge rule created', async () => {
      const eventBridgeClient = new AWS.EventBridge({ region });
      const result = await eventBridgeClient
        .describeRule({ Name: ruleName })
        .promise();
      expect(result.Name).toBe(ruleName);
      expect(result.ScheduleExpression).toBe('rate(1 day)');
      expect(result.State).toBe('ENABLED');
    });
  });

  describe('IAM Roles', () => {
    it('should have Config role with appropriate permissions', async () => {
      const iamClient = new AWS.IAM();
      const roleName = `config-role-${environmentSuffix}`;

      const result = await iamClient
        .getRole({ RoleName: roleName })
        .promise();
      expect(result.Role).toBeDefined();
      expect(result.Role.RoleName).toBe(roleName);

      // Check attached managed policies
      const policies = await iamClient
        .listAttachedRolePolicies({ RoleName: roleName })
        .promise();
      const hasConfigRole = policies.AttachedPolicies.some((p) =>
        p.PolicyArn.includes('AWS_ConfigRole')
      );
      expect(hasConfigRole).toBe(true);
    });

    it('should have Lambda role with appropriate permissions', async () => {
      const iamClient = new AWS.IAM();
      const roleName = `compliance-lambda-role-${environmentSuffix}`;

      const result = await iamClient
        .getRole({ RoleName: roleName })
        .promise();
      expect(result.Role).toBeDefined();
      expect(result.Role.RoleName).toBe(roleName);

      // Check attached managed policies
      const policies = await iamClient
        .listAttachedRolePolicies({ RoleName: roleName })
        .promise();
      const hasBasicExecution = policies.AttachedPolicies.some((p) =>
        p.PolicyArn.includes('AWSLambdaBasicExecutionRole')
      );
      expect(hasBasicExecution).toBe(true);
    });
  });

  describe('End-to-End Compliance Flow', () => {
    it('should generate and store compliance report in S3', async () => {
      const functionName = `compliance-reporter-${environmentSuffix}`;
      const bucketName = `config-bucket-${environmentSuffix}`;

      // Invoke Lambda to generate report
      const invokeResult = await lambdaClient
        .invoke({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
        })
        .promise();

      expect(invokeResult.StatusCode).toBe(200);

      // Wait a bit for S3 write to complete
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check if report exists in S3
      const listResult = await s3Client
        .listObjectsV2({
          Bucket: bucketName,
          Prefix: `compliance-reports/${environmentSuffix}/`,
        })
        .promise();

      expect(listResult.Contents).toBeDefined();
      expect(listResult.Contents.length).toBeGreaterThan(0);
    }, 60000);
  });
});
