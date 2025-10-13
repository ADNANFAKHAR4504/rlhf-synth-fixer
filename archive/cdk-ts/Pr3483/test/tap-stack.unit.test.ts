import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('Uses provided environment suffix', () => {
      const customSuffix = 'custom456';
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, `TapStack${customSuffix}`, {
        environmentSuffix: customSuffix,
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: `wiki-service-network-${customSuffix}`,
      });
    });

    test('Uses context environment suffix when not provided in props', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context789',
        },
      });
      const contextStack = new TapStack(contextApp, 'TapStackContext');
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'wiki-service-network-context789',
      });
    });

    test('Defaults to dev when no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'TapStackDefault');
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'wiki-service-network-dev',
      });
    });
  });

  describe('VPC and Network Configuration', () => {
    test('VPC is created with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.200.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Creates public and private subnets', () => {
      // Public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 6);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Public' }),
        ]),
      });
    });

    test('Creates NAT Gateways for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('Creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('VPC Lattice service network is created', () => {
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        AuthType: 'AWS_IAM',
        Name: `wiki-service-network-${environmentSuffix}`,
      });
    });
  });

  describe('Database Stack', () => {
    test('RDS PostgreSQL database is created', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        DBInstanceClass: 'db.t3.medium',
        AllocatedStorage: '100',
        StorageType: 'gp3',
        BackupRetentionPeriod: 14,
        DeletionProtection: false,
        EnablePerformanceInsights: true,
      });
    });

    test('Database has correct PostgreSQL version', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EngineVersion: '16.3',
      });
    });

    test('Database security group is configured', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS PostgreSQL database',
      });
    });

    test('Database secrets are created', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: Match.anyValue(), // CloudFormation Fn::Join function
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"postgres"}',
        }),
      });
    });
  });

  describe('Storage Stack', () => {
    test('ElastiCache Redis cluster is created', () => {
      template.hasResourceProperties('AWS::ElastiCache::CacheCluster', {
        Engine: 'redis',
        CacheNodeType: 'cache.t3.micro',
        NumCacheNodes: 1,
        SnapshotRetentionLimit: 7,
      });
    });

    test('OpenSearch domain is created with 2 data nodes', () => {
      template.hasResourceProperties('AWS::OpenSearchService::Domain', {
        EngineVersion: 'OpenSearch_2.11',
        ClusterConfig: Match.objectLike({
          InstanceType: 't3.small.search',
          InstanceCount: 2,
        }),
        NodeToNodeEncryptionOptions: { Enabled: true },
        EncryptionAtRestOptions: { Enabled: true },
      });
    });

    test('S3 bucket is created for media uploads', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.anyValue(), // CloudFormation Fn::Join function
        VersioningConfiguration: { Status: 'Enabled' },
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'AES256',
              }),
            }),
          ]),
        }),
      });
    });

    test('S3 bucket has lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: Match.objectLike({
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldVersions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: Match.objectLike({
                NoncurrentDays: 90,
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('Compute Stack', () => {
    test('Application Load Balancer is created', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('Auto Scaling Group is configured correctly', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '5',
        DesiredCapacity: '2',
      });
    });

    test('Launch Template uses t3.small instances', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.small',
        }),
      });
    });

    test('EC2 instances have proper IAM role', () => {
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
      });

      // Check that the EC2 role has the correct managed policies (they're added as Fn::Join)
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find((role: any) =>
        role.Properties?.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service === 'ec2.amazonaws.com'
      );
      expect(ec2Role).toBeDefined();
      expect(ec2Role?.Properties?.ManagedPolicyArns).toHaveLength(2);
    });

    test('Target group health checks are configured', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          HealthCheckPath: '/',
          HealthCheckIntervalSeconds: 30,
          HealthCheckTimeoutSeconds: 5,
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 3,
        }
      );
    });


  });

  describe('Monitoring Stack', () => {
    test('CloudWatch dashboard is created', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `wiki-platform-${environmentSuffix}`,
      });
    });

    test('SNS topic for alerts is created', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `Wiki Platform Alerts - ${environmentSuffix}`,
      });
    });

    test('High response time alarm is configured', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'TargetResponseTime',
        Threshold: 1000,
        EvaluationPeriods: 2,
      });
    });

    test('Low healthy hosts alarm is configured', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'HealthyHostCount',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });

    test('High CPU utilization alarm is configured', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Threshold: 85,
        EvaluationPeriods: 2,
      });
    });

    test('High edit activity alarm is configured', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'EditActivity',
        Threshold: 10000,
        EvaluationPeriods: 1,
      });
    });
  });

  describe('Security Groups', () => {
    test('ALB allows HTTP and HTTPS from internet', () => {
      // ALB security group should have ingress rules for HTTP and HTTPS
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

    test('Database allows PostgreSQL from EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'Allow PostgreSQL from EC2 instances',
      });
    });

    test('Redis allows connections from EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 6379,
        ToPort: 6379,
        Description: 'Allow Redis access from EC2 instances',
      });
    });

    test('OpenSearch allows HTTPS from EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
        Description: 'Allow HTTPS access from EC2 instances for OpenSearch',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('VPC ID output is defined', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('ALB DNS name output is defined', () => {
      template.hasOutput('ALBDnsName', {
        Description: 'Application Load Balancer DNS Name',
      });
    });

    test('S3 bucket name output is defined', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket name for media uploads',
      });
    });

    test('Database endpoint output is defined', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database endpoint',
      });
    });

    test('Redis endpoint output is defined', () => {
      template.hasOutput('RedisEndpoint', {
        Description: 'Redis cache endpoint',
      });
    });

    test('OpenSearch endpoint output is defined', () => {
      template.hasOutput('OpenSearchDomainEndpoint', {
        Description: 'OpenSearch domain endpoint',
      });
    });
  });

  describe('Tags', () => {
    test('Resources are tagged with environment suffix', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
        ]),
      });
    });

    test('Resources have Name tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('WikiVPC'),
          }),
        ]),
      });
    });
  });

  describe('Removal Policies', () => {
    test('Database has DESTROY removal policy', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        DeletionPolicy: 'Delete',
      });
    });

    test('S3 bucket has auto-delete objects', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
      });
      // Auto-delete custom resource is created
      template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
        ServiceToken: Match.anyValue(),
      });
    });

    test('OpenSearch domain has DESTROY removal policy', () => {
      template.hasResource('AWS::OpenSearchService::Domain', {
        DeletionPolicy: 'Delete',
      });
    });
  });
});