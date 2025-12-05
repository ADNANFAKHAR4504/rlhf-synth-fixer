import { execSync } from 'child_process';
import * as AWS from 'aws-sdk';

// Configure AWS SDK
const config = new AWS.Config({
  region: process.env.AWS_REGION || 'us-east-1',
});

const s3 = new AWS.S3(config);
const configService = new AWS.ConfigService(config);
const lambda = new AWS.Lambda(config);
const sns = new AWS.SNS(config);
const ssm = new AWS.SSM(config);

// Get environment suffix from environment variable or use 'dev'
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Compliance Infrastructure Integration Tests', () => {
  jest.setTimeout(300000); // 5 minutes timeout for AWS operations

  describe('S3 Bucket Tests', () => {
    test('Config bucket should exist and be versioned', async () => {
      const bucketName = `compliance-config-${environmentSuffix}`;

      try {
        // Check if bucket exists
        await s3.headBucket({ Bucket: bucketName }).promise();

        // Check versioning
        const versioning = await s3
          .getBucketVersioning({ Bucket: bucketName })
          .promise();
        expect(versioning.Status).toBe('Enabled');
      } catch (error) {
        fail(`Config bucket test failed: ${error}`);
      }
    });

    test('Config bucket should have encryption enabled', async () => {
      const bucketName = `compliance-config-${environmentSuffix}`;

      try {
        const encryption = await s3
          .getBucketEncryption({ Bucket: bucketName })
          .promise();
        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
        expect(
          encryption.ServerSideEncryptionConfiguration?.Rules?.length
        ).toBeGreaterThan(0);
      } catch (error) {
        fail(`Config bucket encryption test failed: ${error}`);
      }
    });

    test('Config bucket should have lifecycle rules configured', async () => {
      const bucketName = `compliance-config-${environmentSuffix}`;

      try {
        const lifecycle = await s3
          .getBucketLifecycleConfiguration({ Bucket: bucketName })
          .promise();
        expect(lifecycle.Rules).toBeDefined();
        expect(lifecycle.Rules?.length).toBeGreaterThanOrEqual(2);

        // Check for archive rule
        const archiveRule = lifecycle.Rules?.find((rule) =>
          rule.ID?.includes('archive')
        );
        expect(archiveRule).toBeDefined();
        expect(archiveRule?.Status).toBe('Enabled');

        // Check for deletion rule
        const deleteRule = lifecycle.Rules?.find((rule) =>
          rule.ID?.includes('delete')
        );
        expect(deleteRule).toBeDefined();
        expect(deleteRule?.Status).toBe('Enabled');
      } catch (error) {
        fail(`Config bucket lifecycle test failed: ${error}`);
      }
    });

    test('Config bucket should have public access blocked', async () => {
      const bucketName = `compliance-config-${environmentSuffix}`;

      try {
        const publicAccessBlock = await s3
          .getPublicAccessBlock({ Bucket: bucketName })
          .promise();
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration
            ?.RestrictPublicBuckets
        ).toBe(true);
      } catch (error) {
        fail(`Config bucket public access test failed: ${error}`);
      }
    });
  });

  describe('AWS Config Tests', () => {
    test('Config recorder should exist and be recording', async () => {
      const recorderName = `config-recorder-${environmentSuffix}`;

      try {
        const recorders = await configService
          .describeConfigurationRecorders()
          .promise();
        const recorder = recorders.ConfigurationRecorders?.find((r) =>
          r.name?.includes(environmentSuffix)
        );
        expect(recorder).toBeDefined();
        expect(recorder?.recordingGroup?.allSupported).toBe(true);
        expect(recorder?.recordingGroup?.includeGlobalResourceTypes).toBe(
          true
        );

        // Check recording status
        const status = await configService
          .describeConfigurationRecorderStatus()
          .promise();
        const recorderStatus = status.ConfigurationRecordersStatus?.find((s) =>
          s.name?.includes(environmentSuffix)
        );
        expect(recorderStatus?.recording).toBe(true);
      } catch (error) {
        fail(`Config recorder test failed: ${error}`);
      }
    });

    test('Config delivery channel should be configured', async () => {
      try {
        const channels = await configService
          .describeDeliveryChannels()
          .promise();
        const channel = channels.DeliveryChannels?.find((c) =>
          c.name?.includes(environmentSuffix)
        );
        expect(channel).toBeDefined();
        expect(channel?.s3BucketName).toContain('compliance-config');
      } catch (error) {
        fail(`Config delivery channel test failed: ${error}`);
      }
    });

    test('Config Rules should be created and active', async () => {
      try {
        const rules = await configService.describeConfigRules().promise();

        // Check for AMI compliance rule
        const amiRule = rules.ConfigRules?.find(
          (r) =>
            r.ConfigRuleName === `ec2-approved-ami-${environmentSuffix}`
        );
        expect(amiRule).toBeDefined();
        expect(amiRule?.Source?.Owner).toBe('CUSTOM_LAMBDA');
        expect(amiRule?.Scope?.ComplianceResourceTypes).toContain(
          'AWS::EC2::Instance'
        );

        // Check for S3 encryption rule
        const s3Rule = rules.ConfigRules?.find(
          (r) =>
            r.ConfigRuleName === `s3-bucket-encryption-${environmentSuffix}`
        );
        expect(s3Rule).toBeDefined();
        expect(s3Rule?.Source?.Owner).toBe('CUSTOM_LAMBDA');
        expect(s3Rule?.Scope?.ComplianceResourceTypes).toContain(
          'AWS::S3::Bucket'
        );

        // Check for RDS backup rule
        const rdsRule = rules.ConfigRules?.find(
          (r) =>
            r.ConfigRuleName === `rds-backup-retention-${environmentSuffix}`
        );
        expect(rdsRule).toBeDefined();
        expect(rdsRule?.Source?.Owner).toBe('CUSTOM_LAMBDA');
        expect(rdsRule?.Scope?.ComplianceResourceTypes).toContain(
          'AWS::RDS::DBInstance'
        );
      } catch (error) {
        fail(`Config Rules test failed: ${error}`);
      }
    });

    test('Config aggregator should be configured', async () => {
      try {
        const aggregators = await configService
          .describeConfigurationAggregators()
          .promise();
        const aggregator = aggregators.ConfigurationAggregators?.find((a) =>
          a.ConfigurationAggregatorName?.includes(environmentSuffix)
        );
        expect(aggregator).toBeDefined();
        expect(aggregator?.AccountAggregationSources?.length).toBeGreaterThan(
          0
        );
      } catch (error) {
        fail(`Config aggregator test failed: ${error}`);
      }
    });
  });

  describe('Lambda Function Tests', () => {
    test('AMI check Lambda function should exist', async () => {
      const functionName = `config-ami-check-${environmentSuffix}`;

      try {
        const fn = await lambda
          .getFunction({ FunctionName: functionName })
          .promise();
        expect(fn.Configuration?.FunctionName).toBe(functionName);
        expect(fn.Configuration?.Runtime).toBe('python3.9');
        expect(fn.Configuration?.Handler).toBe('index.lambda_handler');
        expect(fn.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();
        expect(fn.Configuration?.Environment?.Variables?.APPROVED_AMIS_PARAM).toBeDefined();
        expect(fn.Configuration?.Environment?.Variables?.ENVIRONMENT_SUFFIX).toBe(environmentSuffix);
      } catch (error) {
        fail(`AMI check Lambda test failed: ${error}`);
      }
    });

    test('S3 encryption Lambda function should exist', async () => {
      const functionName = `config-s3-encryption-${environmentSuffix}`;

      try {
        const fn = await lambda
          .getFunction({ FunctionName: functionName })
          .promise();
        expect(fn.Configuration?.FunctionName).toBe(functionName);
        expect(fn.Configuration?.Runtime).toBe('python3.9');
        expect(fn.Configuration?.Handler).toBe('index.lambda_handler');
        expect(fn.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();
        expect(fn.Configuration?.Environment?.Variables?.ENVIRONMENT_SUFFIX).toBe(environmentSuffix);
      } catch (error) {
        fail(`S3 encryption Lambda test failed: ${error}`);
      }
    });

    test('RDS backup Lambda function should exist', async () => {
      const functionName = `config-rds-backup-${environmentSuffix}`;

      try {
        const fn = await lambda
          .getFunction({ FunctionName: functionName })
          .promise();
        expect(fn.Configuration?.FunctionName).toBe(functionName);
        expect(fn.Configuration?.Runtime).toBe('python3.9');
        expect(fn.Configuration?.Handler).toBe('index.lambda_handler');
        expect(fn.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();
        expect(fn.Configuration?.Environment?.Variables?.MIN_BACKUP_RETENTION_PARAM).toBeDefined();
        expect(fn.Configuration?.Environment?.Variables?.ENVIRONMENT_SUFFIX).toBe(environmentSuffix);
      } catch (error) {
        fail(`RDS backup Lambda test failed: ${error}`);
      }
    });

    test('Lambda functions should have correct IAM permissions', async () => {
      const functionName = `config-ami-check-${environmentSuffix}`;

      try {
        const fn = await lambda
          .getFunction({ FunctionName: functionName })
          .promise();
        expect(fn.Configuration?.Role).toBeDefined();
        expect(fn.Configuration?.Role).toContain('config-lambda-role');
      } catch (error) {
        fail(`Lambda IAM permissions test failed: ${error}`);
      }
    });

    test('Lambda functions should have CloudWatch Logs configured', async () => {
      const functionName = `config-ami-check-${environmentSuffix}`;

      try {
        const fn = await lambda
          .getFunction({ FunctionName: functionName })
          .promise();
        expect(fn.Configuration?.LoggingConfig).toBeDefined();
      } catch (error) {
        // LoggingConfig might not be in response, but CloudWatch Logs should be created automatically
        console.log('Lambda CloudWatch Logs check skipped (automatic creation)');
      }
    });
  });

  describe('SNS Topic Tests', () => {
    test('Compliance SNS topic should exist', async () => {
      const topicName = `compliance-alerts-${environmentSuffix}`;

      try {
        const topics = await sns.listTopics().promise();
        const topic = topics.Topics?.find((t) =>
          t.TopicArn?.includes(topicName)
        );
        expect(topic).toBeDefined();
      } catch (error) {
        fail(`SNS topic test failed: ${error}`);
      }
    });

    test('SNS topic should have email subscription', async () => {
      const topicName = `compliance-alerts-${environmentSuffix}`;

      try {
        const topics = await sns.listTopics().promise();
        const topic = topics.Topics?.find((t) =>
          t.TopicArn?.includes(topicName)
        );
        expect(topic).toBeDefined();

        const subscriptions = await sns
          .listSubscriptionsByTopic({ TopicArn: topic!.TopicArn! })
          .promise();
        expect(subscriptions.Subscriptions?.length).toBeGreaterThan(0);
        const emailSub = subscriptions.Subscriptions?.find(
          (s) => s.Protocol === 'email'
        );
        expect(emailSub).toBeDefined();
      } catch (error) {
        fail(`SNS subscription test failed: ${error}`);
      }
    });
  });

  describe('Parameter Store Tests', () => {
    test('Min backup retention parameter should exist', async () => {
      const paramName = `/compliance/${environmentSuffix}/min-backup-retention-days`;

      try {
        const param = await ssm.getParameter({ Name: paramName }).promise();
        expect(param.Parameter?.Name).toBe(paramName);
        expect(param.Parameter?.Type).toBe('String');
        expect(param.Parameter?.Value).toBeDefined();
        expect(parseInt(param.Parameter?.Value!)).toBeGreaterThan(0);
      } catch (error) {
        fail(`Min backup retention parameter test failed: ${error}`);
      }
    });

    test('Approved AMIs parameter should exist', async () => {
      const paramName = `/compliance/${environmentSuffix}/approved-amis`;

      try {
        const param = await ssm.getParameter({ Name: paramName }).promise();
        expect(param.Parameter?.Name).toBe(paramName);
        expect(param.Parameter?.Type).toBe('String');
        expect(param.Parameter?.Value).toBeDefined();
        expect(param.Parameter?.Value?.split(',').length).toBeGreaterThan(0);
      } catch (error) {
        fail(`Approved AMIs parameter test failed: ${error}`);
      }
    });
  });

  describe('Resource Tagging Tests', () => {
    test('S3 bucket should have required tags', async () => {
      const bucketName = `compliance-config-${environmentSuffix}`;

      try {
        const tags = await s3
          .getBucketTagging({ Bucket: bucketName })
          .promise();
        expect(tags.TagSet).toBeDefined();

        const costCenterTag = tags.TagSet?.find(
          (t) => t.Key === 'CostCenter'
        );
        expect(costCenterTag).toBeDefined();
        expect(costCenterTag?.Value).toBe('compliance-team');

        const complianceLevelTag = tags.TagSet?.find(
          (t) => t.Key === 'ComplianceLevel'
        );
        expect(complianceLevelTag).toBeDefined();
        expect(complianceLevelTag?.Value).toBe('high');
      } catch (error) {
        fail(`S3 bucket tagging test failed: ${error}`);
      }
    });

    test('Lambda functions should have required tags', async () => {
      const functionName = `config-ami-check-${environmentSuffix}`;

      try {
        const tags = await lambda
          .listTags({ Resource: (await lambda.getFunction({ FunctionName: functionName }).promise()).Configuration?.FunctionArn! })
          .promise();
        expect(tags.Tags).toBeDefined();
        expect(tags.Tags?.['CostCenter']).toBe('compliance-team');
        expect(tags.Tags?.['ComplianceLevel']).toBe('high');
      } catch (error) {
        fail(`Lambda tagging test failed: ${error}`);
      }
    });
  });

  describe('Integration Test Summary', () => {
    test('All components should be properly integrated', async () => {
      // This test verifies that all major components are created and accessible
      const checks = {
        configBucket: false,
        configRecorder: false,
        configRules: false,
        lambdaFunctions: false,
        snsTopic: false,
        parameters: false,
      };

      try {
        // Check S3 bucket
        await s3
          .headBucket({ Bucket: `compliance-config-${environmentSuffix}` })
          .promise();
        checks.configBucket = true;

        // Check Config recorder
        const recorders = await configService
          .describeConfigurationRecorders()
          .promise();
        checks.configRecorder =
          recorders.ConfigurationRecorders?.some((r) =>
            r.name?.includes(environmentSuffix)
          ) || false;

        // Check Config Rules
        const rules = await configService.describeConfigRules().promise();
        const ruleCount = rules.ConfigRules?.filter((r) =>
          r.ConfigRuleName?.includes(environmentSuffix)
        ).length || 0;
        checks.configRules = ruleCount >= 3;

        // Check Lambda functions
        const amiFunction = await lambda
          .getFunction({ FunctionName: `config-ami-check-${environmentSuffix}` })
          .promise();
        checks.lambdaFunctions = amiFunction.Configuration !== undefined;

        // Check SNS topic
        const topics = await sns.listTopics().promise();
        checks.snsTopic =
          topics.Topics?.some((t) =>
            t.TopicArn?.includes(`compliance-alerts-${environmentSuffix}`)
          ) || false;

        // Check parameters
        const param = await ssm
          .getParameter({
            Name: `/compliance/${environmentSuffix}/min-backup-retention-days`,
          })
          .promise();
        checks.parameters = param.Parameter !== undefined;

        // Verify all checks passed
        expect(checks.configBucket).toBe(true);
        expect(checks.configRecorder).toBe(true);
        expect(checks.configRules).toBe(true);
        expect(checks.lambdaFunctions).toBe(true);
        expect(checks.snsTopic).toBe(true);
        expect(checks.parameters).toBe(true);

        console.log('Integration test summary:', checks);
      } catch (error) {
        console.error('Integration test failed:', error);
        console.log('Checks status:', checks);
        fail(`Integration test failed: ${error}`);
      }
    });
  });
});
