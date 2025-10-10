import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { NetworkingStack } from '../lib/stacks/networking-stack';
import { RegionalStack } from '../lib/stacks/regional-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { GlobalStack } from '../lib/stacks/global-stack';
import { TgwPeeringStack } from '../lib/stacks/tgw-peering-stack';

describe('Individual Stack Tests', () => {
  describe('NetworkingStack', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    let networkingStack: NetworkingStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'ap-northeast-2', account: '123456789012' },
      });
      networkingStack = new NetworkingStack(stack, 'TestNetworking', {
        cidr: '10.0.0.0/16',
        isMainRegion: true,
        environmentSuffix: 'test',
        remoteCidr: '172.16.0.0/16',
      });
      template = Template.fromStack(stack);
    });

    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should create Transit Gateway with correct ASN', () => {
      template.hasResourceProperties('AWS::EC2::TransitGateway', {
        AmazonSideAsn: 64512,
      });
    });

    test('should create routes to remote CIDR', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '172.16.0.0/16',
      });
    });

    test('should export Transit Gateway properties', () => {
      expect(networkingStack.transitGateway).toBeDefined();
      expect(networkingStack.vpc).toBeDefined();
      expect(networkingStack.transitGatewayAttachment).toBeDefined();
    });
  });

  describe('NetworkingStack - Secondary Region', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'ap-southeast-2', account: '123456789012' },
      });
      new NetworkingStack(stack, 'TestNetworking', {
        cidr: '172.16.0.0/16',
        isMainRegion: false,
        environmentSuffix: 'test',
        remoteCidr: '10.0.0.0/16',
      });
      template = Template.fromStack(stack);
    });

    test('should create Transit Gateway with different ASN', () => {
      template.hasResourceProperties('AWS::EC2::TransitGateway', {
        AmazonSideAsn: 64513,
      });
    });

    test('should create routes to primary CIDR', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '10.0.0.0/16',
      });
    });
  });

  describe('NetworkingStack - Without Remote CIDR', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'ap-northeast-2', account: '123456789012' },
      });
      new NetworkingStack(stack, 'TestNetworking', {
        cidr: '10.0.0.0/16',
        isMainRegion: true,
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should not create cross-region routes when remoteCidr is not provided', () => {
      const routes = template.findResources('AWS::EC2::Route');
      const crossRegionRoutes = Object.values(routes).filter((r: any) =>
        r.Properties?.DestinationCidrBlock === '172.16.0.0/16'
      );
      expect(crossRegionRoutes.length).toBe(0);
    });
  });

  describe('RegionalStack', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let regionalStack: RegionalStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'ap-northeast-2', account: '123456789012' },
      });
      vpc = new ec2.Vpc(stack, 'TestVPC');
      regionalStack = new RegionalStack(stack, 'TestRegional', {
        vpc: vpc,
        isMainRegion: true,
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create ECS cluster', () => {
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

    test('should create two ECS services', () => {
      template.resourceCountIs('AWS::ECS::Service', 2);
    });

    test('should export regional properties', () => {
      expect(regionalStack.loadBalancer).toBeDefined();
      expect(regionalStack.ecsCluster).toBeDefined();
      expect(regionalStack.tradingService).toBeDefined();
      expect(regionalStack.orderManagementService).toBeDefined();
    });
  });

  describe('DatabaseStack', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let databaseStack: DatabaseStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'ap-northeast-2', account: '123456789012' },
      });
      vpc = new ec2.Vpc(stack, 'TestVPC', {
        maxAzs: 3,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: 'Private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          {
            cidrMask: 24,
            name: 'Isolated',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        ],
      });
      databaseStack = new DatabaseStack(stack, 'TestDatabase', {
        primaryVpc: vpc,
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create Aurora Global Cluster', () => {
      template.hasResourceProperties('AWS::RDS::GlobalCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '15.4',
        StorageEncrypted: true,
      });
    });

    test('should create Aurora DB Cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        StorageEncrypted: true,
      });
    });

    test('should create Secrets Manager secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: Match.objectLike({
          GenerateStringKey: 'password',
        }),
      });
    });

    test('should export database properties', () => {
      expect(databaseStack.globalCluster).toBeDefined();
      expect(databaseStack.primaryCluster).toBeDefined();
    });

    test('should have globalClusterIdentifier defined', () => {
      // This test ensures the globalClusterIdentifier property exists
      expect(databaseStack.globalCluster.globalClusterIdentifier).toBeDefined();
    });
  });

  describe('GlobalStack', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let alb: elbv2.ApplicationLoadBalancer;
    let globalStack: GlobalStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'ap-northeast-2', account: '123456789012' },
      });
      vpc = new ec2.Vpc(stack, 'TestVPC');
      alb = new elbv2.ApplicationLoadBalancer(stack, 'TestALB', {
        vpc: vpc,
        internetFacing: true,
      });
      globalStack = new GlobalStack(stack, 'TestGlobal', {
        primaryAlb: alb,
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
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

    test('should export accelerator', () => {
      expect(globalStack.accelerator).toBeDefined();
    });

    test('should have ipv4Addresses property', () => {
      // This test ensures the ipv4Addresses property can be accessed
      expect(globalStack.accelerator.ipv4Addresses).toBeDefined();
    });
  });

  describe('TgwPeeringStack', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'ap-northeast-2', account: '123456789012' },
      });
      new TgwPeeringStack(stack, 'TestPeering', {
        primaryTgwId: 'tgw-primary123',
        primaryRegion: 'ap-northeast-2',
        secondaryTgwId: 'tgw-secondary456',
        secondaryRegion: 'ap-southeast-2',
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create Transit Gateway Peering Attachment', () => {
      template.hasResourceProperties('AWS::EC2::TransitGatewayPeeringAttachment', {
        PeerRegion: 'ap-southeast-2',
        TransitGatewayId: 'tgw-primary123',
        PeerTransitGatewayId: 'tgw-secondary456',
      });
    });

    test('should have appropriate tags', () => {
      template.hasResourceProperties('AWS::EC2::TransitGatewayPeeringAttachment', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('TradingPlatform-TGW-Peering'),
          },
        ]),
      });
    });
  });

  describe('TgwPeeringStack - Secondary Region', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'ap-southeast-2', account: '123456789012' },
      });
      new TgwPeeringStack(stack, 'TestPeering', {
        primaryTgwId: 'tgw-primary123',
        primaryRegion: 'ap-northeast-2',
        secondaryTgwId: 'tgw-secondary456',
        secondaryRegion: 'ap-southeast-2',
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should not create peering in secondary region', () => {
      template.resourceCountIs('AWS::EC2::TransitGatewayPeeringAttachment', 0);
    });
  });
});
