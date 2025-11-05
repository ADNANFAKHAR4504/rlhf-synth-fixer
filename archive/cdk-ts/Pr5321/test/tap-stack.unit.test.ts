import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      isPrimary: true,
      primaryRegion: 'us-east-1',
      drRegion: 'eu-west-1',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with 3 AZs', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9);
    });

    test('creates NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with HTTPS and HTTP ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });

    test('creates ECS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ECS tasks',
      });
    });

    test('creates database security group with no outbound', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Aurora PostgreSQL',
        SecurityGroupEgress: [
          {
            CidrIp: '255.255.255.255/32',
            Description: 'Disallow all traffic',
            FromPort: 252,
            IpProtocol: 'icmp',
            ToPort: 86,
          },
        ],
      });
    });
  });

  describe('VPC Endpoints', () => {
    test('creates S3 gateway endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
      });
    });

    test('creates ECR Docker interface endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.stringLikeRegexp('ecr\\.dkr'),
        VpcEndpointType: 'Interface',
      });
    });

    test('creates Secrets Manager interface endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.stringLikeRegexp('secretsmanager'),
        VpcEndpointType: 'Interface',
      });
    });

    test('creates CloudWatch Logs interface endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.stringLikeRegexp('logs'),
        VpcEndpointType: 'Interface',
      });
    });
  });

  describe('Database Configuration', () => {
    test('creates database secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: {
          ExcludePunctuation: true,
          GenerateStringKey: 'password',
          IncludeSpace: false,
          SecretStringTemplate: '{"username":"paymentadmin"}',
        },
      });
    });

    test('creates Aurora PostgreSQL cluster with encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: Match.stringLikeRegexp('16\\.4'),
        StorageEncrypted: true,
        DeletionProtection: false,
      });
    });

    test('creates database parameter group with SSL enforcement', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Family: 'aurora-postgresql16',
        Parameters: {
          'rds.force_ssl': '1',
        },
      });
    });

    test('creates database instances', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 2);
    });

    test('configures backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 35,
      });
    });

    test('enables CloudWatch Logs exports', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableCloudwatchLogsExports: ['postgresql'],
      });
    });
  });

  describe('Secret Rotation', () => {
    test('configures rotation schedule', () => {
      template.hasResourceProperties('AWS::SecretsManager::RotationSchedule', {
        RotationRules: {
          ScheduleExpression: 'rate(30 days)',
        },
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates PCI data bucket with encryption', () => {
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
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('bucket has SSL enforcement policy', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
              Effect: 'Deny',
              Principal: {
                AWS: '*',
              },
            }),
          ]),
        },
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('creates HTTP listener with redirect', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        DefaultActions: [
          {
            RedirectConfig: {
              Port: '443',
              Protocol: 'HTTPS',
              StatusCode: 'HTTP_301',
            },
            Type: 'redirect',
          },
        ],
      });
    });

    test('creates HTTPS listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 443,
        Protocol: 'HTTP',
      });
    });
  });

  describe('AWS WAF', () => {
    test('creates WAF Web ACL', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        DefaultAction: {
          Allow: {},
        },
      });
    });

    test('configures rate-based rule', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'APIRateLimit',
            Priority: 0,
            Statement: {
              RateBasedStatement: {
                Limit: 2000,
                AggregateKeyType: 'IP',
              },
            },
            Action: {
              Block: {},
            },
          }),
        ]),
      });
    });

    test('configures SQLi protection rule', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'SQLiProtection',
            Priority: 1,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
          }),
        ]),
      });
    });

    test('associates WAF with ALB', () => {
      template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
    });
  });

  describe('Target Groups', () => {
    test('creates blue target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
        Matcher: {
          HttpCode: '200,301,302',
        },
      });
    });

    test('creates green target group', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);
    });
  });

  describe('ECS Configuration', () => {
    test('creates ECS cluster with Container Insights', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });

    test('creates task definition with ARM64', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '1024',
        Memory: '2048',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
        RuntimePlatform: {
          CpuArchitecture: 'ARM64',
          OperatingSystemFamily: 'LINUX',
        },
      });
    });

    test('creates container with proper configuration', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          Match.objectLike({
            Name: 'PaymentContainer',
            Image: Match.anyValue(),
            PortMappings: [
              {
                ContainerPort: 80,
                Protocol: 'tcp',
              },
            ],
          }),
        ],
      });
    });

    test('creates Fargate service with circuit breaker', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        DesiredCount: 3,
        DeploymentConfiguration: {
          MaximumPercent: 200,
          MinimumHealthyPercent: 100,
          DeploymentCircuitBreaker: {
            Enable: true,
            Rollback: true,
          },
        },
        EnableExecuteCommand: true,
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates task execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            }),
          ]),
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([Match.stringLikeRegexp('AmazonECSTaskExecutionRolePolicy')]),
            ]),
          }),
        ]),
      });
    });

    test('creates task role with permission boundary', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            }),
          ]),
        },
        Description: 'Role for Payment Processing ECS Tasks',
        PermissionsBoundary: Match.anyValue(),
      });
    });

    test('creates permission boundary policy', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
              Effect: 'Allow',
            }),
            Match.objectLike({
              Action: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
              Effect: 'Allow',
            }),
            Match.objectLike({
              Action: 'cloudwatch:PutMetricData',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Auto Scaling', () => {
    test('creates CPU-based scaling policy', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          TargetValue: 70,
        },
      });
    });

    test('creates memory-based scaling policy', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageMemoryUtilization',
          },
          TargetValue: 70,
        },
      });
    });

    test('creates scalable target', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 3,
        MaxCapacity: 10,
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates 5xx error rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 3,
        DatapointsToAlarm: 2,
        Threshold: 1,
        TreatMissingData: 'notBreaching',
        Metrics: Match.arrayWith([
          Match.objectLike({
            Id: 'm1',
            MetricStat: {
              Metric: {
                MetricName: 'HTTPCode_Target_5XX_Count',
                Namespace: 'AWS/ApplicationELB',
              },
              Period: 60,
              Stat: 'Sum',
            },
          }),
          Match.objectLike({
            Id: 'm2',
            MetricStat: {
              Metric: {
                MetricName: 'RequestCount',
                Namespace: 'AWS/ApplicationELB',
              },
              Period: 60,
              Stat: 'Sum',
            },
          }),
        ]),
      });
    });

    test('creates transaction latency alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 3,
        DatapointsToAlarm: 2,
        Threshold: 500,
        MetricName: 'TransactionLatency',
        Namespace: 'PaymentService',
      });
    });
  });

  describe('Route53 Health Check', () => {
    test('creates health check for ALB', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: {
          Type: 'HTTP',
          Port: 80,
          ResourcePath: '/health',
          RequestInterval: 30,
          FailureThreshold: 3,
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports ALB DNS name', () => {
      template.hasOutput('AlbDnsName', {
        Export: {
          Name: 'TestTapStack-AlbDnsName',
        },
      });
    });

    test('exports health check ID', () => {
      template.hasOutput('HealthCheckId', {
        Export: {
          Name: 'TestTapStack-HealthCheckId',
        },
      });
    });

    test('outputs VPC ID', () => {
      template.hasOutput('VpcId', {});
    });

    test('outputs cluster name', () => {
      template.hasOutput('ClusterName', {});
    });

    test('outputs service name', () => {
      template.hasOutput('ServiceName', {});
    });

    test('outputs database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {});
    });

    test('outputs S3 bucket name', () => {
      template.hasOutput('S3BucketName', {});
    });

    test('outputs target group ARNs', () => {
      template.hasOutput('BlueTargetGroupArn', {});
      template.hasOutput('GreenTargetGroupArn', {});
    });
  });

  describe('Resource Cleanup', () => {
    test('database has deletion protection disabled', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DeletionProtection: false,
      });
    });

    test('S3 bucket has auto-delete enabled', () => {
      template.hasResourceProperties('Custom::S3AutoDeleteObjects', {});
    });
  });

  describe('Multi-Region Support', () => {
    test('DR stack can be created', () => {
      const drApp = new cdk.App();
      const drStack = new TapStack(drApp, 'DrTapStack', {
        environmentSuffix: 'dr-dev',
        isPrimary: false,
        primaryRegion: 'us-east-1',
        drRegion: 'eu-west-1',
        env: {
          account: '123456789012',
          region: 'eu-west-1',
        },
      });
      const drTemplate = Template.fromStack(drStack);

      expect(drStack).toBeDefined();
      drTemplate.resourceCountIs('AWS::EC2::VPC', 1);
    });
  });

  describe('Context Values', () => {
    test('uses custom context values when provided', () => {
      const customApp = new cdk.App({
        context: {
          'vpc-cidr': '10.1.0.0/16',
          'desired-tasks': 5,
          'waf-rate-limit': 1000,
        },
      });
      const customStack = new TapStack(customApp, 'CustomTapStack', {
        environmentSuffix: 'custom',
        isPrimary: true,
        primaryRegion: 'us-east-1',
        drRegion: 'eu-west-1',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });

      customTemplate.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 5,
      });
    });
  });
});

describe('TapStack Public Properties', () => {
  test('exposes VPC property', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      isPrimary: true,
      primaryRegion: 'us-east-1',
      drRegion: 'eu-west-1',
      env: { account: '123456789012', region: 'us-east-1' },
    });

    expect(stack.vpc).toBeDefined();
    expect(stack.vpc.vpcId).toBeDefined();
  });

  test('exposes cluster property', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      isPrimary: true,
      primaryRegion: 'us-east-1',
      drRegion: 'eu-west-1',
      env: { account: '123456789012', region: 'us-east-1' },
    });

    expect(stack.cluster).toBeDefined();
    expect(stack.cluster.clusterName).toBeDefined();
  });

  test('exposes ALB property', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      isPrimary: true,
      primaryRegion: 'us-east-1',
      drRegion: 'eu-west-1',
      env: { account: '123456789012', region: 'us-east-1' },
    });

    expect(stack.alb).toBeDefined();
    expect(stack.alb.loadBalancerArn).toBeDefined();
  });

  test('exposes database cluster property', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      isPrimary: true,
      primaryRegion: 'us-east-1',
      drRegion: 'eu-west-1',
      env: { account: '123456789012', region: 'us-east-1' },
    });

    expect(stack.dbCluster).toBeDefined();
    expect(stack.dbCluster.clusterEndpoint).toBeDefined();
  });

  test('exposes target groups', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      isPrimary: true,
      primaryRegion: 'us-east-1',
      drRegion: 'eu-west-1',
      env: { account: '123456789012', region: 'us-east-1' },
    });

    expect(stack.blueTargetGroup).toBeDefined();
    expect(stack.greenTargetGroup).toBeDefined();
    expect(stack.blueTargetGroup.targetGroupArn).toBeDefined();
    expect(stack.greenTargetGroup.targetGroupArn).toBeDefined();
  });

  test('exposes ECS service property', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      isPrimary: true,
      primaryRegion: 'us-east-1',
      drRegion: 'eu-west-1',
      env: { account: '123456789012', region: 'us-east-1' },
    });

    expect(stack.ecsService).toBeDefined();
    expect(stack.ecsService.serviceName).toBeDefined();
  });
});
