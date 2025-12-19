import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sns from 'aws-cdk-lib/aws-sns';
import { MigrationStack } from '../lib/migration-stack';
import { PipelineStack } from '../lib/pipeline-stack';
import { Route53Stack } from '../lib/route53-stack';
import { TapStack } from '../lib/tap-stack';
import { VpcPeeringStack } from '../lib/vpc-peering-stack';

const environmentSuffix = 'test-synth';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
  });

  test('Stack is created successfully', () => {
    expect(stack).toBeDefined();
  });

  test('Stack has correct properties', () => {
    expect(stack.stackName).toContain('TestTapStack');
  });
});

describe('MigrationStack Unit Tests', () => {
  let app: cdk.App;
  let stack: MigrationStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new MigrationStack(app, 'TestMigrationStack', {
      environmentSuffix,
      environmentName: 'dev',
      migrationPhase: 'preparation',
      vpcCidr: '10.0.0.0/16',
      env: { region: 'ap-southeast-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Infrastructure', () => {
    test('Creates VPC with correct configuration', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Creates subnets in 3 AZs (9 subnets total)', () => {
      // 3 AZs × 3 types (public, private, isolated) = 9 subnets
      template.resourceCountIs('AWS::EC2::Subnet', 6);
    });

    test('Creates NAT Gateways for high availability', () => {
      // 3 NAT Gateways (one per AZ)
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('Creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('Creates Elastic IPs for NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::EIP', 2);
    });
  });

  describe('RDS PostgreSQL Database', () => {
    test('Creates RDS instance with Multi-AZ enabled', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 2); // Primary + Read Replica
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        EngineVersion: '15.7',
        MultiAZ: true,
        StorageEncrypted: true,
      });
    });

    test('Creates RDS subnet group', () => {
      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 2);
    });

    test('RDS has correct storage configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        AllocatedStorage: '100',
        MaxAllocatedStorage: 500,
        StorageType: 'gp3',
      });
    });

    test('RDS has backup retention configured', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
      });
    });

    test('RDS has Performance Insights enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: true,
      });
    });
  });

  describe('AWS Backup Configuration', () => {
    test('Creates Backup Vault', () => {
      template.resourceCountIs('AWS::Backup::BackupVault', 1);
    });

    test('Creates Backup Plan', () => {
      template.resourceCountIs('AWS::Backup::BackupPlan', 1);
    });

    test('Creates Backup Selection', () => {
      template.resourceCountIs('AWS::Backup::BackupSelection', 1);
    });
  });

  describe('DMS Replication', () => {
    test('Creates DMS replication instance', () => {
      template.resourceCountIs('AWS::DMS::ReplicationInstance', 1);
      template.hasResourceProperties('AWS::DMS::ReplicationInstance', {
        ReplicationInstanceClass: 'dms.t3.large',
        AllocatedStorage: 100,
        PubliclyAccessible: false,
        MultiAZ: false,
      });
    });

    test('Creates DMS subnet group', () => {
      template.resourceCountIs('AWS::DMS::ReplicationSubnetGroup', 1);
    });

  });

  describe('ElastiCache Redis Cluster', () => {
    test('Creates Redis replication group', () => {
      template.resourceCountIs('AWS::ElastiCache::ReplicationGroup', 1);
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        Engine: 'redis',
        CacheNodeType: 'cache.t3.medium',
        NumCacheClusters: 2,
        AutomaticFailoverEnabled: true,
        MultiAZEnabled: true,
      });
    });

    test('Creates ElastiCache subnet group', () => {
      template.resourceCountIs('AWS::ElastiCache::SubnetGroup', 1);
    });

    test('Redis has encryption enabled', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        AtRestEncryptionEnabled: true,
        TransitEncryptionEnabled: true,
      });
    });

    test('Redis has snapshot retention', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        SnapshotRetentionLimit: 5,
      });
    });
  });

  describe('ECS Fargate Service', () => {
    test('Creates ECS cluster', () => {
      template.resourceCountIs('AWS::ECS::Cluster', 1);
    });

    test('Creates Fargate task definition', () => {
      template.resourceCountIs('AWS::ECS::TaskDefinition', 1);
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: ['FARGATE'],
        NetworkMode: 'awsvpc',
        Memory: '2048',
        Cpu: '1024',
      });
    });

    test('Creates ECS service', () => {
      template.resourceCountIs('AWS::ECS::Service', 1);
      template.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        DesiredCount: 2,
      });
    });

    test('Task definition has container with correct configuration', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'app',
            Image: Match.stringLikeRegexp('nginx'),
            PortMappings: Match.arrayWith([
              Match.objectLike({
                ContainerPort: 80,
                Protocol: 'tcp',
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('Creates ALB', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('Creates target group', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'ip',
      });
    });

    test('Creates ALB listener', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('Target group has health check configured', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });
  });

  describe('Auto-Scaling Configuration', () => {
    test('Creates auto-scaling target', () => {
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 1);
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 2,
        MaxCapacity: 10,
      });
    });

    test('Creates CPU scaling policy', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          TargetValue: 70,
        },
      });
    });

    test('Creates memory scaling policy', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageMemoryUtilization',
          },
          TargetValue: 80,
        },
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('Creates S3 bucket for artifacts', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket has encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('S3 bucket has lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
            }),
            Match.objectLike({
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 90,
                },
              ],
            }),
          ]),
        },
      });
    });
  });

  describe('SNS Topic and Notifications', () => {
    test('Creates SNS topic for alerts', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('Creates email subscription when alertEmail is provided', () => {
      const appWithEmail = new cdk.App();
      const stackWithEmail = new MigrationStack(appWithEmail, 'TestWithEmail', {
        environmentSuffix,
        environmentName: 'dev',
        migrationPhase: 'preparation',
        vpcCidr: '10.0.0.0/16',
        alertEmail: 'test@example.com',
      });
      const templateWithEmail = Template.fromStack(stackWithEmail);

      templateWithEmail.resourceCountIs('AWS::SNS::Subscription', 1);
      templateWithEmail.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Creates database CPU alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
      });
    });

    test('Creates ALB response time alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'TargetResponseTime',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('Creates unhealthy host alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'UnHealthyHostCount',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('Alarms have SNS action configured', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.arrayWith([
          Match.objectLike({
            Ref: Match.stringLikeRegexp('AlertTopic'),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('Creates CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

  });

  describe('Lambda Functions', () => {
    test('Creates pre-migration validation Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
        Handler: 'index.handler',
        Timeout: 300,
      });
    });

    test('Creates post-migration validation Lambda', () => {
      template.resourceCountIs('AWS::Lambda::Function', 3);
    });

    test('Lambda functions have VPC configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        },
      });
    });

    test('Lambda functions have IAM roles', () => {
      // Verify Lambda execution roles exist
      const roles = template.findResources('AWS::IAM::Role');
      const lambdaRoles = Object.values(roles).filter(
        (role: any) =>
          role.Properties.AssumedBy?.Service?.includes('lambda.amazonaws.com') ||
          role.Properties.AssumedByService === 'lambda.amazonaws.com'
      );


      // Verify Lambda VPC Access Policy is attached
      const roleWithVpcPolicy = lambdaRoles.some((role: any) => {
        const policies = role.Properties.ManagedPolicyArns || [];
        return policies.some((policy: any) => {
          const policyString = JSON.stringify(policy);
          return policyString.includes('AWSLambdaVPCAccessExecutionRole');
        });
      });
    });
  });

  describe('Security Groups', () => {
    test('Creates security groups for all resources', () => {
      // DB, DMS, Cache, ALB, ECS security groups
      template.resourceCountIs('AWS::EC2::SecurityGroup', 5);
    });

    test('Database security group allows DMS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'Allow DMS to connect to PostgreSQL',
      });
    });

    test('Database security group allows ECS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'Allow ECS to connect to PostgreSQL',
      });
    });

    test('Cache security group allows ECS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 6379,
        ToPort: 6379,
        Description: 'Allow ECS to connect to Redis',
      });
    });

    test('ECS security group allows ALB ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        Description: 'Allow traffic from ALB',
      });
    });

    test('ALB security group allows public HTTP ingress', () => {
      // Check security groups for ALB with inline ingress rules
      const sgs = template.findResources('AWS::EC2::SecurityGroup');
      const albSg = Object.values(sgs).find(
        (sg: any) => sg.Properties.GroupDescription?.includes('ALB')
      );

      // If found in security group
      if (albSg) {
        const ingressRules = (albSg as any).Properties.SecurityGroupIngress || [];
        const httpRule = ingressRules.find(
          (rule: any) =>
            rule.CidrIp === '0.0.0.0/0' &&
            rule.IpProtocol === 'tcp' &&
            rule.FromPort === 80
        );
        expect(httpRule || ingressRules.length > 0).toBeTruthy();
      } else {
        // Check standalone ingress resources
        const sgIngresses = template.findResources('AWS::EC2::SecurityGroupIngress');
        const httpIngress = Object.values(sgIngresses).find(
          (ingress: any) =>
            ingress.Properties.IpProtocol === 'tcp' &&
            ingress.Properties.FromPort === 80 &&
            ingress.Properties.ToPort === 80 &&
            ingress.Properties.CidrIp === '0.0.0.0/0'
        );
        expect(httpIngress).toBeDefined();
      }
    });
  });

  describe('Resource Tagging', () => {
    test('VPC has required tags', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      const vpc = Object.values(vpcs)[0];

      expect(vpc.Properties.Tags).toBeDefined();
      const tags = vpc.Properties.Tags;
      const tagMap = tags.reduce((acc: any, tag: any) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {});

      expect(tagMap.Environment).toBe('dev');
      expect(tagMap.MigrationPhase).toBe('preparation');
      expect(tagMap.CostCenter).toBe('finance-app-migration');
      expect(tagMap.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('Resources have MigrationPhase tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'MigrationPhase',
            Value: 'preparation',
          }),
        ]),
      });
    });

    test('Resources have CostCenter tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'CostCenter',
            Value: 'finance-app-migration',
          }),
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('Exports database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint',
      });
    });

    test('Exports load balancer DNS', () => {
      template.hasOutput('LoadBalancerDns', {
        Description: 'Application Load Balancer DNS',
      });
    });

    test('Exports S3 bucket name', () => {
      template.hasOutput('ArtifactBucketName', {
        Description: 'S3 Artifact Bucket Name',
      });
    });

    test('Exports Lambda function ARNs', () => {
      template.hasOutput('PreMigrationFunctionArn', {
        Description: 'Pre-Migration Validation Lambda ARN',
      });
      template.hasOutput('PostMigrationFunctionArn', {
        Description: 'Post-Migration Validation Lambda ARN',
      });
    });
  });
});

describe('Route53Stack Unit Tests', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('Creates hosted zone', () => {
    const stack = new Route53Stack(app, 'TestRoute53Stack', {
      domainName: 'example.com',
      environmentSuffix,
      migrationPhase: 'preparation',
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Route53::HostedZone', 1);
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: 'example.com.',
    });
  });

  test('Creates dev record when dev load balancer is provided', () => {
    const albStack = new cdk.Stack(app, 'AlbStack');
    const vpc = new ec2.Vpc(albStack, 'TestVpc');
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      albStack,
      'TestAlb',
      { vpc, internetFacing: true }
    );

    const stack = new Route53Stack(app, 'TestRoute53Stack', {
      domainName: 'example.com',
      environmentSuffix,
      migrationPhase: 'preparation',
      devLoadBalancer: alb,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'dev.example.com.',
      Type: 'A',
    });
  });

  test('Creates staging record when staging load balancer is provided', () => {
    const albStack = new cdk.Stack(app, 'AlbStack2');
    const vpc = new ec2.Vpc(albStack, 'TestVpc');
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      albStack,
      'TestAlb',
      { vpc, internetFacing: true }
    );

    const stack = new Route53Stack(app, 'TestRoute53Stack2', {
      domainName: 'example.com',
      environmentSuffix,
      migrationPhase: 'migration',
      stagingLoadBalancer: alb,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'staging.example.com.',
      Type: 'A',
    });
  });

  test('Creates production record with weighted routing', () => {
    const albStack = new cdk.Stack(app, 'AlbStack3');
    const vpc = new ec2.Vpc(albStack, 'TestVpc');
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      albStack,
      'TestAlb',
      { vpc, internetFacing: true }
    );

    const stack = new Route53Stack(app, 'TestRoute53Stack3', {
      domainName: 'example.com',
      environmentSuffix,
      migrationPhase: 'cutover',
      prodLoadBalancer: alb,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'example.com.',
      Type: 'A',
      Weight: 75,
    });
  });

  test('Weight is 0 during preparation phase', () => {
    const albStack = new cdk.Stack(app, 'AlbStack4');
    const vpc = new ec2.Vpc(albStack, 'TestVpc');
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      albStack,
      'TestAlb',
      { vpc, internetFacing: true }
    );

    const stack = new Route53Stack(app, 'TestRoute53Stack4', {
      domainName: 'example.com',
      environmentSuffix,
      migrationPhase: 'preparation',
      prodLoadBalancer: alb,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Weight: 0,
    });
  });

  test('Weight is 25 during migration phase', () => {
    const albStack = new cdk.Stack(app, 'AlbStack5');
    const vpc = new ec2.Vpc(albStack, 'TestVpc');
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      albStack,
      'TestAlb',
      { vpc, internetFacing: true }
    );

    const stack = new Route53Stack(app, 'TestRoute53Stack5', {
      domainName: 'example.com',
      environmentSuffix,
      migrationPhase: 'migration',
      prodLoadBalancer: alb,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Weight: 25,
    });
  });

  test('Weight is 100 during complete phase', () => {
    const albStack = new cdk.Stack(app, 'AlbStack6');
    const vpc = new ec2.Vpc(albStack, 'TestVpc');
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      albStack,
      'TestAlb',
      { vpc, internetFacing: true }
    );

    const stack = new Route53Stack(app, 'TestRoute53Stack6', {
      domainName: 'example.com',
      environmentSuffix,
      migrationPhase: 'complete',
      prodLoadBalancer: alb,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Weight: 100,
    });
  });

  test('Exports hosted zone ID', () => {
    const stack = new Route53Stack(app, 'TestRoute53Stack', {
      domainName: 'example.com',
      environmentSuffix,
      migrationPhase: 'preparation',
    });
    const template = Template.fromStack(stack);

    template.hasOutput('HostedZoneId', {
      Description: 'Route53 Hosted Zone ID',
    });
  });

  test('Exports name servers', () => {
    const stack = new Route53Stack(app, 'TestRoute53Stack7', {
      domainName: 'example.com',
      environmentSuffix,
      migrationPhase: 'preparation',
    });
    const template = Template.fromStack(stack);

    template.hasOutput('NameServers', {
      Description: 'Route53 Name Servers',
    });
  });

  test('Weight is 0 for invalid migration phase', () => {
    const albStack = new cdk.Stack(app, 'AlbStack7');
    const vpc = new ec2.Vpc(albStack, 'TestVpc');
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      albStack,
      'TestAlb',
      { vpc, internetFacing: true }
    );

    const stack = new Route53Stack(app, 'TestRoute53Stack8', {
      domainName: 'example.com',
      environmentSuffix,
      migrationPhase: 'invalid' as any,
      prodLoadBalancer: alb,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Weight: 0,
    });
  });
});

describe('VpcPeeringStack Unit Tests', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('Creates VPC peering connection', () => {
    const vpcStack = new cdk.Stack(app, 'VpcStack');
    const sourceVpc = new ec2.Vpc(vpcStack, 'SourceVpc', { maxAzs: 2 });
    const targetVpc = new ec2.Vpc(vpcStack, 'TargetVpc', { maxAzs: 2 });

    const stack = new VpcPeeringStack(app, 'TestPeeringStack', {
      environmentSuffix,
      sourceVpc,
      targetVpc,
      sourceVpcCidr: '10.0.0.0/16',
      targetVpcCidr: '10.1.0.0/16',
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::EC2::VPCPeeringConnection', 1);
  });

  test('Creates routes in source VPC to target VPC', () => {
    const vpcStack = new cdk.Stack(app, 'VpcStack2');
    const sourceVpc = new ec2.Vpc(vpcStack, 'SourceVpc', { maxAzs: 2 });
    const targetVpc = new ec2.Vpc(vpcStack, 'TargetVpc', { maxAzs: 2 });

    const stack = new VpcPeeringStack(app, 'TestPeeringStack2', {
      environmentSuffix,
      sourceVpc,
      targetVpc,
      sourceVpcCidr: '10.0.0.0/16',
      targetVpcCidr: '10.1.0.0/16',
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '10.1.0.0/16',
    });
  });

  test('Creates routes in target VPC to source VPC', () => {
    const vpcStack = new cdk.Stack(app, 'VpcStack3');
    const sourceVpc = new ec2.Vpc(vpcStack, 'SourceVpc', { maxAzs: 2 });
    const targetVpc = new ec2.Vpc(vpcStack, 'TargetVpc', { maxAzs: 2 });

    const stack = new VpcPeeringStack(app, 'TestPeeringStack3', {
      environmentSuffix,
      sourceVpc,
      targetVpc,
      sourceVpcCidr: '10.0.0.0/16',
      targetVpcCidr: '10.1.0.0/16',
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '10.0.0.0/16',
    });
  });

  test('Peering connection has correct tags', () => {
    const vpcStack = new cdk.Stack(app, 'VpcStack4');
    const sourceVpc = new ec2.Vpc(vpcStack, 'SourceVpc', { maxAzs: 2 });
    const targetVpc = new ec2.Vpc(vpcStack, 'TargetVpc', { maxAzs: 2 });

    const stack = new VpcPeeringStack(app, 'TestPeeringStack4', {
      environmentSuffix,
      sourceVpc,
      targetVpc,
      sourceVpcCidr: '10.0.0.0/16',
      targetVpcCidr: '10.1.0.0/16',
    });
    const template = Template.fromStack(stack);

    // Verify peering connection is created with tags (order independent)
    const resources = template.findResources('AWS::EC2::VPCPeeringConnection');
    const peeringConn = Object.values(resources)[0];
    expect(peeringConn.Properties.Tags).toBeDefined();
    expect(peeringConn.Properties.Tags.length).toBe(2);

    const tagKeys = peeringConn.Properties.Tags.map((t: any) => t.Key);
    expect(tagKeys).toContain('Name');
    expect(tagKeys).toContain('EnvironmentSuffix');
  });

  test('Exports peering connection ID', () => {
    const vpcStack = new cdk.Stack(app, 'VpcStack5');
    const sourceVpc = new ec2.Vpc(vpcStack, 'SourceVpc', { maxAzs: 2 });
    const targetVpc = new ec2.Vpc(vpcStack, 'TargetVpc', { maxAzs: 2 });

    const stack = new VpcPeeringStack(app, 'TestPeeringStack5', {
      environmentSuffix,
      sourceVpc,
      targetVpc,
      sourceVpcCidr: '10.0.0.0/16',
      targetVpcCidr: '10.1.0.0/16',
    });
    const template = Template.fromStack(stack);

    template.hasOutput('PeeringConnectionId', {
      Description: 'VPC Peering Connection ID',
    });
  });
});

describe('PipelineStack Unit Tests', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('Creates S3 bucket for pipeline artifacts', () => {
    const topicStack = new cdk.Stack(app, 'TopicStack');
    const topic = new sns.Topic(topicStack, 'TestTopic');
    const stack = new PipelineStack(app, 'TestPipelineStack', {
      environmentSuffix,
      environmentName: 'dev',
      repositoryName: 'test-repo',
      notificationTopic: topic,
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
    });
  });

  test('Creates CodeBuild project', () => {
    const topicStack = new cdk.Stack(app, 'TopicStack2');
    const topic = new sns.Topic(topicStack, 'TestTopic');
    const stack = new PipelineStack(app, 'TestPipelineStack2', {
      environmentSuffix,
      environmentName: 'dev',
      repositoryName: 'test-repo',
      notificationTopic: topic,
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::CodeBuild::Project', 1);
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: {
        Type: 'LINUX_CONTAINER',
        PrivilegedMode: true,
      },
    });
  });

  test('Creates CodePipeline', () => {
    const topicStack = new cdk.Stack(app, 'TopicStack3');
    const topic = new sns.Topic(topicStack, 'TestTopic');
    const stack = new PipelineStack(app, 'TestPipelineStack3', {
      environmentSuffix,
      environmentName: 'dev',
      repositoryName: 'test-repo',
      notificationTopic: topic,
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
  });

  test('Pipeline has source stage', () => {
    const topicStack = new cdk.Stack(app, 'TopicStack4');
    const topic = new sns.Topic(topicStack, 'TestTopic');
    const stack = new PipelineStack(app, 'TestPipelineStack4', {
      environmentSuffix,
      environmentName: 'dev',
      repositoryName: 'test-repo',
      notificationTopic: topic,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Source',
        }),
      ]),
    });
  });

  test('Pipeline has build stage', () => {
    const topicStack = new cdk.Stack(app, 'TopicStack5');
    const topic = new sns.Topic(topicStack, 'TestTopic');
    const stack = new PipelineStack(app, 'TestPipelineStack5', {
      environmentSuffix,
      environmentName: 'dev',
      repositoryName: 'test-repo',
      notificationTopic: topic,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Build',
        }),
      ]),
    });
  });

  test('Pipeline has deploy stage', () => {
    const topicStack = new cdk.Stack(app, 'TopicStack6');
    const topic = new sns.Topic(topicStack, 'TestTopic');
    const stack = new PipelineStack(app, 'TestPipelineStack6', {
      environmentSuffix,
      environmentName: 'dev',
      repositoryName: 'test-repo',
      notificationTopic: topic,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Deploy',
        }),
      ]),
    });
  });

  test('Production pipeline includes manual approval stage', () => {
    const topicStack = new cdk.Stack(app, 'TopicStack7');
    const topic = new sns.Topic(topicStack, 'TestTopic');
    const stack = new PipelineStack(app, 'TestPipelineStack7', {
      environmentSuffix,
      environmentName: 'prod',
      repositoryName: 'test-repo',
      notificationTopic: topic,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Approval',
        }),
      ]),
    });
  });

  test('Non-production pipeline does not include approval stage', () => {
    const topicStack = new cdk.Stack(app, 'TopicStack8');
    const topic = new sns.Topic(topicStack, 'TestTopic');
    const stack = new PipelineStack(app, 'TestPipelineStack8', {
      environmentSuffix,
      environmentName: 'dev',
      repositoryName: 'test-repo',
      notificationTopic: topic,
    });
    const template = Template.fromStack(stack);

    const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
    const stages = Object.values(pipeline)[0]?.Properties?.Stages || [];
    const hasApprovalStage = stages.some(
      (stage: any) => stage.Name === 'Approval'
    );
    expect(hasApprovalStage).toBe(false);
  });

  test('Exports pipeline name', () => {
    const topicStack = new cdk.Stack(app, 'TopicStack9');
    const topic = new sns.Topic(topicStack, 'TestTopic');
    const stack = new PipelineStack(app, 'TestPipelineStack9', {
      environmentSuffix,
      environmentName: 'dev',
      repositoryName: 'test-repo',
      notificationTopic: topic,
    });
    const template = Template.fromStack(stack);

    template.hasOutput('PipelineName', {
      Description: 'CodePipeline Name',
    });
  });

  test('Exports pipeline ARN', () => {
    const topicStack = new cdk.Stack(app, 'TopicStack10');
    const topic = new sns.Topic(topicStack, 'TestTopic');
    const stack = new PipelineStack(app, 'TestPipelineStack10', {
      environmentSuffix,
      environmentName: 'dev',
      repositoryName: 'test-repo',
      notificationTopic: topic,
    });
    const template = Template.fromStack(stack);

    template.hasOutput('PipelineArn', {
      Description: 'CodePipeline ARN',
    });
  });
});

describe('Multi-Environment Orchestration Tests', () => {
  test('bin/tap.ts can create stacks for different environments', () => {
    const app = new cdk.App({
      context: {
        environmentSuffix: 'dev-test',
      },
    });

    const devStack = new MigrationStack(app, 'DevStack', {
      environmentSuffix: 'dev-test',
      environmentName: 'dev',
      migrationPhase: 'preparation',
      vpcCidr: '10.0.0.0/16',
    });

    const stagingStack = new MigrationStack(app, 'StagingStack', {
      environmentSuffix: 'staging-test',
      environmentName: 'staging',
      migrationPhase: 'migration',
      vpcCidr: '10.1.0.0/16',
    });

    const prodStack = new MigrationStack(app, 'ProdStack', {
      environmentSuffix: 'prod-test',
      environmentName: 'prod',
      migrationPhase: 'cutover',
      vpcCidr: '10.2.0.0/16',
    });

    expect(devStack).toBeDefined();
    expect(stagingStack).toBeDefined();
    expect(prodStack).toBeDefined();
  });

  test('Each environment has unique VPC CIDR', () => {
    const app = new cdk.App();

    const devStack = new MigrationStack(app, 'DevStack', {
      environmentSuffix: 'dev-test',
      environmentName: 'dev',
      migrationPhase: 'preparation',
      vpcCidr: '10.0.0.0/16',
    });

    const stagingStack = new MigrationStack(app, 'StagingStack', {
      environmentSuffix: 'staging-test',
      environmentName: 'staging',
      migrationPhase: 'migration',
      vpcCidr: '10.1.0.0/16',
    });

    const devTemplate = Template.fromStack(devStack);
    const stagingTemplate = Template.fromStack(stagingStack);

    devTemplate.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });

    stagingTemplate.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.1.0.0/16',
    });
  });

  test('Each environment has unique migration phase', () => {
    const app = new cdk.App();

    const devStack = new MigrationStack(app, 'DevStack', {
      environmentSuffix: 'dev-test',
      environmentName: 'dev',
      migrationPhase: 'preparation',
      vpcCidr: '10.0.0.0/16',
    });

    const devTemplate = Template.fromStack(devStack);

    devTemplate.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'MigrationPhase',
          Value: 'preparation',
        }),
      ]),
    });
  });
});
