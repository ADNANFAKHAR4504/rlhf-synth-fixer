import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let template: Template;

  describe('with default environment suffix', () => {
    beforeEach(() => {
      app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'dev',
      });
      template = Template.fromStack(stack);
    });

    describe('VPC Configuration', () => {
      test('creates VPC with correct CIDR block', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: '10.0.0.0/16',
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'Name', Value: 'dev-vpc' }),
          ]),
        });
      });

      test('creates exactly one VPC', () => {
        template.resourceCountIs('AWS::EC2::VPC', 1);
      });
    });

    describe('Internet Gateway Configuration', () => {
      test('creates Internet Gateway with proper tags', () => {
        template.hasResourceProperties('AWS::EC2::InternetGateway', {
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'Name', Value: 'dev-igw' }),
          ]),
        });
      });

      test('attaches Internet Gateway to VPC', () => {
        template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
          InternetGatewayId: { Ref: Match.stringLikeRegexp('devigw') },
          VpcId: { Ref: Match.stringLikeRegexp('devvpc') },
        });
      });

      test('creates exactly one Internet Gateway and attachment', () => {
        template.resourceCountIs('AWS::EC2::InternetGateway', 1);
        template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
      });
    });

    describe('Subnet Configuration', () => {
      test('creates public subnet with correct CIDR and configuration', () => {
        template.hasResourceProperties('AWS::EC2::Subnet', {
          CidrBlock: '10.0.1.0/24',
          MapPublicIpOnLaunch: true,
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'Name', Value: 'dev-public-subnet' }),
          ]),
        });
      });

      test('creates private subnet with correct CIDR and configuration', () => {
        template.hasResourceProperties('AWS::EC2::Subnet', {
          CidrBlock: '10.0.2.0/24',
          MapPublicIpOnLaunch: false,
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'Name', Value: 'dev-private-subnet' }),
          ]),
        });
      });

      test('creates exactly two subnets', () => {
        template.resourceCountIs('AWS::EC2::Subnet', 2);
      });
    });

    describe('Route Table Configuration', () => {
      test('creates public route table with proper tags', () => {
        template.hasResourceProperties('AWS::EC2::RouteTable', {
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'Name', Value: 'dev-public-rt' }),
          ]),
        });
      });

      test('creates private route table with proper tags', () => {
        template.hasResourceProperties('AWS::EC2::RouteTable', {
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'Name', Value: 'dev-private-rt' }),
          ]),
        });
      });

      test('creates exactly two route tables', () => {
        template.resourceCountIs('AWS::EC2::RouteTable', 2);
      });

      test('associates public subnet with public route table', () => {
        template.hasResourceProperties(
          'AWS::EC2::SubnetRouteTableAssociation',
          {
            SubnetId: { Ref: Match.stringLikeRegexp('devpublicsubnet') },
            RouteTableId: { Ref: Match.stringLikeRegexp('devpublicrt') },
          }
        );
      });

      test('associates private subnet with private route table', () => {
        template.hasResourceProperties(
          'AWS::EC2::SubnetRouteTableAssociation',
          {
            SubnetId: { Ref: Match.stringLikeRegexp('devprivatesubnet') },
            RouteTableId: { Ref: Match.stringLikeRegexp('devprivatert') },
          }
        );
      });

      test('creates exactly two subnet route table associations', () => {
        template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 2);
      });
    });

    describe('Routing Configuration', () => {
      test('creates default route to Internet Gateway for public subnet', () => {
        template.hasResourceProperties('AWS::EC2::Route', {
          DestinationCidrBlock: '0.0.0.0/0',
          GatewayId: { Ref: Match.stringLikeRegexp('devigw') },
          RouteTableId: { Ref: Match.stringLikeRegexp('devpublicrt') },
        });
      });

      test('creates exactly one route (no routes for private subnet)', () => {
        template.resourceCountIs('AWS::EC2::Route', 1);
      });
    });

    describe('CloudFormation Outputs', () => {
      test('exports VPC ID', () => {
        template.hasOutput('VpcId', {
          Description: 'VPC ID',
          Export: { Name: 'dev-vpc-id' },
        });
      });

      test('exports Public Subnet ID', () => {
        template.hasOutput('PublicSubnetId', {
          Description: 'Public Subnet ID',
          Export: { Name: 'dev-public-subnet-id' },
        });
      });

      test('exports Private Subnet ID', () => {
        template.hasOutput('PrivateSubnetId', {
          Description: 'Private Subnet ID',
          Export: { Name: 'dev-private-subnet-id' },
        });
      });

      test('exports Public Subnet CIDR', () => {
        template.hasOutput('PublicSubnetCidr', {
          Description: 'Public Subnet CIDR Block',
          Value: '10.0.1.0/24',
          Export: { Name: 'dev-public-subnet-cidr' },
        });
      });

      test('exports Private Subnet CIDR', () => {
        template.hasOutput('PrivateSubnetCidr', {
          Description: 'Private Subnet CIDR Block',
          Value: '10.0.2.0/24',
          Export: { Name: 'dev-private-subnet-cidr' },
        });
      });

      test('exports Internet Gateway ID', () => {
        template.hasOutput('InternetGatewayId', {
          Description: 'Internet Gateway ID',
          Export: { Name: 'dev-igw-id' },
        });
      });
    });
  });

  describe('with custom environment suffix', () => {
    beforeEach(() => {
      app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'prod',
      });
      template = Template.fromStack(stack);
    });

    test('uses custom environment suffix in resource names and tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'prod-vpc' }),
        ]),
      });

      template.hasResourceProperties('AWS::EC2::InternetGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'prod-igw' }),
        ]),
      });
    });

    test('uses custom environment suffix in exports', () => {
      template.hasOutput('VpcId', {
        Export: { Name: 'prod-vpc-id' },
      });

      template.hasOutput('PublicSubnetId', {
        Export: { Name: 'prod-public-subnet-id' },
      });
    });
  });

  describe('with context-based environment suffix', () => {
    test('uses context environment suffix when props not provided', () => {
      const app = new cdk.App({ context: { environmentSuffix: 'staging' } });
      const stack = new TapStack(app, 'TestStack', {});
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'staging-vpc' }),
        ]),
      });
    });

    test('falls back to dev when no environment suffix provided anywhere', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {});
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'dev-vpc' }),
        ]),
      });

      template.hasOutput('VpcId', {
        Export: { Name: 'dev-vpc-id' },
      });
    });
  });

  describe('Security and Best Practices', () => {
    beforeEach(() => {
      app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('private subnet does not auto-assign public IPs', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: false,
      });
    });

    test('public subnet auto-assigns public IPs', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true,
      });
    });

    test('VPC has DNS resolution enabled', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('all resources have proper tagging', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'test-vpc' }),
        ]),
      });

      template.hasResourceProperties('AWS::EC2::InternetGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'test-igw' }),
        ]),
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('test-.*-subnet'),
          }),
        ]),
      });

      template.hasResourceProperties('AWS::EC2::RouteTable', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('test-.*-rt'),
          }),
        ]),
      });
    });

    test('private subnet has no internet routes', () => {
      template.resourceCountIs('AWS::EC2::Route', 1);

      template.hasResourceProperties('AWS::EC2::Route', {
        RouteTableId: { Ref: Match.stringLikeRegexp('testpublicrt') },
      });
    });
  });

  describe('Resource Relationships', () => {
    beforeEach(() => {
      app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'dev',
      });
      template = Template.fromStack(stack);
    });

    test('subnets reference the correct VPC', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        VpcId: { Ref: Match.stringLikeRegexp('devvpc') },
      });
    });

    test('route tables reference the correct VPC', () => {
      template.hasResourceProperties('AWS::EC2::RouteTable', {
        VpcId: { Ref: Match.stringLikeRegexp('devvpc') },
      });
    });

    test('IGW attachment references correct VPC and IGW', () => {
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        VpcId: { Ref: Match.stringLikeRegexp('devvpc') },
        InternetGatewayId: { Ref: Match.stringLikeRegexp('devigw') },
      });
    });

    test('public route references correct route table and IGW', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        RouteTableId: { Ref: Match.stringLikeRegexp('devpublicrt') },
        GatewayId: { Ref: Match.stringLikeRegexp('devigw') },
      });
    });
  });

  describe('LocalStack Configuration', () => {
    test('applies RemovalPolicy.DESTROY when AWS_ENDPOINT_URL includes localhost', () => {
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
      const testApp = new cdk.App();
      const stack = new TapStack(testApp, 'LocalStackTestStack', {
        environmentSuffix: 'local',
      });

      const stackTemplate = Template.fromStack(stack);

      // Verify VPC is created with DeletionPolicy: Delete
      stackTemplate.hasResource('AWS::EC2::VPC', {
        DeletionPolicy: 'Delete',
      });

      delete process.env.AWS_ENDPOINT_URL;
    });

    test('applies RemovalPolicy.DESTROY when AWS_ENDPOINT_URL includes 4566', () => {
      process.env.AWS_ENDPOINT_URL = 'http://localstack:4566';
      const testApp = new cdk.App();
      const stack = new TapStack(testApp, 'LocalStackTestStack2', {
        environmentSuffix: 'local',
      });

      const stackTemplate = Template.fromStack(stack);

      // Verify VPC is created with DeletionPolicy: Delete
      stackTemplate.hasResource('AWS::EC2::VPC', {
        DeletionPolicy: 'Delete',
      });

      delete process.env.AWS_ENDPOINT_URL;
    });
  });
});
