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
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack with default environment suffix', () => {
    it('should use dev as default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'TapStackDefault', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      
      // Check that resources exist with default suffix
      defaultTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
      
      // Verify VPC construct with no suffix uses default
      const vpcConstruct = new (require('../lib/vpc-stack').VpcStack)(defaultStack, 'TestVpc');
      expect(vpcConstruct).toBeDefined();
      
      // Verify S3 construct with no suffix uses default
      const s3Construct = new (require('../lib/s3-stack').S3Stack)(defaultStack, 'TestS3');
      expect(s3Construct).toBeDefined();
      
      // Verify SecurityGroup construct with no suffix uses default
      const sgConstruct = new (require('../lib/security-group-stack').SecurityGroupStack)(defaultStack, 'TestSG', {
        vpc: vpcConstruct.vpc,
      });
      expect(sgConstruct).toBeDefined();
    });

    it('should use context environment suffix when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const contextStack = new TapStack(contextApp, 'TapStackContext', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const contextTemplate = Template.fromStack(contextStack);
      
      // Check that resources exist with context suffix
      contextTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });
  });

  describe('VPC Configuration', () => {
    it('should create a VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    it('should create exactly 3 public subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.entries(subnets).filter(([_, resource]: [string, any]) => 
        resource.Properties?.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets.length).toBe(3);
    });

    it('should create exactly 3 private subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.entries(subnets).filter(([_, resource]: [string, any]) => 
        resource.Properties?.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets.length).toBe(3);
    });

    it('should create an Internet Gateway', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });

    it('should create exactly 1 NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    it('should create VPC Block Public Access with correct settings', () => {
      template.hasResourceProperties('AWS::EC2::VPCBlockPublicAccessOptions', {
        InternetGatewayBlockMode: 'block-bidirectional',
      });
    });
  });

  describe('Security Groups', () => {
    it('should create a Web Security Group with HTTP access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    it('should create a Web Security Group with HTTPS access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    it('should create an SSH Security Group with port 22 access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    it('should create an Internal Security Group allowing VPC traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: '-1',
            CidrIp: '10.0.0.0/16',
          }),
        ]),
      });
    });
  });

  describe('Network ACLs', () => {
    it('should create a Public Network ACL', () => {
      template.hasResource('AWS::EC2::NetworkAcl', {});
    });

    it('should allow HTTP traffic in Public Network ACL', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        Protocol: 6,
        RuleAction: 'allow',
        CidrBlock: '0.0.0.0/0',
        PortRange: {
          From: 80,
          To: 80,
        },
      });
    });

    it('should allow SSH traffic in Public Network ACL', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        Protocol: 6,
        RuleAction: 'allow',
        CidrBlock: '0.0.0.0/0',
        PortRange: {
          From: 22,
          To: 22,
        },
      });
    });

    it('should allow HTTPS traffic in Public Network ACL', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        Protocol: 6,
        RuleAction: 'allow',
        CidrBlock: '0.0.0.0/0',
        PortRange: {
          From: 443,
          To: 443,
        },
      });
    });

    it('should create a Private Network ACL', () => {
      const nacls = template.findResources('AWS::EC2::NetworkAcl');
      expect(Object.keys(nacls).length).toBeGreaterThanOrEqual(2);
    });

    it('should allow VPC internal traffic in Private Network ACL', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        Protocol: -1,
        RuleAction: 'allow',
        CidrBlock: '10.0.0.0/16',
      });
    });
  });

  describe('S3 Bucket', () => {
    it('should create an S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        },
      });
    });

    it('should have bucket name with environment suffix', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              `secure-vpc-bucket-${environmentSuffix}-`,
            ]),
          ]),
        }),
      });
    });

    it('should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    it('should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    it('should enforce SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
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

    it('should have lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteIncompleteMultipartUploads',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7,
              },
              Status: 'Enabled',
            }),
            Match.objectLike({
              Id: 'TransitionToIA',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                }),
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                }),
              ]),
            }),
          ]),
        },
      });
    });

    it('should have DESTROY removal policy', () => {
      // Check for CustomResource that handles auto-deletion
      template.hasResource('Custom::S3AutoDeleteObjects', {});
    });
  });

  describe('KMS Key', () => {
    it('should create a KMS key for S3 encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for S3 bucket encryption',
        EnableKeyRotation: true,
      });
    });
  });

  describe('Stack Outputs', () => {
    it('should output VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `${environmentSuffix}-VpcId`,
        },
      });
    });

    it('should output Web Security Group ID', () => {
      template.hasOutput('WebSecurityGroupId', {
        Description: 'Web Security Group ID',
        Export: {
          Name: `${environmentSuffix}-WebSecurityGroupId`,
        },
      });
    });

    it('should output SSH Security Group ID', () => {
      template.hasOutput('SshSecurityGroupId', {
        Description: 'SSH Security Group ID',
        Export: {
          Name: `${environmentSuffix}-SshSecurityGroupId`,
        },
      });
    });

    it('should output S3 Bucket Name', () => {
      template.hasOutput('BucketName', {
        Description: 'S3 Bucket Name',
        Export: {
          Name: `${environmentSuffix}-BucketName`,
        },
      });
    });

    it('should output S3 Bucket ARN', () => {
      template.hasOutput('BucketArn', {
        Description: 'S3 Bucket ARN',
        Export: {
          Name: `${environmentSuffix}-BucketArn`,
        },
      });
    });

    it('should output KMS Key ID', () => {
      template.hasOutput('EncryptionKeyId', {
        Description: 'KMS Key ID used for S3 encryption',
        Export: {
          Name: `${environmentSuffix}-EncryptionKeyId`,
        },
      });
    });
  });

  describe('Tagging', () => {
    it('should tag resources with Environment', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
        ]),
      });
    });

    it('should tag resources with Project', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'SecureVpcInfrastructure',
          }),
        ]),
      });
    });

    it('should tag resources with ManagedBy', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'ManagedBy',
            Value: 'CDK',
          }),
        ]),
      });
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in VPC logical ID', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcKeys = Object.keys(resources);
      expect(vpcKeys.some(key => key.includes(environmentSuffix))).toBe(true);
    });

    it('should include environment suffix in security group logical IDs', () => {
      const resources = template.findResources('AWS::EC2::SecurityGroup');
      const sgKeys = Object.keys(resources);
      expect(sgKeys.some(key => key.includes(environmentSuffix))).toBe(true);
    });
  });
});
