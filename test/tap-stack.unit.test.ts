import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack - High Availability Infrastructure', () => {
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

  describe('Stack initialization', () => {
    test('Uses default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'TapStackDefault', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      // Check that resources are created with 'dev' suffix
      defaultTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('TapStack.*dev.*VPC'),
          }),
        ]),
      });
    });

    test('Uses provided environment suffix', () => {
      // This is already covered by the main template
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(
              `TapStack.*${environmentSuffix}.*VPC`
            ),
          }),
        ]),
      });
    });

    test('Creates stack with empty props object', () => {
      const emptyPropsApp = new cdk.App();
      const emptyPropsStack = new TapStack(emptyPropsApp, 'TapStackEmpty');
      const emptyPropsTemplate = Template.fromStack(emptyPropsStack);

      // Check that stack is created successfully with defaults
      emptyPropsTemplate.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('Creates stack with undefined props', () => {
      const undefinedPropsApp = new cdk.App();
      const undefinedPropsStack = new TapStack(
        undefinedPropsApp,
        'TapStackUndefined',
        undefined as any
      );
      const undefinedPropsTemplate = Template.fromStack(undefinedPropsStack);

      // Check that stack is created successfully with defaults
      undefinedPropsTemplate.resourceCountIs('AWS::EC2::VPC', 1);
    });
  });

  describe('VPC and Network Configuration', () => {
    test('Creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Creates subnets across multiple availability zones', () => {
      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 public, 3 private, 3 database

      // Verify public subnet configuration
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          }),
        ]),
      });
    });

    test('Creates NAT Gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });

    test('Creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('Creates appropriate route tables', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
      });
    });
  });

  describe('Security Groups', () => {
    test('Creates ALB security group with correct rules', () => {
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

    test('Creates EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
    });

    test('Creates database security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });

      // Check for MySQL port ingress rule
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
      });
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('Creates Auto Scaling Group with correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '2',
      });
    });

    test('Creates Launch Template with user data', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
          UserData: Match.anyValue(),
        }),
      });
    });

    test('Creates scaling policies for CPU utilization', () => {
      // Target tracking scaling policy
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: Match.objectLike({
          TargetValue: 70,
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          }),
        }),
      });

      // Step scaling policy exists
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'StepScaling',
      });

      // Verify we have both types of policies
      template.resourceCountIs('AWS::AutoScaling::ScalingPolicy', 3);
    });

    test('Configures ELB health check for Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300,
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('Creates Application Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('Creates Target Group with health checks', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 80,
          Protocol: 'HTTP',
          HealthCheckEnabled: true,
          HealthCheckPath: '/',
          HealthCheckProtocol: 'HTTP',
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 3,
          HealthCheckTimeoutSeconds: 5,
          HealthCheckIntervalSeconds: 30,
        }
      );
    });

    test('Creates ALB Listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('RDS Database Configuration', () => {
    test('Creates Multi-AZ RDS instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true,
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.small',
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
        EnablePerformanceInsights: false,
      });
    });

    test('Creates RDS Read Replica', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        SourceDBInstanceIdentifier: Match.anyValue(),
        DBInstanceClass: 'db.t3.small',
      });
    });

    test('Creates RDS Subnet Group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('Creates RDS Parameter Group', () => {
      template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
        Description: 'Parameter group for MySQL 8.0',
        Family: 'mysql8.0',
      });
    });

    test('Creates database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: Match.stringLikeRegexp(
          `TapStack-${environmentSuffix}-db-credentials`
        ),
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"admin"}',
        }),
      });
    });
  });

  describe('Monitoring and Alarms', () => {
    test('Creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'High Availability Alerts',
      });
    });

    test('Creates CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('Creates database connections alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
        Threshold: 80,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('Creates ALB target response time alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'TargetResponseTime',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
      });
    });

    test('Creates unhealthy host count alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'UnHealthyHostCount',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
      });
    });

    test('Creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp(
          `TapStack-${environmentSuffix}-HighAvailability`
        ),
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Creates IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('CloudWatchAgentServerPolicy'),
              ]),
            ]),
          }),
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('AmazonSSMManagedInstanceCore'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('Creates instance profile for EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: Match.anyValue(),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Exports Load Balancer DNS', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'DNS name of the Application Load Balancer',
      });
    });

    test('Exports Database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
      });
    });

    test('Exports Auto Scaling Group name', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group name',
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('Resources follow naming pattern', () => {
      // Check VPC naming
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(
              `TapStack.*${environmentSuffix}.*VPC`
            ),
          }),
        ]),
      });
    });
  });

  describe('High Availability Features', () => {
    test('Ensures multi-AZ deployment for critical resources', () => {
      // RDS Multi-AZ
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true,
      });

      // Multiple NAT Gateways
      template.resourceCountIs('AWS::EC2::NatGateway', 3);

      // Auto Scaling across multiple AZs (implied by subnet configuration)
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        VPCZoneIdentifier: Match.anyValue(),
      });
    });

    test('Implements automatic recovery mechanisms', () => {
      // Auto Scaling health checks
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        HealthCheckType: 'ELB',
      });

      // Scaling policies for automatic scaling (1 target tracking + 2 step scaling policies)
      template.resourceCountIs('AWS::AutoScaling::ScalingPolicy', 3);
    });
  });
});
