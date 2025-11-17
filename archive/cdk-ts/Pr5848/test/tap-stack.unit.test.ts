import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'ap-northeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('should have correct environment suffix tag on VPCs', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      Object.values(vpcs).forEach((vpc: any) => {
        expect(vpc.Properties.Tags).toContainEqual(
          expect.objectContaining({
            Key: 'Environment',
            Value: environmentSuffix,
          })
        );
      });
    });

    test('should have required global tags on resources', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      Object.values(vpcs).forEach((vpc: any) => {
        const tags = vpc.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'iac-rlhf-amazon', Value: 'true' });
        expect(tags).toContainEqual({ Key: 'Environment', Value: environmentSuffix });
        expect(tags).toContainEqual({ Key: 'CostCenter', Value: 'FinTech-Trading' });
        expect(tags).toContainEqual({ Key: 'ManagedBy', Value: 'AWS-CDK' });
      });
    });
  });

  describe('S3 Flow Logs Bucket', () => {
    test('should create S3 bucket for VPC Flow Logs', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`tap-${environmentSuffix}-vpc-flow-logs-.*`),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have lifecycle rules for flow logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 7,
              Id: 'delete-old-flow-logs',
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('should have S3 managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            }),
          ]),
        },
      });
    });
  });

  describe('Transit Gateway', () => {
    test('should create Transit Gateway', () => {
      template.resourceCountIs('AWS::EC2::TransitGateway', 1);

      template.hasResourceProperties('AWS::EC2::TransitGateway', {
        DefaultRouteTableAssociation: 'disable',
        DefaultRouteTablePropagation: 'disable',
        DnsSupport: 'enable',
        VpnEcmpSupport: 'enable',
        MulticastSupport: 'disable',
      });
    });

    test('should have correct Transit Gateway tags', () => {
      template.hasResourceProperties('AWS::EC2::TransitGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `tap-${environmentSuffix}-tgw`,
          }),
          Match.objectLike({
            Key: 'Purpose',
            Value: 'Network-Hub',
          }),
        ]),
      });
    });
  });

  describe('VPCs', () => {
    test('should create 3 VPCs (dev, staging, prod)', () => {
      template.resourceCountIs('AWS::EC2::VPC', 3);
    });

    test('should create dev VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create staging VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create prod VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.2.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create 3 public subnets per VPC (9 total)', () => {
      const subnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      expect(Object.keys(subnets).length).toBe(9);
    });

    test('should create 3 private subnets per VPC (9 total)', () => {
      const subnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      expect(Object.keys(subnets).length).toBe(9);
    });

    test('should create Internet Gateways for all VPCs', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 3);
    });

    test('should attach Internet Gateways to VPCs', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 3);
    });

    test('should create route tables for subnets', () => {
      // 3 public + 3 private per VPC = 18 total
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(18);
    });
  });

  describe('Transit Gateway Attachments', () => {
    test('should create 3 Transit Gateway attachments', () => {
      template.resourceCountIs('AWS::EC2::TransitGatewayAttachment', 3);
    });

    test('should create Transit Gateway route tables', () => {
      // One per environment
      template.resourceCountIs('AWS::EC2::TransitGatewayRouteTable', 3);
    });

    test('should create Transit Gateway route table associations', () => {
      template.resourceCountIs(
        'AWS::EC2::TransitGatewayRouteTableAssociation',
        3
      );
    });

    test('should create Transit Gateway routes for allowed traffic', () => {
      // Dev->Staging, Staging->Dev, Staging->Prod, Prod->Staging = 4 routes
      template.resourceCountIs('AWS::EC2::TransitGatewayRoute', 4);
    });

    test('should create routes to Transit Gateway in private subnets', () => {
      const routes = template.findResources('AWS::EC2::Route', {
        Properties: {
          DestinationCidrBlock: '10.0.0.0/8',
        },
      });
      // 3 private subnets per VPC * 3 VPCs = 9 routes
      expect(Object.keys(routes).length).toBe(9);
    });
  });

  describe('NAT Instances', () => {
    test('should create 3 NAT instances (one per environment)', () => {
      template.resourceCountIs('AWS::EC2::Instance', 3);
    });

    test('should create NAT instances with correct instance type', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('should disable source/dest check on NAT instances', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SourceDestCheck: false,
      });
    });

    test('should enable IMDSv2 via Launch Template', () => {
      // IMDSv2 is configured via Launch Template
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          MetadataOptions: {
            HttpTokens: 'required',
          },
        }),
      });
    });

    test('should create IAM roles for NAT instances', () => {
      // One per environment = 3
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'ec2.amazonaws.com',
                },
              }),
            ]),
          }),
        },
      });
      expect(Object.keys(roles).length).toBe(3);
    });

    test('should create security groups for NAT instances', () => {
      const natSgs = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: Match.stringLikeRegexp(
            /Security group for NAT instance/
          ),
        },
      });
      expect(Object.keys(natSgs).length).toBe(3);
    });

    test('should allow traffic from private subnets to NAT instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '10.0.0.0/8',
            IpProtocol: '-1',
          }),
        ]),
      });
    });
  });

  describe('VPC Endpoints', () => {
    test('should create S3 gateway endpoints', () => {
      const s3Endpoints = template.findResources('AWS::EC2::VPCEndpoint', {
        Properties: {
          ServiceName: Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([Match.stringLikeRegexp(/\.s3$/)]),
            ]),
          }),
          VpcEndpointType: 'Gateway',
        },
      });
      expect(Object.keys(s3Endpoints).length).toBe(3);
    });

    test('should create DynamoDB gateway endpoints', () => {
      const dynamoEndpoints = template.findResources('AWS::EC2::VPCEndpoint', {
        Properties: {
          ServiceName: Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([Match.stringLikeRegexp(/\.dynamodb$/)]),
            ]),
          }),
          VpcEndpointType: 'Gateway',
        },
      });
      expect(Object.keys(dynamoEndpoints).length).toBe(3);
    });

    test('should create SSM interface endpoints', () => {
      const ssmEndpoints = template.findResources('AWS::EC2::VPCEndpoint', {
        Properties: {
          ServiceName: 'com.amazonaws.ap-northeast-1.ssm',
          VpcEndpointType: 'Interface',
          PrivateDnsEnabled: true,
        },
      });
      expect(Object.keys(ssmEndpoints).length).toBe(3);
    });

    test('should create SSM Messages interface endpoints', () => {
      const ssmMessagesEndpoints = template.findResources(
        'AWS::EC2::VPCEndpoint',
        {
          Properties: {
            ServiceName: 'com.amazonaws.ap-northeast-1.ssmmessages',
            VpcEndpointType: 'Interface',
          },
        }
      );
      expect(Object.keys(ssmMessagesEndpoints).length).toBe(3);
    });

    test('should create EC2 Messages interface endpoints', () => {
      const ec2MessagesEndpoints = template.findResources(
        'AWS::EC2::VPCEndpoint',
        {
          Properties: {
            ServiceName: 'com.amazonaws.ap-northeast-1.ec2messages',
            VpcEndpointType: 'Interface',
          },
        }
      );
      expect(Object.keys(ec2MessagesEndpoints).length).toBe(3);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create VPC Flow Logs for all VPCs', () => {
      template.resourceCountIs('AWS::EC2::FlowLog', 3);
    });

    test('should configure Flow Logs to log to S3', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        LogDestinationType: 's3',
        TrafficType: 'ALL',
      });
    });
  });

  describe('Route53 Private Hosted Zones', () => {
    test('should create 3 private hosted zones', () => {
      template.resourceCountIs('AWS::Route53::HostedZone', 3);
    });

    test('should create hosted zones with correct naming', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: `dev.tap-${environmentSuffix}.internal.`,
      });

      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: `staging.tap-${environmentSuffix}.internal.`,
      });

      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: `prod.tap-${environmentSuffix}.internal.`,
      });
    });

    test('should associate hosted zones with VPCs', () => {
      // Each zone is associated with its own VPC initially
      // Plus cross-zone associations
      const hostedZones = template.findResources('AWS::Route53::HostedZone');
      Object.values(hostedZones).forEach((zone: any) => {
        expect(zone.Properties.VPCs).toBeDefined();
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should create SSM parameters for VPC IDs', () => {
      const vpcIdParams = template.findResources('AWS::SSM::Parameter', {
        Properties: {
          Name: Match.stringLikeRegexp(/\/tap\/.*\/vpc\/id$/),
        },
      });
      expect(Object.keys(vpcIdParams).length).toBe(3);
    });

    test('should create SSM parameters for private subnet IDs', () => {
      const privateSubnetParams = template.findResources(
        'AWS::SSM::Parameter',
        {
          Properties: {
            Name: Match.stringLikeRegexp(/\/subnet\/private\/\d+\/id$/),
          },
        }
      );
      // 3 private subnets per environment * 3 environments = 9
      expect(Object.keys(privateSubnetParams).length).toBe(9);
    });

    test('should create SSM parameters for public subnet IDs', () => {
      const publicSubnetParams = template.findResources('AWS::SSM::Parameter', {
        Properties: {
          Name: Match.stringLikeRegexp(/\/subnet\/public\/\d+\/id$/),
        },
      });
      // 3 public subnets per environment * 3 environments = 9
      expect(Object.keys(publicSubnetParams).length).toBe(9);
    });

    test('should create SSM parameters for Route53 zone IDs', () => {
      const zoneIdParams = template.findResources('AWS::SSM::Parameter', {
        Properties: {
          Name: Match.stringLikeRegexp(/\/route53\/zone-id$/),
        },
      });
      expect(Object.keys(zoneIdParams).length).toBe(3);
    });
  });

  describe('Stack Outputs', () => {
    test('should export Transit Gateway ID', () => {
      template.hasOutput('TransitGatewayId', {
        Description: 'Transit Gateway ID',
      });
    });

    test('should export VPC IDs for all environments', () => {
      template.hasOutput('VpcIddev', {
        Description: 'VPC ID for dev environment',
      });

      template.hasOutput('VpcIdstaging', {
        Description: 'VPC ID for staging environment',
      });

      template.hasOutput('VpcIdprod', {
        Description: 'VPC ID for prod environment',
      });
    });

    test('should export Transit Gateway attachment IDs', () => {
      template.hasOutput('TgwAttachmentIddev', {});
      template.hasOutput('TgwAttachmentIdstaging', {});
      template.hasOutput('TgwAttachmentIdprod', {});
    });

    test('should export Route53 zone IDs', () => {
      template.hasOutput('Route53ZoneIddev', {});
      template.hasOutput('Route53ZoneIdstaging', {});
      template.hasOutput('Route53ZoneIdprod', {});
    });

    test('should export NAT instance IDs', () => {
      template.hasOutput('NatInstanceIddev', {});
      template.hasOutput('NatInstanceIdstaging', {});
      template.hasOutput('NatInstanceIdprod', {});
    });

    test('should export Flow Logs bucket name', () => {
      template.hasOutput('FlowLogsBucketOutput', {
        Description: 'S3 bucket for VPC Flow Logs',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should tag all VPCs with environment', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      Object.values(vpcs).forEach((vpc: any) => {
        const tags = vpc.Properties.Tags;
        expect(tags).toContainEqual(
          expect.objectContaining({
            Key: 'Environment',
            Value: environmentSuffix,
          })
        );
      });
    });

    test('should tag all resources with iac-rlhf-amazon', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      Object.values(vpcs).forEach((vpc: any) => {
        const tags = vpc.Properties.Tags;
        expect(tags).toContainEqual(
          expect.objectContaining({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          })
        );
      });
    });

    test('should tag NAT instances with Type tag', () => {
      const instances = template.findResources('AWS::EC2::Instance');
      Object.values(instances).forEach((instance: any) => {
        const tags = instance.Properties.Tags;
        expect(tags).toContainEqual(
          expect.objectContaining({
            Key: 'Type',
            Value: 'NAT-Instance',
          })
        );
      });
    });
  });

  describe('Network Configuration', () => {
    test('should configure dev VPC subnets with correct CIDR blocks', () => {
      // Public subnets: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
      });
    });

    test('should configure staging VPC subnets with correct CIDR blocks', () => {
      // Public subnets: 10.1.0.0/24, 10.1.1.0/24, 10.1.2.0/24
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.1.0.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.1.1.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.1.2.0/24',
      });
    });

    test('should configure prod VPC subnets with correct CIDR blocks', () => {
      // Public subnets: 10.2.0.0/24, 10.2.1.0/24, 10.2.2.0/24
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.2.0.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.2.1.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.2.2.0/24',
      });
    });
  });

  describe('Security Configuration', () => {
    test('should create security groups for VPC endpoints', () => {
      const endpointSgs = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              FromPort: 443,
              ToPort: 443,
              IpProtocol: 'tcp',
            }),
          ]),
        },
      });
      // 3 interface endpoints (SSM, SSM Messages, EC2 Messages) * 3 VPCs = 9
      expect(Object.keys(endpointSgs).length).toBeGreaterThanOrEqual(9);
    });

    test('should allow HTTPS traffic from VPC CIDR to interface endpoints', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have correct total resource count', () => {
      const resources = template.toJSON().Resources;
      const resourceCount = Object.keys(resources).length;

      // Expected minimum resources:
      // 1 S3 bucket + 1 S3 bucket policy + 1 TGW + 3 VPCs + 18 subnets
      // + 3 IGWs + 3 VPC GW attachments + 18+ route tables + 3 TGW attachments
      // + 3 TGW route tables + 3 TGW RT associations + 4 TGW routes
      // + 3 NAT instances + 3 NAT roles + 3 NAT SGs + 15 VPC endpoints
      // + 9 endpoint SGs + 3 flow logs + 3 hosted zones + 21 SSM params
      // + custom resources + Lambda functions
      expect(resourceCount).toBeGreaterThan(100);
    });
  });
});
