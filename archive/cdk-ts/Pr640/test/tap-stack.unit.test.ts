import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('creates private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates NAT Gateways for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });

  describe('Security Group Configuration', () => {
    test('creates security group for web server', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web server',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '203.0.113.0/24',
            Description: 'SSH access from authorized IP',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
            Description: 'HTTP access',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'HTTPS access',
          }),
        ]),
      });
    });

    test('allows all outbound traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1',
          },
        ],
      });
    });
  });

  describe('Network Firewall Configuration', () => {
    test('creates Network Firewall policy', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::FirewallPolicy', {
        FirewallPolicyName: 'production-firewall-policy',
        FirewallPolicy: {
          StatelessDefaultActions: ['aws:pass'],
          StatelessFragmentDefaultActions: ['aws:pass'],
          StatefulRuleGroupReferences: [],
        },
      });
    });

    test('creates Network Firewall', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::Firewall', {
        FirewallName: 'production-network-firewall',
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });

    test('creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates S3 bucket with public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('creates S3 bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'delete-old-logs',
              Status: 'Enabled',
              ExpirationInDays: 90,
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
            },
          ],
        },
      });
    });

    test('enforces SSL on S3 bucket', () => {
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
  });

  describe('KMS Configuration', () => {
    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for S3 bucket encryption',
        EnableKeyRotation: true,
      });
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('creates EC2 instance in public subnet', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('creates IAM role for EC2 instance', () => {
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
        },
      });
    });

    test('attaches CloudWatch policy to IAM role', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const webServerRole = Object.values(roles).find((role: any) => 
        role.Properties?.ManagedPolicyArns?.some((arn: any) => {
          if (typeof arn === 'object' && arn['Fn::Join']) {
            const parts = arn['Fn::Join'][1];
            return parts.some((part: any) => 
              typeof part === 'string' && part.includes('CloudWatchAgentServerPolicy')
            );
          }
          return false;
        })
      );
      expect(webServerRole).toBeDefined();
    });

    test('grants S3 write permissions to EC2 role', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const s3Policy = Object.values(policies).find((policy: any) =>
        policy.Properties?.PolicyDocument?.Statement?.some((statement: any) =>
          statement.Effect === 'Allow' &&
          statement.Action?.some((action: string) => action.includes('s3:PutObject'))
        )
      );
      expect(s3Policy).toBeDefined();
    });
  });

  describe('Tagging', () => {
    test('applies Environment tag to all resources', () => {
      const resources = template.toJSON().Resources;
      const taggableResources = Object.values(resources).filter((resource: any) =>
        resource.Properties?.Tags !== undefined
      );
      
      expect(taggableResources.length).toBeGreaterThan(0);
      
      taggableResources.forEach((resource: any) => {
        const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe('Production');
      });
    });

    test('applies Project tag to stack', () => {
      const resources = template.toJSON().Resources;
      const taggableResources = Object.values(resources).filter((resource: any) =>
        resource.Properties?.Tags !== undefined
      );
      
      const projectTaggedResources = taggableResources.filter((resource: any) =>
        resource.Properties.Tags.find((tag: any) => tag.Key === 'Project' && tag.Value === 'SecureWebInfrastructure')
      );
      
      expect(projectTaggedResources.length).toBeGreaterThan(0);
    });
  });

  describe('Stack Outputs', () => {
    test('outputs VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('outputs S3 bucket name', () => {
      template.hasOutput('LogBucketName', {
        Description: 'S3 Log Bucket Name',
      });
    });

    test('outputs KMS key ID', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID for S3 encryption',
      });
    });
  });

  describe('Environment Suffix', () => {
    test('uses environment suffix in bucket name', () => {
      const bucketName = `production-logs-test-123456789012`;
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: bucketName,
      });
    });
  });
});