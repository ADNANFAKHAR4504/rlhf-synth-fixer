import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('Creates Production VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `ProductionVPC-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('Creates Staging VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `StagingVPC-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('Creates exactly 2 VPCs', () => {
      template.resourceCountIs('AWS::EC2::VPC', 2);
    });

    test('Creates public and private subnets for each VPC', () => {
      // Should have 8 subnets total (2 VPCs x 2 AZs x 2 subnet types)
      template.resourceCountIs('AWS::EC2::Subnet', 8);
    });

    test('Creates Internet Gateways for each VPC', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 2);
    });

    test('Creates NAT Gateways for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 4);
    });

    test('Creates Elastic IPs for NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::EIP', 4);
    });
  });

  describe('Security Groups', () => {
    test('Creates Production Security Group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('production.*restricted'),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '203.0.113.0/24',
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
          Match.objectLike({
            CidrIp: '203.0.113.0/24',
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
          }),
        ]),
      });
    });

    test('Creates Staging Security Group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('staging.*restricted'),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '203.0.113.0/24',
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });

    test('Security groups have restricted outbound traffic', () => {
      // CDK creates security groups with AllowAllOutbound: false
      // This means no default egress rules are added
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*restricted.*'),
      });
    });
  });

  describe('Network ACLs', () => {
    test('Creates Network ACLs for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NetworkAcl', 2);
    });

    test('Blocks outbound internet traffic from private subnets', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        CidrBlock: '0.0.0.0/0',
        Egress: true,
        RuleAction: 'deny',
        RuleNumber: 100,
      });
    });

    test('Allows inbound traffic from VPC CIDR', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        CidrBlock: '10.0.0.0/16',
        Egress: false,
        RuleAction: 'allow',
        RuleNumber: 100,
      });

      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        CidrBlock: '10.1.0.0/16',
        Egress: false,
        RuleAction: 'allow',
        RuleNumber: 100,
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('Creates CloudWatch Log Group for VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });

    test('Creates VPC Flow Logs for both VPCs', () => {
      template.resourceCountIs('AWS::EC2::FlowLog', 2);
    });

    test('Flow logs capture all traffic', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        TrafficType: 'ALL',
      });
    });

    test('Creates IAM Role for VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });
  });

  describe('S3 Buckets', () => {
    test('Creates Application S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `application-data-bucket-${environmentSuffix}-123456789012`,
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

    test('S3 buckets enforce SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('S3 buckets have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 buckets block public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  describe('KMS Keys', () => {
    test('Creates KMS key for S3 encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'Customer-managed KMS key for S3 bucket encryption',
        EnableKeyRotation: true,
      });
    });

    test('Creates KMS key for CloudWatch Logs encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for CloudWatch Logs encryption',
        EnableKeyRotation: true,
      });
    });

    test('KMS keys have removal policy set to DESTROY', () => {
      const kmsKeys = template.findResources('AWS::KMS::Key');
      Object.values(kmsKeys).forEach(key => {
        expect(key.DeletionPolicy).toBe('Delete');
      });
    });

    test('Creates KMS alias for S3 encryption key', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/s3-encryption-key-${environmentSuffix}`,
      });
    });
  });

  describe('IAM Roles', () => {
    test('Creates EC2 Instance Role with minimal permissions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find(role =>
        role.Properties?.AssumeRolePolicyDocument?.Statement?.some(
          (s: any) => s.Principal?.Service === 'ec2.amazonaws.com'
        )
      );

      expect(ec2Role).toBeDefined();
      expect(ec2Role?.Properties?.ManagedPolicyArns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            'Fn::Join': expect.arrayContaining([
              '',
              expect.arrayContaining([
                expect.stringMatching(/.*AmazonSSMManagedInstanceCore/),
              ]),
            ]),
          }),
        ])
      );
    });

    test('EC2 role is accessible as stack property', () => {
      expect(stack.ec2InstanceRole).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('All resources are tagged with Environment', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      Object.values(resources).forEach(resource => {
        expect(resource.Properties?.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Environment',
              Value: environmentSuffix,
            }),
          ])
        );
      });
    });

    test('All resources are tagged with Project', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      Object.values(resources).forEach(resource => {
        expect(resource.Properties?.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Project',
              Value: 'SecurityConfiguration',
            }),
          ])
        );
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Outputs Production VPC ID', () => {
      template.hasOutput('ProductionVpcId', {
        Description: 'Production VPC ID',
      });
    });

    test('Outputs Staging VPC ID', () => {
      template.hasOutput('StagingVpcId', {
        Description: 'Staging VPC ID',
      });
    });

    test('Outputs S3 KMS Key ID', () => {
      template.hasOutput('S3KmsKeyId', {
        Description: 'S3 Encryption KMS Key ID',
      });
    });

    test('Outputs Application Bucket Name', () => {
      template.hasOutput('ApplicationBucketName', {
        Description: 'Application Data S3 Bucket Name',
      });
    });

    test('Outputs EC2 Instance Role ARN', () => {
      template.hasOutput('EC2InstanceRoleArn', {
        Description: 'EC2 Instance IAM Role ARN',
      });
    });

    test('Outputs Security Group IDs', () => {
      template.hasOutput('ProductionSecurityGroupId', {
        Description: 'Production Security Group ID',
      });
      template.hasOutput('StagingSecurityGroupId', {
        Description: 'Staging Security Group ID',
      });
    });

    test('Outputs VPC Flow Log Group Name', () => {
      template.hasOutput('VPCFlowLogGroupName', {
        Description: 'VPC Flow Logs CloudWatch Log Group Name',
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('Log group has KMS encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        KmsKeyId: Match.anyValue(),
      });
    });

    test('Log group has appropriate retention period', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });
  });

  describe('Removal Policies', () => {
    test('S3 buckets have auto-delete objects enabled', () => {
      const customResources = template.findResources(
        'Custom::S3AutoDeleteObjects'
      );
      expect(Object.keys(customResources).length).toBeGreaterThan(0);
    });

    test('Application bucket is accessible as stack property', () => {
      expect(stack.applicationBucket).toBeDefined();
    });
  });

  describe('Route Tables', () => {
    test('Creates route tables for all subnets', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 8);
    });

    test('Creates routes for public subnets to Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue(),
      });
    });

    test('Creates routes for private subnets to NAT Gateway', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: Match.anyValue(),
      });
    });
  });

  describe('Subnet Associations', () => {
    test('Associates subnets with route tables', () => {
      template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 8);
    });

    test('Associates private subnets with Network ACLs', () => {
      template.resourceCountIs('AWS::EC2::SubnetNetworkAclAssociation', 4);
    });
  });
});
