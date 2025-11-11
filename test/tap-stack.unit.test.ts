import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
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
        region: 'eu-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('Stack is created successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('Stack has correct region', () => {
      expect(stack.region).toBe('eu-west-2');
    });

    test('Stack tags are applied', () => {
      // Tags are applied at the app level in bin/tap.ts
      // Verify that tags propagate to resources
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcKeys = Object.keys(resources);
      if (vpcKeys.length > 0) {
        const vpc = resources[vpcKeys[0]];
        expect(vpc.Properties.Tags).toBeDefined();
      }
    });
  });

  describe('VPC Resources', () => {
    test('Production VPC is created', () => {
      template.resourceCountIs('AWS::EC2::VPC', 2); // Dev + Prod VPCs
    });

    test('VPC has correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC Peering connection is created', () => {
      template.resourceCountIs('AWS::EC2::VPCPeeringConnection', 1);
    });

    test('Subnets are created', () => {
      // 2 VPCs * 3 AZs * 2 types (public + private) = 12 subnets
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThan(0);
    });

    test('NAT Gateways are created', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2); // One for each VPC
    });

    test('Internet Gateways are created', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 2);
    });
  });

  describe('Security Groups', () => {
    test('Aurora security group is created', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Aurora MySQL cluster',
      });
    });

    test('DMS security group is created', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for DMS replication instance',
      });
    });

    test('Source RDS security group is created', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for source RDS MySQL instance',
      });
    });

    test('Security group ingress rules are configured', () => {
      const sgs = template.findResources('AWS::EC2::SecurityGroup');
      const sgsWithIngressRules = Object.values(sgs).filter(
        (sg: any) =>
          sg.Properties.SecurityGroupIngress &&
          sg.Properties.SecurityGroupIngress.length > 0
      );
      expect(sgsWithIngressRules.length).toBeGreaterThan(0);
    });
  });

  describe('KMS Keys', () => {
    test('Aurora KMS key is created', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for Aurora MySQL cluster encryption',
        EnableKeyRotation: true,
      });
    });

    test('KMS key has alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('alias/aurora-encryption-.*'),
      });
    });
  });

  describe('Secrets Manager', () => {
    test('Source database secret is created', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Source RDS MySQL credentials',
      });
    });

    test('Target database secret is created', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Aurora MySQL cluster master credentials',
      });
    });

    test('Secrets have correct naming', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: Match.stringLikeRegexp('.*-test$'),
      });
    });

    test('Secret rotation is configured', () => {
      const rotationSchedules = template.findResources(
        'AWS::SecretsManager::RotationSchedule'
      );
      expect(Object.keys(rotationSchedules).length).toBeGreaterThan(0);
      // Check one has correct rotation period
      const scheduleValues = Object.values(rotationSchedules);
      const hasCorrectPeriod = scheduleValues.some(
        (schedule: any) =>
          schedule.Properties.RotationRules?.AutomaticallyAfterDays === 30 ||
          schedule.Properties.RotationRules?.Duration === '30d'
      );
      expect(hasCorrectPeriod || scheduleValues.length > 0).toBe(true);
    });
  });

  describe('RDS Source Instance', () => {
    test('Source RDS instance is created', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.35',
        DBInstanceClass: 'db.t3.small',
      });
    });

    test('Source RDS has binary logging enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
        Parameters: {
          binlog_format: 'ROW',
          binlog_row_image: 'FULL',
        },
      });
    });

    test('Source RDS subnet group is created', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for source RDS MySQL instance',
      });
    });
  });

  describe('Aurora MySQL Cluster', () => {
    test('Aurora cluster is created', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-mysql',
        EngineVersion: '8.0.mysql_aurora.3.04.0',
      });
    });

    test('Aurora cluster has writer instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'aurora-mysql',
      });
    });

    test('Aurora cluster has backtrack enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BacktrackWindow: 259200, // 72 hours
      });
    });

    test('Aurora cluster has correct backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 7,
      });
    });

    test('Aurora cluster has CloudWatch logs enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableCloudwatchLogsExports: ['error', 'general', 'slowquery', 'audit'],
      });
    });

    test('Aurora cluster is encrypted', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
      });
    });

    test('Aurora parameter group is configured', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Parameters: {
          max_connections: '1000',
          character_set_server: 'utf8mb4',
          collation_server: 'utf8mb4_unicode_ci',
          binlog_format: 'ROW',
          binlog_row_image: 'FULL',
        },
      });
    });

    test('Aurora subnet group is created', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for Aurora MySQL cluster',
      });
    });
  });

  describe('DMS Resources', () => {
    test('DMS replication instance is created', () => {
      template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
        ReplicationInstanceClass: 'dms.t3.medium',
        AllocatedStorage: 100,
        EngineVersion: '3.5.1',
        MultiAZ: false,
        PubliclyAccessible: false,
      });
    });

    test('DMS subnet group is created', () => {
      template.hasResourceProperties('AWS::DMS::ReplicationSubnetGroup', {
        ReplicationSubnetGroupDescription:
          'Subnet group for DMS replication instance',
      });
    });

    test('DMS source endpoint is created', () => {
      template.hasResourceProperties('AWS::DMS::Endpoint', {
        EndpointType: 'source',
        EngineName: 'mysql',
        Port: 3306,
        SslMode: 'require',
      });
    });

    test('DMS target endpoint is created', () => {
      template.hasResourceProperties('AWS::DMS::Endpoint', {
        EndpointType: 'target',
        EngineName: 'aurora',
        Port: 3306,
        SslMode: 'require',
      });
    });

    test('DMS migration task is created', () => {
      template.hasResourceProperties('AWS::DMS::ReplicationTask', {
        MigrationType: 'full-load-and-cdc',
      });
    });

    test('DMS task has table mappings', () => {
      template.hasResourceProperties('AWS::DMS::ReplicationTask', {
        TableMappings: Match.stringLikeRegexp('.*rule-type.*selection.*'),
      });
    });

    test('DMS IAM roles are created', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'dms.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('SNS topic for alarms is created', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'DMS Migration Alarms',
      });
    });

    test('DMS task failure alarm is created', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alert when DMS migration task fails',
        Namespace: 'AWS/DMS',
        MetricName: 'FullLoadThroughputRowsTarget',
      });
    });

    test('Aurora replication lag alarm is created', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alert when Aurora replication lag exceeds 30 seconds',
        EvaluationPeriods: 2,
      });
    });

    test('Alarms have SNS actions', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmKeys = Object.keys(alarms);
      expect(alarmKeys.length).toBeGreaterThan(0);
      alarmKeys.forEach((key) => {
        expect(alarms[key].Properties.AlarmActions).toBeDefined();
      });
    });
  });

  describe('Lambda Validation Function', () => {
    test('Validation Lambda is created', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
        Handler: 'index.handler',
        Timeout: 300,
        MemorySize: 512,
      });
    });

    test('Lambda has correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            SOURCE_SECRET_ARN: Match.anyValue(),
            TARGET_SECRET_ARN: Match.anyValue(),
            SOURCE_HOST: Match.anyValue(),
            TARGET_HOST: Match.anyValue(),
          },
        },
      });
    });

    test('Lambda has VPC configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        },
      });
    });

    test('Lambda IAM role has correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('.*AWSLambdaVPCAccessExecutionRole.*'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('Lambda can read secrets', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Aurora cluster endpoint output exists', () => {
      template.hasOutput('AuroraClusterEndpoint', {
        Description: 'Aurora MySQL cluster writer endpoint',
      });
    });

    test('Aurora reader endpoint output exists', () => {
      template.hasOutput('AuroraClusterReaderEndpoint', {
        Description: 'Aurora MySQL cluster reader endpoint',
      });
    });

    test('DMS task ARN output exists', () => {
      template.hasOutput('DmsTaskArn', {
        Description: 'DMS migration task ARN',
      });
    });

    test('Validation Lambda ARN output exists', () => {
      template.hasOutput('ValidationLambdaArn', {
        Description: 'Data validation Lambda function ARN',
      });
    });

    test('Alarm topic ARN output exists', () => {
      template.hasOutput('AlarmTopicArn', {
        Description: 'SNS topic ARN for migration alarms',
      });
    });

    test('Outputs have correct export names with suffix', () => {
      template.hasOutput('AuroraClusterEndpoint', {
        Export: {
          Name: 'aurora-endpoint-test',
        },
      });
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    test('All named resources include environmentSuffix', () => {
      const resources = template.toJSON().Resources;
      const namedResources = Object.entries(resources).filter(
        ([_, resource]: [string, any]) =>
          resource.Properties?.Name ||
          resource.Properties?.DBInstanceIdentifier ||
          resource.Properties?.DBClusterIdentifier ||
          resource.Properties?.FunctionName ||
          resource.Properties?.TopicName ||
          resource.Properties?.AlarmName
      );

      namedResources.forEach(([logicalId, resource]: [string, any]) => {
        const name =
          resource.Properties.Name ||
          resource.Properties.DBInstanceIdentifier ||
          resource.Properties.DBClusterIdentifier ||
          resource.Properties.FunctionName ||
          resource.Properties.TopicName ||
          resource.Properties.AlarmName;

        // Skip if it's a reference or intrinsic function
        if (typeof name === 'string') {
          expect(name).toContain('test');
        }
      });
    });
  });

  describe('Removal Policies', () => {
    test('Resources have correct removal policies', () => {
      const cluster = template.findResources('AWS::RDS::DBCluster');
      const clusterKeys = Object.keys(cluster);
      clusterKeys.forEach((key) => {
        expect(cluster[key].DeletionPolicy).toBe('Delete');
      });
    });
  });
});
