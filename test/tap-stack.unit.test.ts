import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack - Multi-Region Trading Platform', () => {
  describe('Primary Region Stack (ap-northeast-2)', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestPrimaryStack', {
        environmentSuffix: 'test',
        env: {
          region: 'ap-northeast-2',
          account: '123456789012',
        },
      });
      template = Template.fromStack(stack);
    });

    test('should create VPC with correct CIDR for primary region', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should create VPC with 3 availability zones', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 AZs * 3 subnet types
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create NAT Gateways for private subnet egress', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3); // One per AZ
    });

    test('should create Elastic IPs for NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::EIP', 3);
    });

    test('should create Transit Gateway with correct ASN for primary region', () => {
      template.hasResourceProperties('AWS::EC2::TransitGateway', {
        AmazonSideAsn: 64512,
      });
    });

    test('should create Transit Gateway VPC attachment', () => {
      template.hasResourceProperties('AWS::EC2::TransitGatewayAttachment', {
        TransitGatewayId: Match.objectLike({
          Ref: Match.stringLikeRegexp('TransitGateway'),
        }),
        VpcId: Match.objectLike({
          Ref: Match.stringLikeRegexp('VPC'),
        }),
      });
    });

    test('should create routes to secondary region CIDR via Transit Gateway', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '172.16.0.0/16',
        TransitGatewayId: Match.objectLike({
          Ref: Match.stringLikeRegexp('TransitGateway'),
        }),
      });
    });

    test('should create ECS cluster with container insights', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });

    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create ALB listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('should create Trading Engine service', () => {
      template.hasResourceProperties('AWS::ECS::Service', Match.objectLike({
        LaunchType: 'FARGATE',
      }));
    });

    test('should create ECS task definitions for microservices', () => {
      template.resourceCountIs('AWS::ECS::TaskDefinition', 2); // Trading + Order Management
    });

    test('should create target groups for services', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);
    });

    test('should create Aurora Global Database cluster', () => {
      template.hasResourceProperties('AWS::RDS::GlobalCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '15.4',
        StorageEncrypted: true,
      });
    });

    test('should create Aurora primary cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '15.4',
        StorageEncrypted: true,
      });
    });

    test('should create Secrets Manager secret for database credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: Match.objectLike({
          GenerateStringKey: 'password',
        }),
      });
    });

    test('should create Global Accelerator', () => {
      template.hasResourceProperties('AWS::GlobalAccelerator::Accelerator', {
        Enabled: true,
      });
    });

    test('should create Global Accelerator listener', () => {
      template.hasResourceProperties('AWS::GlobalAccelerator::Listener', {
        PortRanges: [
          {
            FromPort: 80,
            ToPort: 80,
          },
        ],
      });
    });

    test('should create Global Accelerator endpoint group', () => {
      template.hasResourceProperties('AWS::GlobalAccelerator::EndpointGroup', {
        TrafficDialPercentage: 100,
      });
    });

    test('should create outputs for Global Accelerator IPs', () => {
      const outputs = Object.keys(template.toJSON().Outputs || {});
      const gaIpOutputs = outputs.filter(o => o.includes('GlobalAcceleratorIpAddress'));
      expect(gaIpOutputs.length).toBeGreaterThanOrEqual(2);
    });

    test('should create CloudWatch log groups for ECS services', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 2); // Trading + Order Management
    });

    test('should create security groups for ECS services', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', Match.objectLike({
        GroupDescription: Match.stringLikeRegexp('Security group'),
      }));
    });

    test('should create IAM role for ECS task execution', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'ecs-tasks.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('should apply Name tags to VPC resources', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('VPC'),
          },
        ]),
      });
    });

    test('should apply Name tag to VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('VPC'),
          },
        ]),
      });
    });

    test('should create stack outputs for VPC', () => {
      const outputs = Object.keys(template.toJSON().Outputs || {});
      const vpcOutputs = outputs.filter(o => o.includes('Vpc'));
      expect(vpcOutputs.length).toBeGreaterThanOrEqual(1);
    });

    test('should create stack outputs for Transit Gateway', () => {
      const outputs = Object.keys(template.toJSON().Outputs || {});
      const tgwOutputs = outputs.filter(o => o.includes('TransitGateway'));
      expect(tgwOutputs.length).toBeGreaterThanOrEqual(1);
    });

    test('should create stack outputs for ALB', () => {
      const outputs = Object.keys(template.toJSON().Outputs || {});
      const albOutputs = outputs.filter(o => o.includes('ALB'));
      expect(albOutputs.length).toBeGreaterThanOrEqual(1);
    });

    test('should create stack outputs for ECS services', () => {
      const outputs = Object.keys(template.toJSON().Outputs || {});
      const serviceOutputs = outputs.filter(o => o.includes('Service'));
      expect(serviceOutputs.length).toBeGreaterThanOrEqual(1);
    });

    test('should create stack outputs for Aurora database', () => {
      const outputs = Object.keys(template.toJSON().Outputs || {});
      const dbOutputs = outputs.filter(o => o.includes('Cluster') || o.includes('DB'));
      expect(dbOutputs.length).toBeGreaterThanOrEqual(1);
    });

    test('should not create Transit Gateway peering without context flag', () => {
      template.resourcePropertiesCountIs(
        'AWS::EC2::TransitGatewayPeeringAttachment',
        {},
        0
      );
    });
  });

  describe('Secondary Region Stack (ap-southeast-2)', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestSecondaryStack', {
        environmentSuffix: 'test',
        env: {
          region: 'ap-southeast-2',
          account: '123456789012',
        },
      });
      template = Template.fromStack(stack);
    });

    test('should create VPC with correct CIDR for secondary region', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '172.16.0.0/16',
      });
    });

    test('should create Transit Gateway with correct ASN for secondary region', () => {
      template.hasResourceProperties('AWS::EC2::TransitGateway', {
        AmazonSideAsn: 64513,
      });
    });

    test('should create routes to primary region CIDR via Transit Gateway', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '10.0.0.0/16',
        TransitGatewayId: Match.objectLike({
          Ref: Match.stringLikeRegexp('TransitGateway'),
        }),
      });
    });

    test('should create ECS cluster in secondary region', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });

    test('should create Application Load Balancer in secondary region', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should NOT create Aurora Global Database in secondary region', () => {
      template.resourceCountIs('AWS::RDS::GlobalCluster', 0);
    });

    test('should NOT create Global Accelerator in secondary region', () => {
      template.resourceCountIs('AWS::GlobalAccelerator::Accelerator', 0);
    });

    test('should create ECS services in secondary region', () => {
      template.resourceCountIs('AWS::ECS::Service', 2); // Trading + Order Management
    });

    test('should apply Name tag in secondary region', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('VPC'),
          },
        ]),
      });
    });
  });

  describe('Transit Gateway Peering (with context)', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App({
        context: {
          enableTgwPeering: 'true',
        },
      });
      stack = new TapStack(app, 'TestPeeringStack', {
        environmentSuffix: 'test',
        env: {
          region: 'ap-northeast-2',
          account: '123456789012',
        },
      });
      template = Template.fromStack(stack);
    });

    test('should create Transit Gateway peering when enabled', () => {
      template.hasResourceProperties('AWS::EC2::TransitGatewayPeeringAttachment', {
        PeerRegion: 'ap-southeast-2',
      });
    });

    test('TGW peering should reference both Transit Gateways', () => {
      template.hasResourceProperties('AWS::EC2::TransitGatewayPeeringAttachment', {
        TransitGatewayId: Match.objectLike({
          Ref: Match.stringLikeRegexp('TransitGateway'),
        }),
      });
    });
  });

  describe('Stack Configuration', () => {
    test('should use default environment suffix if not provided', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestDefaultStack', {
        env: { region: 'ap-northeast-2' },
      });
      const template = Template.fromStack(stack);

      // Verify VPC is created with Name tag
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('VPC'),
          },
        ]),
      });
    });

    test('should accept custom environment suffix from props', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestCustomStack', {
        environmentSuffix: 'prod',
        env: { region: 'ap-northeast-2' },
      });
      const template = Template.fromStack(stack);

      // Verify VPC is created with environment suffix in name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('prod'),
          },
        ]),
      });
    });

    test('should prioritize props over context for environment suffix', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const stack = new TapStack(app, 'TestPriorityStack', {
        environmentSuffix: 'production',
        env: { region: 'ap-northeast-2' },
      });
      const template = Template.fromStack(stack);

      // Props should take priority - verify 'production' appears in VPC name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('production'),
          },
        ]),
      });
    });
  });

  describe('Networking Stack Configuration', () => {
    test('should create private subnets with NAT Gateway routes', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestNetworkStack', {
        environmentSuffix: 'test',
        env: { region: 'ap-northeast-2' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: Match.objectLike({
          Ref: Match.stringLikeRegexp('NATGateway'),
        }),
      });
    });

    test('should create public, private and isolated subnets', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestIsolatedStack', {
        environmentSuffix: 'test',
        env: { region: 'ap-northeast-2' },
      });
      const template = Template.fromStack(stack);

      // Should have at least 6 subnets (3 AZs * 2 types minimum)
      const resources = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(resources).length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('ECS Service Configuration', () => {
    test('should configure ECS services with Fargate launch type', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestECSStack', {
        environmentSuffix: 'test',
        env: { region: 'ap-northeast-2' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        NetworkConfiguration: Match.objectLike({
          AwsvpcConfiguration: Match.objectLike({
            AssignPublicIp: 'DISABLED',
          }),
        }),
      });
    });

    test('should configure ECS tasks with appropriate resources', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTaskStack', {
        environmentSuffix: 'test',
        env: { region: 'ap-northeast-2' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '256',
        Memory: '512',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });
  });

  describe('Aurora Database Configuration', () => {
    test('should configure Aurora cluster with Serverless v2', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestAuroraStack', {
        environmentSuffix: 'test',
        env: { region: 'ap-northeast-2' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0.5,
          MaxCapacity: 1,
        },
      });
    });

    test('should set Aurora cluster removal policy to DESTROY', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestRemovalStack', {
        environmentSuffix: 'test',
        env: { region: 'ap-northeast-2' },
      });
      const template = Template.fromStack(stack);

      template.hasResource('AWS::RDS::DBCluster', {
        DeletionPolicy: 'Delete',
      });
    });

    test('should create complete set of database outputs', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestDatabaseOutputs', {
        environmentSuffix: 'test',
        env: { region: 'ap-northeast-2' },
      });
      const template = Template.fromStack(stack);

      // Verify all outputs are created
      const outputs = Object.keys(template.toJSON().Outputs || {});
      expect(outputs.length).toBeGreaterThan(0);

      // Check for database-related outputs
      const dbOutputs = outputs.filter(o =>
        o.includes('Cluster') || o.includes('DB') || o.includes('Secret')
      );
      expect(dbOutputs.length).toBeGreaterThan(5);
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should create ALB with health check configuration', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestALBStack', {
        environmentSuffix: 'test',
        env: { region: 'ap-northeast-2' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckIntervalSeconds: 30,
        HealthCheckPath: '/',
      });
    });

    test('should create listener rules for service routing', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestRoutingStack', {
        environmentSuffix: 'test',
        env: { region: 'ap-northeast-2' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        Priority: Match.anyValue(),
        Conditions: Match.arrayWith([
          Match.objectLike({
            Field: 'path-pattern',
          }),
        ]),
      });
    });
  });
});
