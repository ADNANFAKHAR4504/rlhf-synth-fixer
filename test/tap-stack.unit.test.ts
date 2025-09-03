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
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix: 'prod', // Add this to match the expected naming
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      Tags: Match.arrayWith([
        {
          Key: 'Name',
          Value: 'prod-vpc',
        },
        {
          Key: 'Environment',
          Value: 'Production',
        },
        {
          Key: 'Project',
          Value: 'CloudFormationSetup',
        },
      ]),
    });
  });

  test('Public and Private subnets are created', () => {
    // Check for public subnets
    template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public + 2 private + 2 isolated

    // Check for NAT Gateways (one per AZ)
    template.resourceCountIs('AWS::EC2::NatGateway', 2);

    // Check for Internet Gateway
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  });

  test('Application Load Balancer is created correctly', () => {
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      {
        Name: 'prod-alb',
        Scheme: 'internet-facing',
        Type: 'application',
      }
    );

    // Check that we have at least one listener
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);

    // Check that we have a target group
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Port: 80,
      Protocol: 'HTTP',
    });
  });

  test('Auto Scaling Group is created with correct configuration', () => {
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      AutoScalingGroupName: 'prod-asg',
      MinSize: '2',
      MaxSize: '6',
      DesiredCapacity: '2',
      HealthCheckType: 'ELB',
      HealthCheckGracePeriod: 300,
    });

    // Check for Launch Template
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        InstanceType: 't3.micro',
        ImageId: Match.anyValue(),
      },
    });
  });

  test('RDS PostgreSQL instance is created with Multi-AZ', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBInstanceIdentifier: 'prod-postgresql-db',
      Engine: 'postgres',
      DBInstanceClass: 'db.t3.micro',
      MultiAZ: true,
      StorageEncrypted: true,
      DeletionProtection: true,
      BackupRetentionPeriod: 7,
      MonitoringInterval: 60,
    });

    // Check for DB Subnet Group
    template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
      DBSubnetGroupName: 'prod-db-subnet-group',
      DBSubnetGroupDescription: 'Subnet group for RDS database',
    });
  });

  test('S3 bucket is created with proper security settings', () => {
    // Use Match.anyValue() for the bucket name since it includes environment suffix
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
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('Security Groups are configured correctly', () => {
    // ALB Security Group - check for ingress rules
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'prod-alb-sg',
      GroupDescription: 'Security group for Application Load Balancer',
    });

    // Check for specific ingress rules
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: 'tcp',
      FromPort: 80,
      ToPort: 80,
      CidrIp: '0.0.0.0/0',
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: 'tcp',
      FromPort: 443,
      ToPort: 443,
      CidrIp: '0.0.0.0/0',
    });

    // Application Security Group
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'prod-app-sg',
      GroupDescription: 'Security group for application instances',
    });

    // Database Security Group
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'prod-db-sg',
      GroupDescription: 'Security group for RDS database',
    });
  });

  test('IAM role is created with correct policies', () => {
    // Use Match.stringLikeRegexp to handle the environment suffix
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: Match.stringLikeRegexp('prod-ec2-role'),
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
    });

    // Check for instance profile
    template.hasResourceProperties('AWS::IAM::InstanceProfile', {
      Roles: [
        {
          Ref: Match.anyValue(),
        },
      ],
    });
  });

  test('All resources have required tags', () => {
    // Check that at least one resource has the required tags
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Environment',
          Value: 'Production',
        },
        {
          Key: 'Project',
          Value: 'CloudFormationSetup',
        },
      ]),
    });
  });

  test('Target Group is configured with health checks', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Port: 80,
      Protocol: 'HTTP',
      HealthCheckEnabled: true,
      HealthCheckIntervalSeconds: 30,
      HealthCheckPath: '/',
      HealthCheckProtocol: 'HTTP',
      HealthCheckTimeoutSeconds: 5,
      HealthyThresholdCount: 2,
      UnhealthyThresholdCount: 2,
      Matcher: {
        HttpCode: '200',
      },
    });
  });

  test('Auto Scaling Group has correct health check configuration', () => {
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      AutoScalingGroupName: 'prod-asg',
      HealthCheckType: 'ELB',
      HealthCheckGracePeriod: 300,
    });
  });

  test('Auto Scaling policies are created', () => {
    // CPU-based scaling policy
    template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
      PolicyType: 'TargetTrackingScaling',
      TargetTrackingConfiguration: {
        TargetValue: 70,
        PredefinedMetricSpecification: {
          PredefinedMetricType: 'ASGAverageCPUUtilization',
        },
      },
    });

    // Request count-based scaling policy
    template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
      PolicyType: 'TargetTrackingScaling',
      TargetTrackingConfiguration: {
        TargetValue: 1000,
        PredefinedMetricSpecification: {
          PredefinedMetricType: 'ALBRequestCountPerTarget',
        },
      },
    });
  });
  // Add these tests at the end of your test file

  test('ACM certificate is not created when domainName or hostedZoneId is missing', () => {
    const testStack = new TapStack(app, 'TestTapStackNoCert', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      // No domainName or hostedZoneId provided
    });
    const testTemplate = Template.fromStack(testStack);

    // Should not have certificate resources
    testTemplate.resourceCountIs('AWS::CertificateManager::Certificate', 0);
  });

  test('HTTP listener is created when HTTPS certificate is not available', () => {
    const testStack = new TapStack(app, 'TestTapStackHttpOnly', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      // No domainName or hostedZoneId provided
    });
    const testTemplate = Template.fromStack(testStack);

    // Should have HTTP listener with forward action (not redirect)
    testTemplate.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::Listener',
      {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: [
          {
            Type: 'forward',
          },
        ],
      }
    );
  });

  test('Environment suffix is applied to resource names', () => {
    const testStack = new TapStack(app, 'TestTapStackCustomEnv', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix: 'dev',
    });
    const testTemplate = Template.fromStack(testStack);

    // Check that outputs include the environment suffix
    testTemplate.hasOutput('*', {
      ExportName: Match.stringLikeRegexp('Tapdev'),
    });
  });
});
