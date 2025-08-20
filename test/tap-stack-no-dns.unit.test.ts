import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack (No DNS Configuration)', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        domainName: '',
        hostedZoneId: '',
      },
    });
    // Force the stack to be in us-west-2 (secondary region) for testing
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: { region: 'us-west-2', account: '123456789012' }
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: Match.stringLikeRegexp('10\.0\.0\.0/16'),
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          {
            Key: 'Project',
            Value: 'TapApp',
          },
          {
            Key: 'Region',
            Value: 'us-west-2',
          },
          {
            Key: 'Type',
            Value: 'Secondary',
          },
        ]),
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP and HTTPS rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ]),
      });
    });

    test('should create EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
    });

    test('should create RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB with correct configuration', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
        Subnets: Match.anyValue(),
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckPath: '/health',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });

    test('should create ALB listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          {
            Type: 'forward',
            TargetGroupArn: Match.anyValue(),
          },
        ]),
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create Auto Scaling Group with correct configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
        VPCZoneIdentifier: Match.anyValue(),
      });
    });

    test('should create launch template with correct instance type', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          InstanceType: 't3.medium',
          ImageId: Match.anyValue(),
        },
      });
    });
  });

  describe('RDS Database', () => {
    test('should create RDS instance with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro',
        DeletionProtection: true,
        MonitoringInterval: 60,
        StorageType: 'gp2',
      });
    });

    test('should create RDS subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
        SubnetIds: Match.anyValue(),
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic with correct display name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `Tap App Alerts - ${environmentSuffix}`,
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create unhealthy hosts alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'UnHealthyHostCount',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create response time alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'TargetResponseTime',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create database connections alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
        Threshold: 80,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });
  });

  describe('Route 53 Configuration', () => {
    test('should NOT create hosted zone when domain is not provided', () => {
      template.templateMatches({
        Resources: Match.not(Match.objectLike({
          HostedZone: Match.anyValue(),
        })),
      });
    });

    test('should NOT create health check when domain is not provided', () => {
      template.templateMatches({
        Resources: Match.not(Match.objectLike({
          HealthCheck: Match.anyValue(),
        })),
      });
    });

    test('should NOT create A record when domain is not provided', () => {
      template.templateMatches({
        Resources: Match.not(Match.objectLike({
          PrimaryRecord: Match.anyValue(),
        })),
      });
    });
  });

  describe('Lambda-based Failover', () => {
    test('should NOT create failover Lambda function when DNS is not configured', () => {
      template.templateMatches({
        Resources: Match.not(Match.objectLike({
          FailoverLambda: Match.anyValue(),
        })),
      });
    });

    test('should NOT create failover Lambda role when DNS is not configured', () => {
      template.templateMatches({
        Resources: Match.not(Match.objectLike({
          FailoverLambdaRole: Match.anyValue(),
        })),
      });
    });

    test('should NOT create failover alarm when DNS is not configured', () => {
      template.templateMatches({
        Resources: Match.not(Match.objectLike({
          FailoverAlarm: Match.anyValue(),
        })),
      });
    });

    test('should NOT create EventBridge rule when DNS is not configured', () => {
      template.templateMatches({
        Resources: Match.not(Match.objectLike({
          FailoverRule: Match.anyValue(),
        })),
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 instance role with required policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ]),
        },
      });
    });
  });

  describe('Outputs', () => {
    test('should create LoadBalancerDNS output', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS name',
      });
    });

    test('should create DatabaseEndpoint output', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
      });
    });

    test('should create SNSTopicArn output', () => {
      template.hasOutput('SNSTopicArn', {
        Description: 'SNS Topic ARN for alerts',
      });
    });

    test('should NOT create HostedZoneId output when DNS is not configured', () => {
      template.templateMatches({
        Outputs: Match.not(Match.objectLike({
          HostedZoneId: Match.anyValue(),
        })),
      });
    });

    test('should NOT create HealthCheckId output when DNS is not configured', () => {
      template.templateMatches({
        Outputs: Match.not(Match.objectLike({
          HealthCheckId: Match.anyValue(),
        })),
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should apply common tags to resources', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Project',
            Value: 'TapApp',
          },
          {
            Key: 'Region',
            Value: 'us-west-2',
          },
          {
            Key: 'Type',
            Value: 'Secondary',
          },
        ]),
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should use environment suffix in SNS topic name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `Tap App Alerts - ${environmentSuffix}`,
      });
    });
  });

  describe('Multi-Region Configuration', () => {
    test('should configure secondary region correctly', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Type',
            Value: 'Secondary',
          },
        ]),
      });
    });
  });
});
