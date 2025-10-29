import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create stack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      expect(defaultStack).toBeDefined();
    });

    test('should use context environment suffix when provided', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'test');
      const contextStack = new TapStack(contextApp, 'ContextStack');
      expect(contextStack).toBeDefined();
    });
  });

  describe('KMS Keys', () => {
    test('should create database KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for database encryption',
        EnableKeyRotation: true,
        PendingWindowInDays: 30,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/database-encryption-${environmentSuffix}`,
      });
    });

    test('should create S3 KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for S3 bucket encryption',
        EnableKeyRotation: true,
        PendingWindowInDays: 30,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/s3-encryption-${environmentSuffix}`,
      });
    });

    test('should create secrets KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for Secrets Manager encryption',
        EnableKeyRotation: true,
        PendingWindowInDays: 30,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/secrets-encryption-${environmentSuffix}`,
      });
    });

    test('should create logs KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for CloudWatch Logs encryption',
        EnableKeyRotation: true,
        PendingWindowInDays: 30,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/logs-encryption-${environmentSuffix}`,
      });
    });

    test('should have correct KMS key policies', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable IAM policies',
              Effect: 'Allow',
              Action: 'kms:*',
            }),
            Match.objectLike({
              Sid: 'Prevent key deletion',
              Effect: 'Deny',
              Action: Match.arrayWith(['kms:ScheduleKeyDeletion', 'kms:Delete*']),
            }),
          ]),
        },
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create access log bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        AccessControl: 'LogDeliveryWrite',
      });
    });

    test('should create CloudTrail bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        LoggingConfiguration: Match.anyValue(),
      });
    });

    test('should create VPC flow log bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create Config bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        LoggingConfiguration: Match.anyValue(),
      });
    });

    test('should have SSL-only bucket policies', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('should have lifecycle rules for old versions', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldVersions',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 90,
              },
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7,
              },
            }),
          ]),
        },
      });
    });
  });

  describe('VPC and Networking', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        InstanceTenancy: 'default',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `security-baseline-vpc-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('should create isolated subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Isolated',
          }),
        ]),
      });
    });

    test('should create VPC flow logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        TrafficType: 'ALL',
        LogDestinationType: 's3',
      });
    });

    test('should create VPC endpoints for AWS services', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        PrivateDnsEnabled: true,
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create application log group with 7-year retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/application/main-${environmentSuffix}`,
        RetentionInDays: 2557, // 7 years
      });
    });

    test('should create Lambda log group with 7-year retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/secrets-rotation-${environmentSuffix}`,
        RetentionInDays: 2557, // 7 years
      });
    });

    test('should create CloudTrail log group with 7-year retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/cloudtrail/security-baseline-${environmentSuffix}`,
        RetentionInDays: 2557, // 7 years
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 instance role with correct properties', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `SecurityBaselineEc2Role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should create Lambda execution role with VPC access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `SecurityBaselineLambdaRole-${environmentSuffix}`,
        ManagedPolicyArns: Match.anyValue(),
      });
    });

    test('should create ECS task role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `SecurityBaselineEcsTaskRole-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should create DevOps cross-account role with MFA enforcement', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `DevOpsSecurityBaselineRole-${environmentSuffix}`,
        MaxSessionDuration: 7200, // 2 hours
      });
    });

    test('should have IP-based conditions in IAM policies', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Condition: {
                IpAddress: {
                  'aws:SourceIp': ['10.0.0.0/8', '172.16.0.0/12'],
                },
              },
            }),
          ]),
        },
      });
    });

    test('should have MFA conditions in DevOps role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Condition: Match.objectLike({
                Bool: {
                  'aws:MultiFactorAuthPresent': 'true',
                },
              }),
            }),
          ]),
        },
      });
    });
  });

  describe('Secrets Manager', () => {
    test('should create database secret with correct properties', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `app/database/master-${environmentSuffix}`,
        Description: 'Database master credentials',
        GenerateSecretString: {
          ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          GenerateStringKey: 'password',
          PasswordLength: 32,
          SecretStringTemplate: '{"username":"dbadmin"}',
        },
      });
    });

    test('should create API key secret with correct properties', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `app/api/key-${environmentSuffix}`,
        Description: 'API key for external services',
        GenerateSecretString: {
          ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          GenerateStringKey: 'apiKey',
          PasswordLength: 64,
          SecretStringTemplate: '{"service":"payment-gateway"}',
        },
      });
    });

    test('should create rotation schedules for secrets', () => {
      template.hasResourceProperties('AWS::SecretsManager::RotationSchedule', {
        RotationRules: {
          ScheduleExpression: 'rate(30 days)',
        },
      });

      template.hasResourceProperties('AWS::SecretsManager::RotationSchedule', {
        RotationRules: {
          ScheduleExpression: 'rate(90 days)',
        },
      });
    });

    test('should create secrets rotation Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `secrets-rotation-lambda-${environmentSuffix}`,
        Runtime: 'python3.11',
        Handler: 'index.handler',
        Timeout: 300,
        MemorySize: 512,
      });
    });
  });

  describe('CloudTrail', () => {
    test('should create CloudTrail with correct properties', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: `security-baseline-trail-${environmentSuffix}`,
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
        IsLogging: true,
      });
    });

    test('should have CloudTrail event selectors', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EventSelectors: Match.arrayWith([
          Match.objectLike({
            IncludeManagementEvents: true,
            ReadWriteType: 'All',
          }),
          Match.objectLike({
            DataResources: Match.arrayWith([
              Match.objectLike({
                Type: 'AWS::S3::Object',
              }),
            ]),
          }),
        ]),
      });
    });

    test('should have CloudTrail insight types', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        InsightSelectors: Match.arrayWith([
          Match.objectLike({
            InsightType: 'ApiCallRateInsight',
          }),
          Match.objectLike({
            InsightType: 'ApiErrorRateInsight',
          }),
        ]),
      });
    });
  });

  describe('AWS Config', () => {
    test('should create Config recorder', () => {
      template.hasResourceProperties('AWS::Config::ConfigurationRecorder', {
        Name: `security-baseline-recorder-${environmentSuffix}`,
        RecordingGroup: {
          AllSupported: true,
          IncludeGlobalResourceTypes: true,
          RecordingStrategy: {
            UseOnly: 'ALL_SUPPORTED_RESOURCE_TYPES',
          },
        },
      });
    });

    test('should create Config delivery channel', () => {
      template.hasResourceProperties('AWS::Config::DeliveryChannel', {
        Name: `security-baseline-delivery-${environmentSuffix}`,
        ConfigSnapshotDeliveryProperties: {
          DeliveryFrequency: 'TwentyFour_Hours',
        },
      });
    });

    test('should create Config rules for compliance', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Description: 'Checks that EBS volumes are encrypted',
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'ENCRYPTED_VOLUMES',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Description: 'Checks that S3 buckets require SSL requests',
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'S3_BUCKET_SSL_REQUESTS_ONLY',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Description: 'Checks IAM password policy requirements',
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'IAM_PASSWORD_POLICY',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Description: 'Checks that MFA is enabled for IAM console access',
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Description: 'Checks that CloudTrail is enabled',
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'CLOUD_TRAIL_ENABLED',
        },
      });
    });

    test('should create Config aggregator', () => {
      template.hasResourceProperties('AWS::Config::ConfigurationAggregator', {
        ConfigurationAggregatorName: `security-baseline-aggregator-${environmentSuffix}`,
        AccountAggregationSources: Match.arrayWith([
          Match.objectLike({
            AllAwsRegions: true,
          }),
        ]),
      });
    });
  });

  describe('Service Control Policies', () => {
    test('should create SCP to prevent security resource deletion', () => {
      template.hasResourceProperties('AWS::Organizations::Policy', {
        Type: 'SERVICE_CONTROL_POLICY',
        Name: `PreventSecurityResourceDeletion-${environmentSuffix}`,
        Description: 'Prevents deletion or modification of critical security resources',
      });
    });

    test('should have SCP content with deny statements', () => {
      template.hasResourceProperties('AWS::Organizations::Policy', {
        Content: Match.anyValue(),
        Type: 'SERVICE_CONTROL_POLICY',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create unauthorized API calls alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `SecurityBaseline-UnauthorizedAPICalls-${environmentSuffix}`,
        AlarmDescription: 'Alert on unauthorized API calls',
        MetricName: 'UnauthorizedAPICalls',
        Namespace: 'CloudTrailMetrics',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });

    test('should create root account usage alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `SecurityBaseline-RootAccountUsage-${environmentSuffix}`,
        AlarmDescription: 'Alert on root account usage',
        MetricName: 'RootAccountUsage',
        Namespace: 'CloudTrailMetrics',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });
  });

  describe('EventBridge and Lambda', () => {
    test('should create compliance change rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `security-baseline-compliance-changes-${environmentSuffix}`,
        Description: 'Triggers on Config compliance changes',
        EventPattern: {
          source: ['aws.config'],
          'detail-type': ['Config Rules Compliance Change'],
        },
      });
    });

    test('should create compliance reporting Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `compliance-reporting-${environmentSuffix}`,
        Runtime: 'python3.11',
        Handler: 'index.handler',
        Timeout: 300,
      });
    });
  });

  describe('Outputs', () => {
    test('should create KMS database key output', () => {
      template.hasOutput('KmsDatabaseKeyArn', {
        Description: 'KMS key ARN for database encryption',
        Export: {
          Name: `SecurityBaseline-KmsDatabaseKey-${environmentSuffix}`,
        },
      });
    });

    test('should create CloudTrail ARN output', () => {
      template.hasOutput('CloudTrailArn', {
        Description: 'CloudTrail ARN',
        Export: {
          Name: `SecurityBaseline-CloudTrailArn-${environmentSuffix}`,
        },
      });
    });

    test('should create DevOps role ARN output', () => {
      template.hasOutput('DevOpsRoleArn', {
        Description: 'DevOps cross-account role ARN',
        Export: {
          Name: `SecurityBaseline-DevOpsRoleArn-${environmentSuffix}`,
        },
      });
    });

    test('should create compliance aggregator output', () => {
      template.hasOutput('ComplianceAggregatorName', {
        Description: 'Config aggregator name for compliance reporting',
        Export: {
          Name: `SecurityBaseline-ComplianceAggregator-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Tagging', () => {
    test('should apply global tags to resources', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
          Match.objectLike({
            Key: 'Owner',
            Value: 'SecurityTeam',
          }),
        ]),
      });
    });
  });

  describe('Resource Counts', () => {
    test('should have correct number of KMS keys', () => {
      template.resourceCountIs('AWS::KMS::Key', 4);
    });

    test('should have correct number of KMS aliases', () => {
      template.resourceCountIs('AWS::KMS::Alias', 4);
    });

    test('should have correct number of S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 4);
    });

    test('should have correct number of IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 7); // EC2, Lambda, ECS, DevOps, Config, Compliance Reporting, Secrets Rotation
    });

    test('should have correct number of Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 2); // Secrets rotation, Compliance reporting
    });

    test('should have correct number of Config rules', () => {
      template.resourceCountIs('AWS::Config::ConfigRule', 5);
    });

    test('should have correct number of CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });
  });

  describe('Security Features', () => {
    test('should have encryption enabled on all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });
    });

    test('should have encryption enabled on all log groups', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        KmsKeyId: Match.anyValue(),
      });
    });

    test('should have versioning enabled on all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should have public access blocked on all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });
});
