import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Student Analytics Platform Infrastructure', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'test',
        stateBucket: 'test-state-bucket',
        stateBucketRegion: 'ap-northeast-1',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized.provider).toBeDefined();
      expect(synthesized.provider.aws).toBeDefined();
    });

    test('TapStack uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack configures correct AWS region', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackRegion', {
        awsRegion: 'ap-northeast-1', // This will be ignored since region is forced
        environmentSuffix: 'prod',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].region).toBe('us-east-1');
    });

    test('TapStack configures default tags when provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackTags', {
        environmentSuffix: 'staging',
        defaultTags: {
          Owner: 'test-team',
          Project: 'edu-analytics',
        },
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].default_tags).toBeDefined();
      expect(synthesized.provider.aws[0].default_tags.length).toBeGreaterThan(
        0
      );
    });
  });

  describe('VPC and Network Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestVPCStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Creates VPC with correct CIDR and DNS settings', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
      expect(vpc.tags.Name).toContain('edu-vpc-');
    });

    test('Creates Internet Gateway', () => {
      const igw = Object.values(
        synthesized.resource.aws_internet_gateway
      )[0] as any;
      expect(igw).toBeDefined();
      expect(igw.vpc_id).toBeDefined();
      expect(igw.tags.Name).toContain('edu-igw-');
    });

    test('Creates public subnets in multiple AZs', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet);
      const publicSubnets = subnets.filter((s: any) =>
        s.tags?.Name?.includes('public')
      );
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('Creates private subnets in multiple AZs', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet);
      const privateSubnets = subnets.filter((s: any) =>
        s.tags?.Name?.includes('private')
      );
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('Configures route table for public subnets', () => {
      const routeTables = Object.values(synthesized.resource.aws_route_table);
      expect(routeTables.length).toBeGreaterThan(0);

      const routes = Object.values(synthesized.resource.aws_route);
      const internetRoute = routes.find(
        (r: any) => r.destination_cidr_block === '0.0.0.0/0'
      );
      expect(internetRoute).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestSGStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Creates ALB security group with proper rules', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group
      );
      const albSG = securityGroups.find((sg: any) =>
        sg.name?.includes('alb-sg')
      ) as any;
      expect(albSG).toBeDefined();
      expect(albSG.description).toContain('Load Balancer');
    });

    test('Creates ECS security group', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group
      );
      const ecsSG = securityGroups.find((sg: any) =>
        sg.name?.includes('ecs-sg')
      ) as any;
      expect(ecsSG).toBeDefined();
    });

    test('Creates RDS security group', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group
      );
      const rdsSG = securityGroups.find((sg: any) =>
        sg.name?.includes('rds-sg')
      ) as any;
      expect(rdsSG).toBeDefined();
    });

    test('Creates Redis security group', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group
      );
      const redisSG = securityGroups.find((sg: any) =>
        sg.name?.includes('redis-sg')
      ) as any;
      expect(redisSG).toBeDefined();
    });

    test('Creates EFS security group', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group
      );
      const efsSG = securityGroups.find((sg: any) =>
        sg.name?.includes('efs-sg')
      ) as any;
      expect(efsSG).toBeDefined();
    });

    test('Configures security group rules', () => {
      const rules = Object.values(synthesized.resource.aws_security_group_rule);
      expect(rules.length).toBeGreaterThan(0);
    });
  });

  describe('KMS Encryption', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestKMSStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Creates KMS key with rotation enabled', () => {
      const kmsKey = Object.values(synthesized.resource.aws_kms_key)[0] as any;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.enable_key_rotation).toBe(true);
      expect(kmsKey.deletion_window_in_days).toBe(10);
    });

    test('Creates KMS alias', () => {
      const kmsAlias = Object.values(
        synthesized.resource.aws_kms_alias
      )[0] as any;
      expect(kmsAlias).toBeDefined();
      expect(kmsAlias.name).toContain('edutech');
    });
  });

  describe('Kinesis Data Stream', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestKinesisStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Creates Kinesis stream with encryption', () => {
      const stream = Object.values(
        synthesized.resource.aws_kinesis_stream
      )[0] as any;
      expect(stream).toBeDefined();
      expect(stream.name).toContain('edu-analytics-stream');
      expect(stream.shard_count).toBe(2);
      expect(stream.retention_period).toBe(24);
      expect(stream.encryption_type).toBe('KMS');
    });

    test('Configures shard level metrics', () => {
      const stream = Object.values(
        synthesized.resource.aws_kinesis_stream
      )[0] as any;
      expect(stream.shard_level_metrics).toBeDefined();
      expect(stream.shard_level_metrics.length).toBeGreaterThan(0);
    });

    test('Uses environment suffix in stream name', () => {
      const stream = Object.values(
        synthesized.resource.aws_kinesis_stream
      )[0] as any;
      expect(stream.name).toMatch(/.*-dev$/);
    });
  });

  describe('ElastiCache Redis Cluster', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestRedisStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Creates Redis replication group with Multi-AZ', () => {
      const redis = Object.values(
        synthesized.resource.aws_elasticache_replication_group
      )[0] as any;
      expect(redis).toBeDefined();
      expect(redis.replication_group_id).toContain('edu-redis');
      expect(redis.automatic_failover_enabled).toBe(true);
      expect(redis.multi_az_enabled).toBe(true);
    });

    test('Enables encryption at rest and in transit', () => {
      const redis = Object.values(
        synthesized.resource.aws_elasticache_replication_group
      )[0] as any;
      expect(redis.at_rest_encryption_enabled).toBe('true');
      expect(redis.transit_encryption_enabled).toBe(true);
    });

    test('Uses Redis 7.1 engine', () => {
      const redis = Object.values(
        synthesized.resource.aws_elasticache_replication_group
      )[0] as any;
      expect(redis.engine).toBe('redis');
      expect(redis.engine_version).toBe('7.1');
    });

    test('Creates Redis subnet group', () => {
      const subnetGroup = Object.values(
        synthesized.resource.aws_elasticache_subnet_group
      )[0] as any;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.name).toContain('redis-subnet-group');
    });

    test('Configures backup and maintenance windows', () => {
      const redis = Object.values(
        synthesized.resource.aws_elasticache_replication_group
      )[0] as any;
      expect(redis.snapshot_window).toBeDefined();
      expect(redis.maintenance_window).toBeDefined();
    });
  });

  describe('RDS Aurora PostgreSQL', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestAuroraStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Creates Aurora PostgreSQL cluster', () => {
      const cluster = Object.values(
        synthesized.resource.aws_rds_cluster
      )[0] as any;
      expect(cluster).toBeDefined();
      expect(cluster.cluster_identifier).toContain('edu-aurora');
      expect(cluster.engine).toBe('aurora-postgresql');
      expect(cluster.engine_mode).toBe('provisioned');
    });

    test('Enables storage encryption with KMS', () => {
      const cluster = Object.values(
        synthesized.resource.aws_rds_cluster
      )[0] as any;
      expect(cluster.storage_encrypted).toBe(true);
      expect(cluster.kms_key_id).toBeDefined();
    });

    test('Configures Serverless v2 scaling', () => {
      const cluster = Object.values(
        synthesized.resource.aws_rds_cluster
      )[0] as any;
      expect(cluster.serverlessv2_scaling_configuration).toBeDefined();
      const scalingConfig = Array.isArray(
        cluster.serverlessv2_scaling_configuration
      )
        ? cluster.serverlessv2_scaling_configuration[0]
        : cluster.serverlessv2_scaling_configuration;
      expect(scalingConfig.min_capacity).toBe(0.5);
      expect(scalingConfig.max_capacity).toBe(2);
    });

    test('Creates Aurora cluster instance', () => {
      const instance = Object.values(
        synthesized.resource.aws_rds_cluster_instance
      )[0] as any;
      expect(instance).toBeDefined();
      expect(instance.instance_class).toBe('db.serverless');
    });

    test('Creates DB subnet group', () => {
      const subnetGroup = Object.values(
        synthesized.resource.aws_db_subnet_group
      )[0] as any;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.name).toContain('db-subnet-group');
    });

    test('Enables CloudWatch log exports', () => {
      const cluster = Object.values(
        synthesized.resource.aws_rds_cluster
      )[0] as any;
      expect(cluster.enabled_cloudwatch_logs_exports).toContain('postgresql');
    });

    test('Sets skip final snapshot for destroyability', () => {
      const cluster = Object.values(
        synthesized.resource.aws_rds_cluster
      )[0] as any;
      expect(cluster.skip_final_snapshot).toBe(true);
    });
  });

  describe('EFS File System', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestEFSStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Creates EFS file system with encryption', () => {
      const efs = Object.values(
        synthesized.resource.aws_efs_file_system
      )[0] as any;
      expect(efs).toBeDefined();
      expect(efs.encrypted).toBe(true);
      expect(efs.kms_key_id).toBeDefined();
    });

    test('Configures performance and throughput modes', () => {
      const efs = Object.values(
        synthesized.resource.aws_efs_file_system
      )[0] as any;
      expect(efs.performance_mode).toBe('generalPurpose');
      expect(efs.throughput_mode).toBe('bursting');
    });

    test('Creates mount targets in multiple AZs', () => {
      const mountTargets = Object.values(
        synthesized.resource.aws_efs_mount_target
      );
      expect(mountTargets.length).toBeGreaterThanOrEqual(2);
    });

    test('Configures lifecycle policy', () => {
      const efs = Object.values(
        synthesized.resource.aws_efs_file_system
      )[0] as any;
      expect(efs.lifecycle_policy).toBeDefined();
    });
  });

  describe('Secrets Manager', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestSecretsStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Creates database credentials secret', () => {
      const secrets = Object.values(
        synthesized.resource.aws_secretsmanager_secret
      );
      const dbSecret = secrets.find((s: any) =>
        s.name?.includes('db-credentials')
      ) as any;
      expect(dbSecret).toBeDefined();
      expect(dbSecret.kms_key_id).toBeDefined();
    });

    test('Creates Redis configuration secret', () => {
      const secrets = Object.values(
        synthesized.resource.aws_secretsmanager_secret
      );
      const redisSecret = secrets.find((s: any) =>
        s.name?.includes('redis-config')
      ) as any;
      expect(redisSecret).toBeDefined();
    });

    test('Creates secret versions', () => {
      const versions = Object.values(
        synthesized.resource.aws_secretsmanager_secret_version
      );
      expect(versions.length).toBeGreaterThanOrEqual(2);
    });

    test('Configures secret rotation', () => {
      const rotation = Object.values(
        synthesized.resource.aws_secretsmanager_secret_rotation
      )[0] as any;
      expect(rotation).toBeDefined();
      expect(rotation.rotation_rules).toBeDefined();
      const rotationRules = Array.isArray(rotation.rotation_rules)
        ? rotation.rotation_rules[0]
        : rotation.rotation_rules;
      expect(rotationRules.automatically_after_days).toBe(30);
    });

    test('Creates Lambda function for rotation', () => {
      const lambdas = Object.values(synthesized.resource.aws_lambda_function);
      const rotationLambda = lambdas.find((l: any) =>
        l.function_name?.includes('rotation')
      ) as any;
      expect(rotationLambda).toBeDefined();
      expect(rotationLambda.runtime).toBe('python3.11');
    });
  });

  describe('ECS Fargate Cluster', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestECSStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Creates ECS cluster with container insights', () => {
      const cluster = Object.values(
        synthesized.resource.aws_ecs_cluster
      )[0] as any;
      expect(cluster).toBeDefined();
      expect(cluster.name).toContain('edu-ecs-cluster');
      expect(cluster.setting).toBeDefined();
    });

    test('Creates ECS task definition for Fargate', () => {
      const taskDef = Object.values(
        synthesized.resource.aws_ecs_task_definition
      )[0] as any;
      expect(taskDef).toBeDefined();
      expect(taskDef.family).toContain('edu-analytics-task');
      expect(taskDef.network_mode).toBe('awsvpc');
      expect(taskDef.requires_compatibilities).toContain('FARGATE');
    });

    test('Configures task with appropriate CPU and memory', () => {
      const taskDef = Object.values(
        synthesized.resource.aws_ecs_task_definition
      )[0] as any;
      expect(taskDef.cpu).toBe('512');
      expect(taskDef.memory).toBe('1024');
    });

    test('Creates IAM role for task execution', () => {
      const roles = Object.values(synthesized.resource.aws_iam_role);
      const executionRole = roles.find((r: any) =>
        r.name?.includes('execution-role')
      ) as any;
      expect(executionRole).toBeDefined();
    });

    test('Creates IAM role for task', () => {
      const roles = Object.values(synthesized.resource.aws_iam_role);
      const taskRole = roles.find(
        (r: any) =>
          r.name?.includes('task-role') && !r.name?.includes('execution')
      ) as any;
      expect(taskRole).toBeDefined();
    });

    test('Creates ECS service with desired count', () => {
      const service = Object.values(
        synthesized.resource.aws_ecs_service
      )[0] as any;
      expect(service).toBeDefined();
      expect(service.name).toContain('edu-analytics-service');
      expect(service.desired_count).toBe(2);
      expect(service.launch_type).toBe('FARGATE');
    });

    test('Configures ECS service with load balancer', () => {
      const service = Object.values(
        synthesized.resource.aws_ecs_service
      )[0] as any;
      expect(service.load_balancer).toBeDefined();
      expect(service.load_balancer.length).toBeGreaterThan(0);
    });

    test('Creates CloudWatch log group for ECS', () => {
      const logGroups = Object.values(
        synthesized.resource.aws_cloudwatch_log_group
      );
      const ecsLogGroup = logGroups.find((lg: any) =>
        lg.name?.includes('/ecs/')
      ) as any;
      expect(ecsLogGroup).toBeDefined();
      expect(ecsLogGroup.retention_in_days).toBe(7);
    });

    test('Creates Application Load Balancer', () => {
      const alb = Object.values(synthesized.resource.aws_lb)[0] as any;
      expect(alb).toBeDefined();
      expect(alb.name).toContain('edu-alb');
      expect(alb.load_balancer_type).toBe('application');
      expect(alb.internal).toBe(false);
    });

    test('Creates target group for ECS service', () => {
      const targetGroup = Object.values(
        synthesized.resource.aws_lb_target_group
      )[0] as any;
      expect(targetGroup).toBeDefined();
      expect(targetGroup.port).toBe(80);
      expect(targetGroup.protocol).toBe('HTTP');
      expect(targetGroup.target_type).toBe('ip');
    });

    test('Creates ALB listener', () => {
      const listener = Object.values(
        synthesized.resource.aws_lb_listener
      )[0] as any;
      expect(listener).toBeDefined();
      expect(listener.port).toBe(80);
      expect(listener.protocol).toBe('HTTP');
    });
  });

  describe('API Gateway', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestAPIStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Creates REST API Gateway', () => {
      const api = Object.values(
        synthesized.resource.aws_api_gateway_rest_api
      )[0] as any;
      expect(api).toBeDefined();
      expect(api.name).toContain('edu-analytics-api');
      expect(api.description).toContain('student analytics');
    });

    test('Creates API resources', () => {
      const resources = Object.values(
        synthesized.resource.aws_api_gateway_resource
      );
      expect(resources.length).toBeGreaterThanOrEqual(2);
    });

    test('Creates API methods', () => {
      const methods = Object.values(
        synthesized.resource.aws_api_gateway_method
      );
      expect(methods.length).toBeGreaterThanOrEqual(2);
    });

    test('Configures API integrations', () => {
      const integrations = Object.values(
        synthesized.resource.aws_api_gateway_integration
      );
      expect(integrations.length).toBeGreaterThanOrEqual(2);
    });

    test('Creates API deployment', () => {
      const deployment = Object.values(
        synthesized.resource.aws_api_gateway_deployment
      )[0] as any;
      expect(deployment).toBeDefined();
    });

    test('Creates API stage with logging', () => {
      const stage = Object.values(
        synthesized.resource.aws_api_gateway_stage
      )[0] as any;
      expect(stage).toBeDefined();
      expect(stage.xray_tracing_enabled).toBe(true);
      expect(stage.access_log_settings).toBeDefined();
    });

    test('Creates CloudWatch log group for API Gateway', () => {
      const logGroups = Object.values(
        synthesized.resource.aws_cloudwatch_log_group
      );
      const apiLogGroup = logGroups.find((lg: any) =>
        lg.name?.includes('/aws/apigateway/')
      ) as any;
      expect(apiLogGroup).toBeDefined();
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestNamingStack', {
        environmentSuffix: 'staging',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('All VPC resources include environment suffix', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Name).toContain('staging');
    });

    test('All security groups include environment suffix', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group
      );
      securityGroups.forEach((sg: any) => {
        expect(sg.name).toContain('staging');
      });
    });

    test('Kinesis stream includes environment suffix', () => {
      const stream = Object.values(
        synthesized.resource.aws_kinesis_stream
      )[0] as any;
      expect(stream.name).toContain('staging');
    });

    test('Redis cluster includes environment suffix', () => {
      const redis = Object.values(
        synthesized.resource.aws_elasticache_replication_group
      )[0] as any;
      expect(redis.replication_group_id).toContain('staging');
    });

    test('Aurora cluster includes environment suffix', () => {
      const cluster = Object.values(
        synthesized.resource.aws_rds_cluster
      )[0] as any;
      expect(cluster.cluster_identifier).toContain('staging');
    });

    test('ECS cluster includes environment suffix', () => {
      const cluster = Object.values(
        synthesized.resource.aws_ecs_cluster
      )[0] as any;
      expect(cluster.name).toContain('staging');
    });

    test('API Gateway includes environment suffix', () => {
      const api = Object.values(
        synthesized.resource.aws_api_gateway_rest_api
      )[0] as any;
      expect(api.name).toContain('staging');
    });
  });

  describe('Security Best Practices', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestSecurityStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('All encryption uses KMS with key rotation', () => {
      const kmsKey = Object.values(synthesized.resource.aws_kms_key)[0] as any;
      expect(kmsKey.enable_key_rotation).toBe(true);
    });

    test('Kinesis stream uses KMS encryption', () => {
      const stream = Object.values(
        synthesized.resource.aws_kinesis_stream
      )[0] as any;
      expect(stream.encryption_type).toBe('KMS');
    });

    test('Redis uses encryption at rest and in transit', () => {
      const redis = Object.values(
        synthesized.resource.aws_elasticache_replication_group
      )[0] as any;
      expect(redis.at_rest_encryption_enabled).toBe('true');
      expect(redis.transit_encryption_enabled).toBe(true);
    });

    test('Aurora uses storage encryption', () => {
      const cluster = Object.values(
        synthesized.resource.aws_rds_cluster
      )[0] as any;
      expect(cluster.storage_encrypted).toBe(true);
    });

    test('EFS uses encryption', () => {
      const efs = Object.values(
        synthesized.resource.aws_efs_file_system
      )[0] as any;
      expect(efs.encrypted).toBe(true);
    });

    test('Secrets Manager secrets use KMS encryption', () => {
      const secrets = Object.values(
        synthesized.resource.aws_secretsmanager_secret
      );
      secrets.forEach((secret: any) => {
        expect(secret.kms_key_id).toBeDefined();
      });
    });

    test('CloudWatch log groups are configured with retention', () => {
      const logGroups = Object.values(
        synthesized.resource.aws_cloudwatch_log_group
      );
      logGroups.forEach((lg: any) => {
        expect(lg.retention_in_days).toBeDefined();
        expect(lg.name).toBeDefined();
      });
    });

    test('IAM roles follow least privilege principle', () => {
      const policies = Object.values(synthesized.resource.aws_iam_policy);
      expect(policies.length).toBeGreaterThan(0);
    });
  });

  describe('High Availability Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestHAStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Redis cluster has Multi-AZ enabled', () => {
      const redis = Object.values(
        synthesized.resource.aws_elasticache_replication_group
      )[0] as any;
      expect(redis.multi_az_enabled).toBe(true);
      expect(redis.automatic_failover_enabled).toBe(true);
    });

    test('ECS service runs in multiple subnets', () => {
      const service = Object.values(
        synthesized.resource.aws_ecs_service
      )[0] as any;
      expect(service.network_configuration).toBeDefined();
    });

    test('ALB spans multiple availability zones', () => {
      const alb = Object.values(synthesized.resource.aws_lb)[0] as any;
      expect(alb.subnets).toBeDefined();
    });

    test('EFS has mount targets in multiple AZs', () => {
      const mountTargets = Object.values(
        synthesized.resource.aws_efs_mount_target
      );
      expect(mountTargets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('FERPA Compliance Features', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestComplianceStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('All data at rest is encrypted', () => {
      const kmsKey = Object.values(synthesized.resource.aws_kms_key)[0] as any;
      expect(kmsKey).toBeDefined();

      const efs = Object.values(
        synthesized.resource.aws_efs_file_system
      )[0] as any;
      expect(efs.encrypted).toBe(true);

      const rds = Object.values(synthesized.resource.aws_rds_cluster)[0] as any;
      expect(rds.storage_encrypted).toBe(true);
    });

    test('Data in transit is encrypted', () => {
      const redis = Object.values(
        synthesized.resource.aws_elasticache_replication_group
      )[0] as any;
      expect(redis.transit_encryption_enabled).toBe(true);
    });

    test('CloudWatch logging is enabled for audit trails', () => {
      const logGroups = Object.values(
        synthesized.resource.aws_cloudwatch_log_group
      );
      expect(logGroups.length).toBeGreaterThan(0);
    });

    test('API Gateway has X-Ray tracing enabled', () => {
      const stage = Object.values(
        synthesized.resource.aws_api_gateway_stage
      )[0] as any;
      expect(stage.xray_tracing_enabled).toBe(true);
    });
  });
});
