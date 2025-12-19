import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    
    stack = new TapStack(app, 'TestTapStack', { 
      environment: 'test',
      projectName: 'test-project'
    });
    template = Template.fromStack(stack);
  });

  describe('VPC and Networking', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: 'test-project-test-vpc'
          }
        ])
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-name',
            Value: 'Public'
          }
        ])
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-name',
            Value: 'Private'
          }
        ])
      });
    });

    test('should create isolated subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.4.0/28',
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-name',
            Value: 'Isolated'
          }
        ])
      });
    });

    test('should create database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
        SecurityGroupEgress: Match.arrayWith([
          {
            CidrIp: '255.255.255.255/32',
            Description: 'Disallow all traffic',
            FromPort: 252,
            IpProtocol: 'icmp',
            ToPort: 86
          }
        ])
      });
    });

    test('should create application security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application servers',
        SecurityGroupEgress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1'
          }
        ])
      });
    });
  });

  describe('KMS Encryption', () => {
    test('should create KMS encryption key', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'Encryption key for test-project migration resources',
        EnableKeyRotation: true
      });
    });

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/test-project-test-key'
      });
    });
  });

  describe('S3 Storage', () => {
    test('should create data bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            {
              ServerSideEncryptionByDefault: {
                KMSMasterKeyID: Match.anyValue(),
                SSEAlgorithm: 'aws:kms'
              }
            }
          ])
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('should create replication bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            {
              ServerSideEncryptionByDefault: {
                KMSMasterKeyID: Match.anyValue(),
                SSEAlgorithm: 'aws:kms'
              }
            }
          ])
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('should create data bucket lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            {
              Id: 'DataLifecycleRule',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90
                }
              ])
            }
          ])
        }
      });
    });
  });

  describe('RDS Database', () => {
    test('should create RDS subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for migration database'
      });
    });

    test('should create RDS parameter group', () => {
      template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
        Description: 'Parameter group for migration database',
        Family: 'postgres14',
        Parameters: {
          'shared_preload_libraries': 'pg_stat_statements',
          'log_statement': 'all',
          'log_min_duration_statement': '1000'
        }
      });
    });

    test('should create RDS database instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.medium',
        Engine: 'postgres',
        EngineVersion: '14.15',
        AllocatedStorage: '100',
        MaxAllocatedStorage: 1000,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeleteAutomatedBackups: true,
        DeletionProtection: false,
        EnableCloudwatchLogsExports: ['postgresql'],
        EnablePerformanceInsights: true,
        PerformanceInsightsRetentionPeriod: 7
      });
    });

    test('should create database secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: {
          ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@\"\\',
          GenerateStringKey: 'password',
          PasswordLength: 30,
          SecretStringTemplate: '{"username":"migrationadmin"}'
        }
      });
    });
  });

  describe('ECS Application', () => {
    test('should create ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'test-project-test-cluster',
        ClusterSettings: Match.arrayWith([
          {
            Name: 'containerInsights',
            Value: 'enabled'
          }
        ])
      });
    });

    test('should create CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/ecs/test-project-test',
        RetentionInDays: 30
      });
    });

    test('should create application task role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com'
              }
            }
          ])
        },
        Description: 'Role for migration application tasks'
      });
    });

    test('should create ECS service with load balancer', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        DesiredCount: 1,
        DeploymentConfiguration: {
          MaximumPercent: 200,
          MinimumHealthyPercent: 50
        }
      });
    });

    test('should create application load balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internal'
      });
    });
  });

  describe('Backup and Restore', () => {
    test('should create backup vault', () => {
      template.hasResourceProperties('AWS::Backup::BackupVault', {
        BackupVaultName: 'test-project-test-backup-vault'
      });
    });

    test('should create backup role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'backup.amazonaws.com'
              }
            }
          ])
        }
      });
    });

    test('should create backup plan', () => {
      template.hasResourceProperties('AWS::Backup::BackupPlan', {
        BackupPlan: {
          BackupPlanName: 'test-project-test-backup-plan',
          BackupPlanRule: Match.arrayWith([
            {
              RuleName: 'DailyBackups',
              ScheduleExpression: 'cron(0 2 * * ? *)',
              StartWindowMinutes: 60,
              CompletionWindowMinutes: 120,
              Lifecycle: {
                DeleteAfterDays: 7
              },
              TargetBackupVault: Match.anyValue()
            },
            {
              RuleName: 'WeeklyBackups',
              ScheduleExpression: 'cron(0 3 ? * SUN *)',
              StartWindowMinutes: 60,
              CompletionWindowMinutes: 180,
              Lifecycle: {
                DeleteAfterDays: 30
              },
              TargetBackupVault: Match.anyValue()
            }
          ])
        }
      });
    });

    test('should create database backup selection', () => {
      template.hasResourceProperties('AWS::Backup::BackupSelection', {
        BackupSelection: {
          SelectionName: 'DatabaseBackupSelection'
        }
      });
    });

    test('should create S3 backup selection', () => {
      template.hasResourceProperties('AWS::Backup::BackupSelection', {
        BackupSelection: {
          SelectionName: 'S3BackupSelection'
        }
      });
    });

    test('should skip backup resources for LocalStack', () => {
      // Create a stack with LocalStack account ID
      const localStackApp = new cdk.App();
      const localStack = new TapStack(localStackApp, 'LocalStackTapStack', {
        environment: 'test',
        projectName: 'test-project',
        env: {
          account: '000000000000',
          region: 'us-east-1'
        }
      });
      const localStackTemplate = Template.fromStack(localStack);

      // Verify BackupStatus output is created
      localStackTemplate.hasOutput('BackupStatus', {
        Description: 'Backup Configuration Status',
        Value: 'Skipped (LocalStack does not fully support AWS Backup)'
      });

      // Verify backup resources are NOT created
      localStackTemplate.resourceCountIs('AWS::Backup::BackupVault', 0);
      localStackTemplate.resourceCountIs('AWS::Backup::BackupPlan', 0);
      localStackTemplate.resourceCountIs('AWS::Backup::BackupSelection', 0);
    });
  });

  describe('Parameter Store', () => {
    test('should create database endpoint parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/test-project/test/database/endpoint',
        Type: 'String',
        Description: 'RDS database endpoint'
      });
    });

    test('should create data bucket parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/test-project/test/s3/data-bucket',
        Type: 'String',
        Description: 'S3 data bucket name'
      });
    });

    test('should create backup vault parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/test-project/test/backup/vault-name',
        Type: 'String',
        Description: 'Backup vault name'
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database endpoint',
        Export: {
          Name: 'test-project-test-db-endpoint'
        }
      });
    });

    test('should export database secret ARN', () => {
      template.hasOutput('DatabaseSecretArn', {
        Description: 'Database secret ARN',
        Export: {
          Name: 'test-project-test-db-secret-arn'
        }
      });
    });

    test('should export data bucket name', () => {
      template.hasOutput('DataBucketName', {
        Description: 'S3 data bucket name',
        Export: {
          Name: 'test-project-test-data-bucket'
        }
      });
    });

    test('should export load balancer DNS', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS name',
        Export: {
          Name: 'test-project-test-alb-dns'
        }
      });
    });

    test('should export backup vault name', () => {
      template.hasOutput('BackupVaultName', {
        Description: 'Backup vault name',
        Export: {
          Name: 'test-project-test-backup-vault'
        }
      });
    });

    test('should export encryption key ID', () => {
      template.hasOutput('EncryptionKeyId', {
        Description: 'KMS encryption key ID',
        Export: {
          Name: 'test-project-test-kms-key-id'
        }
      });
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should use test environment configuration', () => {
      // Verify that test environment uses appropriate settings
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
        DeleteAutomatedBackups: true,
        DeletionProtection: false
      });
    });

    test('should use production environment configuration', () => {
      // Create a production stack for comparison
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTapStack', {
        environment: 'prod',
        projectName: 'test-project'
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 30,
        DeleteAutomatedBackups: false,
        DeletionProtection: true
      });
    });
  });

  describe('Security and Compliance', () => {
    test('should encrypt all storage resources', () => {
      // RDS encryption
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true
      });

      // S3 encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            {
              ServerSideEncryptionByDefault: {
                KMSMasterKeyID: Match.anyValue(),
                SSEAlgorithm: 'aws:kms'
              }
            }
          ])
        }
      });
    });



    test('should restrict database access', () => {
      // Test that database security group has restricted outbound access
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
        SecurityGroupEgress: Match.arrayWith([
          {
            CidrIp: '255.255.255.255/32',
            Description: 'Disallow all traffic',
            FromPort: 252,
            IpProtocol: 'icmp',
            ToPort: 86
          }
        ])
      });
    });
  });
});
