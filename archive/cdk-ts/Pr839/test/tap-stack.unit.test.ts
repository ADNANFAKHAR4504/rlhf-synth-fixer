import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: 'test',
      },
    });
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        InstanceTenancy: 'default',
      });
    });

    test('should create VPC with correct tags', () => {
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

    test('should create exactly 2 public subnets', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          Tags: Match.arrayWith([
            { Key: 'aws-cdk:subnet-type', Value: 'Public' },
          ]),
        },
      });
      expect(Object.keys(publicSubnets)).toHaveLength(2);
    });

    test('should create exactly 2 private subnets', () => {
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          Tags: Match.arrayWith([
            { Key: 'aws-cdk:subnet-type', Value: 'Private' },
          ]),
        },
      });
      expect(Object.keys(privateSubnets)).toHaveLength(2);
    });

    test('should create public subnets with correct CIDR blocks', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-name', Value: 'PublicSubnet' },
          { Key: 'aws-cdk:subnet-type', Value: 'Public' },
        ]),
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-name', Value: 'PublicSubnet' },
          { Key: 'aws-cdk:subnet-type', Value: 'Public' },
        ]),
      });
    });

    test('should create private subnets with correct CIDR blocks', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-name', Value: 'PrivateSubnet' },
          { Key: 'aws-cdk:subnet-type', Value: 'Private' },
        ]),
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.3.0/24',
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-name', Value: 'PrivateSubnet' },
          { Key: 'aws-cdk:subnet-type', Value: 'Private' },
        ]),
      });
    });

    test('should create Internet Gateway', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });

    test('should create NAT Gateway', () => {
      template.hasResource('AWS::EC2::NatGateway', {});
    });

    test('should create Elastic IP for NAT Gateway', () => {
      template.hasResource('AWS::EC2::EIP', {});
    });
  });

  describe('Security Groups', () => {
    test('should create public security group with correct description', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for public subnet resources - allows HTTP and SSH',
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
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1',
          },
        ],
      });
    });

    test('should create private security group with correct description', () => {
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

    test('should not allow SSH access to private security group', () => {
      const privateSecurityGroup = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for private subnet resources - no direct SSH access',
        },
      });

      const privateSg = Object.values(privateSecurityGroup)[0];
      const ingressRules = privateSg.Properties.SecurityGroupIngress || [];

      // Verify no SSH rules (port 22) exist
      const sshRules = ingressRules.filter((rule: any) => 
        rule.FromPort === 22 || rule.ToPort === 22
      );
      expect(sshRules).toHaveLength(0);
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
    test('should create EC2 instance role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'TestTapStack-SecureNetworkFoundation-EC2Role',
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
      });
    });

    test('should create instance profile with correct name', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: 'TestTapStack-InstanceProfile',
      });
    });

    test('should attach custom policy to EC2 role', () => {
      const policy = template.findResources('AWS::IAM::Policy', {
        Properties: {
          PolicyName: 'EC2MinimalAccessPolicy',
        },
      });
      
      const policyResource = Object.values(policy)[0];
      const statements = policyResource.Properties.PolicyDocument.Statement;
      
      // Check that all required permissions are present
      const allActions = statements.flatMap((stmt: any) => stmt.Action || []);
      
      expect(allActions).toEqual(
        expect.arrayContaining([
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
          'logs:DescribeLogGroups',
          'ec2:DescribeInstances',
          'ec2:DescribeTags',
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ])
      );
      
      expect(statements).toHaveLength(3);
      expect(policyResource.Properties.PolicyDocument.Version).toBe('2012-10-17');
    });

    test('should attach Systems Manager managed policy', () => {
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
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with correct name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'secure-network-foundation-123456789012-us-east-1',
      });
    });

    test('should enable versioning on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should enable server-side encryption on S3 bucket', () => {
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

    test('should block all public access on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should enforce SSL on S3 bucket', () => {
      const bucketPolicy = template.findResources('AWS::S3::BucketPolicy');
      const policyResource = Object.values(bucketPolicy)[0];
      const statements = policyResource.Properties.PolicyDocument.Statement;
      
      // Check that SSL enforcement policy exists
      const sslStatement = statements.find((stmt: any) => 
        stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );
      
      expect(sslStatement).toBeDefined();
      expect(sslStatement.Action).toBe('s3:*');
      expect(sslStatement.Effect).toBe('Deny');
      expect(sslStatement.Principal.AWS).toBe('*');
    });

    test('should configure lifecycle rules for cost optimization', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
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
          ],
        },
      });
    });

    test('should set RETAIN removal policy for S3 bucket', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
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

    test('should export security group IDs', () => {
      template.hasOutput('PublicSecurityGroupId', {
        Description: 'Security group ID for public subnet resources',
        Export: {
          Name: 'SecureNetworkFoundation-PublicSG',
        },
      });

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

    test('should export S3 bucket name', () => {
      template.hasOutput('RetainedBucketName', {
        Description: 'Name of the S3 bucket (will be retained after stack destruction - COMPLIANT)',
        Export: {
          Name: 'SecureNetworkFoundation-RetainedBucket',
        },
      });
    });
  });

  describe('Stack Metadata and Documentation', () => {
    test('should have correct stack description', () => {
      expect(stack.templateOptions.description).toContain('Secure Network Foundation Stack');
      expect(stack.templateOptions.description).toContain('highly available, secure VPC');
    });

    test('should have metadata with author and version information', () => {
      expect(stack.templateOptions.metadata).toEqual(
        expect.objectContaining({
          Author: 'AWS Solutions Architect',
          Purpose: 'Secure Network Foundation',
          Version: '1.0.0',
        })
      );
    });
  });

  describe('Compliance Requirements', () => {
    test('should apply standard tags to all resources', () => {
      // Check that VPC has standard tags
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

      // Check that security groups have standard tags
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach((sg: any) => {
        const sgTags = sg.Properties.Tags;
        expect(sgTags).toEqual(
          expect.arrayContaining([
            { Key: 'Project', Value: 'MyProject' },
            { Key: 'Environment', Value: 'Production' },
            { Key: 'CostCenter', Value: '12345' },
          ])
        );
      });

      // Check that IAM role has standard tags
      const iamRole = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: 'TestTapStack-SecureNetworkFoundation-EC2Role',
        },
      });
      const roleResource = Object.values(iamRole)[0];
      const roleTags = roleResource.Properties.Tags;
      
      expect(roleTags).toEqual(
        expect.arrayContaining([
          { Key: 'Project', Value: 'MyProject' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'CostCenter', Value: '12345' },
        ])
      );

      // Check that S3 bucket has standard tags
      const s3Bucket = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(s3Bucket)[0];
      const bucketTags = bucketResource.Properties.Tags;
      
      expect(bucketTags).toEqual(
        expect.arrayContaining([
          { Key: 'Project', Value: 'MyProject' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'CostCenter', Value: '12345' },
        ])
      );
    });

    test('should implement least privilege principle for IAM', () => {
      const ec2Policy = template.findResources('AWS::IAM::Policy', {
        Properties: {
          PolicyName: 'EC2MinimalAccessPolicy',
        },
      });

      const policy = Object.values(ec2Policy)[0];
      const statements = policy.Properties.PolicyDocument.Statement;

      // Verify only necessary permissions are granted
      const allActions = statements.flatMap((stmt: any) => stmt.Action || []);
      
      // Should only have specific, minimal permissions
      expect(allActions).toEqual(
        expect.arrayContaining([
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
          'logs:DescribeLogGroups',
          'ec2:DescribeInstances',
          'ec2:DescribeTags',
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ])
      );

      // Should not have overly broad permissions
      expect(allActions).not.toContain('ec2:*');
      expect(allActions).not.toContain('s3:*');
      expect(allActions).not.toContain('iam:*');
    });

    test('should have non-destructive lifecycle policies', () => {
      // S3 bucket should have RETAIN policy
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      });
    });
  });

  describe('Stack Properties and Configuration', () => {
    test('should expose public properties for other stacks', () => {
      expect(stack.vpc).toBeDefined();
      expect(stack.publicSecurityGroup).toBeDefined();
      expect(stack.privateSecurityGroup).toBeDefined();
      expect(stack.ec2Role).toBeDefined();
    });

    test('should have correct stack name', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should have correct account and region', () => {
      expect(stack.account).toBe('123456789012');
      expect(stack.region).toBe('us-east-1');
    });
  });
});
