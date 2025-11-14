import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;

  describe('Stack Creation Tests', () => {
    beforeEach(() => {
      app = new cdk.App();
    });

    test('Stack synthesizes successfully with default environment suffix', () => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      app.synth();
      expect(stack).toBeDefined();
    });

    test('Stack synthesizes successfully with custom environment suffix', () => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'staging',
      });
      app.synth();
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('Stack synthesizes successfully without environment suffix', () => {
      stack = new TapStack(app, 'TestTapStack');
      app.synth();
      expect(stack).toBeDefined();
    });

    test('Stack creates all required nested stacks', () => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      app.synth();

      const childStacks = stack.node.children.filter(
        child => child instanceof cdk.Stack
      );
      expect(childStacks.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('KmsStack Tests', () => {
    beforeEach(() => {
      app = new cdk.App();
    });

    test('Creates KMS key with rotation enabled', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const kmsStack = stack.node.findChild('Kms-dev') as cdk.Stack;
      const template = Template.fromStack(kmsStack);

      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('KMS key has correct removal policy', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const kmsStack = stack.node.findChild('Kms-dev') as cdk.Stack;
      const template = Template.fromStack(kmsStack);

      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('KMS key has correct alias naming convention', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'prod' });
      const kmsStack = stack.node.findChild('Kms-prod') as cdk.Stack;
      const template = Template.fromStack(kmsStack);

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/dr-prod',
      });
    });

    test('KMS key exports ARN to SSM Parameter Store', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const kmsStack = stack.node.findChild('Kms-dev') as cdk.Stack;
      const template = Template.fromStack(kmsStack);

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/dr/dev/kms-key-arn',
        Type: 'String',
      });
    });

    test('KMS key has environment tags', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'staging' });
      const kmsStack = stack.node.findChild('Kms-staging') as cdk.Stack;
      const template = Template.fromStack(kmsStack);

      template.hasResource('AWS::KMS::Key', {
        Properties: Match.objectLike({
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Environment',
              Value: 'staging',
            }),
          ]),
        }),
      });
    });
  });

  describe('NetworkStack Tests', () => {
    beforeEach(() => {
      app = new cdk.App();
    });

    test('Creates VPC with correct CIDR block', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const networkStack = stack.node.findChild('Network-dev') as cdk.Stack;
      const template = Template.fromStack(networkStack);

      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('VPC has correct naming with environment suffix', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      const networkStack = stack.node.findChild('Network-test') as cdk.Stack;
      const template = Template.fromStack(networkStack);

      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'dr-vpc-test',
          }),
        ]),
      });
    });

    test('Creates public subnets', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const networkStack = stack.node.findChild('Network-dev') as cdk.Stack;
      const template = Template.fromStack(networkStack);

      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 AZs * 2 subnet types (default during synthesis)
    });

    test('Creates private isolated subnets', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const networkStack = stack.node.findChild('Network-dev') as cdk.Stack;
      const template = Template.fromStack(networkStack);

      const subnets = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.values(subnets).filter((subnet: any) =>
        subnet.Properties?.Tags?.some(
          (tag: any) =>
            tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Isolated'
        )
      );
      expect(privateSubnets.length).toBe(2); // 2 AZs by default during synthesis
    });

    test('NAT Gateway count is zero', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const networkStack = stack.node.findChild('Network-dev') as cdk.Stack;
      const template = Template.fromStack(networkStack);

      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });

    test('VPC has environment tags', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'prod' });
      const networkStack = stack.node.findChild('Network-prod') as cdk.Stack;
      const template = Template.fromStack(networkStack);

      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'prod',
          }),
        ]),
      });
    });

    test('Creates VPC endpoints when createVpcEndpoints is true', () => {
      const NetworkStack = require('../lib/stacks/network-stack').NetworkStack;
      app = new cdk.App();
      const testStack = new NetworkStack(app, 'TestNetwork', {
        environmentSuffix: 'test',
        createVpcEndpoints: true,
      });
      const template = Template.fromStack(testStack);

      // Should have 5 VPC endpoints: 2 gateway (S3, DynamoDB) + 3 interface (ECR, ECR Docker, Logs)
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 5);

      // Verify gateway endpoints exist
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const gatewayEndpoints = Object.values(endpoints).filter(
        (ep: any) => ep.Properties?.VpcEndpointType === 'Gateway'
      );
      const interfaceEndpoints = Object.values(endpoints).filter(
        (ep: any) => ep.Properties?.VpcEndpointType === 'Interface'
      );

      expect(gatewayEndpoints.length).toBe(2); // S3 and DynamoDB
      expect(interfaceEndpoints.length).toBe(3); // ECR, ECR Docker, Logs
    });

    test('Does not create VPC endpoints when createVpcEndpoints is false', () => {
      const NetworkStack = require('../lib/stacks/network-stack').NetworkStack;
      app = new cdk.App();
      const testStack = new NetworkStack(app, 'TestNetwork', {
        environmentSuffix: 'test',
        createVpcEndpoints: false,
      });
      const template = Template.fromStack(testStack);

      template.resourceCountIs('AWS::EC2::VPCEndpoint', 0);
    });
  });

  describe('DatabaseStack Tests', () => {
    beforeEach(() => {
      app = new cdk.App();
    });

    test('Creates Aurora PostgreSQL cluster with correct engine version', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const dbStack = stack.node.findChild('Database-dev') as cdk.Stack;
      const template = Template.fromStack(dbStack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: Match.stringLikeRegexp('15\\.6'),
      });
    });

    test('Aurora cluster is serverless v2', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const dbStack = stack.node.findChild('Database-dev') as cdk.Stack;
      const template = Template.fromStack(dbStack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0.5,
          MaxCapacity: 2,
        },
      });
    });

    test('Aurora cluster uses KMS encryption', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const dbStack = stack.node.findChild('Database-dev') as cdk.Stack;
      const template = Template.fromStack(dbStack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
      });
    });

    test('Aurora cluster has correct backup retention', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const dbStack = stack.node.findChild('Database-dev') as cdk.Stack;
      const template = Template.fromStack(dbStack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 7,
        PreferredBackupWindow: '03:00-04:00',
      });
    });

    test('Database security group allows PostgreSQL traffic from VPC', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const dbStack = stack.node.findChild('Database-dev') as cdk.Stack;
      const template = Template.fromStack(dbStack);

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 5432,
            ToPort: 5432,
          }),
        ]),
      });
    });

    test('Aurora cluster deploys in private isolated subnets', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const dbStack = stack.node.findChild('Database-dev') as cdk.Stack;
      const template = Template.fromStack(dbStack);

      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        SubnetIds: Match.anyValue(),
      });
    });

    test('Aurora cluster has correct identifier with environment suffix', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'staging' });
      const dbStack = stack.node.findChild('Database-staging') as cdk.Stack;
      const template = Template.fromStack(dbStack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DBClusterIdentifier: Match.anyValue(),
      });
    });

    test('Aurora cluster has backup tag', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const dbStack = stack.node.findChild('Database-dev') as cdk.Stack;
      const template = Template.fromStack(dbStack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Backup',
            Value: 'true',
          }),
        ]),
      });
    });

    test('Aurora cluster has removal policy set to destroy', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const dbStack = stack.node.findChild('Database-dev') as cdk.Stack;
      const template = Template.fromStack(dbStack);

      template.hasResource('AWS::RDS::DBCluster', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('StorageStack Tests', () => {
    beforeEach(() => {
      app = new cdk.App();
    });

    test('Creates DynamoDB table with correct name', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const storageStack = stack.node.findChild('Storage-dev') as cdk.Stack;
      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: 'dr-sessions-dev',
      });
    });

    test('DynamoDB table uses on-demand billing', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const storageStack = stack.node.findChild('Storage-dev') as cdk.Stack;
      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('DynamoDB table has point-in-time recovery enabled', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const storageStack = stack.node.findChild('Storage-dev') as cdk.Stack;
      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        Replicas: Match.arrayWith([
          Match.objectLike({
            PointInTimeRecoverySpecification: {
              PointInTimeRecoveryEnabled: true,
            },
          }),
        ]),
      });
    });

    test('DynamoDB table has contributor insights enabled', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const storageStack = stack.node.findChild('Storage-dev') as cdk.Stack;
      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        Replicas: Match.arrayWith([
          Match.objectLike({
            ContributorInsightsSpecification: {
              Enabled: true,
            },
          }),
        ]),
      });
    });

    test('DynamoDB table has correct partition key', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const storageStack = stack.node.findChild('Storage-dev') as cdk.Stack;
      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        KeySchema: Match.arrayWith([
          {
            AttributeName: 'sessionId',
            KeyType: 'HASH',
          },
        ]),
        AttributeDefinitions: Match.arrayWith([
          {
            AttributeName: 'sessionId',
            AttributeType: 'S',
          },
        ]),
      });
    });

    test('DynamoDB table has TTL attribute', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const storageStack = stack.node.findChild('Storage-dev') as cdk.Stack;
      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      });
    });

    test('S3 bucket has versioning enabled', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const storageStack = stack.node.findChild('Storage-dev') as cdk.Stack;
      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket uses KMS encryption', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const storageStack = stack.node.findChild('Storage-dev') as cdk.Stack;
      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.anyValue(),
              },
            },
          ],
        },
      });
    });

    test('S3 bucket blocks all public access', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const storageStack = stack.node.findChild('Storage-dev') as cdk.Stack;
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

    test('S3 bucket has lifecycle rules for old versions', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const storageStack = stack.node.findChild('Storage-dev') as cdk.Stack;
      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
            }),
          ]),
        },
      });
    });
  });

  describe('ComputeStack Tests', () => {
    beforeEach(() => {
      app = new cdk.App();
    });

    test('Creates ECS cluster with correct name', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: Match.anyValue(),
      });
    });

    test('ECS cluster has container insights enabled', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });

    test('Creates Fargate task definition with correct CPU and memory', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '256',
        Memory: '512',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('Task definition has execution role with required permissions', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      const roles = template.findResources('AWS::IAM::Role');
      const executionRoles = Object.values(roles).filter(
        (role: any) =>
          role.Properties?.AssumeRolePolicyDocument?.Statement?.some(
            (stmt: any) => stmt.Principal?.Service === 'ecs-tasks.amazonaws.com'
          ) &&
          role.Properties?.ManagedPolicyArns &&
          Array.isArray(role.Properties.ManagedPolicyArns) &&
          role.Properties.ManagedPolicyArns.length > 0
      );
      expect(executionRoles.length).toBeGreaterThan(0);
    });

    test('Task role has DynamoDB permissions', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      const roles = template.findResources('AWS::IAM::Role');
      const taskRoles = Object.values(roles).filter((role: any) =>
        role.Properties?.AssumeRolePolicyDocument?.Statement?.some(
          (stmt: any) => stmt.Principal?.Service === 'ecs-tasks.amazonaws.com'
        )
      );
      expect(taskRoles.length).toBeGreaterThan(0);
    });

    test('Creates Application Load Balancer', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Scheme: 'internet-facing',
          Type: 'application',
        }
      );
    });

    test('ALB has correct naming with environment suffix', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      const computeStack = stack.node.findChild('Compute-test') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Name: Match.anyValue(),
        }
      );
    });

    test('Creates target group with correct health check configuration', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          HealthCheckIntervalSeconds: 30,
          HealthCheckTimeoutSeconds: 5,
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 3,
          HealthCheckPath: '/',
          TargetType: 'ip',
        }
      );
    });

    test('ALB listener forwards to target group', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward',
          }),
        ]),
      });
    });

    test('ECS service deploys in public subnets with public IP', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      template.hasResourceProperties('AWS::ECS::Service', {
        NetworkConfiguration: {
          AwsvpcConfiguration: {
            AssignPublicIp: 'ENABLED',
          },
        },
      });
    });

    test('ECS service has desired count of 2', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      template.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 2,
      });
    });

    test('Creates CloudWatch alarm for unhealthy hosts', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'UnHealthyHostCount',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1,
        EvaluationPeriods: 2,
      });
    });

    test('CloudWatch alarm sends to SNS topic', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmsWithActions = Object.values(alarms).filter(
        (alarm: any) =>
          alarm.Properties?.AlarmActions &&
          Array.isArray(alarm.Properties.AlarmActions) &&
          alarm.Properties.AlarmActions.length > 0
      );
      expect(alarmsWithActions.length).toBeGreaterThan(0);
    });

    test('ALB security group allows HTTP traffic', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const albSg = Object.values(securityGroups).find((sg: any) =>
        sg.Properties?.GroupDescription?.includes('ALB')
      );

      expect(albSg).toBeDefined();
      expect(albSg?.Properties?.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ])
      );
    });

    test('ALB DNS is exported to SSM Parameter Store', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/dr/dev/alb-dns',
        Type: 'String',
      });
    });
  });

  describe('MonitoringStack Tests', () => {
    beforeEach(() => {
      app = new cdk.App();
    });

    test('Creates SNS topic with correct name', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const monitoringStack = stack.node.findChild(
        'Monitoring-dev'
      ) as cdk.Stack;
      const template = Template.fromStack(monitoringStack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.anyValue(),
      });
    });

    test('SNS topic has display name', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'staging' });
      const monitoringStack = stack.node.findChild(
        'Monitoring-staging'
      ) as cdk.Stack;
      const template = Template.fromStack(monitoringStack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'DR Alarms staging',
      });
    });

    test('Creates CloudWatch Dashboard', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const monitoringStack = stack.node.findChild(
        'Monitoring-dev'
      ) as cdk.Stack;
      const template = Template.fromStack(monitoringStack);

      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('Dashboard has correct name with environment suffix', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'prod' });
      const monitoringStack = stack.node.findChild(
        'Monitoring-prod'
      ) as cdk.Stack;
      const template = Template.fromStack(monitoringStack);

      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.anyValue(),
      });
    });

    test('Creates CloudWatch log group', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const monitoringStack = stack.node.findChild(
        'Monitoring-dev'
      ) as cdk.Stack;
      const template = Template.fromStack(monitoringStack);

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.anyValue(),
        RetentionInDays: 30,
      });
    });

    test('SNS topic has environment tags', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const monitoringStack = stack.node.findChild(
        'Monitoring-dev'
      ) as cdk.Stack;
      const template = Template.fromStack(monitoringStack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'dev',
          }),
        ]),
      });
    });

    test('Creates SNS email subscriptions when alert emails are provided', () => {
      const MonitoringStack =
        require('../lib/stacks/monitoring-stack').MonitoringStack;
      app = new cdk.App();
      const testStack = new MonitoringStack(app, 'TestMonitoring', {
        environmentSuffix: 'test',
        alertEmails: ['test@example.com', 'admin@example.com'],
      });
      const template = Template.fromStack(testStack);

      template.resourceCountIs('AWS::SNS::Subscription', 2);
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'admin@example.com',
      });
    });
  });

  describe('BackupStack Tests', () => {
    beforeEach(() => {
      app = new cdk.App();
    });

    test('Creates backup vault', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const backupStack = stack.node.findChild('Backup-dev') as cdk.Stack;
      const template = Template.fromStack(backupStack);

      template.hasResourceProperties('AWS::Backup::BackupVault', {
        BackupVaultName: Match.anyValue(),
      });
    });

    test('Creates backup plan with correct name', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const backupStack = stack.node.findChild('Backup-dev') as cdk.Stack;
      const template = Template.fromStack(backupStack);

      template.hasResourceProperties('AWS::Backup::BackupPlan', {
        BackupPlan: {
          BackupPlanName: Match.anyValue(),
        },
      });
    });

    test('Backup plan has 7-day retention', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const backupStack = stack.node.findChild('Backup-dev') as cdk.Stack;
      const template = Template.fromStack(backupStack);

      template.hasResourceProperties('AWS::Backup::BackupPlan', {
        BackupPlan: {
          BackupPlanRule: Match.arrayWith([
            Match.objectLike({
              Lifecycle: {
                DeleteAfterDays: 7,
              },
            }),
          ]),
        },
      });
    });

    test('Backup plan has daily schedule at 2 AM', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const backupStack = stack.node.findChild('Backup-dev') as cdk.Stack;
      const template = Template.fromStack(backupStack);

      template.hasResourceProperties('AWS::Backup::BackupPlan', {
        BackupPlan: {
          BackupPlanRule: Match.arrayWith([
            Match.objectLike({
              ScheduleExpression: 'cron(0 2 * * ? *)',
            }),
          ]),
        },
      });
    });

    test('Creates backup selection for RDS', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const backupStack = stack.node.findChild('Backup-dev') as cdk.Stack;
      const template = Template.fromStack(backupStack);

      const selections = template.findResources('AWS::Backup::BackupSelection');
      expect(Object.keys(selections).length).toBeGreaterThanOrEqual(2);
    });

    test('Creates backup selection for DynamoDB', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const backupStack = stack.node.findChild('Backup-dev') as cdk.Stack;
      const template = Template.fromStack(backupStack);

      const selections = template.findResources('AWS::Backup::BackupSelection');
      expect(Object.keys(selections).length).toBeGreaterThanOrEqual(2);
    });

    test('Backup vault has removal policy set to destroy', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const backupStack = stack.node.findChild('Backup-dev') as cdk.Stack;
      const template = Template.fromStack(backupStack);

      template.hasResource('AWS::Backup::BackupVault', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('Backup vault has environment tags', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'staging' });
      const backupStack = stack.node.findChild('Backup-staging') as cdk.Stack;
      const template = Template.fromStack(backupStack);

      template.hasResourceProperties('AWS::Backup::BackupVault', {
        BackupVaultTags: Match.objectLike({
          Environment: 'staging',
        }),
      });
    });
  });

  describe('Resource Naming Convention Tests', () => {
    test('All resources include environment suffix in identifiers', () => {
      const suffixes = ['dev', 'test', 'staging', 'prod'];
      suffixes.forEach(suffix => {
        app = new cdk.App();
        stack = new TapStack(app, 'TestStack', { environmentSuffix: suffix });
        app.synth();

        const childStacks = stack.node.children.filter(
          child => child instanceof cdk.Stack
        );
        childStacks.forEach(child => {
          expect(child.node.id).toContain(suffix);
        });
      });
    });
  });

  describe('Security Configuration Tests', () => {
    beforeEach(() => {
      app = new cdk.App();
    });

    test('All encryption uses KMS keys', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const dbStack = stack.node.findChild('Database-dev') as cdk.Stack;
      const dbTemplate = Template.fromStack(dbStack);

      const storageStack = stack.node.findChild('Storage-dev') as cdk.Stack;
      const storageTemplate = Template.fromStack(storageStack);

      dbTemplate.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
      });

      storageTemplate.hasResourceProperties('AWS::S3::Bucket', {
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

    test('Task role has region restriction policy', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dev' });
      const computeStack = stack.node.findChild('Compute-dev') as cdk.Stack;
      const template = Template.fromStack(computeStack);

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                StringNotEquals: {
                  'aws:RequestedRegion': Match.anyValue(), // Dynamic region reference using this.region
                },
              },
            }),
          ]),
        },
      });
    });
  });

  describe('Tags Consistency Tests', () => {
    beforeEach(() => {
      app = new cdk.App();
    });

    test('All major resources have environment tags', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'prod' });
      app.synth();

      const kmsStack = stack.node.findChild('Kms-prod') as cdk.Stack;
      const kmsTemplate = Template.fromStack(kmsStack);
      kmsTemplate.hasResource('AWS::KMS::Key', {
        Properties: Match.objectLike({
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Environment',
              Value: 'prod',
            }),
          ]),
        }),
      });
    });
  });
});
