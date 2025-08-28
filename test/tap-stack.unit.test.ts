import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { WebAppStack } from '../lib/tap-stack';

describe('WebAppStack Unit Tests', () => {
  let app: cdk.App;
  let stack: WebAppStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new WebAppStack(app, 'TestWebAppStack', {
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should create 2 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private

      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create NAT Gateways in public subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('should create HTTP listener with redirect to HTTPS', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: [
          {
            Type: 'redirect',
            RedirectConfig: {
              Protocol: 'HTTPS',
              Port: '443',
              StatusCode: 'HTTP_301',
            },
          },
        ],
      });
    });

    test('should create HTTPS listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 443,
        Protocol: 'HTTPS',
      });
    });

    test('should create target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/health',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should create Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '2',
        HealthCheckType: 'ELB',
      });
    });

    test('should create Launch Template', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          InstanceType: 't3.micro',
          IamInstanceProfile: Match.anyValue(),
        },
      });
    });

    test('should create scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP/HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('should create EC2 security group allowing traffic only from ALB', () => {
      // EC2 security group is created but doesn't have ingress rules defined directly
      // because they are added via addIngressRule method
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });

      // Check that there's a security group ingress rule
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        SourceSecurityGroupId: Match.anyValue(),
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket for ALB logs', () => {
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
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Status: 'Enabled',
              ExpirationInDays: 90,
            },
          ],
        },
      });
    });

    test('should have bucket policy for ALB logs', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 's3:PutObject',
              Principal: Match.anyValue(),
            }),
          ]),
        },
      });
    });
  });

  describe('IAM Configuration', () => {
    test('should create IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        ManagedPolicyArns: Match.anyValue(),
      });
    });

    test('should create instance profile', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
    });
  });

  describe('SSL Certificate', () => {
    test('should create ACM certificate', () => {
      template.resourceCountIs('AWS::CertificateManager::Certificate', 1);
    });
  });

  describe('Stack Outputs', () => {
    test('should output VPC ID', () => {
      template.hasOutput('VPCId', {});
    });

    test('should output Load Balancer DNS name', () => {
      template.hasOutput('LoadBalancerDNS', {});
    });

    test('should output Load Balancer ARN', () => {
      template.hasOutput('LoadBalancerArn', {});
    });

    test('should output S3 bucket name', () => {
      template.hasOutput('S3BucketName', {});
    });

    test('should output Auto Scaling Group name', () => {
      template.hasOutput('AutoScalingGroupName', {});
    });
  });

  describe('Resource Tags', () => {
    test('should apply common tags to all resources', () => {
      // Check that tags are applied at stack level
      expect(stack.tags.tagValues()).toEqual(
        expect.objectContaining({
          Project: 'ScalableWebApp',
          Environment: 'Production',
          ManagedBy: 'CDK',
        })
      );
    });
  });
});
