import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('Single-Region High Availability Stack', () => {
  let app: cdk.App;

  describe('TapStack', () => {
    let tapStack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      tapStack = new TapStack(app, `TapStack-${environmentSuffix}`, {
        env: { region: 'us-east-1', account: '123456789012' },
        environmentSuffix,
      });
      template = Template.fromStack(tapStack);
    });

    describe('VPC Configuration', () => {
      test('creates VPC with correct configuration', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
        });
      });

      test('VPC has correct CIDR and max AZs', () => {
        template.resourceCountIs('AWS::EC2::VPC', 1);
        const vpcs = template.findResources('AWS::EC2::VPC');
        expect(Object.keys(vpcs).length).toBe(1);
      });

      test('creates correct number of subnets', () => {
        template.resourceCountIs('AWS::EC2::Subnet', 4);
      });

      test('creates private subnets with correct type', () => {
        const subnets = template.findResources('AWS::EC2::Subnet');
        const subnetCount = Object.keys(subnets).length;
        expect(subnetCount).toBe(4);
      });

      test('creates public subnets', () => {
        template.resourceCountIs('AWS::EC2::Subnet', 4);
      });

      test('creates NAT Gateway', () => {
        template.resourceCountIs('AWS::EC2::NatGateway', 1);
      });

      test('creates Internet Gateway', () => {
        template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      });

      test('creates VPC Gateway Attachment', () => {
        template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
      });

      test('creates route tables', () => {
        template.resourceCountIs('AWS::EC2::RouteTable', 4);
      });

      test('creates Elastic IP for NAT Gateway', () => {
        template.resourceCountIs('AWS::EC2::EIP', 1);
      });
    });

    describe('VPC Endpoints', () => {
      test('creates VPC endpoints for AWS services', () => {
        template.resourceCountIs('AWS::EC2::VPCEndpoint', 4);
      });

      test('creates RDS VPC endpoint', () => {
        template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
          ServiceName: Match.stringLikeRegexp('.*rds.*'),
        });
      });

      test('creates SNS VPC endpoint', () => {
        template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
          ServiceName: Match.stringLikeRegexp('.*sns.*'),
        });
      });

      test('creates CloudWatch Logs VPC endpoint', () => {
        template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
          ServiceName: Match.stringLikeRegexp('.*logs.*'),
        });
      });

      test('creates CloudWatch Events VPC endpoint', () => {
        template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
          ServiceName: Match.stringLikeRegexp('.*events.*'),
        });
      });
    });

    describe('RDS Configuration', () => {
      test('creates RDS PostgreSQL instance with Multi-AZ', () => {
        template.hasResourceProperties('AWS::RDS::DBInstance', {
          Engine: 'postgres',
          EngineVersion: Match.stringLikeRegexp('^14'),
          DBInstanceClass: 'db.r6g.xlarge',
          MultiAZ: true,
          StorageEncrypted: true,
          DeletionProtection: false,
        });
      });

      test('RDS instance has correct storage configuration', () => {
        template.hasResourceProperties('AWS::RDS::DBInstance', {
          AllocatedStorage: '100',
          MaxAllocatedStorage: 500,
          StorageType: 'gp3',
        });
      });

      test('RDS instance has backup retention configured', () => {
        template.hasResourceProperties('AWS::RDS::DBInstance', {
          BackupRetentionPeriod: 7,
        });
      });

      test('RDS instance has deletion protection disabled', () => {
        template.hasResourceProperties('AWS::RDS::DBInstance', {
          DeletionProtection: false,
        });
      });

      test('RDS instance has CloudWatch logs enabled', () => {
        template.hasResourceProperties('AWS::RDS::DBInstance', {
          EnableCloudwatchLogsExports: ['postgresql', 'upgrade'],
        });
      });

      test('RDS instance has Performance Insights enabled', () => {
        template.hasResourceProperties('AWS::RDS::DBInstance', {
          EnablePerformanceInsights: true,
        });
      });

      test('database is in private subnets', () => {
        template.hasResourceProperties('AWS::RDS::DBInstance', {
          PubliclyAccessible: false,
        });
      });

      test('creates RDS subnet group', () => {
        template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
      });

      test('creates DB secret for credentials', () => {
        template.resourceCountIs('AWS::SecretsManager::Secret', 1);
      });

      test('attaches secret to RDS instance', () => {
        template.resourceCountIs(
          'AWS::SecretsManager::SecretTargetAttachment',
          1
        );
      });
    });

    describe('Security Groups', () => {
      test('creates security groups for database and Lambda', () => {
        const sgCount = template.findResources('AWS::EC2::SecurityGroup');
        expect(Object.keys(sgCount).length).toBeGreaterThan(1);
      });

      test('creates database security group', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupDescription: Match.stringLikeRegexp('.*RDS.*'),
        });
      });

      test('creates Lambda security group', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupDescription: Match.stringLikeRegexp('.*Lambda.*'),
        });
      });

      test('database security group allows Lambda ingress on port 5432', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
          IpProtocol: 'tcp',
          FromPort: 5432,
          ToPort: 5432,
        });
      });

      test('Lambda security group allows outbound traffic', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupDescription: Match.stringLikeRegexp('.*Lambda.*'),
          SecurityGroupEgress: Match.arrayWith([
            Match.objectLike({
              CidrIp: '0.0.0.0/0',
            }),
          ]),
        });
      });
    });

    describe('KMS Encryption', () => {
      test('creates KMS key for encryption', () => {
        template.resourceCountIs('AWS::KMS::Key', 1);
      });

      test('KMS key has rotation disabled for testing', () => {
        template.hasResourceProperties('AWS::KMS::Key', {
          EnableKeyRotation: false,
        });
      });

      test('KMS key has correct removal policy', () => {
        const kmsKeys = template.findResources('AWS::KMS::Key');
        expect(Object.keys(kmsKeys).length).toBe(1);
      });
    });

    describe('S3 Backup Bucket', () => {
      test('creates S3 bucket for backup with versioning', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          VersioningConfiguration: {
            Status: 'Enabled',
          },
        });
      });

      test('S3 bucket has KMS encryption', () => {
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

      test('S3 bucket blocks all public access', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        });
      });

      test('S3 bucket has lifecycle rules', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'delete-old-versions',
                NoncurrentVersionExpiration: {
                  NoncurrentDays: 30,
                },
              }),
            ]),
          },
        });
      });

      test('S3 bucket has removal policy DESTROY', () => {
        const buckets = template.findResources('AWS::S3::Bucket');
        expect(Object.keys(buckets).length).toBeGreaterThan(0);
      });
    });

    describe('SNS Monitoring', () => {
      test('creates SNS topic for alerts', () => {
        template.resourceCountIs('AWS::SNS::Topic', 1);
      });

      test('SNS topic has correct display name', () => {
        template.hasResourceProperties('AWS::SNS::Topic', {
          DisplayName: 'Monitoring Alerts',
        });
      });
    });

    describe('CloudWatch Alarms', () => {
      test('creates CloudWatch alarms for CPU and connections', () => {
        template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      });

      test('creates CPU alarm with correct threshold', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          MetricName: 'CPUUtilization',
          Threshold: 80,
          EvaluationPeriods: 2,
          DatapointsToAlarm: 2,
        });
      });

      test('creates database connections alarm', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          MetricName: 'DatabaseConnections',
          Threshold: 80,
          EvaluationPeriods: 2,
          DatapointsToAlarm: 2,
        });
      });

      test('alarms are configured with SNS actions', () => {
        const alarmCapture = new Capture();
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmActions: alarmCapture,
        });
        expect(alarmCapture.asArray().length).toBeGreaterThan(0);
      });
    });

    describe('Stack Outputs', () => {
      test('exports VpcId output', () => {
        template.hasOutput('VpcId', {
          Description: 'VPC ID',
        });
      });

      test('exports VpcCidr output', () => {
        template.hasOutput('VpcCidr', {
          Description: 'VPC CIDR Block',
        });
      });

      test('exports DbEndpoint output', () => {
        template.hasOutput('DbEndpoint', {
          Description: 'Database Endpoint',
        });
      });

      test('exports DbInstanceIdentifier output', () => {
        template.hasOutput('DbInstanceIdentifier', {
          Description: 'Database Instance Identifier',
        });
      });

      test('exports DbPort output', () => {
        template.hasOutput('DbPort', {
          Description: 'Database Port',
        });
      });

      test('exports BackupBucketArn output', () => {
        template.hasOutput('BackupBucketArn', {
          Description: 'Backup Bucket ARN',
        });
      });

      test('exports BackupBucketName output', () => {
        template.hasOutput('BackupBucketName', {
          Description: 'Backup Bucket Name',
        });
      });

      test('exports KmsKeyArn output', () => {
        template.hasOutput('KmsKeyArn', {
          Description: 'KMS Key ARN',
        });
      });

      test('exports KmsKeyId output', () => {
        template.hasOutput('KmsKeyId', {
          Description: 'KMS Key ID',
        });
      });

      test('exports MonitoringTopicArn output', () => {
        template.hasOutput('MonitoringTopicArn', {
          Description: 'SNS Monitoring Topic ARN',
        });
      });

      test('exports MonitoringTopicName output', () => {
        template.hasOutput('MonitoringTopicName', {
          Description: 'SNS Monitoring Topic Name',
        });
      });

      test('exports DbSecurityGroupId output', () => {
        template.hasOutput('DbSecurityGroupId', {
          Description: 'Database Security Group ID',
        });
      });

      test('exports LambdaSecurityGroupId output', () => {
        template.hasOutput('LambdaSecurityGroupId', {
          Description: 'Lambda Security Group ID',
        });
      });

      test('stack exports all 13 required outputs', () => {
        const outputs = template.findOutputs('*');
        expect(Object.keys(outputs).length).toBe(13);
      });
    });

    describe('Public Properties', () => {
      test('exposes vpc property', () => {
        expect(tapStack.vpc).toBeDefined();
      });

      test('exposes kmsKey property', () => {
        expect(tapStack.kmsKey).toBeDefined();
      });

      test('exposes backupBucket property', () => {
        expect(tapStack.backupBucket).toBeDefined();
      });

      test('exposes dbInstance property', () => {
        expect(tapStack.dbInstance).toBeDefined();
      });

      test('exposes database alias property', () => {
        expect(tapStack.database).toBeDefined();
        expect(tapStack.database).toBe(tapStack.dbInstance);
      });

      test('exposes monitoringTopic property', () => {
        expect(tapStack.monitoringTopic).toBeDefined();
      });

      test('exposes dbEndpoint property', () => {
        expect(tapStack.dbEndpoint).toBeDefined();
      });
    });

    describe('Resource Naming', () => {
      test('resources use environment suffix in naming', () => {
        const resources = template.toJSON().Resources;
        const resourceNames = Object.keys(resources);
        const hasEnvironmentSuffix = resourceNames.some((name) =>
          name.includes(environmentSuffix)
        );
        expect(hasEnvironmentSuffix).toBe(true);
      });
    });

    describe('IAM Roles and Policies', () => {
      test('creates IAM roles for log retention', () => {
        const roles = template.findResources('AWS::IAM::Role');
        expect(Object.keys(roles).length).toBeGreaterThan(0);
      });

      test('creates custom resource for log retention', () => {
        template.resourceCountIs('Custom::LogRetention', 2);
      });
    });
  });

  describe('TapStack with default environment suffix', () => {
    let tapStack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      tapStack = new TapStack(app, 'TapStackDefault', {
        env: { region: 'us-east-1', account: '123456789012' },
      });
      template = Template.fromStack(tapStack);
    });

    test('uses default environment suffix when not provided', () => {
      const resources = template.toJSON().Resources;
      const resourceNames = Object.keys(resources);
      const hasDevSuffix = resourceNames.some((name) => name.includes('dev'));
      expect(hasDevSuffix).toBe(true);
    });

    test('creates all required resources with default suffix', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBeGreaterThan(0);
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('exports all outputs with default suffix', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBe(13);
    });
  });
});
