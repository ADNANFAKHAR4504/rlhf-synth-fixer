import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let tapStack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'ap-southeast-1' },
    });
    tapStack = new TapStack(stack, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Encryption Key', () => {
    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for payment application encryption',
        EnableKeyRotation: true,
      });
    });

    test('creates KMS alias with environmentSuffix', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/payment-app-key-${environmentSuffix}`,
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct name', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: `payment-vpc-${environmentSuffix}` },
        ]),
      });
    });

    test('creates 3 public subnets across availability zones', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9);
      const resources = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
          Tags: Match.arrayWith([
            { Key: 'aws-cdk:subnet-type', Value: 'Public' },
          ]),
        },
      });
      expect(Object.keys(resources)).toHaveLength(3);
    });

    test('creates 3 private subnets for ECS tasks', () => {
      const resources = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
          Tags: Match.arrayWith([
            { Key: 'aws-cdk:subnet-type', Value: 'Private' },
          ]),
        },
      });
      expect(Object.keys(resources)).toHaveLength(3);
    });

    test('creates 3 isolated subnets for database', () => {
      const resources = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
          Tags: Match.arrayWith([
            { Key: 'aws-cdk:subnet-type', Value: 'Isolated' },
          ]),
        },
      });
      expect(Object.keys(resources)).toHaveLength(3); // 3 isolated
    });

    test('creates 3 NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });

    test('creates internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Secrets Manager', () => {
    test('creates database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `payment-db-credentials-${environmentSuffix}`,
        Description: 'Database credentials for payment application',
      });
    });

    test('secret uses KMS encryption', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        KmsKeyId: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('EncryptionKey')]),
        }),
      });
    });

    test('attaches secret to RDS cluster', () => {
      template.hasResourceProperties('AWS::SecretsManager::SecretTargetAttachment', {
        TargetType: 'AWS::RDS::DBCluster',
      });
    });
  });

  describe('RDS Aurora PostgreSQL', () => {
    test('creates Aurora PostgreSQL cluster with correct identifier', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DBClusterIdentifier: `payment-db-${environmentSuffix}`,
        Engine: 'aurora-postgresql',
        EngineVersion: '15.12',
      });
    });

    test('enables storage encryption with KMS', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
        KmsKeyId: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('EncryptionKey')]),
        }),
      });
    });

    test('configures 7-day backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 7,
      });
    });

    test('creates 2 database instances', () => {
      const instances = template.findResources('AWS::RDS::DBInstance', {
        Properties: {
          Engine: 'aurora-postgresql',
          DBInstanceClass: 'db.t3.medium',
        },
      });
      expect(Object.keys(instances)).toHaveLength(2);
    });

    test('creates database security group with no outbound access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS Aurora cluster',
        SecurityGroupEgress: [
          {
            CidrIp: '255.255.255.255/32',
            Description: 'Disallow all traffic',
          },
        ],
      });
    });
  });

  describe('ECS Cluster and Service', () => {
    test('creates ECS cluster with container insights', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `payment-cluster-${environmentSuffix}`,
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });

    test('creates Fargate task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `payment-api-${environmentSuffix}`,
        Cpu: '256',
        Memory: '512',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('configures container with CloudWatch logging', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'ApiContainer',
            Image: 'amazon/amazon-ecs-sample',
            LogConfiguration: {
              LogDriver: 'awslogs',
            },
          }),
        ]),
      });
    });

    test('creates Fargate service with circuit breaker', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `payment-api-${environmentSuffix}`,
        DesiredCount: 2,
        LaunchType: 'FARGATE',
        DeploymentConfiguration: {
          DeploymentCircuitBreaker: {
            Enable: true,
            Rollback: true,
          },
        },
      });
    });

    test('creates CloudWatch log group with 90-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 90,
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `payment-alb-${environmentSuffix}`,
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('creates HTTP listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('creates target group with health checks every 30 seconds', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckIntervalSeconds: 30,
        UnhealthyThresholdCount: 2,
        HealthyThresholdCount: 2,
      });
    });
  });

  describe('Auto Scaling', () => {
    test('configures ECS service auto scaling with CPU target', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 2,
        MaxCapacity: 10,
        ServiceNamespace: 'ecs',
      });
    });

    test('creates CPU-based scaling policy at 70% threshold', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        TargetTrackingScalingPolicyConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          TargetValue: 70,
        },
      });
    });
  });

  describe('S3 and CloudFront', () => {
    test('creates S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `payment-frontend-${environmentSuffix}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });

    test('blocks all public access to S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('creates CloudFront Origin Access Identity', () => {
      template.resourceCountIs('AWS::CloudFront::CloudFrontOriginAccessIdentity', 1);
    });

    test('creates CloudFront distribution with HTTPS redirect', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
          },
          DefaultRootObject: 'index.html',
        },
      });
    });
  });

  describe('Monitoring and Alerting', () => {
    test('creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `payment-alerts-${environmentSuffix}`,
        DisplayName: 'Payment Application Alerts',
      });
    });

    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `payment-dashboard-${environmentSuffix}`,
      });
    });

    test('creates error rate alarm with 1% threshold', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `payment-high-error-rate-${environmentSuffix}`,
        Threshold: 1,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });
  });

  describe('Security Configuration', () => {
    test('allows ECS tasks to connect to database', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'Allow ECS tasks to access database',
      });
    });

    test('creates security group for ECS tasks', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ECS tasks',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports ALB DNS name', () => {
      const outputs = template.findOutputs('*', {
        Export: Match.objectLike({
          Name: `PaymentALBDns-${environmentSuffix}`,
        }),
      });
      expect(Object.keys(outputs)).toHaveLength(1);
    });

    test('exports CloudFront domain', () => {
      const outputs = template.findOutputs('*', {
        Export: Match.objectLike({
          Name: `PaymentCloudfrontDomain-${environmentSuffix}`,
        }),
      });
      expect(Object.keys(outputs)).toHaveLength(1);
    });

    test('exports database endpoint', () => {
      const outputs = template.findOutputs('*', {
        Export: Match.objectLike({
          Name: `PaymentDbEndpoint-${environmentSuffix}`,
        }),
      });
      expect(Object.keys(outputs)).toHaveLength(1);
    });

    test('exports frontend bucket name', () => {
      const outputs = template.findOutputs('*', {
        Export: Match.objectLike({
          Name: `PaymentFrontendBucket-${environmentSuffix}`,
        }),
      });
      expect(Object.keys(outputs)).toHaveLength(1);
    });
  });

  describe('Resource Count Validation', () => {
    test('creates expected number of subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 public + 3 private + 3 isolated
    });

    test('creates expected number of route tables', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 9); // 3 public + 3 private + 3 isolated
    });

    test('creates expected number of security groups', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3); // ALB, ECS, Database
    });
  });

  describe('Removal Policy', () => {
    test('KMS key has DELETE removal policy', () => {
      const resources = template.findResources('AWS::KMS::Key');
      const keyResource = Object.values(resources)[0] as any;
      expect(keyResource.DeletionPolicy).toBe('Delete');
    });

    test('RDS cluster has DELETE removal policy', () => {
      const resources = template.findResources('AWS::RDS::DBCluster');
      const clusterResource = Object.values(resources)[0] as any;
      expect(clusterResource.DeletionPolicy).toBe('Delete');
    });

    test('S3 bucket has DELETE removal policy', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(resources)[0] as any;
      expect(bucketResource.DeletionPolicy).toBe('Delete');
    });
  });

  describe('IAM Roles', () => {
    test('creates ECS task execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ]),
        },
      });
    });
  });

  describe('Environment Configuration', () => {
    test('task definition includes database environment variables', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Environment: Match.arrayWith([
              Match.objectLike({ Name: 'DB_HOST' }),
              Match.objectLike({ Name: 'DB_PORT' }),
            ]),
          }),
        ]),
      });
    });

    test('task definition includes database secrets from Secrets Manager', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Secrets: Match.arrayWith([
              Match.objectLike({ Name: 'DB_PASSWORD' }),
              Match.objectLike({ Name: 'DB_USERNAME' }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Constructor Input Validation', () => {
    test('accepts valid props', () => {
      expect(() => {
        new TapStack(stack, 'ValidStack', { environmentSuffix: 'prod' });
      }).not.toThrow();
    });

    test('creates stack with different environmentSuffix', () => {
      const customApp = new cdk.App();
      const customStack = new cdk.Stack(customApp, 'CustomStack', {
        env: { account: '123456789012', region: 'ap-southeast-1' },
      });
      const customTapStack = new TapStack(customStack, 'CustomTapStack', {
        environmentSuffix: 'staging',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/payment-app-key-staging',
      });
    });
  });

  describe('Public Properties', () => {
    test('exposes vpc property', () => {
      expect(tapStack.vpc).toBeDefined();
      expect(tapStack.vpc.vpcId).toBeDefined();
    });

    test('exposes cluster property', () => {
      expect(tapStack.cluster).toBeDefined();
      expect(tapStack.cluster.clusterName).toBeDefined();
    });

    test('exposes alb property', () => {
      expect(tapStack.alb).toBeDefined();
      expect(tapStack.alb.loadBalancerDnsName).toBeDefined();
    });

    test('exposes database property', () => {
      expect(tapStack.database).toBeDefined();
      expect(tapStack.database.clusterEndpoint).toBeDefined();
    });

    test('exposes frontendBucket property', () => {
      expect(tapStack.frontendBucket).toBeDefined();
      expect(tapStack.frontendBucket.bucketName).toBeDefined();
    });

    test('exposes distribution property', () => {
      expect(tapStack.distribution).toBeDefined();
      expect(tapStack.distribution.distributionDomainName).toBeDefined();
    });
  });
});
