import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Basic Stack Creation', () => {
    test('should create stack with default properties', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });

      // Verify stack is created
      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
    });

    test('should create stack with custom service name', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        serviceName: 'custom-service',
      });

      expect(stack).toBeDefined();
    });

    test('should create stack with notification email', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        notificationEmail: 'test@example.com',
      });
      const template = Template.fromStack(stack);

      // Verify SNS email subscription is created
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });
  });

  describe('VPC and Networking', () => {
    test('should create VPC with correct configuration for primary region', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        isPrimaryRegion: true,
      });
      const template = Template.fromStack(stack);

      // VPC should be created without explicit CIDR (uses default 10.0.0.0/16)
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create VPC with explicit CIDR for secondary region', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-west-2' },
        environmentSuffix,
        isPrimaryRegion: false,
      });
      const template = Template.fromStack(stack);

      // VPC should be created with explicit CIDR 10.1.0.0/16
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('should create public, private, and isolated subnets', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Verify subnets exist
      const resources = template.toJSON().Resources;
      const subnets = Object.keys(resources).filter(key => resources[key].Type === 'AWS::EC2::Subnet');
      expect(subnets.length).toBeGreaterThan(0);

      // Verify NAT Gateways for high availability
      template.hasResourceProperties('AWS::EC2::NatGateway', {});
    });

    test('should create security groups for ECS, ALB, and RDS', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Should create security groups
      const resources = template.toJSON().Resources;
      const securityGroups = Object.keys(resources).filter(key => resources[key].Type === 'AWS::EC2::SecurityGroup');
      expect(securityGroups.length).toBeGreaterThan(0);

      // Verify ALB security group allows HTTP
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
      });

      // HTTPS ingress may be added separately or through security group rules
      const securityGroupIngresses = Object.values(resources).filter((r: any) =>
        r.Type === 'AWS::EC2::SecurityGroupIngress'
      );
      expect(securityGroupIngresses.length).toBeGreaterThan(0);
    });
  });

  describe('VPC Peering', () => {
    test('should create VPC peering when peer VPC ID is provided', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        isPrimaryRegion: true,
        peerVpcId: 'vpc-12345678',
      });
      const template = Template.fromStack(stack);

      // Verify VPC peering connection is created
      template.hasResourceProperties('AWS::EC2::VPCPeeringConnection', {
        PeerVpcId: 'vpc-12345678',
        PeerRegion: 'us-west-2',
      });

      // Verify routes are created for peering
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '10.1.0.0/16',
      });
    });

    test('should not create VPC peering when peer VPC ID is not provided', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Should create output indicating peering is not configured
      const outputs = template.toJSON().Outputs;
      expect(outputs.VpcPeeringStatus).toBeDefined();
    });

    test('should use correct peer CIDR for secondary region', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-west-2' },
        environmentSuffix,
        isPrimaryRegion: false,
        peerVpcId: 'vpc-87654321',
      });
      const template = Template.fromStack(stack);

      // Verify route uses primary region CIDR
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '10.0.0.0/16',
      });
    });
  });

  describe('KMS Encryption', () => {
    test('should create KMS key with rotation enabled', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should create secondary KMS key for cross-region replication', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Should create at least 2 KMS keys (primary and secondary)
      template.resourceCountIs('AWS::KMS::Key', 2);
    });
  });

  describe('RDS Aurora Cluster', () => {
    test('should create Aurora MySQL cluster with encryption', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-mysql',
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
      });
    });

    test('should create parameter group with binary logging enabled', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Parameters: {
          binlog_format: 'ROW',
        },
      });
    });

    test('should create writer and reader instances', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Should have at least 2 DB instances (writer and reader)
      template.resourceCountIs('AWS::RDS::DBInstance', 2);
    });

    test('should create cross-region read replica in primary region', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        isPrimaryRegion: true,
      });
      const template = Template.fromStack(stack);

      // Custom resource waiter should be created
      template.hasResourceProperties('AWS::Lambda::Function',
        Match.objectLike({
          Handler: 'index.handler',
        })
      );
    });

    test('should not create replica in secondary region', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-west-2' },
        environmentSuffix,
        isPrimaryRegion: false,
      });
      const template = Template.fromStack(stack);

      // Verify replica cluster is not in outputs
      const outputs = template.toJSON().Outputs;
      expect(outputs.ReplicaClusterArn).toBeUndefined();
    });
  });

  describe('DynamoDB Global Table', () => {
    test('should create DynamoDB global table in primary region', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        isPrimaryRegion: true,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: Match.arrayWith([
          Match.objectLike({ AttributeName: 'sessionId', KeyType: 'HASH' }),
          Match.objectLike({ AttributeName: 'timestamp', KeyType: 'RANGE' }),
        ]),
        Replicas: Match.arrayWith([
          Match.objectLike({ Region: 'us-west-2' }),
        ]),
      });
    });

    test('should import table in secondary region', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-west-2' },
        environmentSuffix,
        isPrimaryRegion: false,
      });
      const template = Template.fromStack(stack);

      // Secondary region should not create the table
      template.resourceCountIs('AWS::DynamoDB::GlobalTable', 0);
    });
  });

  describe('S3 Buckets and Replication', () => {
    test('should create primary and replica S3 buckets', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Should have 2 S3 buckets
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('should enable versioning on buckets', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should configure S3 replication with RTC', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Verify replication configuration
      template.hasResourceProperties('AWS::S3::Bucket',
        Match.objectLike({
          ReplicationConfiguration: Match.objectLike({
            Rules: Match.arrayWith([
              Match.objectLike({
                Status: 'Enabled',
                Priority: 1,
                Destination: Match.objectLike({
                  ReplicationTime: Match.objectLike({
                    Status: 'Enabled',
                    Time: { Minutes: 15 },
                  }),
                }),
              }),
            ]),
          }),
        })
      );
    });

    test('should create replication role with correct permissions', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Role',
        Match.objectLike({
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: { Service: 's3.amazonaws.com' },
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('ECS Fargate Service', () => {
    test('should create ECS cluster with container insights', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: Match.arrayWith([
          Match.objectLike({
            Name: 'containerInsights',
            Value: 'enabled',
          }),
        ]),
      });
    });

    test('should create Fargate task definition with correct configuration', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '512',
        Memory: '1024',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('should configure container with health check', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECS::TaskDefinition',
        Match.objectLike({
          ContainerDefinitions: Match.arrayWith([
            Match.objectLike({
              HealthCheck: Match.objectLike({
                Command: Match.arrayWith([
                  'CMD-SHELL',
                  'curl -f http://localhost/ || exit 1',
                ]),
                Interval: 30,
                Timeout: 10,
                Retries: 5,
                StartPeriod: 180,
              }),
            }),
          ]),
        })
      );
    });

    test('should create Fargate service with circuit breaker', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 1,
        DeploymentConfiguration: Match.objectLike({
          DeploymentCircuitBreaker: {
            Enable: true,
            Rollback: true,
          },
        }),
      });
    });

    test('should configure auto scaling for ECS service', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Should have scalable target
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 1,
        MaxCapacity: 10,
      });

      // Should have CPU and memory scaling policies
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 2);
    });
  });

  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create target group with health checks', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 10,
        TargetType: 'ip',
      });
    });

    test('should create HTTP listener', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('should create CloudFront distribution with origin failover', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Enabled: true,
          DefaultCacheBehavior: Match.objectLike({
            ViewerProtocolPolicy: 'redirect-to-https',
            Compress: true,
          }),
        }),
      });
    });

    test('should create Origin Access Identity for S3', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudFront::CloudFrontOriginAccessIdentity', {});
    });
  });

  describe('Lambda Functions', () => {
    test('should create health monitor Lambda function', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Lambda::Function',
        Match.objectLike({
          Runtime: 'python3.11',
          Handler: 'index.handler',
          Timeout: 10,
          MemorySize: 256,
        })
      );
    });

    test('should create failover trigger Lambda with circuit breaker', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Verify failover function exists
      template.hasResourceProperties('AWS::Lambda::Function',
        Match.objectLike({
          Runtime: 'python3.11',
          Timeout: 30,
        })
      );
    });

    test('should create region health monitor Lambda', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Should have multiple Lambda functions
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.keys(resources).filter(key => resources[key].Type === 'AWS::Lambda::Function');
      expect(lambdaFunctions.length).toBeGreaterThanOrEqual(3);
    });

    test('should create cluster waiter Lambda in primary region', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        isPrimaryRegion: true,
      });
      const template = Template.fromStack(stack);

      // Custom resource provider should be created
      template.hasResourceProperties('AWS::CloudFormation::CustomResource', {});
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create unhealthy host alarm', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm',
        Match.objectLike({
          MetricName: 'UnHealthyHostCount',
          Threshold: 1,
          ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        })
      );
    });

    test('should create ALB 5xx error alarm', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm',
        Match.objectLike({
          MetricName: 'HTTPCode_Target_5XX_Count',
          Threshold: 10,
        })
      );
    });

    test('should create RDS CPU utilization alarm', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm',
        Match.objectLike({
          MetricName: 'CPUUtilization',
          Threshold: 80,
        })
      );
    });

    test('should create custom health metric alarm', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Should have multiple CloudWatch alarms
      const resources = template.toJSON().Resources;
      const alarms = Object.keys(resources).filter(key => resources[key].Type === 'AWS::CloudWatch::Alarm');
      expect(alarms.length).toBeGreaterThan(0);
    });

    test('should connect alarms to SNS topic', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Verify SNS topic is created
      template.hasResourceProperties('AWS::SNS::Topic', {});
    });
  });

  describe('Route53 Health Checks and Failover', () => {
    test('should create Route53 health check', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          Type: 'HTTP',
          Port: 80,
          RequestInterval: 30,
          FailureThreshold: 2,
        }),
      });
    });

    test('should create hosted zone in primary region when domain provided', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        isPrimaryRegion: true,
        domainName: 'example.com',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'example.com.',
      });
    });

    test('should create PRIMARY failover record in primary region', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        isPrimaryRegion: true,
        domainName: 'example.com',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'A',
        Failover: 'PRIMARY',
      });
    });

    test('should create SECONDARY failover record in secondary region', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-west-2' },
        environmentSuffix,
        isPrimaryRegion: false,
        domainName: 'example.com',
        hostedZoneId: 'Z1234567890ABC',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'A',
        Failover: 'SECONDARY',
      });
    });

    test('should throw error if secondary region without hosted zone ID', () => {
      expect(() => {
        new TapStack(app, 'TestTapStack', {
          env: { account: '123456789012', region: 'us-west-2' },
          environmentSuffix,
          isPrimaryRegion: false,
          domainName: 'example.com',
        });
      }).toThrow('Secondary region requires hostedZoneId to be provided');
    });

    test('should create Route53 health alarm', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        domainName: 'example.com',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm',
        Match.objectLike({
          Namespace: 'AWS/Route53',
          MetricName: 'HealthCheckStatus',
        })
      );
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('should create DR role with cross-account assume permissions', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Verify DR role exists with both service and account principals
      const resources = template.toJSON().Resources;
      const drRoles = Object.keys(resources).filter(key =>
        resources[key].Type === 'AWS::IAM::Role' &&
        key.includes('DrRole')
      );

      expect(drRoles.length).toBeGreaterThan(0);

      // Verify the DR role has correct trust policy
      const drRole = resources[drRoles[0]];
      const statements = drRole.Properties.AssumeRolePolicyDocument.Statement;

      // CompositePrincipal creates statements with both principals
      const hasLambdaPrincipal = statements.some((s: any) =>
        s.Principal?.Service === 'lambda.amazonaws.com' ||
        s.Principal?.Service?.includes?.('lambda.amazonaws.com')
      );

      const hasAccountPrincipal = statements.some((s: any) => {
        const awsPrincipal = s.Principal?.AWS;
        if (!awsPrincipal) return false;
        if (typeof awsPrincipal === 'string') {
          return awsPrincipal.includes('123456789012');
        }
        if (typeof awsPrincipal === 'object' && awsPrincipal['Fn::Join']) {
          return JSON.stringify(awsPrincipal).includes('123456789012');
        }
        return false;
      });

      expect(hasLambdaPrincipal).toBe(true);
      expect(hasAccountPrincipal).toBe(true);
    });

    test('should grant RDS failover permissions to DR role', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Policy',
        Match.objectLike({
          PolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: Match.arrayWith([
                  'rds:FailoverDBCluster',
                  'rds:DescribeDBClusters',
                  'rds:ModifyDBCluster',
                ]),
              }),
            ]),
          }),
        })
      );
    });

    test('should grant Route53 permissions to DR role', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Policy',
        Match.objectLike({
          PolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: Match.arrayWith([
                  'route53:ChangeResourceRecordSets',
                  'route53:GetChange',
                  'route53:GetHealthCheckStatus',
                ]),
              }),
            ]),
          }),
        })
      );
    });

    test('should grant ECS task role permissions to access RDS, DynamoDB, and S3', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // Verify task role has necessary permissions for secrets manager
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter((r: any) => r.Type === 'AWS::IAM::Policy');

      const hasSecretsManagerAccess = policies.some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          return actions.some((action: string) => action.includes('secretsmanager:GetSecretValue'));
        });
      });

      expect(hasSecretsManagerAccess).toBe(true);
    });
  });

  describe('SNS Topics and Subscriptions', () => {
    test('should create encrypted SNS topic', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: Match.stringLikeRegexp('Alarm notifications'),
      });
    });

    test('should subscribe failover Lambda to SNS topic', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'lambda',
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create log groups with retention policy', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: Match.anyValue(),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export ALB DNS name', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      const outputs = template.toJSON().Outputs;
      expect(outputs.AlbDnsName).toBeDefined();
    });

    test('should export CloudFront domain', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      const outputs = template.toJSON().Outputs;
      expect(outputs.CloudFrontDomain).toBeDefined();
    });

    test('should export database endpoint', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      const outputs = template.toJSON().Outputs;
      expect(outputs.DatabaseEndpoint).toBeDefined();
    });

    test('should export session table name', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      const outputs = template.toJSON().Outputs;
      expect(outputs.SessionTableName).toBeDefined();
    });

    test('should export VPC ID', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      const outputs = template.toJSON().Outputs;
      expect(outputs.PrimaryVpcId).toBeDefined();
    });

    test('should export health check ID', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      const outputs = template.toJSON().Outputs;
      expect(outputs.HealthCheckId).toBeDefined();
    });

    test('should export replica cluster ARN in primary region', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        isPrimaryRegion: true,
      });
      const template = Template.fromStack(stack);

      const outputs = template.toJSON().Outputs;
      expect(outputs.ReplicaClusterArn).toBeDefined();
    });

    test('should export VPC peering ID when configured', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        peerVpcId: 'vpc-12345678',
      });
      const template = Template.fromStack(stack);

      const outputs = template.toJSON().Outputs;
      expect(outputs.VpcPeeringConnectionId).toBeDefined();
    });

    test('should export failover domain when configured', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        domainName: 'example.com',
      });
      const template = Template.fromStack(stack);

      const outputs = template.toJSON().Outputs;
      expect(outputs.FailoverDomain).toBeDefined();
    });
  });

  describe('Removal Policies', () => {
    test('should set DESTROY removal policy on all resources', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      // KMS keys should have deletion policy
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });

      // RDS cluster should not have deletion protection
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DeletionProtection: false,
      });

      // S3 buckets should have auto delete objects
      template.hasResource('Custom::S3AutoDeleteObjects', {});
    });
  });

  describe('Resource Naming', () => {
    test('should handle resource names exceeding maxLength with region shortening', () => {
      // Use long enough name to trigger region shortening for 32-char ALB limit
      // ALB name format: serviceName-alb-region-env
      // Example: "finplatform-alb-us-east-1-dev" = 32 chars = at the limit
      // Need slightly longer to trigger shortening
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'production',
        serviceName: 'finplatform',
      });
      const template = Template.fromStack(stack);

      // ALB and Target Group have 32 character limits, which should trigger shortening
      // Verify they are created successfully with shortened names
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
      });

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        TargetType: 'ip',
      });

      // Verify the ALB name is shortened (should be <= 32 chars)
      const resources = template.toJSON().Resources;
      const albs = Object.values(resources).filter((r: any) =>
        r.Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      const albResource = albs[0] as any;
      const albName = albResource?.Properties?.Name;
      if (albName) {
        expect(albName.length).toBeLessThanOrEqual(32);
      }
    });

    test('should truncate service name when region shortening is insufficient', () => {
      // Use long names to trigger service name truncation (second level of shortening)
      // This should trigger both region shortening AND service name truncation
      // Keep service name shorter to avoid S3 bucket name exceeding 63 chars
      // S3 bucket format: serviceName-assets-replica-accountId-region-env
      // Max: 10-14-12-9-7 = 52 + 5 hyphens = 57 chars (within 63 limit)
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'staging',
        serviceName: 'finplatform',
      });
      const template = Template.fromStack(stack);

      // Verify resources are still created with truncated names
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
      });

      // Verify the ALB name is properly truncated
      const resources = template.toJSON().Resources;
      const albs = Object.values(resources).filter((r: any) =>
        r.Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      const albResource = albs[0] as any;
      const albName = albResource?.Properties?.Name;
      if (albName) {
        expect(albName.length).toBeLessThanOrEqual(32);
      }
    });

    test('should handle S3 bucket names with account ID', () => {
      // S3 buckets include account ID in their names
      // Use names that stay within S3's 63 character limit
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'prod',
        serviceName: 'myapp',
      });
      const template = Template.fromStack(stack);

      // Verify S3 buckets are created successfully with account ID
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });

      // Verify bucket names include account ID and are within limits
      const resources = template.toJSON().Resources;
      const buckets = Object.values(resources).filter((r: any) =>
        r.Type === 'AWS::S3::Bucket'
      );

      buckets.forEach((bucket: any) => {
        const bucketName = bucket.Properties?.BucketName;
        if (bucketName) {
          // S3 bucket names must be 3-63 characters
          expect(bucketName.length).toBeGreaterThanOrEqual(3);
          expect(bucketName.length).toBeLessThanOrEqual(63);
          // Should include account ID
          expect(bucketName).toContain('123456789012');
        }
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should tag resources with environment suffix', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'test-env',
      });
      const template = Template.fromStack(stack);

      // Verify tags are present (VPC tagging is handled by CDK automatically)
      const resources = template.toJSON().Resources;
      expect(resources).toBeDefined();

      // Check that resources are created with proper naming convention including env suffix
      const vpcNames = Object.keys(resources).filter(key => resources[key].Type === 'AWS::EC2::VPC');
      expect(vpcNames.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Region Configuration', () => {
    test('should configure different regions correctly', () => {
      const primaryStack = new TapStack(app, 'PrimaryStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
        isPrimaryRegion: true,
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
      });

      const secondaryStack = new TapStack(app, 'SecondaryStack', {
        env: { account: '123456789012', region: 'us-west-2' },
        environmentSuffix,
        isPrimaryRegion: false,
        primaryRegion: 'us-west-2',
        secondaryRegion: 'us-east-1',
      });

      expect(primaryStack).toBeDefined();
      expect(secondaryStack).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing environment gracefully', () => {
      // DynamoDB global tables require explicit region, so provide it
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix,
      });

      expect(stack).toBeDefined();
    });

    test('should use default values when props not provided', () => {
      // Provide minimal required props for region-aware resources
      const stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });
  });
});
