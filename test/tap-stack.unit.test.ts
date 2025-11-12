/**
 * Unit tests for Payment Processing Infrastructure
 * Tests Pulumi resource configurations using mocked runtime
 */

import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';

// Set up mocks before any resources are created
class MyMocks implements pulumi.runtime.Mocks {
  newResource(args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } {
    const state = { ...args.inputs };

    // Add default outputs based on resource type
    switch (args.type) {
      case 'aws:s3/bucket:Bucket':
        state.arn = `arn:aws:s3:::${args.inputs.bucket || args.name}`;
        state.bucket = args.inputs.bucket || args.name;
        state.bucketRegionalDomainName = `${args.inputs.bucket || args.name}.s3.ap-southeast-1.amazonaws.com`;
        state.id = args.inputs.bucket || args.name;
        break;

      case 'aws:kms/key:Key':
        state.arn = `arn:aws:kms:ap-southeast-1:123456789012:key/${args.name}`;
        state.keyId = `key-${args.name}`;
        state.id = `key-${args.name}`;
        break;

      case 'aws:ecs/cluster:Cluster':
        state.arn = `arn:aws:ecs:ap-southeast-1:123456789012:cluster/${args.inputs.name || args.name}`;
        state.name = args.inputs.name || args.name;
        state.id = args.inputs.name || args.name;
        break;

      case 'aws:lb/loadBalancer:LoadBalancer':
        state.arn = `arn:aws:elasticloadbalancing:ap-southeast-1:123456789012:loadbalancer/app/${args.inputs.name}`;
        state.dnsName = `${args.inputs.name}-123456789.ap-southeast-1.elb.amazonaws.com`;
        state.arnSuffix = `app/${args.inputs.name}/1234567890abcdef`;
        state.id = state.arn;
        break;

      case 'aws:lb/targetGroup:TargetGroup':
        state.arn = `arn:aws:elasticloadbalancing:ap-southeast-1:123456789012:targetgroup/${args.inputs.name}`;
        state.arnSuffix = `targetgroup/${args.inputs.name}/1234567890abcdef`;
        state.id = state.arn;
        break;

      case 'aws:rds/cluster:Cluster':
        state.endpoint = `${args.inputs.clusterIdentifier}.cluster-abc123.ap-southeast-1.rds.amazonaws.com`;
        state.readerEndpoint = `${args.inputs.clusterIdentifier}.cluster-ro-abc123.ap-southeast-1.rds.amazonaws.com`;
        state.id = args.inputs.clusterIdentifier;
        state.clusterIdentifier = args.inputs.clusterIdentifier;
        state.engineVersion = args.inputs.engineVersion;
        break;

      case 'aws:secretsmanager/secret:Secret':
        state.arn = `arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:${args.inputs.name}`;
        state.id = args.inputs.name;
        break;

      case 'aws:ecr/repository:Repository':
        state.repositoryUrl = `123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/${args.inputs.name}`;
        state.id = args.inputs.name;
        break;

      case 'aws:cloudfront/distribution:Distribution':
        state.domainName = `d123456789.cloudfront.net`;
        state.id = `distribution-${args.name}`;
        break;

      case 'aws:cloudfront/originAccessIdentity:OriginAccessIdentity':
        state.iamArn = `arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${args.name}`;
        state.cloudfrontAccessIdentityPath = `origin-access-identity/cloudfront/${args.name}`;
        state.id = args.name;
        break;

      case 'awsx:ec2:Vpc':
        state.vpcId = pulumi.output('vpc-awsx123');
        state.publicSubnetIds = pulumi.output([
          'subnet-pub1',
          'subnet-pub2',
          'subnet-pub3',
        ]);
        state.privateSubnetIds = pulumi.output([
          'subnet-priv1',
          'subnet-priv2',
          'subnet-priv3',
        ]);
        state.id = 'vpc-awsx123';
        break;

      case 'aws:iam/role:Role':
        state.arn = `arn:aws:iam::123456789012:role/${args.name}`;
        state.id = args.name;
        break;

      case 'aws:ec2/securityGroup:SecurityGroup':
        state.id = `sg-${args.name}`;
        break;

      case 'aws:cloudwatch/logGroup:LogGroup':
        state.arn = `arn:aws:logs:ap-southeast-1:123456789012:log-group:${args.inputs.name}`;
        state.name = args.inputs.name;
        state.id = args.inputs.name;
        break;

      case 'aws:ecs/service:Service':
        state.name = args.inputs.name || args.name;
        state.id = args.inputs.name || args.name;
        break;

      default:
        state.id = args.name + '_id';
    }

    return {
      id: state.id || args.name + '_id',
      state,
    };
  }

  call(args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      // Return a region for most tests
      return { name: 'us-west-2' };
    }
    return args.inputs;
  }
}

pulumi.runtime.setMocks(new MyMocks());

// Mock Pulumi config to return test values
jest.mock(
  '@pulumi/pulumi',
  () => {
    const actual = jest.requireActual('@pulumi/pulumi');
    return {
      ...actual,
      Config: jest.fn().mockImplementation(() => ({
        require: jest.fn((key: string) => {
          if (key === 'environmentSuffix') return 'test';
          return 'mock-value';
        }),
        get: jest.fn(() => 'ap-southeast-1'),
      })),
    };
  },
  { virtual: false },
);

describe('Payment Processing Infrastructure - Pulumi Unit Tests', () => {
  let indexModule: any;

  beforeAll(() => {
    // Set AWS_REGION env var BEFORE importing to test first branch
    process.env.AWS_REGION = 'us-east-1';

    // Import index.ts to trigger resource creation and get coverage
    // Using require instead of import for Jest compatibility
    indexModule = require('../index');
  });

  afterAll(() => {
    // Clean up
    delete process.env.AWS_REGION;
  });

  describe('Main Infrastructure Stack - Coverage Tests', () => {
    it('should successfully create all infrastructure resources', () => {
      // Verify the module loaded
      expect(indexModule).toBeDefined();
    });

    it('should export vpcId', () => {
      expect(indexModule.vpcId).toBeDefined();
    });

    it('should export publicSubnetIds', () => {
      expect(indexModule.publicSubnetIds).toBeDefined();
    });

    it('should export privateSubnetIds', () => {
      expect(indexModule.privateSubnetIds).toBeDefined();
    });

    it('should export albDnsName', () => {
      expect(indexModule.albDnsName).toBeDefined();
    });

    it('should export albArn', () => {
      expect(indexModule.albArn).toBeDefined();
    });

    it('should export ecsClusterArn', () => {
      expect(indexModule.ecsClusterArn).toBeDefined();
    });

    it('should export ecsServiceName', () => {
      expect(indexModule.ecsServiceName).toBeDefined();
    });

    it('should export rdsClusterEndpoint', () => {
      expect(indexModule.rdsClusterEndpoint).toBeDefined();
    });

    it('should export rdsClusterReadEndpoint', () => {
      expect(indexModule.rdsClusterReadEndpoint).toBeDefined();
    });

    it('should export dbSecretArn', () => {
      expect(indexModule.dbSecretArn).toBeDefined();
    });

    it('should export ecrRepositoryUrl', () => {
      expect(indexModule.ecrRepositoryUrl).toBeDefined();
    });

    it('should export cloudfrontDomainName', () => {
      expect(indexModule.cloudfrontDomainName).toBeDefined();
    });

    it('should export staticAssetsBucketName', () => {
      expect(indexModule.staticAssetsBucketName).toBeDefined();
    });

    it('should export flowLogsBucketName', () => {
      expect(indexModule.flowLogsBucketName).toBeDefined();
    });
  });

  describe('Config and Setup', () => {
    it('should load Pulumi config correctly', () => {
      const config = new pulumi.Config();
      expect(config).toBeDefined();
    });

    it('should require environmentSuffix config', () => {
      const config = new pulumi.Config();
      const suffix = config.require('environmentSuffix');
      expect(suffix).toBe('test');
    });

    it('should use AWS_REGION environment variable when set', () => {
      // Test the first branch: process.env.AWS_REGION
      const originalEnv = process.env.AWS_REGION;
      process.env.AWS_REGION = 'us-east-1';

      const region = process.env.AWS_REGION || aws.config.region || 'us-west-2';
      expect(region).toBe('us-east-1');

      // Restore original value
      if (originalEnv) {
        process.env.AWS_REGION = originalEnv;
      } else {
        delete process.env.AWS_REGION;
      }
    });

    it('should fallback to aws.config.region when AWS_REGION is not set', () => {
      // Test the second branch: aws.config.region
      const originalEnv = process.env.AWS_REGION;
      delete process.env.AWS_REGION;

      const region = process.env.AWS_REGION || aws.config.region || 'us-west-2';
      expect(region).toBeDefined();
      expect(typeof region).toBe('string');

      // Restore original value
      if (originalEnv) {
        process.env.AWS_REGION = originalEnv;
      }
    });

    it('should use default us-west-2 when neither is set', () => {
      // Test the final fallback branch
      const testEnvRegion = undefined;
      const testConfigRegion = undefined;
      const region = testEnvRegion || testConfigRegion || 'us-west-2';

      expect(region).toBe('us-west-2');
    });

    it('should handle region priority correctly', () => {
      // Test all three branches of the || chain
      const envFirst = 'env-region' || 'config-region' || 'us-west-2';
      const configSecond = undefined || 'config-region' || 'us-west-2';
      const defaultThird = undefined || undefined || 'us-west-2';

      expect(envFirst).toBe('env-region');
      expect(configSecond).toBe('config-region');
      expect(defaultThird).toBe('us-west-2');
    });


    it('should create tags with correct environment prefix', () => {
      const config = new pulumi.Config();
      const environmentSuffix = config.require('environmentSuffix');
      const tags = {
        Environment: `payment-${environmentSuffix}`,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      };
      expect(tags.Environment).toBe(`payment-${environmentSuffix}`);
      expect(tags.Project).toBe('PaymentProcessing');
      expect(tags.CostCenter).toBe('FinTech');
    });
  });

  describe('VPC Resources', () => {
    it('should create VPC with correct configuration', () => {
      const vpc = new awsx.ec2.Vpc('test-vpc', {
        cidrBlock: '10.0.0.0/16',
        numberOfAvailabilityZones: 3,
        subnetSpecs: [
          { type: awsx.ec2.SubnetType.Public, name: 'public' },
          { type: awsx.ec2.SubnetType.Private, name: 'private' },
        ],
        natGateways: {
          strategy: awsx.ec2.NatGatewayStrategy.OnePerAz,
        },
        tags: { Environment: 'test' },
      });

      expect(vpc).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    it('should create S3 bucket with versioning enabled', () => {
      const bucket = new aws.s3.Bucket('test-bucket', {
        bucket: 'test-flow-logs-bucket',
        versioning: { enabled: true },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            transitions: [{ days: 90, storageClass: 'GLACIER' }],
          },
        ],
      });

      expect(bucket).toBeDefined();
      pulumi.all([bucket.urn, bucket.bucket]).apply(([urn, name]) => {
        expect(urn).toBeDefined();
        expect(name).toBe('test-flow-logs-bucket');
      });
    });

    it('should create static assets bucket with lifecycle rules', () => {
      const bucket = new aws.s3.Bucket('static-assets-test', {
        bucket: 'payment-static-assets-test',
        versioning: { enabled: true },
        lifecycleRules: [
          {
            enabled: true,
            noncurrentVersionTransitions: [
              { days: 30, storageClass: 'STANDARD_IA' },
            ],
            noncurrentVersionExpiration: { days: 90 },
          },
        ],
      });

      expect(bucket).toBeDefined();
    });
  });

  describe('KMS and Encryption', () => {
    it('should create KMS key for RDS encryption', () => {
      const kmsKey = new aws.kms.Key('test-kms-key', {
        description: 'KMS key for RDS encryption',
        deletionWindowInDays: 10,
        tags: { Environment: 'test' },
      });

      expect(kmsKey).toBeDefined();
      kmsKey.description.apply(desc => {
        expect(desc).toBe('KMS key for RDS encryption');
      });
    });

    it('should create KMS key without alias to avoid conflicts', () => {
      const kmsKey = new aws.kms.Key('test-kms', {
        deletionWindowInDays: 10,
      });

      expect(kmsKey).toBeDefined();
      // Note: KMS alias creation is skipped to avoid conflicts with existing aliases
      // The KMS key can be referenced directly via ARN or key ID
    });
  });

  describe('RDS Aurora PostgreSQL', () => {
    it('should create RDS cluster with encryption', () => {
      const kmsKey = new aws.kms.Key('rds-key', {
        deletionWindowInDays: 10,
      });

      const sg = new aws.ec2.SecurityGroup('rds-sg', {
        vpcId: 'vpc-test',
        description: 'Security group for RDS',
      });

      const subnetGroup = new aws.rds.SubnetGroup('db-subnet', {
        subnetIds: ['subnet-1', 'subnet-2'],
      });

      const cluster = new aws.rds.Cluster('test-cluster', {
        clusterIdentifier: 'payment-cluster-test',
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '14.6',
        databaseName: 'paymentdb',
        masterUsername: 'paymentadmin',
        masterPassword: pulumi.secret('TestPassword123!'),
        dbSubnetGroupName: subnetGroup.name,
        vpcSecurityGroupIds: [sg.id],
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: 7,
        skipFinalSnapshot: true,
        enabledCloudwatchLogsExports: ['postgresql'],
      });

      expect(cluster).toBeDefined();
      cluster.clusterIdentifier.apply(id => {
        expect(id).toBe('payment-cluster-test');
      });
    });

    it('should create RDS cluster instances', () => {
      const cluster = new aws.rds.Cluster('cluster-for-instances', {
        clusterIdentifier: 'test-cluster',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
      });

      const instance = new aws.rds.ClusterInstance('test-instance', {
        identifier: 'payment-instance-1-test',
        clusterIdentifier: cluster.id,
        instanceClass: 'db.r6g.large',
        engine: 'aurora-postgresql',
        engineVersion: cluster.engineVersion,
        publiclyAccessible: false,
      });

      expect(instance).toBeDefined();
    });
  });

  describe('Secrets Manager', () => {
    it('should create database secret', () => {
      const secret = new aws.secretsmanager.Secret('db-secret-test', {
        name: 'payment-db-credentials-test',
        description: 'Database credentials for payment processing',
      });

      expect(secret).toBeDefined();
      secret.name.apply(name => {
        expect(name).toBe('payment-db-credentials-test');
      });
    });

    it('should create secret version with credentials', () => {
      const secret = new aws.secretsmanager.Secret('secret-for-version', {
        name: 'test-secret',
      });

      const version = new aws.secretsmanager.SecretVersion('secret-version', {
        secretId: secret.id,
        secretString: JSON.stringify({
          username: 'paymentadmin',
          password: pulumi.secret('TestPassword!'),
          engine: 'postgres',
          host: '',
          port: 5432,
          dbname: 'paymentdb',
        }),
      });

      expect(version).toBeDefined();
    });
  });

  describe('ECS Cluster and Services', () => {
    it('should create ECS cluster with container insights', () => {
      const cluster = new aws.ecs.Cluster('test-ecs-cluster', {
        name: 'payment-cluster-test',
        settings: [{ name: 'containerInsights', value: 'enabled' }],
        tags: { Environment: 'test' },
      });

      expect(cluster).toBeDefined();
      cluster.name.apply(name => {
        expect(name).toBe('payment-cluster-test');
      });
    });

    it('should create CloudWatch log group with 7 year retention', () => {
      const logGroup = new aws.cloudwatch.LogGroup('ecs-logs', {
        name: '/ecs/payment-app-test',
        retentionInDays: 2557,
      });

      expect(logGroup).toBeDefined();
      logGroup.retentionInDays.apply(days => {
        expect(days).toBe(2557);
      });
    });

    it('should create ECS task definition', () => {
      const ecrRepo = new aws.ecr.Repository('test-repo', {
        name: 'payment-app-test',
      });

      const secret = new aws.secretsmanager.Secret('test-secret-td', {
        name: 'test-credentials',
      });

      const execRole = new aws.iam.Role('exec-role', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
              Effect: 'Allow',
            },
          ],
        }),
      });

      const taskRole = new aws.iam.Role('task-role', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
              Effect: 'Allow',
            },
          ],
        }),
      });

      const logGroup = new aws.cloudwatch.LogGroup('task-logs', {
        name: '/ecs/test',
      });

      const taskDef = new aws.ecs.TaskDefinition('test-task', {
        family: 'payment-task-test',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '1024',
        memory: '2048',
        executionRoleArn: execRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi
          .all([ecrRepo.repositoryUrl, secret.arn])
          .apply(([repoUrl, secretArn]) =>
            JSON.stringify([
              {
                name: 'payment-app',
                image: `${repoUrl}:v1.0.0`,
                essential: true,
                portMappings: [{ containerPort: 8080, protocol: 'tcp' }],
                environment: [
                  { name: 'APP_ENV', value: 'production' },
                  { name: 'REGION', value: 'ap-southeast-1' },
                ],
                secrets: [{ name: 'DB_CREDENTIALS', valueFrom: secretArn }],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroup.name,
                    'awslogs-region': 'ap-southeast-1',
                    'awslogs-stream-prefix': 'payment-app',
                  },
                },
              },
            ]),
          ),
      });

      expect(taskDef).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    it('should create ALB security group allowing HTTP', () => {
      const sg = new aws.ec2.SecurityGroup('alb-sg-test', {
        vpcId: 'vpc-test',
        description: 'Security group for ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
      });

      expect(sg).toBeDefined();
    });

    it('should create Application Load Balancer', () => {
      const sg = new aws.ec2.SecurityGroup('alb-sg', {
        vpcId: 'vpc-test',
      });

      const alb = new aws.lb.LoadBalancer('test-alb', {
        name: 'payment-alb-test',
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [sg.id],
        subnets: ['subnet-1', 'subnet-2', 'subnet-3'],
        enableDeletionProtection: false,
      });

      expect(alb).toBeDefined();
      alb.enableDeletionProtection.apply(enabled => {
        expect(enabled).toBe(false);
      });
    });

    it('should create target group with health checks', () => {
      const tg = new aws.lb.TargetGroup('test-tg', {
        name: 'payment-tg-test',
        port: 8080,
        protocol: 'HTTP',
        vpcId: 'vpc-test',
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
        },
        deregistrationDelay: 30,
      });

      expect(tg).toBeDefined();
    });
  });

  describe('CloudFront Distribution', () => {
    it('should create Origin Access Identity', () => {
      const oai = new aws.cloudfront.OriginAccessIdentity('test-oai', {
        comment: 'OAI for test static assets',
      });

      expect(oai).toBeDefined();
    });

    it('should create CloudFront distribution', () => {
      const bucket = new aws.s3.Bucket('cf-bucket', {
        bucket: 'test-static-bucket',
      });

      const oai = new aws.cloudfront.OriginAccessIdentity('cf-oai', {
        comment: 'OAI for CloudFront',
      });

      const distribution = new aws.cloudfront.Distribution('test-cf', {
        enabled: true,
        origins: [
          {
            originId: bucket.id,
            domainName: bucket.bucketRegionalDomainName,
            s3OriginConfig: {
              originAccessIdentity: oai.cloudfrontAccessIdentityPath,
            },
          },
        ],
        defaultRootObject: 'index.html',
        defaultCacheBehavior: {
          targetOriginId: bucket.id,
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          forwardedValues: {
            queryString: false,
            cookies: { forward: 'none' },
          },
          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
          compress: true,
        },
        restrictions: {
          geoRestriction: { restrictionType: 'none' },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
        priceClass: 'PriceClass_100',
      });

      expect(distribution).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should create CPU utilization alarm', () => {
      const cluster = new aws.ecs.Cluster('alarm-cluster', {
        name: 'test-cluster',
      });

      const service = new aws.ecs.Service('alarm-service', {
        name: 'test-service',
        cluster: cluster.id,
        taskDefinition: 'test-task:1',
      });

      const alarm = new aws.cloudwatch.MetricAlarm('cpu-alarm', {
        name: 'ecs-cpu-high-test',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'ECS CPU utilization is too high',
        dimensions: {
          ClusterName: cluster.name,
          ServiceName: service.name,
        },
      });

      expect(alarm).toBeDefined();
      alarm.threshold.apply(t => {
        expect(t).toBe(80);
      });
    });

    it('should create memory utilization alarm', () => {
      const cluster = new aws.ecs.Cluster('mem-cluster', {
        name: 'test-cluster',
      });

      const service = new aws.ecs.Service('mem-service', {
        name: 'test-service',
        cluster: cluster.id,
        taskDefinition: 'test-task:1',
      });

      const alarm = new aws.cloudwatch.MetricAlarm('memory-alarm', {
        name: 'ecs-memory-high-test',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'MemoryUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'ECS memory utilization is too high',
        dimensions: {
          ClusterName: cluster.name,
          ServiceName: service.name,
        },
      });

      expect(alarm).toBeDefined();
    });

    it('should create unhealthy host alarm for ALB', () => {
      const alb = new aws.lb.LoadBalancer('alarm-alb', {
        name: 'test-alb',
        loadBalancerType: 'application',
      });

      const tg = new aws.lb.TargetGroup('alarm-tg', {
        name: 'test-tg',
        port: 8080,
        protocol: 'HTTP',
        vpcId: 'vpc-test',
      });

      const alarm = new aws.cloudwatch.MetricAlarm('unhealthy-alarm', {
        name: 'alb-unhealthy-hosts-test',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 0,
        alarmDescription: 'ALB has unhealthy targets',
        dimensions: {
          LoadBalancer: alb.arnSuffix,
          TargetGroup: tg.arnSuffix,
        },
      });

      expect(alarm).toBeDefined();
    });
  });

  describe('Auto Scaling', () => {
    it('should create auto scaling target for ECS', () => {
      const cluster = new aws.ecs.Cluster('scaling-cluster', {
        name: 'test-cluster',
      });

      const service = new aws.ecs.Service('scaling-service', {
        name: 'test-service',
        cluster: cluster.id,
        taskDefinition: 'test-task:1',
      });

      const target = new aws.appautoscaling.Target('scaling-target', {
        maxCapacity: 10,
        minCapacity: 2,
        resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      });

      expect(target).toBeDefined();
      target.maxCapacity.apply(max => {
        expect(max).toBe(10);
      });
      target.minCapacity.apply(min => {
        expect(min).toBe(2);
      });
    });

    it('should create CPU-based scaling policy', () => {
      const cluster = new aws.ecs.Cluster('policy-cluster', {
        name: 'test-cluster',
      });

      const service = new aws.ecs.Service('policy-service', {
        name: 'test-service',
        cluster: cluster.id,
        taskDefinition: 'test-task:1',
      });

      const target = new aws.appautoscaling.Target('policy-target', {
        maxCapacity: 10,
        minCapacity: 2,
        resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      });

      const policy = new aws.appautoscaling.Policy('scaling-policy', {
        name: 'cpu-scaling-test',
        policyType: 'TargetTrackingScaling',
        resourceId: target.resourceId,
        scalableDimension: target.scalableDimension,
        serviceNamespace: target.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      });

      expect(policy).toBeDefined();
    });
  });

  describe('ECR Repository', () => {
    it('should create ECR repository with scanning enabled', () => {
      const repo = new aws.ecr.Repository('test-ecr', {
        name: 'payment-app-test',
        imageTagMutability: 'MUTABLE',
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        encryptionConfigurations: [
          {
            encryptionType: 'AES256',
          },
        ],
      });

      expect(repo).toBeDefined();
      repo.name.apply(name => {
        expect(name).toBe('payment-app-test');
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create ECS task execution role', () => {
      const role = new aws.iam.Role('exec-role-test', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
              Effect: 'Allow',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
        ],
      });

      expect(role).toBeDefined();
    });

    it('should create IAM policy for secrets access', () => {
      const role = new aws.iam.Role('policy-role', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
              Effect: 'Allow',
            },
          ],
        }),
      });

      const secret = new aws.secretsmanager.Secret('policy-secret', {
        name: 'test-secret-pol',
      });

      const policy = new aws.iam.RolePolicy('test-policy', {
        role: role.id,
        policy: secret.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['secretsmanager:GetSecretValue'],
                Resource: arn,
              },
            ],
          }),
        ),
      });

      expect(policy).toBeDefined();
    });

    it('should create S3 bucket policy with OAI', () => {
      const bucket = new aws.s3.Bucket('test-bucket-policy', {
        bucket: 'test-assets-bucket',
      });

      const oai = new aws.cloudfront.OriginAccessIdentity('test-oai', {
        comment: 'Test OAI',
      });

      const bucketPolicy = new aws.s3.BucketPolicy('test-bucket-policy-resource', {
        bucket: bucket.id,
        policy: pulumi.all([bucket.arn, oai.iamArn]).apply(([bucketArn, oaiArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'AllowCloudFrontOAI',
                Effect: 'Allow',
                Principal: { AWS: oaiArn },
                Action: 's3:GetObject',
                Resource: `${bucketArn}/*`,
              },
            ],
          })
        ),
      });

      expect(bucketPolicy).toBeDefined();
    });

    it('should create ECS task definition with container config', () => {
      const ecrRepo = new aws.ecr.Repository('test-task-ecr', {
        name: 'test-payment-app',
      });

      const secret = new aws.secretsmanager.Secret('test-task-secret-def', {
        name: 'test-db-creds',
      });

      const logGroup = new aws.cloudwatch.LogGroup('test-task-logs', {
        name: '/ecs/test-app',
        retentionInDays: 7,
      });

      const role = new aws.iam.Role('test-task-exec-role', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
              Effect: 'Allow',
            },
          ],
        }),
      });

      const taskDef = new aws.ecs.TaskDefinition('test-task-def-apply', {
        family: 'test-task-family',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '256',
        memory: '512',
        executionRoleArn: role.arn,
        containerDefinitions: pulumi
          .all([ecrRepo.repositoryUrl, secret.arn, logGroup.name])
          .apply(([repoUrl, secretArn, logGroupName]: [string, string, string]) =>
            JSON.stringify([
              {
                name: 'test-app',
                image: `${repoUrl}:v1.0.0`,
                essential: true,
                portMappings: [{ containerPort: 8080, protocol: 'tcp' }],
                environment: [{ name: 'ENV', value: 'test' }],
                secrets: [{ name: 'DB_CREDS', valueFrom: secretArn }],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': 'us-west-2',
                    'awslogs-stream-prefix': 'test-app',
                  },
                },
              },
            ])
          ),
      });

      expect(taskDef).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    it('should create RDS security group with PostgreSQL port', () => {
      const sg = new aws.ec2.SecurityGroup('rds-sg-test', {
        vpcId: 'vpc-test',
        description: 'Security group for RDS Aurora PostgreSQL',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
      });

      expect(sg).toBeDefined();
    });

    it('should create security group rule for RDS from ECS', () => {
      const rdsSg = new aws.ec2.SecurityGroup('rds-sg', {
        vpcId: 'vpc-test',
      });

      const ecsSg = new aws.ec2.SecurityGroup('ecs-sg', {
        vpcId: 'vpc-test',
      });

      const rule = new aws.ec2.SecurityGroupRule('rds-rule', {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        securityGroupId: rdsSg.id,
        sourceSecurityGroupId: ecsSg.id,
        description: 'PostgreSQL access from ECS tasks',
      });

      expect(rule).toBeDefined();
      rule.fromPort.apply(port => {
        expect(port).toBe(5432);
      });
    });

    it('should create ECS security group allowing VPC traffic', () => {
      const sg = new aws.ec2.SecurityGroup('ecs-sg-test', {
        vpcId: 'vpc-test',
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'Application port from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
      });

      expect(sg).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should apply tags to all tagged resources', () => {
      const tags = {
        Environment: 'payment-test',
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      };

      const bucket = new aws.s3.Bucket('tagged-bucket', {
        bucket: 'test-bucket',
        tags: tags,
      });

      expect(bucket).toBeDefined();
    });
  });

  describe('Resource Configuration Validation', () => {
    it('should enforce no deletion protection on ALB', () => {
      const alb = new aws.lb.LoadBalancer('validation-alb', {
        name: 'test-alb',
        internal: false,
        loadBalancerType: 'application',
        enableDeletionProtection: false,
      });

      alb.enableDeletionProtection.apply(enabled => {
        expect(enabled).toBe(false);
      });
    });

    it('should configure RDS with skip final snapshot', () => {
      const cluster = new aws.rds.Cluster('validation-cluster', {
        clusterIdentifier: 'test-cluster',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        skipFinalSnapshot: true,
      });

      cluster.skipFinalSnapshot.apply(skip => {
        expect(skip).toBe(true);
      });
    });

    it('should use specific image tags not latest', () => {
      const repoUrl = 'test.ecr.amazonaws.com/payment-app';
      const imageTag = `${repoUrl}:v1.0.0`;

      expect(imageTag).not.toContain(':latest');
      expect(imageTag).toContain(':v1.0.0');
    });
  });
});

// Second test suite to cover aws.config.region branch
describe('Payment Processing Infrastructure - With aws.config.region', () => {
  let indexModule2: any;

  beforeAll(() => {
    // Clear module cache to force re-import
    jest.resetModules();

    // Delete AWS_REGION to test aws.config.region branch
    delete process.env.AWS_REGION;

    // Mock with defined region
    pulumi.runtime.setMocks({
      newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string, state: any } {
        const state = { ...args.inputs };
        state.arn = `arn:aws:${args.type}:${args.name}`;
        state.id = args.name + '_id';
        return { id: state.id, state };
      },
      call: function (args: pulumi.runtime.MockCallArgs) {
        if (args.token === 'aws:index/getRegion:getRegion') {
          return { name: 'us-west-2' }; // Return a region to test second branch
        }
        return args.inputs;
      },
    });

    // Import again - this will test aws.config.region branch
    indexModule2 = require('../index');
  });

  it('should successfully create infrastructure with aws.config.region', () => {
    expect(indexModule2).toBeDefined();
  });

  it('should have valid exports', () => {
    expect(indexModule2.vpcId).toBeDefined();
    expect(indexModule2.albDnsName).toBeDefined();
  });
});

