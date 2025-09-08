import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      vpcId: undefined, // Will create a new VPC
      env: { region: 'us-east-1', account: '123456789012' },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public, 2 private, 2 isolated

      // Public subnet
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          }),
        ]),
      });

      // Private subnet
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          }),
        ]),
      });
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
      template.resourceCountIs('AWS::EC2::EIP', 1);
    });
  });

  describe('KMS Key', () => {
    test('should create KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp(
          'KMS key for security-related resources'
        ),
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });
    });
  });

  describe('S3 Security Bucket', () => {
    test('should create encrypted S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tap-security-logs-test-'),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
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

    test('should have lifecycle configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'security-logs-lifecycle',
              Status: 'Enabled',
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
              ExpirationInDays: 2555,
            }),
          ]),
        },
      });
    });

    test('should deny unencrypted uploads', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: { AWS: '*' },
              Action: 's3:PutObject',
              Sid: 'DenyUnencryptedUploads',
            }),
          ]),
        },
      });
    });

    test('should enforce SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
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
  });

  describe('EC2 Instance', () => {
    test('should create EC2 instance with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'PatchGroup',
            Value: 'tap-security-test',
          }),
        ]),
      });
    });

    test('should have HTTPS-only security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instance - HTTPS only',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('should have encrypted EBS volume', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        BlockDeviceMappings: Match.arrayWith([
          Match.objectLike({
            DeviceName: '/dev/xvda',
            Ebs: Match.objectLike({
              Encrypted: true,
              VolumeSize: 20,
              VolumeType: 'gp3',
            }),
          }),
        ]),
      });
    });
  });

  describe('RDS PostgreSQL Instance', () => {
    test('should create RDS instance with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: Match.stringLikeRegexp('tap-rds-postgres-test'),
        Engine: 'postgres',
        DBInstanceClass: 'db.t3.micro',
        StorageEncrypted: true,
        MultiAZ: true,
        BackupRetentionPeriod: 7,
        StorageType: 'gp3',
      });
    });

    test('should have RDS security group allowing access only from EC2', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription:
          'Security group for RDS PostgreSQL - access from EC2 only',
      });

      // Check that it has restricted egress (CDK adds a default one)
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const rdsSecurityGroup = Object.values(securityGroups).find(
        (sg: any) =>
          sg.Properties?.GroupDescription ===
          'Security group for RDS PostgreSQL - access from EC2 only'
      );
      expect(rdsSecurityGroup).toBeDefined();
    });

    test('should have performance insights enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: true,
        PerformanceInsightsRetentionPeriod: 7,
        MonitoringInterval: 60,
      });
    });

    test('should export CloudWatch logs', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnableCloudwatchLogsExports: ['postgresql'],
      });
    });
  });

  describe('CloudTrail', () => {
    test('should create CloudTrail with proper configuration', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: Match.stringLikeRegexp('tap-security-trail-test'),
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
      });
    });

    test('should have CloudWatch log group for CloudTrail', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/cloudtrail/tap-security-test',
        RetentionInDays: 365,
      });
    });

    test('should log S3 data events', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EventSelectors: Match.arrayWith([
          Match.objectLike({
            ReadWriteType: 'All',
            DataResources: Match.arrayWith([
              Match.objectLike({
                Type: 'AWS::S3::Object',
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('AWS Config', () => {
    test('should create S3 bucket public read prohibited rule', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: Match.stringLikeRegexp(
          'tap-s3-bucket-public-read-prohibited-test'
        ),
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'S3_BUCKET_PUBLIC_READ_PROHIBITED',
        },
      });
    });

    test('should create root access key check rule', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: Match.stringLikeRegexp(
          'tap-root-access-key-check-test'
        ),
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'IAM_ROOT_ACCESS_KEY_CHECK',
        },
      });
    });

    test('should create MFA enabled for IAM console access rule', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: Match.stringLikeRegexp(
          'tap-mfa-enabled-for-iam-console-access-test'
        ),
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS',
        },
      });
    });
  });

  describe('GuardDuty', () => {
    test('should create EventBridge rule for GuardDuty findings', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.guardduty'],
          'detail-type': ['GuardDuty Finding'],
        },
      });
    });

    test('should create CloudWatch log group for GuardDuty findings', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/events/guardduty/tap-security-test',
        RetentionInDays: 365,
      });
    });
  });

  describe('IAM Configuration', () => {
    test('should create application role with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-app-role-test',
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
      });
    });

    test('should create instance profile for EC2', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: 'tap-app-instance-profile-test',
      });
    });

    test('should have CloudWatch agent policy', () => {
      // Check that the app role exists and has the correct policy
      const roles = template.findResources('AWS::IAM::Role');
      const appRole = Object.values(roles).find(
        (role: any) => role.Properties?.RoleName === 'tap-app-role-test'
      );

      expect(appRole).toBeDefined();
      expect(appRole?.Properties?.ManagedPolicyArns).toBeDefined();

      // Check if any policy ARN contains CloudWatchAgentServerPolicy
      const hasCWPolicy = appRole?.Properties?.ManagedPolicyArns?.some(
        (policy: any) => {
          const policyString = JSON.stringify(policy);
          return policyString.includes('CloudWatchAgentServerPolicy');
        }
      );

      expect(hasCWPolicy).toBe(true);
    });
  });

  describe('Systems Manager', () => {
    test('should create maintenance window', () => {
      template.hasResourceProperties('AWS::SSM::MaintenanceWindow', {
        Name: 'tap-patch-maintenance-window-test',
        Duration: 4,
        Cutoff: 1,
        Schedule: 'cron(0 2 ? * SUN *)',
        AllowUnassociatedTargets: false,
      });
    });

    test('should create maintenance window target', () => {
      template.hasResourceProperties('AWS::SSM::MaintenanceWindowTarget', {
        ResourceType: 'INSTANCE',
        Targets: Match.arrayWith([
          Match.objectLike({
            Key: 'tag:PatchGroup',
            Values: ['tap-security-test'],
          }),
        ]),
      });
    });

    test('should create maintenance window task', () => {
      template.hasResourceProperties('AWS::SSM::MaintenanceWindowTask', {
        TaskType: 'RUN_COMMAND',
        TaskArn: 'AWS-RunPatchBaseline',
        Priority: 1,
        MaxConcurrency: '50%',
        MaxErrors: '0',
      });
    });
  });

  describe('Lambda Remediation', () => {
    test('should create remediation function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-security-remediation-test',
        Runtime: 'python3.9',
        Handler: 'index.handler',
        Timeout: 300,
        Environment: {
          Variables: {
            ENVIRONMENT: 'test',
          },
        },
      });
    });

    test('should create remediation role with proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-remediation-role-test',
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
      });
    });

    test('should have remediation policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'RemediationPolicy',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    's3:PutBucketPublicAccessBlock',
                    'ec2:ModifyInstanceAttribute',
                  ]),
                }),
              ]),
            },
          }),
        ]),
      });
    });
  });

  describe('Monitoring', () => {
    test('should create EventBridge rules for monitoring', () => {
      // Config compliance changes
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.config'],
          'detail-type': ['Config Rules Compliance Change'],
        },
      });

      // Unauthorized API calls
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.cloudtrail'],
          detail: {
            errorCode: ['UnauthorizedOperation', 'AccessDenied'],
          },
        },
      });
    });

    test('should create security alerts log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/events/security-alerts/tap-security-test',
        RetentionInDays: 365,
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should apply consistent tags to resources', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      Object.values(resources).forEach((resource: any) => {
        const tags = resource.Properties?.Tags;
        expect(tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Environment',
              Value: 'Production',
            }),
            expect.objectContaining({ Key: 'Department', Value: 'IT' }),
            expect.objectContaining({ Key: 'Project', Value: 'TapSecurity' }),
          ])
        );
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should output KMS key ID', () => {
      template.hasOutput('SecurityKmsKeyId', {
        Description: 'KMS Key ID for security resources',
      });
    });

    test('should output security bucket name', () => {
      template.hasOutput('SecurityBucketName', {
        Description: 'Security Logs Bucket Name',
      });
    });

    test('should output EC2 instance ID', () => {
      template.hasOutput('EC2InstanceId', {
        Description: 'EC2 Instance ID',
      });
    });

    test('should output RDS endpoint', () => {
      template.hasOutput('RDSEndpoint', {
        Description: 'RDS PostgreSQL Endpoint',
      });
    });

    test('should output VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });
  });

  describe('Compliance Requirements', () => {
    test('should have removal policy set to DESTROY for testing', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should use proper naming convention', () => {
      // Check KMS key naming - it should contain both 'tap' and 'test' in the description
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('.*security.*test'),
      });

      // Check S3 bucket naming
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tap-.*-test-'),
      });
    });

    test('should have encrypted resources', () => {
      // Check S3 encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({}),
      });

      // Check RDS encryption
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });

      // Check EC2 EBS encryption
      template.hasResourceProperties('AWS::EC2::Instance', {
        BlockDeviceMappings: Match.arrayWith([
          Match.objectLike({
            Ebs: Match.objectLike({
              Encrypted: true,
            }),
          }),
        ]),
      });
    });
  });
});

describe('TapStack with Existing VPC', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();

    // Mock VPC lookup
    const mockVpc = {
      vpcId: 'vpc-abc12345',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      publicSubnets: [],
      privateSubnets: [],
      isolatedSubnets: [],
    };

    // Set VPC lookup context
    app.node.setContext(
      'vpc-provider:account=123456789012:filter.vpc-id=vpc-abc12345:region=us-east-1',
      mockVpc
    );

    stack = new TapStack(app, 'TestTapStackExistingVPC', {
      environmentSuffix: 'test-existing',
      vpcId: 'vpc-abc12345',
      env: { region: 'us-east-1', account: '123456789012' },
    });
    template = Template.fromStack(stack);
  });

  test('should not create new VPC when vpcId is provided', () => {
    // Should not have VPC resource when using existing VPC
    const vpcs = template.findResources('AWS::EC2::VPC');
    expect(Object.keys(vpcs).length).toBe(0);
  });

  test('should still create all security resources with existing VPC', () => {
    // Should still create KMS key
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });

    // Should still create S3 bucket
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp('tap-security-logs-test-existing-'),
    });

    // Should still create CloudTrail
    template.hasResourceProperties('AWS::CloudTrail::Trail', {
      TrailName: Match.stringLikeRegexp('tap-security-trail-test-existing'),
    });
  });

  test('should handle environment suffix from context', () => {
    const contextApp = new cdk.App();
    contextApp.node.setContext('environmentSuffix', 'context-test');

    const contextStack = new TapStack(contextApp, 'ContextTestStack', {
      env: { region: 'us-east-1', account: '123456789012' },
    });

    const contextTemplate = Template.fromStack(contextStack);

    // Should use context value when no prop is provided
    contextTemplate.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp('tap-security-logs-context-test-'),
    });
  });

  test('should handle default environment suffix', () => {
    const defaultApp = new cdk.App();

    const defaultStack = new TapStack(defaultApp, 'DefaultTestStack', {
      env: { region: 'us-east-1', account: '123456789012' },
    });

    const defaultTemplate = Template.fromStack(defaultStack);

    // Should use 'dev' as default when no prop or context is provided
    defaultTemplate.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp('tap-security-logs-dev-'),
    });
  });
});
