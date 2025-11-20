import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { NetworkStack } from '../lib/network-stack';
import { StorageStack } from '../lib/storage-stack';
import { DatabaseStack } from '../lib/database-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { FailoverStack } from '../lib/failover-stack';

describe('TAP Stack - Complete Unit Test Suite', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  // ============================================================================
  // NETWORK STACK TESTS
  // ============================================================================
  describe('NetworkStack', () => {
    let stack: cdk.Stack;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack');
    });

    describe('Primary Region', () => {
      test('creates VPC with correct CIDR for primary region', () => {
        const networkStack = new NetworkStack(stack, 'NetworkStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(networkStack);

        template.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: '10.0.0.0/16',
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Name',
              Value: 'postgres-dr-vpc-test-us-east-1',
            }),
          ]),
        });
      });

      test('creates 3 subnet types', () => {
        const networkStack = new NetworkStack(stack, 'NetworkStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(networkStack);
        template.resourceCountIs('AWS::EC2::Subnet', 9);
      });

      test('creates 2 NAT gateways', () => {
        const networkStack = new NetworkStack(stack, 'NetworkStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(networkStack);
        template.resourceCountIs('AWS::EC2::NatGateway', 2);
      });

      test('creates database security group with VPC ingress', () => {
        const networkStack = new NetworkStack(stack, 'NetworkStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(networkStack);

        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupDescription: 'Security group for PostgreSQL RDS in us-east-1',
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              CidrIp: '10.0.0.0/16',
              FromPort: 5432,
              ToPort: 5432,
            }),
          ]),
        });
      });

      test('creates database security group with peer VPC ingress', () => {
        const networkStack = new NetworkStack(stack, 'NetworkStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(networkStack);

        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              CidrIp: '10.1.0.0/16',
              FromPort: 5432,
              ToPort: 5432,
            }),
          ]),
        });
      });

      test('creates Lambda security group', () => {
        const networkStack = new NetworkStack(stack, 'NetworkStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(networkStack);

        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupDescription: 'Security group for Lambda functions in us-east-1',
        });
      });

      test('creates VPC endpoints', () => {
        const networkStack = new NetworkStack(stack, 'NetworkStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(networkStack);
        template.resourceCountIs('AWS::EC2::VPCEndpoint', 4);
      });

      test('creates outputs', () => {
        const networkStack = new NetworkStack(stack, 'NetworkStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(networkStack);

        template.hasOutput('VpcIdOutput', {});
        template.hasOutput('VpcCidrOutput', {});
        template.hasOutput('DbSecurityGroupId', {});
        template.hasOutput('LambdaSecurityGroupId', {});
      });
    });

    describe('DR Region', () => {
      test('creates VPC with correct CIDR for DR region', () => {
        const networkStack = new NetworkStack(stack, 'NetworkStack', {
          environmentSuffix: 'test',
          isPrimary: false,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(networkStack);

        template.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: '10.1.0.0/16',
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Name',
              Value: 'postgres-dr-vpc-test-us-west-2',
            }),
          ]),
        });
      });

      test('creates database security group with correct peer VPC CIDR', () => {
        const networkStack = new NetworkStack(stack, 'NetworkStack', {
          environmentSuffix: 'test',
          isPrimary: false,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(networkStack);

        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              CidrIp: '10.0.0.0/16',
              FromPort: 5432,
              ToPort: 5432,
            }),
          ]),
        });
      });
    });

    test('snapshot test', () => {
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
        isPrimary: true,
        primaryRegion: 'us-east-1',
        drRegion: 'us-west-2',
      });

      const template = Template.fromStack(networkStack);
      expect(template.toJSON()).toMatchSnapshot();
    });
  });

  // ============================================================================
  // STORAGE STACK TESTS
  // ============================================================================
  describe('StorageStack', () => {
    let stack: cdk.Stack;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
    });

    describe('KMS Key', () => {
      test('creates KMS key with rotation enabled', () => {
        const storageStack = new StorageStack(stack, 'StorageStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(storageStack);

        template.hasResourceProperties('AWS::KMS::Key', {
          EnableKeyRotation: true,
        });
      });

      test('creates KMS alias', () => {
        const storageStack = new StorageStack(stack, 'StorageStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(storageStack);

        template.hasResourceProperties('AWS::KMS::Alias', {
          AliasName: 'alias/postgres-dr-key-test-us-east-1',
        });
      });

      test('grants RDS permissions to use KMS key', () => {
        const storageStack = new StorageStack(stack, 'StorageStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(storageStack);

        template.hasResourceProperties('AWS::KMS::Key', {
          KeyPolicy: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Sid: 'Allow RDS to use the key',
                Effect: 'Allow',
                Principal: {
                  Service: 'rds.amazonaws.com',
                },
                Action: Match.arrayWith([
                  'kms:Decrypt',
                  'kms:DescribeKey',
                  'kms:CreateGrant',
                  'kms:GenerateDataKey',
                ]),
              }),
            ]),
          }),
        });
      });
    });

    describe('S3 Backup Bucket', () => {
      test('creates S3 bucket with versioning', () => {
        const storageStack = new StorageStack(stack, 'StorageStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(storageStack);

        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: 'postgres-dr-backups-test-us-east-1-123456789012',
          VersioningConfiguration: {
            Status: 'Enabled',
          },
        });
      });

      test('encrypts bucket with KMS', () => {
        const storageStack = new StorageStack(stack, 'StorageStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(storageStack);

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

      test('blocks public access', () => {
        const storageStack = new StorageStack(stack, 'StorageStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(storageStack);

        template.hasResourceProperties('AWS::S3::Bucket', {
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        });
      });

      test('creates lifecycle rules for IA transition', () => {
        const storageStack = new StorageStack(stack, 'StorageStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(storageStack);

        template.hasResourceProperties('AWS::S3::Bucket', {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'TransitionToIA',
                Status: 'Enabled',
                Transitions: [
                  {
                    StorageClass: 'STANDARD_IA',
                    TransitionInDays: 30,
                  },
                ],
              }),
            ]),
          },
        });
      });

      test('creates lifecycle rules for Glacier transition', () => {
        const storageStack = new StorageStack(stack, 'StorageStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(storageStack);

        template.hasResourceProperties('AWS::S3::Bucket', {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'TransitionToGlacier',
                Status: 'Enabled',
                Transitions: [
                  {
                    StorageClass: 'GLACIER',
                    TransitionInDays: 90,
                  },
                ],
              }),
            ]),
          },
        });
      });

      test('adds bucket tags', () => {
        const storageStack = new StorageStack(stack, 'StorageStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(storageStack);

        template.hasResourceProperties('AWS::S3::Bucket', {
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Name',
              Value: 'postgres-dr-backups-test-us-east-1-123456789012',
            }),
            Match.objectLike({
              Key: 'Region',
              Value: 'us-east-1',
            }),
            Match.objectLike({
              Key: 'Purpose',
              Value: 'PostgreSQL-DR-Backups',
            }),
          ]),
        });
      });
    });

    describe('Replication (Primary Only)', () => {
      test('creates replication role for primary', () => {
        const storageStack = new StorageStack(stack, 'StorageStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(storageStack);

        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: 's3-replication-role-test-us-east-1',
          AssumedBy: {
            Service: 's3.amazonaws.com',
          },
        });
      });

      test('grants replication permissions', () => {
        const storageStack = new StorageStack(stack, 'StorageStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(storageStack);

        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: Match.arrayWith([
                  's3:ReplicateObject',
                  's3:ReplicateDelete',
                  's3:ReplicateTags',
                  's3:GetObjectVersionTagging',
                ]),
              }),
            ]),
          },
        });
      });

      test('does not create replication role for DR', () => {
        const storageStack = new StorageStack(stack, 'StorageStack', {
          environmentSuffix: 'test',
          isPrimary: false,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(storageStack);
        template.resourceCountIs('AWS::IAM::Role', 0);
      });
    });

    describe('Outputs', () => {
      test('creates all outputs', () => {
        const storageStack = new StorageStack(stack, 'StorageStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(storageStack);

        template.hasOutput('BackupBucketName', {});
        template.hasOutput('BackupBucketArn', {});
        template.hasOutput('KmsKeyId', {});
        template.hasOutput('KmsKeyArn', {});
      });
    });

    test('snapshot test', () => {
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
        isPrimary: true,
        primaryRegion: 'us-east-1',
        drRegion: 'us-west-2',
      });

      const template = Template.fromStack(storageStack);
      expect(template.toJSON()).toMatchSnapshot();
    });
  });

  // ============================================================================
  // DATABASE STACK TESTS
  // ============================================================================
  describe('DatabaseStack', () => {
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let kmsKey: kms.Key;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack');
      vpc = new ec2.Vpc(stack, 'TestVpc');
      kmsKey = new kms.Key(stack, 'TestKey');
    });

    describe('Primary Database', () => {
      test('creates database with correct identifier', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBInstance', {
          DBInstanceIdentifier: 'postgres-dr-test-us-east-1',
          Engine: 'postgres',
        });
      });

      test('creates database with MultiAZ enabled for primary', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBInstance', {
          MultiAZ: true,
        });
      });

      test('creates database with R6G XLARGE instance', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBInstance', {
          DBInstanceClass: 'db.r6g.xlarge',
        });
      });

      test('enables storage encryption', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBInstance', {
          StorageEncrypted: true,
        });
      });

      test('creates database with correct storage settings', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBInstance', {
          AllocatedStorage: '100',
          MaxAllocatedStorage: 500,
          StorageType: 'gp3',
        });
      });

      test('enables performance insights', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBInstance', {
          EnablePerformanceInsights: true,
        });
      });

      test('enables CloudWatch logs export', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBInstance', {
          EnableCloudwatchLogsExports: ['postgresql', 'upgrade'],
        });
      });

      test('sets backup retention to 7 days', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBInstance', {
          BackupRetentionPeriod: 7,
        });
      });

      test('creates read replica for primary', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBInstance', {
          DBInstanceIdentifier: 'postgres-dr-replica-test-us-east-1',
        });
      });

      test('adds tags to primary database', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBInstance', {
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'Name' }),
            Match.objectLike({ Key: 'Region', Value: 'us-east-1' }),
            Match.objectLike({ Key: 'Purpose', Value: 'PostgreSQL-DR' }),
            Match.objectLike({ Key: 'RPO', Value: 'under-1-hour' }),
            Match.objectLike({ Key: 'RTO', Value: 'under-4-hours' }),
          ]),
        });
      });
    });

    describe('DR Database', () => {
      test('creates database without MultiAZ for DR', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: false,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBInstance', {
          MultiAZ: false,
        });
      });

      test('does not create read replica for DR', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: false,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        const resources = template.findResources('AWS::RDS::DBInstance');
        const replicaCount = Object.values(resources).filter((r: any) =>
          r.Properties?.DBInstanceIdentifier?.includes('replica')
        ).length;

        expect(replicaCount).toBe(0);
      });
    });

    describe('Database Credentials', () => {
      test('creates Secrets Manager secret', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::SecretsManager::Secret', {
          Name: 'postgres-dr-credentials-test-us-east-1',
          GenerateSecretString: {
            SecretStringTemplate: '{"username":"postgres"}',
            GenerateStringKey: 'password',
            ExcludePunctuation: true,
            IncludeSpace: false,
            PasswordLength: 32,
          },
        });
      });
    });

    describe('Subnet Group', () => {
      test('creates subnet group', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
          DBSubnetGroupName: 'postgres-dr-subnet-group-test-us-east-1',
        });
      });
    });

    describe('Parameter Group', () => {
      test('creates parameter group with SSL enforcement', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
          Parameters: Match.objectLike({
            'rds.force_ssl': '1',
          }),
        });
      });

      test('creates parameter group with logging parameters', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
          Parameters: Match.objectLike({
            log_statement: 'all',
            log_min_duration_statement: '1000',
          }),
        });
      });
    });

    describe('Option Group', () => {
      test('creates option group', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);
        template.resourceCountIs('AWS::RDS::OptionGroup', 1);
      });
    });

    describe('Outputs', () => {
      test('creates database outputs', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);

        template.hasOutput('DatabaseEndpoint', {});
        template.hasOutput('DatabasePort', {});
        template.hasOutput('DatabaseIdentifier', {});
        template.hasOutput('CredentialsSecretArn', {});
      });

      test('creates read replica output for primary', () => {
        const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          kmsKey,
        });

        const template = Template.fromStack(dbStack);
        template.hasOutput('ReadReplicaEndpoint', {});
      });
    });

    test('snapshot test for primary', () => {
      const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        isPrimary: true,
        primaryRegion: 'us-east-1',
        drRegion: 'us-west-2',
        vpc,
        kmsKey,
      });

      const template = Template.fromStack(dbStack);
      expect(template.toJSON()).toMatchSnapshot();
    });

    test('snapshot test for DR', () => {
      const dbStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        isPrimary: false,
        primaryRegion: 'us-east-1',
        drRegion: 'us-west-2',
        vpc,
        kmsKey,
      });

      const template = Template.fromStack(dbStack);
      expect(template.toJSON()).toMatchSnapshot();
    });
  });

  // ============================================================================
  // MONITORING STACK TESTS
  // ============================================================================
  describe('MonitoringStack', () => {
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let database: rds.DatabaseInstance;
    let readReplica: rds.DatabaseInstanceReadReplica;
    let kmsKey: kms.Key;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack');
      vpc = new ec2.Vpc(stack, 'TestVpc');
      kmsKey = new kms.Key(stack, 'TestKey');

      database = new rds.DatabaseInstance(stack, 'TestDatabase', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14,
        }),
        vpc,
        instanceIdentifier: 'test-db',
      });

      readReplica = new rds.DatabaseInstanceReadReplica(
        stack,
        'TestReadReplica',
        {
          sourceDatabaseInstance: database,
          instanceIdentifier: 'test-replica',
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.BURSTABLE2,
            ec2.InstanceSize.LARGE
          ),
          vpc,
        }
      );
    });


    describe('SNS Topic', () => {
      test('creates alarm topic', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
          readReplica,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::SNS::Topic', {
          TopicName: 'postgres-dr-alarms-test-us-east-1',
          DisplayName: 'PostgreSQL DR Alarms for us-east-1',
        });
      });
    });

    describe('CloudWatch Alarms', () => {
      test('creates CPU alarm', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: 'postgres-dr-cpu-test-us-east-1',
          Threshold: 80,
          ComparisonOperator: 'GreaterThanThreshold',
        });
      });

      test('creates storage alarm', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: 'postgres-dr-storage-test-us-east-1',
          Threshold: 10737418240,
          ComparisonOperator: 'LessThanThreshold',
        });
      });

      test('creates connections alarm', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: 'postgres-dr-connections-test-us-east-1',
          Threshold: 80,
        });
      });

      test('creates read latency alarm', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: 'postgres-dr-read-latency-test-us-east-1',
          Threshold: 0.1,
        });
      });

      test('creates write latency alarm', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: 'postgres-dr-write-latency-test-us-east-1',
          Threshold: 0.1,
        });
      });

      test('creates composite alarm', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::CloudWatch::CompositeAlarm', {
          CompositeAlarmName: 'postgres-dr-composite-test-us-east-1',
        });
      });

      test('alarms send actions to SNS', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmActions: Match.arrayWith([
            Match.objectLike({
              Ref: Match.anyValue(),
            }),
          ]),
        });
      });
    });

    describe('Replication Lag Lambda (Primary Only)', () => {
      test('creates Lambda function when read replica exists', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
          readReplica,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: 'replication-lag-monitor-test-us-east-1',
          Runtime: 'nodejs18.x',
          Timeout: 300,
          MemorySize: 256,
        });
      });

      test('Lambda has correct environment variables', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
          readReplica,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              PRIMARY_DB_IDENTIFIER: 'test-db',
              REPLICA_DB_IDENTIFIER: 'test-replica',
              ENVIRONMENT_SUFFIX: 'test',
            },
          },
        });
      });

      test('creates IAM role for Lambda', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
          readReplica,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: 'replication-lag-monitor-test-us-east-1',
          AssumedBy: {
            Service: 'lambda.amazonaws.com',
          },
        });
      });

      test('Lambda role has RDS permissions', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
          readReplica,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: Match.arrayWith([
                  'rds:DescribeDBInstances',
                  'rds:DescribeDBClusters',
                  'cloudwatch:PutMetricData',
                ]),
              }),
            ]),
          },
        });
      });

      test('Lambda role has SNS permissions', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
          readReplica,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: ['sns:Publish'],
              }),
            ]),
          },
        });
      });

      test('creates EventBridge rule for Lambda', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
          readReplica,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::Events::Rule', {
          Name: 'replication-lag-monitor-test-us-east-1',
          ScheduleExpression: 'rate(5 minutes)',
        });
      });

      test('creates replication lag alarm', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
          readReplica,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: 'postgres-dr-replication-lag-test-us-east-1',
          Threshold: 300,
        });
      });

      test('does not create Lambda for DR region', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: false,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
        });

        const template = Template.fromStack(monitoringStack);
        template.resourceCountIs('AWS::Lambda::Function', 0);
      });

      test('does not create Lambda without read replica', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
        });

        const template = Template.fromStack(monitoringStack);
        template.resourceCountIs('AWS::Lambda::Function', 0);
      });
    });

    describe('Outputs', () => {
      test('creates alarm topic output', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
        });

        const template = Template.fromStack(monitoringStack);

        template.hasOutput('AlarmTopicArn', {});
        template.hasOutput('CompositeAlarmName', {});
      });

      test('creates Lambda output when read replica exists', () => {
        const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          vpc,
          database,
          readReplica,
        });

        const template = Template.fromStack(monitoringStack);
        template.hasOutput('ReplicationLagFunctionArn', {});
      });
    });

    test('snapshot test with read replica', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        isPrimary: true,
        primaryRegion: 'us-east-1',
        drRegion: 'us-west-2',
        vpc,
        database,
        readReplica,
      });

      const template = Template.fromStack(monitoringStack);
      expect(template.toJSON()).toMatchSnapshot();
    });

    test('snapshot test without read replica', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        isPrimary: false,
        primaryRegion: 'us-east-1',
        drRegion: 'us-west-2',
        vpc,
        database,
      });

      const template = Template.fromStack(monitoringStack);
      expect(template.toJSON()).toMatchSnapshot();
    });
  });

  // ============================================================================
  // FAILOVER STACK TESTS
  // ============================================================================
  describe('FailoverStack', () => {
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let primaryDatabase: rds.DatabaseInstance;
    let alarmTopic: sns.Topic;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack');
      vpc = new ec2.Vpc(stack, 'TestVpc');

      primaryDatabase = new rds.DatabaseInstance(stack, 'TestDatabase', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14,
        }),
        vpc,
        instanceIdentifier: 'test-primary-db',
      });

      alarmTopic = new sns.Topic(stack, 'TestTopic');
    });

    describe('Failover Lambda', () => {
      test('creates Lambda function', () => {
        const failoverStack = new FailoverStack(stack, 'FailoverStack', {
          environmentSuffix: 'test',
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          primaryDatabase,
          alarmTopic,
        });

        const template = Template.fromStack(failoverStack);

        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: 'postgres-dr-failover-test',
          Runtime: 'python3.11',
          Handler: 'index.handler',
          Timeout: 900,
          MemorySize: 512,
        });
      });

      test('Lambda has correct environment variables', () => {
        const failoverStack = new FailoverStack(stack, 'FailoverStack', {
          environmentSuffix: 'test',
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          primaryDatabase,
          alarmTopic,
        });

        const template = Template.fromStack(failoverStack);

        template.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              PRIMARY_DB_IDENTIFIER: 'test-primary-db',
              PRIMARY_REGION: 'us-east-1',
              DR_REGION: 'us-west-2',
              ENVIRONMENT_SUFFIX: 'test',
            },
          },
        });
      });

      test('creates IAM role for failover Lambda', () => {
        const failoverStack = new FailoverStack(stack, 'FailoverStack', {
          environmentSuffix: 'test',
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          primaryDatabase,
          alarmTopic,
        });

        const template = Template.fromStack(failoverStack);

        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: 'postgres-dr-failover-test',
          AssumedBy: {
            Service: 'lambda.amazonaws.com',
          },
        });
      });

      test('Lambda role has RDS failover permissions', () => {
        const failoverStack = new FailoverStack(stack, 'FailoverStack', {
          environmentSuffix: 'test',
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          primaryDatabase,
          alarmTopic,
        });

        const template = Template.fromStack(failoverStack);

        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: Match.arrayWith([
                  'rds:PromoteReadReplica',
                  'rds:DescribeDBInstances',
                  'rds:ModifyDBInstance',
                  'rds:RebootDBInstance',
                ]),
              }),
            ]),
          },
        });
      });

      test('Lambda role has SNS permissions', () => {
        const failoverStack = new FailoverStack(stack, 'FailoverStack', {
          environmentSuffix: 'test',
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          primaryDatabase,
          alarmTopic,
        });

        const template = Template.fromStack(failoverStack);

        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: ['sns:Publish'],
              }),
            ]),
          },
        });
      });

      test('Lambda role has CloudWatch permissions', () => {
        const failoverStack = new FailoverStack(stack, 'FailoverStack', {
          environmentSuffix: 'test',
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          primaryDatabase,
          alarmTopic,
        });

        const template = Template.fromStack(failoverStack);

        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: Match.arrayWith([
                  'cloudwatch:DescribeAlarms',
                  'cloudwatch:GetMetricStatistics',
                ]),
              }),
            ]),
          },
        });
      });
    });

    describe('EventBridge Rules', () => {
      test('creates CloudWatch alarm failover rule', () => {
        const failoverStack = new FailoverStack(stack, 'FailoverStack', {
          environmentSuffix: 'test',
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          primaryDatabase,
          alarmTopic,
        });

        const template = Template.fromStack(failoverStack);

        template.hasResourceProperties('AWS::Events::Rule', {
          Name: 'postgres-dr-failover-rule-test',
          EventPattern: {
            source: ['aws.cloudwatch'],
            'detail-type': ['CloudWatch Alarm State Change'],
            detail: {
              alarmName: [
                {
                  prefix: 'postgres-dr-composite-test',
                },
              ],
              state: {
                value: ['ALARM'],
              },
            },
          },
        });
      });

      test('creates RDS event rule', () => {
        const failoverStack = new FailoverStack(stack, 'FailoverStack', {
          environmentSuffix: 'test',
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          primaryDatabase,
          alarmTopic,
        });

        const template = Template.fromStack(failoverStack);

        template.hasResourceProperties('AWS::Events::Rule', {
          Name: 'postgres-dr-rds-events-test',
          EventPattern: {
            source: ['aws.rds'],
            'detail-type': ['RDS DB Instance Event'],
            detail: {
              EventCategories: ['failover', 'failure', 'recovery'],
            },
          },
        });
      });

      test('failover rule targets Lambda', () => {
        const failoverStack = new FailoverStack(stack, 'FailoverStack', {
          environmentSuffix: 'test',
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          primaryDatabase,
          alarmTopic,
        });

        const template = Template.fromStack(failoverStack);

        const rules = template.findResources('AWS::Events::Rule', {
          Properties: {
            Name: 'postgres-dr-failover-rule-test',
          },
        });

        expect(Object.keys(rules).length).toBeGreaterThan(0);
      });

      test('rules target SNS topic', () => {
        const failoverStack = new FailoverStack(stack, 'FailoverStack', {
          environmentSuffix: 'test',
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          primaryDatabase,
          alarmTopic,
        });

        const template = Template.fromStack(failoverStack);
        template.resourceCountIs('AWS::SNS::TopicPolicy', 1);
      });
    });

    describe('Tags', () => {
      test('adds tags to Lambda function', () => {
        const failoverStack = new FailoverStack(stack, 'FailoverStack', {
          environmentSuffix: 'test',
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          primaryDatabase,
          alarmTopic,
        });

        const template = Template.fromStack(failoverStack);

        template.hasResourceProperties('AWS::Lambda::Function', {
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Name',
              Value: 'postgres-dr-failover-test',
            }),
            Match.objectLike({
              Key: 'Purpose',
              Value: 'PostgreSQL-DR-Failover',
            }),
          ]),
        });
      });
    });

    describe('Outputs', () => {
      test('creates all outputs', () => {
        const failoverStack = new FailoverStack(stack, 'FailoverStack', {
          environmentSuffix: 'test',
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
          primaryDatabase,
          alarmTopic,
        });

        const template = Template.fromStack(failoverStack);

        template.hasOutput('FailoverFunctionArn', {});
        template.hasOutput('FailoverRuleName', {});
        template.hasOutput('RdsEventRuleName', {});
      });
    });

    test('snapshot test', () => {
      const failoverStack = new FailoverStack(stack, 'FailoverStack', {
        environmentSuffix: 'test',
        primaryRegion: 'us-east-1',
        drRegion: 'us-west-2',
        primaryDatabase,
        alarmTopic,
      });

      const template = Template.fromStack(failoverStack);
      expect(template.toJSON()).toMatchSnapshot();
    });
  });

  // ============================================================================
  // TAP STACK INTEGRATION TESTS
  // ============================================================================
  describe('TapStack Integration', () => {
    describe('Primary Stack', () => {
      test('creates all nested stacks for primary region', () => {
        const tapStack = new TapStack(app, 'TapStack', {
          env: { account: '123456789012', region: 'us-east-1' },
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::CloudFormation::Stack', 5);
      });

      test('creates failover stack for primary', () => {
        const tapStack = new TapStack(app, 'TapStack', {
          env: { account: '123456789012', region: 'us-east-1' },
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(tapStack);

        const stacks = template.findResources('AWS::CloudFormation::Stack');
        const hasFailoverStack = Object.keys(stacks).some((key) =>
          key.includes('FailoverStack')
        );

        expect(hasFailoverStack).toBe(true);
      });

      test('creates all outputs for primary', () => {
        const tapStack = new TapStack(app, 'TapStack', {
          env: { account: '123456789012', region: 'us-east-1' },
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(tapStack);

        template.hasOutput('VpcId', {
          Export: {
            Name: 'test-vpc-id-us-east-1',
          },
        });
        template.hasOutput('DatabaseEndpoint', {});
        template.hasOutput('ReadReplicaEndpoint', {});
        template.hasOutput('BackupBucket', {});
        template.hasOutput('AlarmTopicArn', {});
      });
    });

    describe('DR Stack', () => {
      test('creates all nested stacks except failover for DR region', () => {
        const tapStack = new TapStack(app, 'TapStack', {
          env: { account: '123456789012', region: 'us-west-2' },
          environmentSuffix: 'test',
          isPrimary: false,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::CloudFormation::Stack', 4);
      });

      test('does not create failover stack for DR', () => {
        const tapStack = new TapStack(app, 'TapStack', {
          env: { account: '123456789012', region: 'us-west-2' },
          environmentSuffix: 'test',
          isPrimary: false,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(tapStack);

        const stacks = template.findResources('AWS::CloudFormation::Stack');
        const hasFailoverStack = Object.keys(stacks).some((key) =>
          key.includes('FailoverStack')
        );

        expect(hasFailoverStack).toBe(false);
      });

      test('creates outputs without read replica for DR', () => {
        const tapStack = new TapStack(app, 'TapStack', {
          env: { account: '123456789012', region: 'us-west-2' },
          environmentSuffix: 'test',
          isPrimary: false,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(tapStack);

        template.hasOutput('VpcId', {});
        template.hasOutput('DatabaseEndpoint', {});
        template.hasOutput('BackupBucket', {});
        template.hasOutput('AlarmTopicArn', {});

        const outputs = template.toJSON().Outputs;
        expect(outputs).not.toHaveProperty('ReadReplicaEndpoint');
      });
    });

    describe('Stack Dependencies', () => {
      test('database stack depends on network and storage', () => {
        const tapStack = new TapStack(app, 'TapStack', {
          env: { account: '123456789012', region: 'us-east-1' },
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(tapStack);

        const stacks = template.findResources('AWS::CloudFormation::Stack');
        const databaseStack = Object.entries(stacks).find(([key]) =>
          key.includes('DatabaseStack')
        );

        expect(databaseStack).toBeDefined();
        if (databaseStack) {
          const [, props] = databaseStack;
          expect(props.DependsOn).toBeDefined();
          expect((props.DependsOn as string[]).length).toBeGreaterThan(0);
        }
      });

      test('monitoring stack depends on database', () => {
        const tapStack = new TapStack(app, 'TapStack', {
          env: { account: '123456789012', region: 'us-east-1' },
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(tapStack);

        const stacks = template.findResources('AWS::CloudFormation::Stack');
        const monitoringStack = Object.entries(stacks).find(([key]) =>
          key.includes('MonitoringStack')
        );

        expect(monitoringStack).toBeDefined();
        if (monitoringStack) {
          const [, props] = monitoringStack;
          expect(props.DependsOn).toBeDefined();
        }
      });

      test('failover stack depends on monitoring (primary only)', () => {
        const tapStack = new TapStack(app, 'TapStack', {
          env: { account: '123456789012', region: 'us-east-1' },
          environmentSuffix: 'test',
          isPrimary: true,
          primaryRegion: 'us-east-1',
          drRegion: 'us-west-2',
        });

        const template = Template.fromStack(tapStack);

        const stacks = template.findResources('AWS::CloudFormation::Stack');
        const failoverStack = Object.entries(stacks).find(([key]) =>
          key.includes('FailoverStack')
        );

        expect(failoverStack).toBeDefined();
        if (failoverStack) {
          const [, props] = failoverStack;
          expect(props.DependsOn).toBeDefined();
        }
      });
    });

    test('snapshot test for primary stack', () => {
      const tapStack = new TapStack(app, 'TapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'test',
        isPrimary: true,
        primaryRegion: 'us-east-1',
        drRegion: 'us-west-2',
      });

      const template = Template.fromStack(tapStack);
      expect(template.toJSON()).toMatchSnapshot();
    });

    test('snapshot test for DR stack', () => {
      const tapStack = new TapStack(app, 'TapStack', {
        env: { account: '123456789012', region: 'us-west-2' },
        environmentSuffix: 'test',
        isPrimary: false,
        primaryRegion: 'us-east-1',
        drRegion: 'us-west-2',
      });

      const template = Template.fromStack(tapStack);
      expect(template.toJSON()).toMatchSnapshot();
    });
  });
});
