import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        domainName: 'testturing.com',
        // No hostedZoneId provided - will create new hosted zone
      },
    });
    // Force the stack to be in us-east-2 (primary region) for testing
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region: 'us-east-2', account: '123456789012' }
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
            Value: 'us-east-2',
          },
          {
            Key: 'Type',
            Value: 'Primary',
          },
        ]),
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\.0\.0\.0/24'),
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-name',
            Value: 'public',
          },
        ]),
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\.0\.3\.0/24'),
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-name',
            Value: 'private',
          },
        ]),
      });
    });

    test('should create isolated subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\.0\.6\.0/28'),
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-name',
            Value: 'isolated',
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
    test('should create hosted zone when domain is provided', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'testturing.com.',
      });
    });

    test('should create health check when domain is provided', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: {
          Type: 'HTTP',
          ResourcePath: '/health',
          Port: 80,
          RequestInterval: 30,
          FailureThreshold: 3,
        },
      });
    });

    test('should create A record when domain is provided', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'testturing.com',
        Type: 'A',
        TTL: '60',
        Failover: 'PRIMARY',
      });
    });

    test('should create A record with alias target', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'testturing.com',
        Type: 'A',
        AliasTarget: {
          EvaluateTargetHealth: true,
        },
      });
    });
  });

  describe('Lambda-based Failover', () => {
    test('should create failover Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.12',
        Handler: 'index.handler',
        Timeout: 300,
        Environment: {
          Variables: {
            DOMAIN_NAME: 'testturing.com',
            HOSTED_ZONE_ID: {
              Ref: Match.stringLikeRegexp('HostedZone.*'),
            },
            SECONDARY_ALB_DNS: `TapSta-Appli-us-west-2-${environmentSuffix}.us-west-2.elb.amazonaws.com`,
            SECONDARY_REGION: 'us-west-2',
          },
        },
      });
    });

    test('should create failover Lambda role with Route 53 permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ]),
        },
      });
    });

    test('should create failover alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'HealthyHostCount',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1,
        EvaluationPeriods: 2,
        ComparisonOperator: 'LessThanOrEqualToThreshold',
        TreatMissingData: 'breaching',
      });
    });

    test('should create EventBridge rule for failover', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.cloudwatch'],
          'detail-type': ['CloudWatch Alarm State Change'],
          detail: {
            state: {
              value: ['ALARM'],
            },
          },
        },
        Targets: Match.arrayWith([
          {
            Arn: Match.anyValue(),
            Id: 'Target0',
          },
        ]),
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

    test('should create HostedZoneId output when DNS is configured', () => {
      template.hasOutput('HostedZoneId', {
        Description: 'Route 53 Hosted Zone ID',
      });
    });

    test('should create HealthCheckId output when health check is configured', () => {
      template.hasOutput('HealthCheckId', {
        Description: 'Route 53 Health Check ID',
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
            Value: 'us-east-2',
          },
          {
            Key: 'Type',
            Value: 'Primary',
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
    test('should configure primary region correctly', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Type',
            Value: 'Primary',
          },
        ]),
      });
    });

    test('should configure secondary region correctly', () => {
      // Create a secondary region stack
      const secondaryApp = new cdk.App({
        context: {
          domainName: 'testturing.com',
        },
      });
      const secondaryStack = new TapStack(secondaryApp, 'TestSecondaryStack', {
        environmentSuffix,
        env: { region: 'us-west-2', account: '123456789012' }
      });
      const secondaryTemplate = Template.fromStack(secondaryStack);

      // Check that it's tagged as Secondary
      secondaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Type',
            Value: 'Secondary',
          },
        ]),
      });

      // Check that it creates a read replica instead of primary database
      secondaryTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        SourceDBInstanceIdentifier: Match.anyValue(),
      });
    });
  });

  describe('Hosted Zone Configuration', () => {
    test('should use existing hosted zone when hostedZoneId is provided', () => {
      const appWithExistingZone = new cdk.App({
        context: {
          domainName: 'testturing.com',
          hostedZoneId: 'Z1234567890ABC',
        },
      });
      const stackWithExistingZone = new TapStack(appWithExistingZone, 'TestExistingZoneStack', {
        environmentSuffix,
        env: { region: 'us-east-2', account: '123456789012' }
      });
      const templateWithExistingZone = Template.fromStack(stackWithExistingZone);

      // Should not create a new hosted zone
      templateWithExistingZone.templateMatches({
        Resources: Match.not(Match.objectLike({
          HostedZone: Match.anyValue(),
        })),
      });

      // Should still create Route 53 records
      templateWithExistingZone.hasResourceProperties('AWS::Route53::RecordSet', {
        HostedZoneId: 'Z1234567890ABC',
      });
    });

    test('should not create DNS resources when domainName is not provided', () => {
      const appWithoutDomain = new cdk.App({
        context: {
          // No domainName provided
        },
      });
      const stackWithoutDomain = new TapStack(appWithoutDomain, 'TestNoDomainStack', {
        environmentSuffix,
        env: { region: 'us-east-2', account: '123456789012' }
      });
      const templateWithoutDomain = Template.fromStack(stackWithoutDomain);

      // Should not create any Route 53 resources
      templateWithoutDomain.templateMatches({
        Resources: Match.not(Match.objectLike({
          HostedZone: Match.anyValue(),
        })),
      });

      templateWithoutDomain.templateMatches({
        Resources: Match.not(Match.objectLike({
          HealthCheck: Match.anyValue(),
        })),
      });

      templateWithoutDomain.templateMatches({
        Resources: Match.not(Match.objectLike({
          PrimaryRecord: Match.anyValue(),
        })),
      });

      // Should not create DNS-related outputs
      templateWithoutDomain.templateMatches({
        Outputs: Match.not(Match.objectLike({
          HostedZoneId: Match.anyValue(),
        })),
      });

      templateWithoutDomain.templateMatches({
        Outputs: Match.not(Match.objectLike({
          HealthCheckId: Match.anyValue(),
        })),
      });
    });
  });
});
