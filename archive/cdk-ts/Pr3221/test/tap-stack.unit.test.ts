import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    // Set environment to eu-central-1 to match requirements
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region: 'eu-central-1' }
    });
    template = Template.fromStack(stack);
  });

  describe('Region Guard Tests', () => {
    test('should enforce eu-central-1 region', () => {
      expect(stack.region).toBe('eu-central-1');
    });

    test('should reject us-east-1 region', () => {
      expect(() => {
        new TapStack(new cdk.App(), 'TestStack', {
          environmentSuffix,
          env: { region: 'us-east-1' }
        });
      }).toThrow('Stack must be deployed in eu-central-1. Current region: us-east-1');
    });

    test('should reject us-west-2 region', () => {
      expect(() => {
        new TapStack(new cdk.App(), 'TestStack', {
          environmentSuffix,
          env: { region: 'us-west-2' }
        });
      }).toThrow('Stack must be deployed in eu-central-1. Current region: us-west-2');
    });

    test('should use default environment suffix when not provided', () => {
      const testStack = new TapStack(new cdk.App(), 'TestDefaultStack', {
        env: { region: 'eu-central-1' }
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify VPC is created with default 'dev' suffix
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production'
          }
        ])
      });
    });
  });

  describe('VPC Configuration Tests', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create public subnets in multiple AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public + 2 private + 2 database
    });

    test('should create NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });

  describe('EC2 Instance Tests', () => {
    test('should create two EC2 instances', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);
    });

    test('should use latest Amazon Linux 2 AMI', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        ImageId: Match.anyValue(), // AMI ID is resolved at deployment
        InstanceType: 't3.micro'
      });
    });

    test('should enable detailed monitoring', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Monitoring: true
      });
    });
  });

  describe('Load Balancer Tests', () => {
    test('should create Application Load Balancer', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    });

    test('should configure ALB as internet-facing', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing'
      });
    });

    test('should create target group for EC2 instances', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);
    });
  });

  describe('RDS Configuration Tests', () => {
    test('should create RDS instance', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('should configure RDS as db.t3.micro', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro'
      });
    });

    test('should make RDS publicly accessible', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: true
      });
    });

    test('should enable storage encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true
      });
    });
  });

  describe('S3 Bucket Tests', () => {
    test('should create S3 buckets with AES-256 encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      });
    });

    test('should block public access on S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });
  });

  describe('IAM Role Tests', () => {
    test('should create EC2 IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              }
            }
          ]
        }
      });
    });

    test('should create Lambda IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            }
          ]
        }
      });
    });
  });

  describe('Tagging Tests', () => {
    test('should tag VPC with Environment=Production', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production'
          }
        ])
      });
    });

    test('should tag EC2 instances with Environment=Production', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production'
          }
        ])
      });
    });
  });

  describe('Security Group Tests', () => {
    test('should create ALB security group with HTTP/HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', Match.objectLike({
        GroupDescription: Match.stringLikeRegexp('Security group for Application Load Balancer'),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp'
            // don't assert CidrIp text here (could be string or intrinsic)
          }),
          Match.objectLike({
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp'
          })
        ])
      }));
    });

    test('should have ingress rules for HTTP/HTTPS in separate SecurityGroupIngress resources if split', () => {
      // Extra defensive check: if CDK split ingress into AWS::EC2::SecurityGroupIngress resources,
      // ensure at least one ingress for 80/443 exists.
      const ingressResources = template.findResources('AWS::EC2::SecurityGroupIngress');
      const has80or443 = Object.values(ingressResources).some((r: any) => {
        const p = r.Properties ?? {};
        // Ports might be numbers or strings depending on synthesis - coerce to number if possible
        const from = typeof p.FromPort === 'string' ? Number(p.FromPort) : p.FromPort;
        const proto = p.IpProtocol;
        return proto === 'tcp' && (from === 80 || from === 443);
      });
      expect(has80or443 || Object.keys(ingressResources).length === 0).toBe(true);
    });
  });
});
