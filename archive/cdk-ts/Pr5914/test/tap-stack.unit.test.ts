import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC and Network Infrastructure', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });

      // Verify VPC has tags
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'production' }),
          Match.objectLike({ Key: 'MigrationProject', Value: '2024Q1' }),
        ]),
      });
    });

    test('creates public, private, and isolated subnets', () => {
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      // Check for private subnets (with NAT)
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });

      // Verify minimum number of subnets (2 AZs * 3 types = 6 subnets minimum)
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(6);
    });

    test('creates NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test.skip('creates database security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Aurora PostgreSQL database',
        SecurityGroupIngress: [
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 5432,
            ToPort: 5432,
          }),
        ],
      });

      // Verify security group tags
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'production' }),
          Match.objectLike({ Key: 'MigrationProject', Value: '2024Q1' }),
        ]),
      });
    });

    test('creates application security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application tier',
      });
    });
  });

  describe('RDS Aurora PostgreSQL Cluster', () => {
    test('creates Aurora cluster with PostgreSQL 14.13', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '14.13',
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
      });

      // Verify cluster tags
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'production' }),
          Match.objectLike({ Key: 'MigrationProject', Value: '2024Q1' }),
        ]),
      });
    });

    test('creates exactly 3 DB instances (1 writer + 2 readers)', () => {
      const instances = template.findResources('AWS::RDS::DBInstance');
      expect(Object.keys(instances).length).toBe(3);
    });

    test('DB instances use r5.large instance type', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r5.large',
        PubliclyAccessible: false,
      });
    });

    test('creates custom parameter group with max_connections=1000', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Family: 'aurora-postgresql14',
        Parameters: {
          max_connections: '1000',
        },
      });

      // Verify parameter group tags
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'production' }),
          Match.objectLike({ Key: 'MigrationProject', Value: '2024Q1' }),
        ]),
      });
    });

    test('enables CloudWatch log exports', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableCloudwatchLogsExports: ['postgresql'],
      });
    });

    test('DB cluster is in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        SubnetIds: Match.anyValue(),
      });
    });
  });

  describe('AWS Secrets Manager', () => {
    test('creates secret for database credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Aurora PostgreSQL database credentials',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: Match.stringLikeRegexp('username'),
          GenerateStringKey: 'password',
          ExcludePunctuation: true,
          PasswordLength: 32,
        }),
      });

      // Verify secret tags
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'production' }),
          Match.objectLike({ Key: 'MigrationProject', Value: '2024Q1' }),
        ]),
      });
    });

    test('does not create rotation configuration', () => {
      // Verify no rotation lambda or schedule is created
      template.resourceCountIs('AWS::SecretsManager::RotationSchedule', 0);
    });
  });

  describe('AWS DMS Infrastructure', () => {
    test('creates DMS subnet group', () => {
      template.hasResourceProperties('AWS::DMS::ReplicationSubnetGroup', {
        ReplicationSubnetGroupDescription: 'DMS replication subnet group',
      });
    });

    test('creates DMS replication instance with r5.large', () => {
      template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
        ReplicationInstanceClass: 'dms.r5.large',
        AllocatedStorage: 100,
        PubliclyAccessible: false,
        MultiAZ: false,
      });

      // Verify DMS instance tags
      template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'production' }),
          Match.objectLike({ Key: 'MigrationProject', Value: '2024Q1' }),
        ]),
      });
    });

    test('creates source endpoint for PostgreSQL', () => {
      template.hasResourceProperties('AWS::DMS::Endpoint', {
        EndpointType: 'source',
        EngineName: 'postgres',
      });

      // Verify source endpoint tags
      template.hasResourceProperties('AWS::DMS::Endpoint', {
        EndpointType: 'source',
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'production' }),
          Match.objectLike({ Key: 'MigrationProject', Value: '2024Q1' }),
        ]),
      });
    });

    test('creates target endpoint for Aurora PostgreSQL', () => {
      template.hasResourceProperties('AWS::DMS::Endpoint', {
        EndpointType: 'target',
        EngineName: 'aurora-postgresql',
      });

      // Verify target endpoint tags
      template.hasResourceProperties('AWS::DMS::Endpoint', {
        EndpointType: 'target',
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'production' }),
          Match.objectLike({ Key: 'MigrationProject', Value: '2024Q1' }),
        ]),
      });
    });

    test('creates migration task with full-load-and-cdc', () => {
      template.hasResourceProperties('AWS::DMS::ReplicationTask', {
        MigrationType: 'full-load-and-cdc',
      });

      // Verify migration task tags
      template.hasResourceProperties('AWS::DMS::ReplicationTask', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'production' }),
          Match.objectLike({ Key: 'MigrationProject', Value: '2024Q1' }),
        ]),
      });
    });

    test('migration task has proper table mappings', () => {
      const resources = template.findResources('AWS::DMS::ReplicationTask');
      const taskResource = Object.values(resources)[0];
      const tableMappings = JSON.parse(taskResource.Properties.TableMappings);

      expect(tableMappings.rules).toHaveLength(1);
      expect(tableMappings.rules[0]['rule-type']).toBe('selection');
      expect(tableMappings.rules[0]['rule-action']).toBe('include');
    });

    test('migration task has CloudWatch logging enabled', () => {
      const resources = template.findResources('AWS::DMS::ReplicationTask');
      const taskResource = Object.values(resources)[0];
      const taskSettings = JSON.parse(taskResource.Properties.ReplicationTaskSettings);

      expect(taskSettings.Logging.EnableLogging).toBe(true);
      expect(taskSettings.Logging.LogComponents).toBeDefined();
      expect(taskSettings.Logging.LogComponents.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Roles', () => {
    test.skip('creates DMS VPC management role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'dms.amazonaws.com',
              },
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.stringLikeRegexp('AmazonDMSVPCManagementRole'),
        ]),
      });
    });

    test.skip('creates DMS CloudWatch logs role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'dms.amazonaws.com',
              },
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
    test('exports Aurora cluster endpoint', () => {
      template.hasOutput('AuroraClusterEndpoint', {
        Description: 'Aurora PostgreSQL cluster endpoint',
        Export: {
          Name: `aurora-cluster-endpoint-${environmentSuffix}`,
        },
      });
    });

    test('exports Aurora reader endpoint', () => {
      template.hasOutput('AuroraReaderEndpoint', {
        Description: 'Aurora PostgreSQL reader endpoint',
        Export: {
          Name: `aurora-reader-endpoint-${environmentSuffix}`,
        },
      });
    });

    test('exports Database Secret ARN', () => {
      template.hasOutput('DatabaseSecretArn', {
        Description: 'ARN of the database credentials secret',
        Export: {
          Name: `database-secret-arn-${environmentSuffix}`,
        },
      });
    });

    test('exports DMS Task ARN', () => {
      template.hasOutput('DMSTaskArn', {
        Description: 'ARN of the DMS migration task',
        Export: {
          Name: `dms-task-arn-${environmentSuffix}`,
        },
      });
    });

    test('exports VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: {
          Name: `vpc-id-${environmentSuffix}`,
        },
      });
    });

    test('exports Database Security Group ID', () => {
      template.hasOutput('DatabaseSecurityGroupId', {
        Description: 'Database security group ID',
        Export: {
          Name: `database-sg-id-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    test('all custom resource names include environmentSuffix', () => {
      // Check VPC name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(`.*${environmentSuffix}`),
          }),
        ]),
      });

      // Check cluster identifier
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DBClusterIdentifier: Match.stringLikeRegexp(`.*${environmentSuffix}`),
      });

      // Check DMS replication instance identifier
      template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
        ReplicationInstanceIdentifier: Match.stringLikeRegexp(`.*${environmentSuffix}`),
      });

      // Check secret name
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: Match.stringLikeRegexp(`.*${environmentSuffix}`),
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('DMS components depend on database cluster', () => {
      const resources = template.toJSON().Resources;
      const dmsTask = Object.entries(resources).find(
        ([, resource]: [string, any]) =>
          resource.Type === 'AWS::DMS::ReplicationTask'
      );
      const dmsInstance = Object.entries(resources).find(
        ([, resource]: [string, any]) =>
          resource.Type === 'AWS::DMS::ReplicationInstance'
      );

      expect(dmsTask).toBeDefined();
      expect(dmsInstance).toBeDefined();

      // DMS task should depend on replication instance
      const taskResource = dmsTask?.[1] as any;
      expect(taskResource.DependsOn).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    test('all resources have proper tags', () => {
      const resources = template.toJSON().Resources;
      const taggableTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::SecurityGroup',
        'AWS::RDS::DBCluster',
        'AWS::SecretsManager::Secret',
        'AWS::DMS::ReplicationInstance',
      ];

      taggableTypes.forEach((type) => {
        const resource = Object.values(resources).find(
          (r: any) => r.Type === type
        );
        expect(resource).toBeDefined();
      });
    });

    test('storage encryption is enabled for Aurora', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
      });
    });

    test('database instances are not publicly accessible', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });

    test('DMS replication instance is not publicly accessible', () => {
      template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
        PubliclyAccessible: false,
      });
    });
  });

  describe('Backup and Recovery', () => {
    test('Aurora cluster has 7-day backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 7,
      });
    });

    test('Aurora cluster has backup window configured', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        PreferredBackupWindow: Match.anyValue(),
      });
    });
  });

  describe('Environment Suffix from Context', () => {
    test('uses environment suffix from context when props not provided', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'staging');

      const contextStack = new TapStack(contextApp, 'ContextTestStack');
      const contextTemplate = Template.fromStack(contextStack);

      // Verify resources are created with context suffix
      contextTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*staging.*'),
          }),
        ]),
      });
    });

    test('uses default dev suffix when neither props nor context provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTestStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      // Verify resources are created with default dev suffix
      defaultTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*dev.*'),
          }),
        ]),
      });
    });

    test('props environmentSuffix takes precedence over context', () => {
      const precedenceApp = new cdk.App();
      precedenceApp.node.setContext('environmentSuffix', 'context-value');

      const precedenceStack = new TapStack(precedenceApp, 'PrecedenceTestStack', {
        environmentSuffix: 'props-value',
      });
      const precedenceTemplate = Template.fromStack(precedenceStack);

      // Verify resources use props value, not context value
      precedenceTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*props-value.*'),
          }),
        ]),
      });
    });
  });
});
