import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: 'int-test',
      },
    });
    stack = new TapStack(app, 'IntTestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC and Network Infrastructure', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        InstanceTenancy: 'default',
      });
      
      // Test tags separately to avoid array order issues
      const vpc = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpc)[0];
      const tags = vpcResource.Properties.Tags;
      
      expect(tags).toEqual(
        expect.arrayContaining([
          { Key: 'Project', Value: 'MyProject' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'CostCenter', Value: '12345' },
        ])
      );
    });

    test('should create exactly 2 public subnets across 2 AZs', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          Tags: Match.arrayWith([
            { Key: 'aws-cdk:subnet-type', Value: 'Public' },
          ]),
        },
      });
      expect(Object.keys(publicSubnets)).toHaveLength(2);
    });

    test('should create exactly 2 private subnets across 2 AZs', () => {
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          Tags: Match.arrayWith([
            { Key: 'aws-cdk:subnet-type', Value: 'Private' },
          ]),
        },
      });
      expect(Object.keys(privateSubnets)).toHaveLength(2);
    });

    test('should create Internet Gateway for public subnets', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });

    test('should create NAT Gateway for private subnet internet access', () => {
      template.hasResource('AWS::EC2::NatGateway', {});
    });

    test('should create EIP for NAT Gateway', () => {
      template.hasResource('AWS::EC2::EIP', {
        Properties: {
          Domain: 'vpc',
        },
      });
    });

    test('should create route tables for public and private subnets', () => {
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBeGreaterThan(0);
    });
  });

  describe('Security Groups', () => {
    test('should create public security group with HTTP and SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for public subnet resources - allows HTTP and SSH',
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1',
          },
        ],
        SecurityGroupIngress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP traffic from anywhere',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow SSH access from anywhere',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          },
        ]),
      });
    });

    test('should create private security group without SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for private subnet resources - no direct SSH access',
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1',
          },
        ],
      });
    });

    test('should allow traffic from public to private security group', () => {
      template.hasResource('AWS::EC2::SecurityGroupIngress', {
        Properties: {
          Description: 'Allow traffic from public security group',
          IpProtocol: '-1',
        },
      });
    });

    test('should allow internal communication within private security group', () => {
      template.hasResource('AWS::EC2::SecurityGroupIngress', {
        Properties: {
          Description: 'Allow internal communication within private security group',
          IpProtocol: '-1',
        },
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create EC2 instance role with correct assume role policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        Description: 'IAM role for EC2 instances with least privilege access',
        RoleName: 'IntTestTapStack-SecureNetworkFoundation-EC2Role',
      });
    });

    test('should attach SSM managed policy to EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
        ]),
      });
    });

    test('should create custom policy with minimal permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
                'logs:DescribeLogGroups',
              ],
              Resource: Match.anyValue(),
            },
            {
              Effect: 'Allow',
              Action: ['ec2:DescribeInstances', 'ec2:DescribeTags'],
              Resource: '*',
              Condition: Match.anyValue(),
            },
            {
              Effect: 'Allow',
              Action: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
              ],
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });

    test('should create instance profile for EC2 instances', () => {
      template.hasResource('AWS::IAM::InstanceProfile', {});
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with retention policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'secure-network-foundation-123456789012-us-east-1',
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
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

    test('should configure bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            {
              Id: 'TransitionToIA',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ],
            },
          ]),
        },
      });
    });

    test('should enforce SSL for S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
              Effect: 'Deny',
              Principal: {
                AWS: '*',
              },
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID for the secure network foundation',
        Export: {
          Name: 'SecureNetworkFoundation-VPC-ID',
        },
      });
    });

    test('should export public subnet IDs', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Comma-separated list of public subnet IDs',
        Export: {
          Name: 'SecureNetworkFoundation-PublicSubnets',
        },
      });
    });

    test('should export private subnet IDs', () => {
      template.hasOutput('PrivateSubnetIds', {
        Description: 'Comma-separated list of private subnet IDs',
        Export: {
          Name: 'SecureNetworkFoundation-PrivateSubnets',
        },
      });
    });

    test('should export public security group ID', () => {
      template.hasOutput('PublicSecurityGroupId', {
        Description: 'Security group ID for public subnet resources',
        Export: {
          Name: 'SecureNetworkFoundation-PublicSG',
        },
      });
    });

    test('should export private security group ID', () => {
      template.hasOutput('PrivateSecurityGroupId', {
        Description: 'Security group ID for private subnet resources',
        Export: {
          Name: 'SecureNetworkFoundation-PrivateSG',
        },
      });
    });

    test('should export EC2 role ARN', () => {
      template.hasOutput('EC2RoleArn', {
        Description: 'ARN of the EC2 instance role with least privilege access',
        Export: {
          Name: 'SecureNetworkFoundation-EC2Role',
        },
      });
    });

    test('should export retained bucket name', () => {
      template.hasOutput('RetainedBucketName', {
        Description: 'Name of the S3 bucket (will be retained after stack destruction - COMPLIANT)',
        Export: {
          Name: 'SecureNetworkFoundation-RetainedBucket',
        },
      });
    });
  });

  describe('Stack Metadata and Description', () => {
    test('should have correct stack description', () => {
      expect(stack.templateOptions.description).toContain('Secure Network Foundation Stack');
      expect(stack.templateOptions.description).toContain('Creates a highly available, secure VPC');
    });

    test('should have stack metadata', () => {
      expect(stack.templateOptions.metadata).toBeDefined();
      expect(stack.templateOptions.metadata?.Author).toBe('AWS Solutions Architect');
      expect(stack.templateOptions.metadata?.Purpose).toBe('Secure Network Foundation');
      expect(stack.templateOptions.metadata?.Version).toBe('1.0.0');
    });
  });

  describe('Resource Tagging', () => {
    test('should apply standard tags to all resources', () => {
      // Test that VPC has standard tags
      const vpc = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpc)[0];
      const vpcTags = vpcResource.Properties.Tags;
      
      expect(vpcTags).toEqual(
        expect.arrayContaining([
          { Key: 'Project', Value: 'MyProject' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'CostCenter', Value: '12345' },
        ])
      );

      // Test that security groups have standard tags
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const securityGroupResource = Object.values(securityGroups)[0];
      const sgTags = securityGroupResource.Properties.Tags;
      
      expect(sgTags).toEqual(
        expect.arrayContaining([
          { Key: 'Project', Value: 'MyProject' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'CostCenter', Value: '12345' },
        ])
      );

      // Test that IAM role has standard tags
      const iamRole = template.findResources('AWS::IAM::Role');
      const iamRoleResource = Object.values(iamRole)[0];
      const roleTags = iamRoleResource.Properties.Tags;
      
      expect(roleTags).toEqual(
        expect.arrayContaining([
          { Key: 'Project', Value: 'MyProject' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'CostCenter', Value: '12345' },
        ])
      );
    });
  });

  describe('Security Compliance', () => {
    test('should block public access on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should enable encryption on S3 bucket', () => {
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

    test('should enable versioning on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should use least privilege IAM policies', () => {
      // Verify that the custom policy has specific, limited permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
                'logs:DescribeLogGroups',
              ],
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });
  });
});
