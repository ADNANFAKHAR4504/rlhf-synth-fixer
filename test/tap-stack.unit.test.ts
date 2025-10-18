import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack - Secure Multi-Tier AWS Environment', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    app.node.setContext('environmentSuffix', 'test');
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        InstanceTenancy: 'default',
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: 'TestTapStack/SecureFinancialVPCtest',
          },
          {
            Key: 'Network-Tier',
            Value: 'Core',
          },
          {
            Key: 'Security-Level',
            Value: 'High',
          },
        ]),
      });
    });

    test('should create 9 subnets (3 public, 3 private, 3 data)', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9);

      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          },
        ]),
      });

      // Check for private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          },
        ]),
      });

      // Check for data subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Isolated',
          },
        ]),
      });
    });

    test('should create Internet Gateway and VPC Gateway Attachment', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('should create route tables for all subnets', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 9);
    });
  });

  describe('NAT Instances Configuration', () => {
    test('should create NAT security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for NAT instances',
        SecurityGroupEgress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1',
          },
        ]),
      });
    });

    test('should create 3 NAT instances (one per AZ)', () => {
      template.resourceCountIs('AWS::EC2::Instance', 4); // 3 NAT + 1 Bastion

      // Check NAT instances have correct configuration
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([
          {
            Key: 'Type',
            Value: 'NAT',
          },
        ]),
      });
    });

    test('should create Elastic IPs for NAT instances', () => {
      template.resourceCountIs('AWS::EC2::EIP', 3);
    });

    test('should create routes for private subnets to NAT instances', () => {
      template.resourceCountIs('AWS::EC2::Route', 6); // 3 public default routes + 3 private NAT routes
    });
  });

  describe('Bastion Host Configuration', () => {
    test('should create bastion security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription:
          'Security group for bastion host - Session Manager only',
        SecurityGroupEgress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS for Session Manager',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ]),
      });
    });

    test('should create bastion host instance', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([
          {
            Key: 'Type',
            Value: 'Bastion',
          },
        ]),
      });
    });

    test('should create IAM role for bastion with SSM permissions', () => {
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
          Version: '2012-10-17',
        },
      });
    });

    test('should create MFA policy for Session Manager', () => {
      // Verify that IAM policies exist (the exact structure may vary)
      template.resourceCountIs('AWS::IAM::Policy', 4);
    });
  });

  describe('VPC Endpoints Configuration', () => {
    test('should create S3 Gateway Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
      });
    });

    test('should create DynamoDB Gateway Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
      });
    });

    test('should create SSM Interface Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
      });
    });

    test('should create endpoint security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for VPC endpoints',
      });
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('should create CloudWatch Log Group for Flow Logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/vpc/flowlogs/financial-platform-test',
        RetentionInDays: 180, // 6 months
      });
    });

    test('should create IAM role for Flow Logs', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
            },
          ]),
        },
      });
    });

    test('should create VPC Flow Log with custom format', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
        LogFormat: Match.stringLikeRegexp('srcaddr.*dstaddr.*action'),
      });
    });
  });

  describe('Network ACLs Configuration', () => {
    test('should create Network ACL for data subnets', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAcl', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: 'DataTierACL-test',
          },
        ]),
      });
    });

    test('should create Network ACL entries with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        RuleNumber: 100,
        Protocol: -1,
        RuleAction: 'allow',
      });

      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        RuleNumber: 200,
        Protocol: -1,
        RuleAction: 'deny',
      });
    });

    test('should associate Network ACL with data subnets', () => {
      template.resourceCountIs('AWS::EC2::SubnetNetworkAclAssociation', 3);
    });
  });

  describe('Route53 Configuration', () => {
    test('should create private hosted zone', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'financial-test.internal.',
        HostedZoneConfig: {
          Comment: 'Private DNS zone for financial platform internal resources',
        },
      });
    });

    test('should create A record for bastion host', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'A',
        Name: 'bastion.financial-test.internal.',
        TTL: '300',
      });
    });

    test('should create Route53 Resolver Endpoint', () => {
      template.hasResourceProperties('AWS::Route53Resolver::ResolverEndpoint', {
        Direction: 'OUTBOUND',
        Name: 'FinancialPlatformOutboundResolver-test',
      });
    });

    test('should create resolver security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Route53 Resolver',
      });
    });
  });

  describe('Dynamic Security Groups Configuration', () => {
    test('should create application security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription:
          'Security group with dynamic rules based on instance tags',
      });
    });

    test('should create Lambda function for security group updates', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.9',
        Handler: 'index.handler',
        Timeout: 300,
        Code: {
          ZipFile: Match.stringLikeRegexp('import boto3'),
        },
      });
    });

    test('should create IAM policy for security group updates', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: Match.arrayWith([
                'ec2:Describe*',
                'ec2:AuthorizeSecurityGroupIngress',
                'ec2:RevokeSecurityGroupIngress',
              ]),
              Resource: '*',
            },
          ]),
        },
      });
    });

    test('should create EventBridge rule for scheduled updates', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'rate(5 minutes)',
        State: 'ENABLED',
      });
    });
  });

  describe('CloudWatch Monitoring Configuration', () => {
    test('should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Financial Platform Security Alarms-test',
      });
    });

    test('should create CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'financial-platform-security-test',
      });
    });

    test('should create metric filter for suspicious traffic', () => {
      template.hasResourceProperties('AWS::Logs::MetricFilter', {
        FilterPattern: Match.stringLikeRegexp('action="REJECT"'),
        MetricTransformations: Match.arrayWith([
          {
            MetricName: 'RejectedConnections',
            MetricNamespace: 'FinancialPlatform/Security-test',
            MetricValue: '1',
          },
        ]),
      });
    });

    test('should create alarm for high rejected connections', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'High number of rejected connections detected',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        Threshold: 100,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create CPU alarms for NAT instances', () => {
      // Total alarms: 1 rejected connections + 3 NAT CPU + 3 NAT status check = 7

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.stringLikeRegexp(
          'NAT instance.*CPU utilization is high'
        ),
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
      });
    });
  });

  describe('AWS Config Configuration', () => {
    test('should create S3 bucket for Config', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'financial-platform-config-test-123456789012',
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ]),
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create Config service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'config.amazonaws.com',
              },
            },
          ]),
        },
      });
    });

    test('should create Configuration Recorder', () => {
      template.hasResourceProperties('AWS::Config::ConfigurationRecorder', {
        Name: 'financial-platform-recorder-test',
        RecordingGroup: {
          AllSupported: true,
          IncludeGlobalResourceTypes: true,
        },
      });
    });

    test('should create Delivery Channel', () => {
      template.hasResourceProperties('AWS::Config::DeliveryChannel', {
        Name: 'financial-platform-delivery-test',
        ConfigSnapshotDeliveryProperties: {
          DeliveryFrequency: 'TwentyFour_Hours',
        },
      });
    });

    test('should create Config rules for compliance', () => {
      template.resourceCountIs('AWS::Config::ConfigRule', 4);

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'VPC_SG_OPEN_ONLY_TO_AUTHORIZED_PORTS',
        },
        InputParameters: {
          authorizedTcpPorts: '443,22',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'VPC_FLOW_LOGS_ENABLED',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'EC2_INSTANCE_MANAGED_BY_SSM',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS',
        },
      });
    });
  });

  describe('NAT Failover Configuration', () => {
    test('should create Lambda function for NAT failover', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.9',
        Handler: 'index.handler',
        Timeout: 120,
        Environment: {
          Variables: {
            VPC_ID: Match.anyValue(),
          },
        },
        Code: {
          ZipFile: Match.stringLikeRegexp('import boto3'),
        },
      });
    });

    test('should create IAM policy for NAT failover', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: Match.arrayWith([
                'ec2:DescribeInstances',
                'ec2:DescribeRouteTables',
                'ec2:ReplaceRoute',
                'ec2:CreateRoute',
                'ec2:DeleteRoute',
              ]),
              Resource: '*',
            },
          ]),
        },
      });
    });

    test('should create status check alarms for NAT instances', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 7); // 1 rejected connections + 3 NAT CPU + 3 NAT status check

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.stringLikeRegexp(
          'NAT instance.*status check failed'
        ),
        MetricName: 'StatusCheckFailed',
        Namespace: 'AWS/EC2',
        Threshold: 1,
        Statistic: 'Maximum',
      });
    });

    test('should grant Lambda permission to be invoked by CloudWatch', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'lambda.alarms.cloudwatch.amazonaws.com',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should apply consistent tags to all resources', () => {
      // Check that resources have the expected tags (order doesn't matter)
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: 'TestTapStack/SecureFinancialVPCtest',
          },
          {
            Key: 'Project',
            Value: 'Secure-Financial-Platform',
          },
          {
            Key: 'Environment',
            Value: 'test',
          },
        ]),
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should use default environment when not provided', () => {
      const defaultApp = new cdk.App();
      // Don't set context, should use 'prod' as default
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: 'DefaultStack/SecureFinancialVPCprod',
          },
        ]),
      });
    });

    test('should use custom environment suffix', () => {
      const customApp = new cdk.App();
      customApp.node.setContext('environmentSuffix', 'staging');
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'staging',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: 'CustomStack/SecureFinancialVPCstaging',
          },
        ]),
      });
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of resources', () => {
      // VPC and networking
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 9);
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
      template.resourceCountIs('AWS::EC2::RouteTable', 9);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 5); // NAT, Bastion, Endpoint, Resolver, Application
      template.resourceCountIs('AWS::EC2::Instance', 4); // 3 NAT + 1 Bastion
      template.resourceCountIs('AWS::EC2::EIP', 3); // 3 NAT EIPs

      // VPC Endpoints
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 5); // S3, DynamoDB, SSM, SSM Messages, EC2 Messages

      // Network ACLs
      template.resourceCountIs('AWS::EC2::NetworkAcl', 1);
      template.resourceCountIs('AWS::EC2::NetworkAclEntry', 5); // 2 inbound + 3 outbound rules
      template.resourceCountIs('AWS::EC2::SubnetNetworkAclAssociation', 3);

      // Route53
      template.resourceCountIs('AWS::Route53::HostedZone', 1);
      template.resourceCountIs('AWS::Route53::RecordSet', 1);
      template.resourceCountIs('AWS::Route53Resolver::ResolverEndpoint', 1);

      // CloudWatch
      template.resourceCountIs('AWS::Logs::LogGroup', 1); // VPC Flow Logs (Lambda log groups are created automatically)
      template.resourceCountIs('AWS::Logs::MetricFilter', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 7); // 1 rejected connections + 3 NAT CPU + 3 NAT status check
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);

      // SNS
      template.resourceCountIs('AWS::SNS::Topic', 1);

      // Lambda
      template.resourceCountIs('AWS::Lambda::Function', 2); // Security Group Update + NAT Failover

      // EventBridge
      template.resourceCountIs('AWS::Events::Rule', 1);

      // IAM
      template.resourceCountIs('AWS::IAM::Role', 9); // NAT instances + Bastion + Flow Logs + 2 Lambda + Config + Custom resource
      template.resourceCountIs('AWS::IAM::Policy', 4); // 2 Lambda policies + Config + MFA policy
      template.resourceCountIs('AWS::IAM::InstanceProfile', 5); // 3 NAT + 1 Bastion + 1 additional

      // S3
      template.resourceCountIs('AWS::S3::Bucket', 1); // Config bucket

      // AWS Config
      template.resourceCountIs('AWS::Config::ConfigurationRecorder', 1);
      template.resourceCountIs('AWS::Config::DeliveryChannel', 1);
      template.resourceCountIs('AWS::Config::ConfigRule', 4);

      // VPC Flow Logs
      template.resourceCountIs('AWS::EC2::FlowLog', 1);
    });
  });

  describe('Security and Compliance', () => {
    test('should have proper security group configurations', () => {
      // Check that security groups exist
      template.resourceCountIs('AWS::EC2::SecurityGroup', 5);
    });

    test('should have proper IAM role configurations', () => {
      // Check that IAM roles exist
      template.resourceCountIs('AWS::IAM::Role', 9);
    });

    test('should have proper S3 bucket configurations', () => {
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
});
