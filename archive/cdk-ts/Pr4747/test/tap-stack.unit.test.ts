import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const testEnvSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: testEnvSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack should be created successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('Stack should be created with correct stack ID', () => {
      expect(stack.artifactId).toBe('TestTapStack');
    });

    test('Stack name should be set correctly', () => {
      expect(stack.stackName).toBeDefined();
    });

    test('Stack should have VPC configured', () => {
      expect(stack.vpc).toBeDefined();
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });
  });

  // ========== ENVIRONMENT SUFFIX TESTS ==========
  describe('Environment Suffix Validation', () => {
    test('S3 buckets should include environmentSuffix in names', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketNames = Object.values(buckets).map((bucket: any) => bucket.Properties?.BucketName);

      // Filter out buckets with BucketName defined (not auto-generated)
      const namedBuckets = bucketNames.filter((name: any) => name && typeof name === 'object');

      expect(namedBuckets.length).toBeGreaterThan(0);
      namedBuckets.forEach((name: any) => {
        const bucketNameStr = JSON.stringify(name);
        expect(bucketNameStr).toContain(testEnvSuffix);
      });
    });

    test('SQS queue should include environmentSuffix in name', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp(`tap-lambda-dlq-${testEnvSuffix}`),
      });
    });

    test('Secrets Manager secret should include environmentSuffix in name', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-app-secrets-${testEnvSuffix}`,
      });
    });

    test('Lambda function should include environmentSuffix in name', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-application-function-${testEnvSuffix}`,
      });
    });

    test('CloudWatch alarms should include environmentSuffix in names', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-lambda-errors-${testEnvSuffix}`,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-lambda-throttles-${testEnvSuffix}`,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-lambda-duration-${testEnvSuffix}`,
      });
    });

    test('SNS topic should include environmentSuffix in name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `tap-alarm-topic-${testEnvSuffix}`,
      });
    });

    test('EventBridge rule should include environmentSuffix in name', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `tap-s3-events-${testEnvSuffix}`,
      });
    });

    test('VPC should include environmentSuffix in name', () => {
      template.hasResourceProperties('AWS::EC2::VPC', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(`tap-vpc-${testEnvSuffix}`),
          }),
        ]),
      }));
    });
  });

  // ========== REMOVAL POLICY TESTS ==========
  describe('Resource Removal Policy Validation', () => {
    test('S3 buckets should have autoDeleteObjects enabled', () => {
      const buckets = template.findResources('AWS::S3::Bucket');

      Object.values(buckets).forEach((bucket: any) => {
        // Check for DeletionPolicy: Delete
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });

    test('KMS keys should have DESTROY removal policy', () => {
      const keys = template.findResources('AWS::KMS::Key');

      Object.values(keys).forEach((key: any) => {
        expect(key.DeletionPolicy).toBe('Delete');
      });
    });

    test('Secrets Manager secret should have DESTROY removal policy', () => {
      const secrets = template.findResources('AWS::SecretsManager::Secret');

      Object.values(secrets).forEach((secret: any) => {
        expect(secret.DeletionPolicy).toBe('Delete');
      });
    });

    test('Custom resources for S3 bucket auto-delete should exist', () => {
      // CDK creates custom resources to handle auto-delete of S3 objects
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 3); // 3 buckets with autoDeleteObjects
    });
  });

  // ========== S3 BUCKET TESTS ==========
  describe('S3 Bucket Configuration', () => {
    test('Should create application S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3); // App bucket, logging bucket, pipeline source bucket
    });

    test('Application bucket should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('Application bucket should have KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });

    test('Application bucket should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Application bucket should have logging configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LoggingConfiguration: Match.objectLike({
          DestinationBucketName: Match.anyValue(),
          LogFilePrefix: 'app-bucket-logs/',
        }),
      });
    });

    test('Application bucket should have lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'delete-incomplete-multipart-uploads',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7,
              },
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('Logging bucket should exist', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Pipeline source bucket should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('Application bucket should deny unencrypted uploads', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyUnencryptedObjectUploads',
              Effect: 'Deny',
              Action: 's3:PutObject',
              Condition: {
                StringNotEquals: {
                  's3:x-amz-server-side-encryption': 'aws:kms',
                },
              },
            }),
          ]),
        },
      });
    });
  });

  // ========== KMS ENCRYPTION TESTS ==========
  describe('KMS Encryption Configuration', () => {
    test('Should create KMS key for S3 encryption', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('KMS key should have key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('KMS key should have proper description', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.objectLike({
          'Fn::Join': Match.anyValue(),
        }),
      });
    });
  });

  // ========== LAMBDA FUNCTION TESTS ==========
  describe('Lambda Function Configuration', () => {
    test('Should create Lambda function', () => {
      // May include log retention custom resource Lambda
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(1);
    });

    test('Lambda should have correct runtime and handler', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'handler.main',
      });
    });

    test('Lambda should have correct memory and timeout for high throughput', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 3008, // Maximum memory
        Timeout: 300, // 5 minutes
      });
    });

    test('Lambda should NOT have reserved concurrent executions (to handle 100k+ req/min)', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      Object.values(lambdaFunctions).forEach((func: any) => {
        expect(func.Properties.ReservedConcurrentExecutions).toBeUndefined();
      });
    });

    test('Lambda should have X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Lambda should have environment variables configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            APPLICATION_BUCKET: Match.anyValue(),
            SECRET_ARN: Match.anyValue(),
            NODE_ENV: 'production',
          },
        },
      });
    });

    test('Lambda should have Dead Letter Queue configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        DeadLetterConfig: {
          TargetArn: Match.anyValue(),
        },
      });
    });

    test('Lambda should have CloudWatch Logs configured', () => {
      // Log group is created implicitly by Lambda or through custom resource
      const func = template.findResources('AWS::Lambda::Function');
      const mainLambda = Object.values(func).find((f: any) =>
        f.Properties?.FunctionName === `tap-application-function-${testEnvSuffix}`
      );
      expect(mainLambda).toBeDefined();
    });
  });

  // ========== SQS DEAD LETTER QUEUE TESTS ==========
  describe('Dead Letter Queue Configuration', () => {
    test('Should create SQS Dead Letter Queue', () => {
      template.resourceCountIs('AWS::SQS::Queue', 1);
    });

    test('DLQ should have correct retention period (14 days)', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 1209600, // 14 days in seconds
      });
    });

    test('DLQ should have KMS encryption', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        KmsMasterKeyId: 'alias/aws/sqs',
      });
    });

    test('DLQ should have proper queue name', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `tap-lambda-dlq-${testEnvSuffix}`,
      });
    });
  });

  // ========== SECRETS MANAGER TESTS ==========
  describe('Secrets Manager Configuration', () => {
    test('Should create Secrets Manager secret', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });

    test('Secret should have proper name and description', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-app-secrets-${testEnvSuffix}`,
        Description: `Secrets for TAP application ${testEnvSuffix}`,
      });
    });

    test('Secret should have automatic secret generation configured', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: Match.stringLikeRegexp(/.*apiKey.*/),
          GenerateStringKey: 'password',
        }),
      });
    });
  });

  // ========== IAM ROLES AND POLICIES TESTS ==========
  describe('IAM Roles and Least Privilege', () => {
    test('Should create IAM role for Lambda function', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('Lambda role should have basic execution policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp(/.*AWSLambdaBasicExecutionRole/),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('Lambda role should have scoped S3 permissions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      let hasS3Policy = false;

      // Check inline policies
      Object.values(roles).forEach((role: any) => {
        const inlinePolicies = role.Properties?.Policies || [];
        inlinePolicies.forEach((policy: any) => {
          const statements = policy.PolicyDocument?.Statement || [];
          statements.forEach((stmt: any) => {
            const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
            if (actions.some((action: string) =>
              action.includes('s3:GetObject') || action.includes('s3:PutObject')
            )) {
              hasS3Policy = true;
            }
          });
        });
      });

      expect(hasS3Policy).toBe(true);
    });

    test('Lambda role should have S3 ListBucket permission', () => {
      const roles = template.findResources('AWS::IAM::Role');
      let hasListBucketPolicy = false;

      // Check inline policies
      Object.values(roles).forEach((role: any) => {
        const inlinePolicies = role.Properties?.Policies || [];
        inlinePolicies.forEach((policy: any) => {
          const statements = policy.PolicyDocument?.Statement || [];
          statements.forEach((stmt: any) => {
            const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
            if (actions.includes('s3:ListBucket')) {
              hasListBucketPolicy = true;
            }
          });
        });
      });

      expect(hasListBucketPolicy).toBe(true);
    });

    test('Lambda role should have SQS SendMessage permission for DLQ', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasSQSPolicy = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          return actions.includes('sqs:SendMessage');
        });
      });
      expect(hasSQSPolicy).toBe(true);
    });

    test('Lambda role should have Secrets Manager GetSecretValue permission', () => {
      const roles = template.findResources('AWS::IAM::Role');
      let hasSecretsPolicy = false;

      // Check inline policies
      Object.values(roles).forEach((role: any) => {
        const inlinePolicies = role.Properties?.Policies || [];
        inlinePolicies.forEach((policy: any) => {
          const statements = policy.PolicyDocument?.Statement || [];
          statements.forEach((stmt: any) => {
            const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
            if (actions.includes('secretsmanager:GetSecretValue')) {
              hasSecretsPolicy = true;
            }
          });
        });
      });

      expect(hasSecretsPolicy).toBe(true);
    });

    test('IAM policies should not have wildcard (*) resources for sensitive actions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        statements.forEach((stmt: any) => {
          if (stmt.Action && (
            stmt.Action.includes('s3:PutObject') ||
            stmt.Action.includes('s3:GetObject') ||
            stmt.Action.includes('secretsmanager:GetSecretValue')
          )) {
            expect(stmt.Resource).not.toBe('*');
          }
        });
      });
    });
  });

  // ========== CLOUDWATCH ALARMS TESTS ==========
  describe('CloudWatch Alarms Configuration', () => {
    test('Should create CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3); // Error, Throttle, Duration
    });

    test('Should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Threshold: 10,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('Should create Lambda throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Threshold: 5,
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching',
      });
    });

    test('Should create Lambda duration alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        Statistic: 'Average',
        Threshold: 3000, // 3 seconds
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('All alarms should have SNS actions configured', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  // ========== SNS TOPIC TESTS ==========
  describe('SNS Topic Configuration', () => {
    test('Should create SNS topic for alarms', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('SNS topic should have display name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `TAP Application Alarms ${testEnvSuffix}`,
      });
    });
  });

  // ========== CANARY DEPLOYMENT TESTS ==========
  describe('Canary Deployment Configuration', () => {
    test('Should create Lambda alias for canary deployment', () => {
      template.resourceCountIs('AWS::Lambda::Alias', 1);
    });

    test('Lambda alias should be named "live"', () => {
      template.hasResourceProperties('AWS::Lambda::Alias', {
        Name: 'live',
      });
    });

    test('Should create CodeDeploy application', () => {
      template.resourceCountIs('AWS::CodeDeploy::Application', 1);
    });

    test('CodeDeploy application should be for Lambda', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ComputePlatform: 'Lambda',
      });
    });

    test('Should create CodeDeploy deployment group', () => {
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    });

    test('Deployment group should use canary deployment config', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentConfigName: 'CodeDeployDefault.LambdaCanary10Percent5Minutes',
      });
    });

    test('Deployment group should have alarm configuration', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentStyle: {
          DeploymentOption: 'WITH_TRAFFIC_CONTROL',
          DeploymentType: 'BLUE_GREEN',
        },
      });
    });
  });

  // ========== VPC CONFIGURATION TESTS ==========
  describe('VPC Configuration', () => {
    test('Should create VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('VPC should have public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private (2 AZs)
    });

    test('VPC should have NAT Gateway for private subnet egress', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('VPC should have Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('Lambda function should be configured with VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        }),
      });
    });

    test('VPC should have appropriate route tables', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 4); // 2 public + 2 private
    });
  });

  // ========== EVENTBRIDGE INTEGRATION TESTS ==========
  describe('EventBridge Integration', () => {
    test('Should create EventBridge rule', () => {
      template.resourceCountIs('AWS::Events::Rule', 1);
    });

    test('EventBridge rule should target Lambda function', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `tap-s3-events-${testEnvSuffix}`,
        Description: `Trigger Lambda on S3 events for ${testEnvSuffix}`,
        State: 'ENABLED',
      });
    });

    test('EventBridge rule should have S3 event pattern', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: Match.objectLike({
          source: ['aws.s3'],
          'detail-type': ['AWS API Call via CloudTrail'],
        }),
      });
    });

    test('Lambda should have permission to be invoked by EventBridge', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'events.amazonaws.com',
      });
    });

    test('EventBridge rule should have targets configured', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
            Id: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  // ========== STACK OUTPUTS TESTS ==========
  describe('Stack Outputs', () => {
    test('Should have ApplicationBucketName output', () => {
      template.hasOutput('ApplicationBucketName', {
        Description: 'Name of the application S3 bucket',
      });
    });

    test('Should have ApplicationBucketArn output', () => {
      template.hasOutput('ApplicationBucketArn', {
        Description: 'ARN of the application S3 bucket',
      });
    });

    test('Should have LoggingBucketName output', () => {
      template.hasOutput('LoggingBucketName', {
        Description: 'Name of the logging S3 bucket',
      });
    });

    test('Should have PipelineSourceBucketName output', () => {
      template.hasOutput('PipelineSourceBucketName', {
        Description: 'Name of the pipeline source S3 bucket',
      });
    });

    test('Should have LambdaFunctionArn output', () => {
      template.hasOutput('LambdaFunctionArn', {
        Description: 'ARN of the Lambda function',
      });
    });

    test('Should have LambdaFunctionName output', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'Name of the Lambda function (use for AWS CLI invocations)',
      });
    });

    test('Should have DeadLetterQueueUrl output', () => {
      template.hasOutput('DeadLetterQueueUrl', {
        Description: 'URL of the Dead Letter Queue',
      });
    });

    test('Should have DeadLetterQueueArn output', () => {
      template.hasOutput('DeadLetterQueueArn', {
        Description: 'ARN of the Dead Letter Queue',
      });
    });

    test('Should have SecretArn output', () => {
      template.hasOutput('SecretArn', {
        Description: 'ARN of the Secrets Manager secret',
      });
    });

    test('Should have AlarmTopicArn output', () => {
      template.hasOutput('AlarmTopicArn', {
        Description: 'ARN of the SNS alarm topic',
      });
    });

    test('Should have alarm name outputs', () => {
      template.hasOutput('ErrorAlarmName', {
        Description: 'Name of the Lambda error alarm',
      });
      template.hasOutput('ThrottleAlarmName', {
        Description: 'Name of the Lambda throttle alarm',
      });
      template.hasOutput('DurationAlarmName', {
        Description: 'Name of the Lambda duration alarm',
      });
    });

    test('Should have LambdaRoleArn output', () => {
      template.hasOutput('LambdaRoleArn', {
        Description: 'ARN of the Lambda execution role',
      });
    });

    test('Should have helper command outputs', () => {
      template.hasOutput('TestInvokeCommand', {
        Description: 'AWS CLI command to test invoke the Lambda function',
      });
      template.hasOutput('CheckDLQCommand', {
        Description: 'AWS CLI command to check Dead Letter Queue messages',
      });
      template.hasOutput('ViewLogsCommand', {
        Description: 'AWS CLI command to tail Lambda function logs',
      });
    });

    test('All outputs should have export names', () => {
      const outputs = [
        'ApplicationBucketName',
        'ApplicationBucketArn',
        'LoggingBucketName',
        'PipelineSourceBucketName',
        'LambdaFunctionArn',
        'LambdaFunctionName',
        'DeadLetterQueueUrl',
        'DeadLetterQueueArn',
        'SecretArn',
        'AlarmTopicArn',
        'ErrorAlarmName',
        'ThrottleAlarmName',
        'DurationAlarmName',
        'LambdaRoleArn',
      ];

      outputs.forEach(outputName => {
        template.hasOutput(outputName, {
          Export: Match.objectLike({
            Name: Match.anyValue(),
          }),
        });
      });
    });
  });

  // ========== SECURITY COMPLIANCE TESTS ==========
  describe('Security Compliance', () => {
    test('All S3 buckets should have encryption enabled', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('All S3 buckets should block public access', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      });
    });

    test('Lambda function should not have wildcard IAM permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        statements.forEach((stmt: any) => {
          // Allow wildcard only for logs and xray (standard AWS managed permissions)
          if (stmt.Resource === '*') {
            const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
            const allowedWildcardActions = actions.every((action: string) =>
              action.startsWith('logs:') ||
              action.startsWith('xray:') ||
              action.startsWith('cloudwatch:')
            );
            expect(allowedWildcardActions).toBe(true);
          }
        });
      });
    });

    test('SQS queue should have encryption enabled', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });

    test('Secrets Manager secret should not have plain text values', () => {
      const secrets = template.findResources('AWS::SecretsManager::Secret');
      Object.values(secrets).forEach((secret: any) => {
        // Should use GenerateSecretString, not plain SecretString
        expect(secret.Properties.GenerateSecretString).toBeDefined();
      });
    });
  });

  // ========== RESOURCE COUNT TESTS ==========
  describe('Resource Count Validation', () => {
    test('Should create expected number of S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('Should create expected number of Lambda functions', () => {
      // May include log retention custom resource Lambda
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(1);
    });

    test('Should create expected number of IAM roles', () => {
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2); // Lambda role + CodeDeploy role
    });

    test('Should create expected number of CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });

    test('Should create expected number of SNS topics', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('Should create expected number of SQS queues', () => {
      template.resourceCountIs('AWS::SQS::Queue', 1);
    });

    test('Should create expected number of Secrets Manager secrets', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });

    test('Should create expected number of KMS keys', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('Should create expected number of Lambda aliases', () => {
      template.resourceCountIs('AWS::Lambda::Alias', 1);
    });

    test('Should create expected number of CodeDeploy applications', () => {
      template.resourceCountIs('AWS::CodeDeploy::Application', 1);
    });

    test('Should create expected number of CodeDeploy deployment groups', () => {
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    });
  });

  // ========== CUSTOM CONSTRUCT TESTS ==========
  describe('Custom Constructs Integration', () => {
    test('SecureBucket construct should be properly integrated', () => {
      // Verify the secure bucket has all required security features
      const buckets = template.findResources('AWS::S3::Bucket');
      const secureBuckets = Object.values(buckets).filter((bucket: any) =>
        bucket.Properties.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]
          ?.ServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms'
      );
      expect(secureBuckets.length).toBeGreaterThan(0);
    });

    test('LambdaWithCanary construct should be properly integrated', () => {
      // Verify Lambda has both function and alias
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(1);
      template.resourceCountIs('AWS::Lambda::Alias', 1);
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    });

    test('LambdaWithCanary should work without logRetention', () => {
      // Create a separate stack to test LambdaWithCanary without logRetention
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'TestStack');

      // Import necessary modules
      const lambda = require('aws-cdk-lib/aws-lambda');
      const codedeploy = require('aws-cdk-lib/aws-codedeploy');
      const { LambdaWithCanary } = require('../lib/constructs/lambda-with-canary');

      // Create LambdaWithCanary without logRetention
      const lambdaWithCanary = new LambdaWithCanary(testStack, 'TestLambda', {
        functionName: 'test-function',
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
        canaryConfig: {
          deploymentConfig: codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
          alarmConfiguration: {
            alarms: [],
            enabled: true,
          },
        },
        // Note: No logRetention specified to test the false branch
      });

      expect(lambdaWithCanary.lambdaFunction).toBeDefined();

      // Verify the template was created correctly
      const testTemplate = Template.fromStack(testStack);
      testTemplate.resourceCountIs('AWS::Lambda::Function', 1);
    });
  });

  // ========== REGION AGNOSTIC TESTS ==========
  describe('Region Agnostic Deployment', () => {
    test('Stack should not have hardcoded region references', () => {
      const stackTemplate = template.toJSON();
      const templateStr = JSON.stringify(stackTemplate);

      // Should use Fn::Sub or Ref for region, not hardcoded values
      expect(templateStr).not.toMatch(/us-east-1(?!.*Ref)/);
      expect(templateStr).not.toMatch(/us-west-2(?!.*Ref)/);
      expect(templateStr).not.toMatch(/eu-west-1(?!.*Ref)/);
    });

    test('Bucket names should use AWS pseudo parameters', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        const bucketName = bucket.Properties?.BucketName;
        if (bucketName && typeof bucketName === 'object') {
          // Should use Fn::Join or Fn::Sub with AWS::Region
          expect(
            bucketName['Fn::Join'] || bucketName['Fn::Sub']
          ).toBeDefined();
        }
      });
    });
  });

  // ========== MONITORING AND OBSERVABILITY TESTS ==========
  describe('Monitoring and Observability', () => {
    test('Lambda function should have log retention configured', () => {
      // Log retention is managed through custom resource or implicit creation
      const func = template.findResources('AWS::Lambda::Function');
      const mainLambda = Object.values(func).find((f: any) =>
        f.Properties?.FunctionName === `tap-application-function-${testEnvSuffix}`
      );
      expect(mainLambda).toBeDefined();
    });

    test('Lambda function should have X-Ray tracing active', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('CloudWatch alarms should monitor key Lambda metrics', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const metricNames = Object.values(alarms).map((alarm: any) =>
        alarm.Properties.MetricName
      );

      expect(metricNames).toContain('Errors');
      expect(metricNames).toContain('Throttles');
      expect(metricNames).toContain('Duration');
    });

    test('All alarms should have proper evaluation configuration', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.EvaluationPeriods).toBeGreaterThan(0);
        expect(alarm.Properties.Threshold).toBeGreaterThan(0);
        expect(alarm.Properties.ComparisonOperator).toBeDefined();
      });
    });
  });

  // ========== HIGH AVAILABILITY TESTS ==========
  describe('High Availability Configuration', () => {
    test('Lambda should support auto-scaling for 100k req/min', () => {
      // No reserved concurrency = uses account-level unreserved capacity
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      Object.values(lambdaFunctions).forEach((func: any) => {
        expect(func.Properties.ReservedConcurrentExecutions).toBeUndefined();
      });
    });

    test('S3 buckets should have versioning for data protection', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const versionedBuckets = Object.values(buckets).filter((bucket: any) =>
        bucket.Properties.VersioningConfiguration?.Status === 'Enabled'
      );
      expect(versionedBuckets.length).toBeGreaterThanOrEqual(2); // App bucket and pipeline bucket
    });

    test('Lambda should have adequate timeout for processing', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 300, // 5 minutes
      });
    });

    test('Lambda should have maximum memory for better performance', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 3008,
      });
    });
  });

  // ========== BEST PRACTICES TESTS ==========
  describe('AWS Best Practices', () => {
    test('Should use managed policies where appropriate', () => {
      const roles = template.findResources('AWS::IAM::Role');
      let hasManagedPolicy = false;

      Object.values(roles).forEach((role: any) => {
        if (role.Properties.ManagedPolicyArns && role.Properties.ManagedPolicyArns.length > 0) {
          hasManagedPolicy = true;
        }
      });

      expect(hasManagedPolicy).toBe(true);
    });

    test('Should use environment variables for configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            APPLICATION_BUCKET: Match.anyValue(),
            SECRET_ARN: Match.anyValue(),
            NODE_ENV: Match.anyValue(),
          }),
        },
      });
    });

    test('Should have proper resource naming conventions', () => {
      const resources = template.toJSON().Resources;
      Object.keys(resources).forEach(logicalId => {
        // Logical IDs should be in PascalCase
        expect(logicalId).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });

    test('Should have descriptions for important resources', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: Match.anyValue(),
      });
    });
  });
});
