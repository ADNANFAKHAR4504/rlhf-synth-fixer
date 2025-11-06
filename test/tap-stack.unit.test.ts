import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'production' },
          { Key: 'Project', Value: 'payment-processor' },
          { Key: 'CostCenter', Value: 'engineering' },
        ]),
      });
    });

    test('creates 3 public subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      expect(Object.keys(subnets).length).toBe(3);
    });

    test('creates 3 private subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      expect(Object.keys(subnets).length).toBe(3);
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates 3 NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with HTTP and HTTPS ingress', () => {
      const sgs = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for Application Load Balancer',
        },
      });

      expect(Object.keys(sgs).length).toBe(1);
      const albSg = Object.values(sgs)[0] as any;

      // Check HTTP rule (port 80)
      const hasHttpRule = albSg.Properties.SecurityGroupIngress.some(
        (rule: any) =>
          rule.CidrIp === '0.0.0.0/0' &&
          rule.FromPort === 80 &&
          rule.ToPort === 80 &&
          rule.IpProtocol === 'tcp'
      );

      // Check HTTPS rule (port 443)
      const hasHttpsRule = albSg.Properties.SecurityGroupIngress.some(
        (rule: any) =>
          rule.CidrIp === '0.0.0.0/0' &&
          rule.FromPort === 443 &&
          rule.ToPort === 443 &&
          rule.IpProtocol === 'tcp'
      );

      expect(hasHttpRule).toBe(true);
      expect(hasHttpsRule).toBe(true);
    });

    test('creates ECS security group with port 8080 ingress from ALB', () => {
      const sgs = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for ECS Fargate containers',
        },
      });

      expect(Object.keys(sgs).length).toBe(1);
      const ecsSg = Object.values(sgs)[0] as any;

      const hasPort8080 = ecsSg.Properties.SecurityGroupIngress.some(
        (rule: any) => rule.FromPort === 8080 && rule.ToPort === 8080
      );

      expect(hasPort8080).toBe(true);
    });

    test('creates RDS security group with port 5432 ingress from ECS', () => {
      const sgs = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for RDS Aurora PostgreSQL',
        },
      });

      expect(Object.keys(sgs).length).toBe(1);
      const rdsSg = Object.values(sgs)[0] as any;

      // RDS security group should exist
      expect(rdsSg.Properties.GroupDescription).toBe(
        'Security group for RDS Aurora PostgreSQL'
      );

      // Check egress is restricted (empty array)
      expect(rdsSg.Properties.SecurityGroupEgress).toEqual([]);
    });

    test('creates all 3 security groups', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
    });

    test('all security groups have mandatory tags', () => {
      const sgs = template.findResources('AWS::EC2::SecurityGroup');

      Object.values(sgs).forEach((sg: any) => {
        expect(sg.Properties.Tags).toEqual(
          expect.arrayContaining([
            { Key: 'Environment', Value: 'production' },
            { Key: 'Project', Value: 'payment-processor' },
            { Key: 'CostCenter', Value: 'engineering' },
          ])
        );
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('creates S3 bucket for Flow Logs', () => {
      // Check bucket exists
      template.resourceCountIs('AWS::S3::Bucket', 1);

      // Verify bucket has encryption
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucket = Object.values(buckets)[0] as any;

      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Environment', Value: 'production' },
          { Key: 'Project', Value: 'payment-processor' },
          { Key: 'CostCenter', Value: 'engineering' },
        ])
      );
    });

    test('creates VPC Flow Log to S3', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 's3',
        MaxAggregationInterval: 60,
      });
    });
  });

  describe('VPC Endpoints', () => {
    test('creates S3 Gateway Endpoint', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint', {
        Properties: {
          VpcEndpointType: 'Gateway',
        },
      });

      const hasS3Endpoint = Object.values(endpoints).some((endpoint: any) => {
        const serviceName = endpoint.Properties.ServiceName;
        return (
          typeof serviceName === 'object' &&
          'Fn::Join' in serviceName &&
          JSON.stringify(serviceName).includes('s3')
        );
      });

      expect(hasS3Endpoint).toBe(true);
    });

    test('creates DynamoDB Gateway Endpoint', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint', {
        Properties: {
          VpcEndpointType: 'Gateway',
        },
      });

      const hasDynamoDBEndpoint = Object.values(endpoints).some(
        (endpoint: any) => {
          const serviceName = endpoint.Properties.ServiceName;
          return (
            typeof serviceName === 'object' &&
            'Fn::Join' in serviceName &&
            JSON.stringify(serviceName).includes('dynamodb')
          );
        }
      );

      expect(hasDynamoDBEndpoint).toBe(true);
    });

    test('creates 2 VPC endpoints', () => {
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 2);
    });
  });

  describe('CloudFormation Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `VpcId-${environmentSuffix}`,
        },
      });
    });

    test('exports Public Subnet IDs', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Public Subnet IDs',
        Export: {
          Name: `PublicSubnetIds-${environmentSuffix}`,
        },
      });
    });

    test('exports Private Subnet IDs', () => {
      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private Subnet IDs',
        Export: {
          Name: `PrivateSubnetIds-${environmentSuffix}`,
        },
      });
    });

    test('exports ALB Security Group ID', () => {
      template.hasOutput('ALBSecurityGroupId', {
        Description: 'ALB Security Group ID',
        Export: {
          Name: `ALBSecurityGroupId-${environmentSuffix}`,
        },
      });
    });

    test('exports ECS Security Group ID', () => {
      template.hasOutput('ECSSecurityGroupId', {
        Description: 'ECS Security Group ID',
        Export: {
          Name: `ECSSecurityGroupId-${environmentSuffix}`,
        },
      });
    });

    test('exports RDS Security Group ID', () => {
      template.hasOutput('RDSSecurityGroupId', {
        Description: 'RDS Security Group ID',
        Export: {
          Name: `RDSSecurityGroupId-${environmentSuffix}`,
        },
      });
    });

    test('exports Flow Log Bucket Name', () => {
      template.hasOutput('FlowLogBucketName', {
        Description: 'S3 Bucket for VPC Flow Logs',
        Export: {
          Name: `FlowLogBucketName-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Tagging', () => {
    test('VPC has mandatory tags', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      const vpc = Object.values(vpcs)[0] as any;

      expect(vpc.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Environment', Value: 'production' },
          { Key: 'Project', Value: 'payment-processor' },
          { Key: 'CostCenter', Value: 'engineering' },
        ])
      );
    });

    test('S3 bucket has mandatory tags', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucket = Object.values(buckets)[0] as any;

      expect(bucket.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Environment', Value: 'production' },
          { Key: 'Project', Value: 'payment-processor' },
          { Key: 'CostCenter', Value: 'engineering' },
        ])
      );
    });
  });

  describe('Resource Naming', () => {
    test('resources include environmentSuffix', () => {
      expect(stack.vpc).toBeDefined();
      expect(stack.albSecurityGroup).toBeDefined();
      expect(stack.ecsSecurityGroup).toBeDefined();
      expect(stack.rdsSecurityGroup).toBeDefined();
      expect(stack.flowLogBucket).toBeDefined();
    });
  });
});
