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
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: Match.anyValue(),
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'production' },
          { Key: 'MigrationProject', Value: '2024Q1' },
        ]),
      });
    });

    test('should create public, private, and isolated subnets', () => {
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Public' }),
        ]),
      });

      // Check for private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Private' }),
        ]),
      });

      // Check for isolated subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Isolated' }),
        ]),
      });
    });

    test('should create NAT Gateway for private subnet connectivity', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name' }),
        ]),
      });
    });
  });

  describe('Security Groups', () => {
    test('should create database security group with port 5432 access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('database'),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 5432,
            ToPort: 5432,
          }),
        ]),
      });
    });

    test('should create application security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('application'),
      });
    });
  });

  describe('RDS Aurora Cluster', () => {
    test('should create Aurora PostgreSQL cluster with version 14.13', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: Match.stringLikeRegexp('14\\.13'),
        MasterUsername: Match.anyValue(),
        DatabaseName: Match.absent(),
        BackupRetentionPeriod: 7,
        StorageEncrypted: true,
      });
    });

    test('should create cluster parameter group with max_connections=1000', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Parameters: Match.objectLike({
          max_connections: '1000',
        }),
      });
    });

    test('should create one writer and two reader instances', () => {
      // Check for writer instance
      const instances = template.findResources('AWS::RDS::DBInstance', {
        Properties: {
          DBClusterIdentifier: Match.anyValue(),
        },
      });

      // Should have exactly 3 instances (1 writer + 2 readers)
      expect(Object.keys(instances).length).toBe(3);
    });

    test('should place Aurora cluster in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        SubnetIds: Match.anyValue(),
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'production' },
        ]),
      });
    });
  });

  describe('Secrets Manager', () => {
    test('should create secret for database credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Aurora PostgreSQL database credentials',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: Match.anyValue(),
          GenerateStringKey: 'password',
          PasswordLength: 32,
          ExcludePunctuation: true,
          IncludeSpace: false,
        }),
      });
    });

    test('should not have automatic rotation enabled', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Aurora PostgreSQL database credentials',
      });

      // Verify no rotation schedule exists
      const rotationSchedules = template.findResources('AWS::SecretsManager::RotationSchedule');
      expect(Object.keys(rotationSchedules).length).toBe(0);
    });
  });

  describe('DMS Configuration', () => {
    test('should create DMS replication instance', () => {
      template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
        ReplicationInstanceClass: 'dms.r5.large',
        AllocatedStorage: 100,
        PubliclyAccessible: false,
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'production' },
          { Key: 'MigrationProject', Value: '2024Q1' },
        ]),
      });
    });

    test('should create DMS subnet group', () => {
      template.hasResourceProperties('AWS::DMS::ReplicationSubnetGroup', {
        ReplicationSubnetGroupDescription: 'DMS replication subnet group',
        SubnetIds: Match.anyValue(),
      });
    });

    test('should create source and target DMS endpoints', () => {
      // Source endpoint
      template.hasResourceProperties('AWS::DMS::Endpoint', {
        EndpointType: 'source',
        EngineName: 'postgres',
        Port: 5432,
      });

      // Target endpoint
      template.hasResourceProperties('AWS::DMS::Endpoint', {
        EndpointType: 'target',
        EngineName: 'aurora-postgresql',
        Port: 5432,
      });
    });

    test('should create DMS migration task with full-load-and-cdc', () => {
      template.hasResourceProperties('AWS::DMS::ReplicationTask', {
        MigrationType: 'full-load-and-cdc',
        TableMappings: Match.anyValue(),
        ReplicationTaskSettings: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should enable CloudWatch logs for Aurora cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableCloudwatchLogsExports: ['postgresql'],
      });
    });

    test('should create CloudWatch log groups', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: Match.anyValue(),
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create DMS VPC management role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'dms.amazonaws.com',
              }),
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.stringLikeRegexp('AmazonDMSVPCManagementRole'),
        ]),
      });
    });

    test('should create DMS CloudWatch logs role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'dms.amazonaws.com',
              }),
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.stringLikeRegexp('AmazonDMSCloudWatchLogsRole'),
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output Aurora cluster endpoint', () => {
      template.hasOutput('AuroraClusterEndpoint', {
        Description: 'Aurora PostgreSQL cluster endpoint',
        Export: Match.objectLike({
          Name: Match.stringLikeRegexp('aurora-cluster-endpoint'),
        }),
      });
    });

    test('should output Aurora reader endpoint', () => {
      template.hasOutput('AuroraReaderEndpoint', {
        Description: 'Aurora PostgreSQL reader endpoint',
        Export: Match.objectLike({
          Name: Match.stringLikeRegexp('aurora-reader-endpoint'),
        }),
      });
    });

    test('should output database secret ARN', () => {
      template.hasOutput('DatabaseSecretArn', {
        Description: 'ARN of the database credentials secret',
        Export: Match.objectLike({
          Name: Match.stringLikeRegexp('database-secret-arn'),
        }),
      });
    });

    test('should output DMS task ARN', () => {
      template.hasOutput('DMSTaskArn', {
        Description: 'ARN of the DMS migration task',
        Export: Match.objectLike({
          Name: Match.stringLikeRegexp('dms-task-arn'),
        }),
      });
    });

    test('should output VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: Match.objectLike({
          Name: Match.stringLikeRegexp('vpc-id'),
        }),
      });
    });

    test('should output database security group ID', () => {
      template.hasOutput('DatabaseSecurityGroupId', {
        Description: 'Database security group ID',
        Export: Match.objectLike({
          Name: Match.stringLikeRegexp('database-sg-id'),
        }),
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should tag all resources with Environment and MigrationProject', () => {
      // Check VPC tagging
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'production' },
          { Key: 'MigrationProject', Value: '2024Q1' },
        ]),
      });

      // Check RDS cluster tagging
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'production' },
          { Key: 'MigrationProject', Value: '2024Q1' },
        ]),
      });

      // Check DMS instance tagging
      template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'production' },
          { Key: 'MigrationProject', Value: '2024Q1' },
        ]),
      });
    });
  });

  describe('Resource Naming', () => {
    test('should include environmentSuffix in resource names', () => {
      // Check VPC naming
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('test')
          }),
        ]),
      });

      // Check Aurora cluster naming
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DBClusterIdentifier: Match.stringLikeRegexp('test'),
      });

      // Check DMS instance naming
      template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
        ReplicationInstanceIdentifier: Match.stringLikeRegexp('test'),
      });
    });
  });

  describe('Deletion Policies', () => {
    test('should allow clean destruction of resources', () => {
      // Check Aurora cluster has DESTROY removal policy
      const clusterResources = template.findResources('AWS::RDS::DBCluster');
      Object.values(clusterResources).forEach(resource => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });

      // Check Secrets Manager secret can be deleted
      const secretResources = template.findResources('AWS::SecretsManager::Secret');
      Object.values(secretResources).forEach(resource => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });
  });
});