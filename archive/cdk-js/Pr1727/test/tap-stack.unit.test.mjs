import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';
import { SecurityKmsStack } from '../lib/security-kms-stack.mjs';
import { SecurityIamStack } from '../lib/security-iam-stack.mjs';
import { SecurityConfigStack } from '../lib/security-config-stack.mjs';
import { SecurityMonitoringStack } from '../lib/security-monitoring-stack.mjs';

describe('TapStack', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';
  const region = 'us-west-2';
  const stackSuffix = `${environmentSuffix}-${region}`;

  beforeEach(() => {
    // Set AWS_REGION for testing
    process.env.AWS_REGION = region;
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: { region }
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create the main stack with correct properties', () => {
      expect(stack.stackName).toBe('TestTapStack');
      expect(stack.tags.tagValues()).toMatchObject({
        'Owner': 'SecurityTeam',
        'Purpose': 'SecurityConfiguration',
        'Environment': environmentSuffix,
        'CostCenter': 'Security',
        'Compliance': 'Required',
        'Project': 'SecurityAsCode',
      });
    });

    test('should have output for deployment completion', () => {
      template.hasOutput(`SecurityDeploymentComplete${stackSuffix.replace(/-/g, '')}`, {
        Value: 'SUCCESS',
        Description: 'Indicates successful deployment of all security stacks',
      });
    });
  });

  describe('Nested Stack Dependencies', () => {
    test('should create all nested security stacks', () => {
      const app = new cdk.App();
      
      // Create KMS Stack
      const kmsStack = new SecurityKmsStack(app, `SecurityKmsStack${stackSuffix}`, {
        environmentSuffix,
      });
      expect(kmsStack).toBeDefined();
      
      // Create IAM Stack
      const iamStack = new SecurityIamStack(app, `SecurityIamStack${stackSuffix}`, {
        environmentSuffix,
        encryptionKeyArn: 'arn:aws:kms:us-west-2:123456789012:key/test-key',
      });
      expect(iamStack).toBeDefined();
      
      // Create Config Stack
      const configStack = new SecurityConfigStack(app, `SecurityConfigStack${stackSuffix}`, {
        environmentSuffix,
        encryptionKeyArn: 'arn:aws:kms:us-west-2:123456789012:key/test-key',
        serviceRoleArn: 'arn:aws:iam::123456789012:role/test-role',
      });
      expect(configStack).toBeDefined();
      
      // Create Monitoring Stack
      const monitoringStack = new SecurityMonitoringStack(app, `SecurityMonitoringStack${stackSuffix}`, {
        environmentSuffix,
        encryptionKeyArn: 'arn:aws:kms:us-west-2:123456789012:key/test-key',
      });
      expect(monitoringStack).toBeDefined();
    });
  });
});

describe('SecurityKmsStack', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';
  const region = 'us-west-2';
  const stackSuffix = `${environmentSuffix}-${region}`;

  beforeEach(() => {
    // Set AWS_REGION for testing
    process.env.AWS_REGION = region;
    app = new cdk.App();
    stack = new SecurityKmsStack(app, 'TestKmsStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Keys', () => {
    test('should create encryption key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'Customer-managed key for data encryption across all security resources',
        EnableKeyRotation: true,
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeySpec: 'SYMMETRIC_DEFAULT',
      });
    });

    test('should create signing key with asymmetric configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'Asymmetric key for digital signing and verification',
        KeyUsage: 'SIGN_VERIFY',
        KeySpec: 'RSA_2048',
      });
    });

    test('should have proper key policies for encryption key', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: Match.objectLike({
                AWS: Match.anyValue(),
              }),
              Action: 'kms:*',
              Resource: '*',
            }),
            Match.objectLike({
              Sid: 'Allow use of the key for encryption/decryption',
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: Match.arrayWith([
                  's3.amazonaws.com',
                  'cloudtrail.amazonaws.com',
                  'logs.amazonaws.com',
                ]),
              }),
              Action: Match.arrayWith([
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:GenerateDataKey*',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('KMS Aliases', () => {
    test('should create alias for encryption key', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/security-encryption-key-${environmentSuffix}`,
      });
    });

    test('should create alias for signing key', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/security-signing-key-${environmentSuffix}`,
      });
    });
  });

  describe('Outputs', () => {
    test('should export encryption key ID', () => {
      template.hasOutput(`EncryptionKeyId${stackSuffix.replace(/-/g, '')}`, {
        Description: 'KMS Encryption Key ID',
        Export: {
          Name: `SecurityStack-EncryptionKeyId-${stackSuffix}`,
        },
      });
    });

    test('should export encryption key ARN', () => {
      template.hasOutput(`EncryptionKeyArn${stackSuffix.replace(/-/g, '')}`, {
        Description: 'KMS Encryption Key ARN',
        Export: {
          Name: `SecurityStack-EncryptionKeyArn-${stackSuffix}`,
        },
      });
    });

    test('should export signing key ID', () => {
      template.hasOutput(`SigningKeyId${stackSuffix.replace(/-/g, '')}`, {
        Description: 'KMS Signing Key ID',
        Export: {
          Name: `SecurityStack-SigningKeyId-${stackSuffix}`,
        },
      });
    });
  });

  describe('Tags', () => {
    test('should have all required tags', () => {
      expect(stack.tags.tagValues()).toMatchObject({
        'Owner': 'SecurityTeam',
        'Purpose': 'DataEncryptionAndSigning',
        'Environment': environmentSuffix,
        'CostCenter': 'Security',
        'Compliance': 'Required',
      });
    });
  });
});

describe('SecurityIamStack', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';
  const region = 'us-west-2';
  const stackSuffix = `${environmentSuffix}-${region}`;
  const encryptionKeyArn = 'arn:aws:kms:us-west-2:123456789012:key/test-key';

  beforeEach(() => {
    // Set AWS_REGION for testing
    process.env.AWS_REGION = region;
    app = new cdk.App();
    stack = new SecurityIamStack(app, 'TestIamStack', { 
      environmentSuffix,
      encryptionKeyArn,
    });
    template = Template.fromStack(stack);
  });

  describe('IAM Roles', () => {
    test('should create security audit role with correct assume role policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `SecurityAuditRole-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'config.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'cloudtrail.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        MaxSessionDuration: 14400,
      });
    });

    test('should create security monitoring role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `SecurityMonitoringRole-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'lambda.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'events.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        MaxSessionDuration: 7200,
      });
    });

    test('should create data access role with EC2 assume policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `DataAccessRole-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        MaxSessionDuration: 3600,
      });
    });
  });

  describe('IAM Policies', () => {
    test('should have proper permissions for security audit role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `SecurityAuditRole-${environmentSuffix}`,
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'SecurityAuditPolicy',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'ConfigServicePermissions',
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'config:Put*',
                    'config:Get*',
                    'config:List*',
                  ]),
                  Resource: '*',
                }),
              ]),
            }),
          }),
        ]),
      });
    });

    test('should have CloudWatch permissions for monitoring role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `SecurityMonitoringRole-${environmentSuffix}`,
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'SecurityMonitoringPolicy',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'CloudWatchPermissions',
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'cloudwatch:PutMetricData',
                    'logs:CreateLogGroup',
                    'logs:PutLogEvents',
                  ]),
                }),
              ]),
            }),
          }),
        ]),
      });
    });

    test('should have restricted S3 access for data access role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `DataAccessRole-${environmentSuffix}`,
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'DataAccessPolicy',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'S3DataAccess',
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    's3:GetObject',
                    's3:GetObjectVersion',
                  ]),
                  Condition: Match.objectLike({
                    StringEquals: Match.anyValue(),
                    Bool: Match.objectLike({
                      'aws:SecureTransport': 'true',
                    }),
                  }),
                }),
              ]),
            }),
          }),
        ]),
      });
    });
  });

  describe('Outputs', () => {
    test('should export security audit role ARN', () => {
      template.hasOutput(`SecurityAuditRoleArn${stackSuffix.replace(/-/g, '')}`, {
        Description: 'Security Audit Role ARN',
        Export: {
          Name: `SecurityStack-AuditRoleArn-${stackSuffix}`,
        },
      });
    });

    test('should export security monitoring role ARN', () => {
      template.hasOutput(`SecurityMonitoringRoleArn${stackSuffix.replace(/-/g, '')}`, {
        Description: 'Security Monitoring Role ARN',
        Export: {
          Name: `SecurityStack-MonitoringRoleArn-${stackSuffix}`,
        },
      });
    });
  });
});

describe('SecurityConfigStack', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';
  const region = 'us-west-2';
  const stackSuffix = `${environmentSuffix}-${region}`;
  const encryptionKeyArn = 'arn:aws:kms:us-west-2:123456789012:key/test-key';

  beforeEach(() => {
    // Set AWS_REGION for testing
    process.env.AWS_REGION = region;
    app = new cdk.App();
    stack = new SecurityConfigStack(app, 'TestConfigStack', { 
      environmentSuffix,
      encryptionKeyArn,
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket for Config', () => {
    test('should create S3 bucket with encryption and versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        }),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have lifecycle rules for old versions', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldVersions',
              ExpirationInDays: 2555,
              NoncurrentVersionExpiration: Match.objectLike({
                NoncurrentDays: 365,
              }),
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic for compliance alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `security-compliance-alerts-${environmentSuffix}`,
        DisplayName: 'Security Compliance Alerts',
      });
    });
  });

  describe('Config Rules', () => {
    test('should create S3 public read prohibited rule', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `s3-bucket-public-read-prohibited-${environmentSuffix}`,
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'S3_BUCKET_PUBLIC_READ_PROHIBITED',
        },
      });
    });

    test('should create IAM password policy rule with parameters', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `iam-password-policy-${environmentSuffix}`,
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'IAM_PASSWORD_POLICY',
        },
        InputParameters: Match.objectLike({
          RequireUppercaseCharacters: true,
          RequireLowercaseCharacters: true,
          RequireSymbols: true,
          RequireNumbers: true,
          MinimumPasswordLength: 14,
          PasswordReusePrevention: 24,
          MaxPasswordAge: 90,
        }),
      });
    });

    test('should create at least 8 config rules', () => {
      const configRules = template.findResources('AWS::Config::ConfigRule');
      expect(Object.keys(configRules).length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Outputs', () => {
    test('should export config bucket name', () => {
      template.hasOutput(`ConfigBucketName${stackSuffix.replace(/-/g, '')}`, {
        Description: 'Config S3 Bucket Name',
        Export: {
          Name: `SecurityStack-ConfigBucket-${stackSuffix}`,
        },
      });
    });

    test('should export compliance topic ARN', () => {
      template.hasOutput(`ComplianceTopicArn${stackSuffix.replace(/-/g, '')}`, {
        Description: 'Compliance SNS Topic ARN',
        Export: {
          Name: `SecurityStack-ComplianceTopic-${stackSuffix}`,
        },
      });
    });
  });
});

describe('SecurityMonitoringStack', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';
  const region = 'us-west-2';
  const stackSuffix = `${environmentSuffix}-${region}`;
  const encryptionKeyArn = 'arn:aws:kms:us-west-2:123456789012:key/test-key';

  beforeEach(() => {
    // Set AWS_REGION for testing
    process.env.AWS_REGION = region;
    app = new cdk.App();
    stack = new SecurityMonitoringStack(app, 'TestMonitoringStack', { 
      environmentSuffix,
      encryptionKeyArn,
    });
    template = Template.fromStack(stack);
  });

  describe('CloudTrail', () => {
    test('should create S3 bucket for CloudTrail logs', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        }),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should have lifecycle rules for log archival', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'ArchiveOldLogs',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                }),
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                }),
              ]),
            }),
          ]),
        },
      });
    });

    test('should create CloudWatch log group for CloudTrail', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/cloudtrail/security-trail-${environmentSuffix}`,
        RetentionInDays: 731,
      });
    });

    test('should create CloudTrail with proper configuration', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: `SecurityTrailV2${environmentSuffix}`,
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: false,
        EnableLogFileValidation: true,
      });
    });
  });

  describe('VPC and Network Monitoring', () => {
    test('should create VPC with proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create VPC flow logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        TrafficType: 'ALL',
      });
    });

    test('should create log group for VPC flow logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
        RetentionInDays: 365,
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create alarm for high failed logins', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `HighFailedLogins-${environmentSuffix}`,
        AlarmDescription: 'Alert when there are high number of failed login attempts',
        Threshold: 10,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create alarm for root account usage', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `RootAccountUsage-${environmentSuffix}`,
        AlarmDescription: 'Alert when root account is used',
        Threshold: 0,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create alarm for unauthorized API calls', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `UnauthorizedApiCalls-${environmentSuffix}`,
        AlarmDescription: 'Alert on unauthorized API calls',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });
  });

  describe('Metric Filters', () => {
    test('should create metric filter for root usage', () => {
      template.hasResourceProperties('AWS::Logs::MetricFilter', {
        FilterPattern: '{ $.userIdentity.type = "Root" }',
        MetricTransformations: Match.arrayWith([
          Match.objectLike({
            MetricName: 'RootAccountUsage',
            MetricNamespace: 'SecurityMonitoring',
            MetricValue: '1',
          }),
        ]),
      });
    });

    test('should create metric filter for unauthorized API calls', () => {
      template.hasResourceProperties('AWS::Logs::MetricFilter', {
        FilterPattern: '{ $.responseElements.message = "*Unauthorized*" || $.errorCode = "*Unauthorized*" || $.errorCode = "AccessDenied*" }',
        MetricTransformations: Match.arrayWith([
          Match.objectLike({
            MetricName: 'UnauthorizedApiCalls',
            MetricNamespace: 'SecurityMonitoring',
            MetricValue: '1',
          }),
        ]),
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic for security alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `security-alerts-${environmentSuffix}`,
        DisplayName: 'Security Alerts',
      });
    });
  });

  describe('Outputs', () => {
    test('should export CloudTrail bucket name', () => {
      template.hasOutput(`CloudTrailBucketName${stackSuffix.replace(/-/g, '')}`, {
        Description: 'CloudTrail S3 Bucket Name',
        Export: {
          Name: `SecurityStack-CloudTrailBucket-${stackSuffix}`,
        },
      });
    });

    test('should export security alerts topic ARN', () => {
      template.hasOutput(`SecurityAlertsTopicArn${stackSuffix.replace(/-/g, '')}`, {
        Description: 'Security Alerts SNS Topic ARN',
        Export: {
          Name: `SecurityStack-SecurityAlerts-${stackSuffix}`,
        },
      });
    });

    test('should export VPC ID', () => {
      template.hasOutput(`SecurityVPCId${stackSuffix.replace(/-/g, '')}`, {
        Description: 'Security VPC ID',
        Export: {
          Name: `SecurityStack-VPCId-${stackSuffix}`,
        },
      });
    });
  });
});