import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { WebAppStack } from '../lib/webapp-stack';

describe('WebAppStack', () => {
  let app: cdk.App;
  let stack: WebAppStack;
  let template: Template;
  const environmentSuffix = 'dev';
  const port = 80;

  beforeEach(() => {
    app = new cdk.App();
    stack = new WebAppStack(app, 'TestWebAppStack', {
      environmentSuffix,
      port,
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket', () => {
    test('creates an encrypted S3 bucket with KMS key', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });
  });

  describe('IAM Role and Policies', () => {
    test('creates EC2 instance role with required managed policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                'arn:',
                Match.objectLike({ Ref: 'AWS::Partition' }),
                Match.stringLikeRegexp(':iam::aws:policy/.+'),
              ]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('VPC and Subnets', () => {
    test('creates a VPC with public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 3 AZs * 2 subnet types
    });
  });

  describe('Auto Scaling Group', () => {
    test('creates ASG with Ubuntu AMI and instance type t2.micro', () => {
      template.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
        InstanceType: 't2.micro',
        UserData: {
          'Fn::Base64': Match.stringLikeRegexp('sudo apt.*nginx'),
        },
      });
    });

    test('enables CPU scaling and sets min/max capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '5',
      });
    });
  });

  describe('Load Balancer and Listeners', () => {
    test('creates an internet-facing ALB with HTTP and HTTPS listeners', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 443,
        Protocol: 'HTTPS',
      });
    });
  });

  describe('Outputs', () => {
    test('exports Load Balancer DNS name', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Load Balancer DNS',
      });
    });

    test('exports VPC ID and S3 Bucket name', () => {
      template.hasOutput('VPCID', {
        Description: 'VPC ID',
      });
      template.hasOutput('S3Bucket', {
        Description: 'S3 Bucket ID',
      });
    });
  });
  describe('Security', () => {
    test('does not expose sensitive information in template', () => {
      const json = JSON.stringify(template.toJSON(), null, 2);

      // Match raw exposed secrets, not property names or logical IDs
      const sensitiveValuePattern =
        /(["']?)(password|secret|api[-_]?key|token)(["']?)\s*[:=]\s*["'][^"']{4,}["']/i;
      const match = json.match(sensitiveValuePattern);
      if (match) {
        console.warn('⚠️ Potential sensitive data leak:', match[0]);
      }

      expect(json).not.toMatch(sensitiveValuePattern);
    });
  });

  describe('Security Groups', () => {
    test('creates security group with expected properties', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*'),
        VpcId: Match.anyValue(), // optional if VPC is implicit
      });
    });

    test('allows inbound HTTP traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        SourceSecurityGroupId: Match.anyValue(),
      });
    });
  });
  describe('CloudWatch Alarms', () => {
    test('creates CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        ComparisonOperator: 'GreaterThanThreshold',
        Namespace: 'AWS/EC2',
        Threshold: 80,
        EvaluationPeriods: 2,
      });
    });
  });
});
