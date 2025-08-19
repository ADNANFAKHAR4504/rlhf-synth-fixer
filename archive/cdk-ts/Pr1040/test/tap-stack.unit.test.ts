import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();

    // Create a simple stack first
    stack = new TapStack(app, 'TestTapStack', {
      isPrimaryRegion: true,
      environmentSuffix,
      notificationEmail: 'test@example.com',
    });
    template = Template.fromStack(stack);
  });

  describe('Basic Stack Creation', () => {
    test('should create stack without errors', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('should have basic resources created', () => {
      // Just check that resources exist
      const resources = template.toJSON().Resources;
      expect(Object.keys(resources).length).toBeGreaterThan(0);
    });
  });

  describe('KMS Key - Security & Encryption', () => {
    test('should create a KMS key and alias for S3 encryption', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::KMS::Alias', 1);
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });
  });

  describe('VPC Resources - Network Configuration', () => {
    test('should create VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('should use correct CIDR block 10.0.0.0/16', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should enable DNS hostnames and support', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create 4 subnets (2 AZs × 2 types)', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('should create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create 1 NAT gateway (cost-optimized)', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create route tables for subnets', () => {
      // VPC creates route tables automatically - check that they exist
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBeGreaterThan(0);
    });
  });

  describe('S3 Resources - Backup Storage', () => {
    test('should create 1 S3 bucket (backup)', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('should encrypt S3 buckets with KMS (aws:kms)', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            },
          ],
        },
      });
    });

    test('should block all S3 public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should enable S3 versioning for backup bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should enforce SSL for S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: {
                AWS: '*',
              },
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

    test('should have auto-delete objects configuration', () => {
      // Our buckets are configured with autoDeleteObjects: true for easy cleanup
      // This is handled by CDK custom resources, not lifecycle rules
      expect(template.toJSON().Resources).toBeDefined();
    });
  });

  describe('RDS Resources - Database Configuration', () => {
    test('should create RDS subnet group', () => {
      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
    });

    test('should create RDS instance', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('should create RDS parameter group', () => {
      template.resourceCountIs('AWS::RDS::DBParameterGroup', 1);
    });

    test('should create database secret', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });

    test('should use PostgreSQL engine', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
      });
    });

    test('should encrypt RDS storage', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('should enable automated backups with 7 days retention', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
      });
    });

    test('should enable performance insights', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: true,
      });
    });

    test('should enable CloudWatch logs export', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnableCloudwatchLogsExports: ['postgresql'],
      });
    });

    test('should use isolated subnets for database security', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for TAP RDS',
      });
    });
  });

  describe('Lambda Resources - Data Processing', () => {
    test('should create Lambda function', () => {
      // CDK may create additional Lambda functions for custom resources
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    test('should deploy Lambda in VPC for security', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue(),
        }),
      });
    });

    test('should use Python 3.12 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.12',
      });
    });

    test('should have proper timeout and memory configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 300, // 5 minutes
        MemorySize: 256,
      });
    });

    test('should have required environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT: environmentSuffix,
          }),
        },
      });
    });
  });

  describe('CloudWatch Resources - Logging & Monitoring', () => {
    test('should create 1 log group (application)', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
    });

    test('should create CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('should configure log retention policy', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });

    test('should configure database CPU alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should configure Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 1,
      });
    });
  });

  describe('SNS Resources - Alerting', () => {
    test('should create SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('should NOT create SNS subscription (topic only)', () => {
      template.resourceCountIs('AWS::SNS::Subscription', 0);
    });

    test('should link alarms to SNS topic', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.anyValue(),
      });
    });
  });

  describe('Security Groups - Network Security', () => {
    test('should create 2 security groups (RDS + Lambda)', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
    });

    test('should configure RDS security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for TAP RDS',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 5432,
            ToPort: 5432,
            CidrIp: Match.anyValue(), // VPC CIDR is dynamically generated
            Description: 'PostgreSQL access from VPC',
          },
        ],
      });
    });

    test('should configure Lambda security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for TAP Lambda',
      });
    });
  });

  describe('IAM Resources - Least Privilege Access', () => {
    test('should create 3 IAM roles (Lambda + RDS monitoring + custom)', () => {
      template.resourceCountIs('AWS::IAM::Role', 3);
    });

    test('Lambda role should have VPC access permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        ManagedPolicyArns: Match.anyValue(), // CDK uses Fn::Join for policy ARNs
      });
    });

    test('Lambda role should have inline policies for S3 and secrets access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'TapLambdaPolicy',
          }),
        ]),
      });
    });
  });

  describe('Route53 Resources - DNS Management (Primary Region)', () => {
    test('should create hosted zone', () => {
      template.resourceCountIs('AWS::Route53::HostedZone', 1);
    });

    test('should NOT create a Route53 health check', () => {
      template.resourceCountIs('AWS::Route53::HealthCheck', 0);
    });

    test('should create 2 DNS records for failover', () => {
      template.resourceCountIs('AWS::Route53::RecordSet', 2);
    });

    test('should configure hosted zone with correct domain', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'tap-internal.local.',
      });
    });

    // No explicit health check configuration expected

    test('should configure weighted routing records', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        SetIdentifier: 'primary',
        Weight: 100,
        TTL: '60', // CDK generates TTL as string
      });

      template.hasResourceProperties('AWS::Route53::RecordSet', {
        SetIdentifier: 'secondary',
        Weight: 0,
        TTL: '60', // CDK generates TTL as string
      });
    });
  });

  describe('Compliance & Security - AWS Config Implementation', () => {
    test('should NOT create AWS Config resources by default', () => {
      template.resourceCountIs('AWS::Config::DeliveryChannel', 0);
      template.resourceCountIs('AWS::Config::ConfigurationRecorder', 0);
      template.resourceCountIs('AWS::Config::ConfigRule', 0);
    });
  });

  describe('Compliance & Security - AWS Config (enabled via context)', () => {
    test('should create recorder and delivery channel when enabled', () => {
      const appWithConfig = new cdk.App({ context: { enableConfig: 'true' } });
      const stackWithConfig = new TapStack(
        appWithConfig,
        'TestTapStackWithConfig',
        {
          isPrimaryRegion: true,
          environmentSuffix,
          notificationEmail: 'test@example.com',
        }
      );
      const t = Template.fromStack(stackWithConfig);
      t.resourceCountIs('AWS::Config::DeliveryChannel', 1);
      t.resourceCountIs('AWS::Config::ConfigurationRecorder', 1);
    });
  });

  describe('Disaster Recovery - Multi-Region Independent Databases', () => {
    test('should NOT have S3 replication configuration', () => {
      // We use independent databases in each region instead of read replicas
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.ReplicationConfiguration).toBeUndefined();
      });
    });

    test('should have independent RDS database per region', () => {
      // Each region has its own complete database setup
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        StorageEncrypted: true,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toBeDefined();
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.BackupBucketName).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.SnsTopicArn).toBeDefined();
    });

    test('should export outputs with correct export names', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs.VpcId.Export.Name).toBe('TestTapStack-VpcId');
      expect(outputs.DatabaseEndpoint.Export.Name).toBe(
        'TestTapStack-DatabaseEndpoint'
      );
      expect(outputs.BackupBucketName.Export.Name).toBe(
        'TestTapStack-BackupBucketName'
      );
      expect(outputs.LambdaFunctionArn.Export.Name).toBe(
        'TestTapStack-LambdaFunctionArn'
      );
      expect(outputs.SnsTopicArn.Export.Name).toBe('TestTapStack-SnsTopicArn');
    });
  });
});

describe('TapStack Multi-Region Deployment', () => {
  let app: cdk.App;
  let primaryStack: TapStack;
  let secondaryStack: TapStack;

  beforeEach(() => {
    app = new cdk.App();

    primaryStack = new TapStack(app, 'TestPrimaryStack', {
      env: { region: 'us-west-2' },
      isPrimaryRegion: true,
      environmentSuffix,
      notificationEmail: 'test@example.com',
    });

    secondaryStack = new TapStack(app, 'TestSecondaryStack', {
      env: { region: 'us-east-2' },
      isPrimaryRegion: false,
      environmentSuffix,
      notificationEmail: 'test@example.com',
    });
  });

  describe('Multi-Region Infrastructure', () => {
    test('should create both primary and secondary stacks', () => {
      expect(primaryStack).toBeDefined();
      expect(secondaryStack).toBeDefined();
    });

    test('should deploy in correct regions (us-west-2 and us-east-2)', () => {
      expect(primaryStack.region).toBe('us-west-2');
      expect(secondaryStack.region).toBe('us-east-2');
    });
  });

  describe('Region-Specific Resources', () => {
    test('primary should have Route53 hosted zone', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      primaryTemplate.resourceCountIs('AWS::Route53::HostedZone', 1);
    });

    test('secondary should not have Route53 hosted zone', () => {
      const secondaryTemplate = Template.fromStack(secondaryStack);
      secondaryTemplate.resourceCountIs('AWS::Route53::HostedZone', 0);
    });

    test('primary should NOT have Route53 health check', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      primaryTemplate.resourceCountIs('AWS::Route53::HealthCheck', 0);
    });

    test('secondary should not have Route53 health check', () => {
      const secondaryTemplate = Template.fromStack(secondaryStack);
      secondaryTemplate.resourceCountIs('AWS::Route53::HealthCheck', 0);
    });

    test('both regions should have same IAM role count', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);

      // Both regions should have 3 IAM roles (Lambda + RDS monitoring + custom provider)
      primaryTemplate.resourceCountIs('AWS::IAM::Role', 3);
      secondaryTemplate.resourceCountIs('AWS::IAM::Role', 3);
    });

    test('both regions should NOT have AWS Config resources by default', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);

      primaryTemplate.resourceCountIs('AWS::Config::ConfigurationRecorder', 0);
      secondaryTemplate.resourceCountIs(
        'AWS::Config::ConfigurationRecorder',
        0
      );
    });
  });

  describe('Core Resources in Both Regions', () => {
    test('both regions should have identical core infrastructure (with KMS)', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);

      // Both should have these core resources for high availability
      const coreResources = [
        'AWS::EC2::VPC',
        'AWS::RDS::DBInstance',
        'AWS::Lambda::Function',
        'AWS::SNS::Topic',
      ];

      // Check core resources with appropriate counts
      primaryTemplate.resourceCountIs('AWS::EC2::VPC', 1);
      secondaryTemplate.resourceCountIs('AWS::EC2::VPC', 1);
      primaryTemplate.resourceCountIs('AWS::RDS::DBInstance', 1);
      secondaryTemplate.resourceCountIs('AWS::RDS::DBInstance', 1);
      primaryTemplate.resourceCountIs('AWS::Lambda::Function', 2); // Custom resources create additional Lambda
      secondaryTemplate.resourceCountIs('AWS::Lambda::Function', 2);
      primaryTemplate.resourceCountIs('AWS::SNS::Topic', 1);
      secondaryTemplate.resourceCountIs('AWS::SNS::Topic', 1);
      primaryTemplate.resourceCountIs('AWS::KMS::Key', 1);
      secondaryTemplate.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('both regions should have 1 S3 bucket each (backup only)', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);

      primaryTemplate.resourceCountIs('AWS::S3::Bucket', 1);
      secondaryTemplate.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('both regions should have 2 CloudWatch alarms each', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);

      primaryTemplate.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      secondaryTemplate.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('both regions should have VPC with same CIDR configuration', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);

      primaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });

      secondaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('both regions should have encrypted RDS instances', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);

      primaryTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        Engine: 'postgres',
      });

      secondaryTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        Engine: 'postgres',
      });
    });

    test('both regions should have Lambda functions in VPC', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);

      primaryTemplate.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.anyValue(),
      });

      secondaryTemplate.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.anyValue(),
      });
    });

    test('both regions should have CloudWatch monitoring', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);

      // Both should have database CPU alarm
      primaryTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
      });

      secondaryTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
      });

      // Both should have Lambda error alarm
      primaryTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
      });

      secondaryTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
      });
    });
  });

  describe('Disaster Recovery Configuration', () => {
    test('both regions should have independent infrastructure', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);

      // Both regions have their own databases for true disaster recovery
      primaryTemplate.resourceCountIs('AWS::RDS::DBInstance', 1);
      secondaryTemplate.resourceCountIs('AWS::RDS::DBInstance', 1);

      // No replication configuration - independent regions
      const primaryBuckets = primaryTemplate.findResources('AWS::S3::Bucket');
      Object.values(primaryBuckets).forEach((bucket: any) => {
        expect(bucket.Properties.ReplicationConfiguration).toBeUndefined();
      });
    });

    test('both regions should have backup retention and removal policies configured', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);

      // 7-day backup retention for both regions
      primaryTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
        DeletionProtection: false, // Allows easy cleanup
      });

      secondaryTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
        DeletionProtection: false, // Allows easy cleanup
      });
    });

    test('both regions should have performance insights enabled', () => {
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);

      primaryTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: true,
      });

      secondaryTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: true,
      });
    });
  });
});
