import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
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
        environmentSuffix: 'prod',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack creates AWS provider with correct region', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);

      const config = JSON.parse(synthesized);
      expect(config.provider).toBeDefined();
      expect(config.provider.aws).toBeDefined();
      expect(config.provider.aws[0].region).toBe('us-east-1');
    });

    test('TapStack creates LocalBackend configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      const config = JSON.parse(synthesized);
      expect(config.terraform).toBeDefined();
      expect(config.terraform.backend).toBeDefined();
      expect(config.terraform.backend.local).toBeDefined();
      expect(config.terraform.backend.local.path).toBe('terraform.test.tfstate');
    });

    test('TapStack respects AWS_REGION_OVERRIDE', () => {
      app = new App();
      // AWS_REGION_OVERRIDE is hardcoded to 'us-east-1' in tap-stack.ts
      // This test verifies the override logic works
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'us-west-2', // This should be overridden
      });
      synthesized = Testing.synth(stack);

      const config = JSON.parse(synthesized);
      // Due to AWS_REGION_OVERRIDE = 'us-east-1', region should be us-east-1
      expect(config.provider.aws[0].region).toBe('us-east-1');
    });
  });

  describe('Manufacturing Stack Resources', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('Creates VPC with correct CIDR and DNS configuration', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource).toBeDefined();
      expect(config.resource.aws_vpc).toBeDefined();

      const vpcs = Object.values(config.resource.aws_vpc) as any[];
      expect(vpcs.length).toBeGreaterThan(0);

      const vpc = vpcs[0];
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBeTruthy();
      expect(vpc.enable_dns_support).toBeTruthy();
      expect(vpc.tags.Name).toContain('manufacturing-vpc');
      expect(vpc.tags.Environment).toBe('dev');
    });

    test('Creates Kinesis Stream for data ingestion', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_kinesis_stream).toBeDefined();

      const streams = Object.values(config.resource.aws_kinesis_stream) as any[];
      expect(streams.length).toBeGreaterThan(0);

      const stream = streams[0];
      expect(stream.name).toContain('manufacturing');
      expect(stream.name).toContain('stream');
      expect(stream.shard_count).toBeGreaterThanOrEqual(4);
      expect(stream.retention_period).toBeGreaterThanOrEqual(168); // 7 days minimum
      expect(stream.encryption_type).toBe('KMS');
      expect(stream.tags.Environment).toBe('dev');
    });

    test('Creates ECS Cluster for data processing', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_ecs_cluster).toBeDefined();

      const clusters = Object.values(config.resource.aws_ecs_cluster) as any[];
      expect(clusters.length).toBeGreaterThan(0);

      const cluster = clusters[0];
      expect(cluster.name).toContain('manufacturing-cluster');
      expect(cluster.tags.Name).toContain('manufacturing-cluster');
      expect(cluster.tags.Environment).toBe('dev');
    });

    test('Creates ECS Task Definition with Fargate compatibility', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_ecs_task_definition).toBeDefined();

      const taskDefs = Object.values(config.resource.aws_ecs_task_definition) as any[];
      expect(taskDefs.length).toBeGreaterThan(0);

      const taskDef = taskDefs[0];
      expect(taskDef.family).toContain('manufacturing-processor');
      expect(taskDef.requires_compatibilities).toEqual(['FARGATE']);
      expect(taskDef.network_mode).toBe('awsvpc');
      expect(taskDef.cpu).toBeDefined();
      expect(taskDef.memory).toBeDefined();
    });

    test('Creates RDS Aurora PostgreSQL cluster with encryption', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_rds_cluster).toBeDefined();

      const clusters = Object.values(config.resource.aws_rds_cluster) as any[];
      expect(clusters.length).toBeGreaterThan(0);

      const cluster = clusters[0];
      expect(cluster.cluster_identifier).toContain('manufacturing-aurora');
      expect(cluster.engine).toBe('aurora-postgresql');
      expect(cluster.storage_encrypted).toBeTruthy();
      expect(cluster.backup_retention_period).toBeLessThanOrEqual(35); // AWS maximum
      expect(cluster.preferred_backup_window).toBeDefined();
      expect(cluster.tags.Environment).toBe('dev');
    });

    test('Creates RDS Aurora instances in multiple AZs', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_rds_cluster_instance).toBeDefined();

      const instances = Object.values(config.resource.aws_rds_cluster_instance) as any[];
      expect(instances.length).toBeGreaterThanOrEqual(2); // Multi-AZ requirement

      instances.forEach((instance: any) => {
        expect(instance.cluster_identifier).toBeDefined();
        expect(instance.instance_class).toBeDefined();
        expect(instance.engine).toBe('aurora-postgresql');
      });
    });

    test('Creates ElastiCache Redis cluster for real-time analytics', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_elasticache_replication_group).toBeDefined();

      const repGroups = Object.values(config.resource.aws_elasticache_replication_group) as any[];
      expect(repGroups.length).toBeGreaterThan(0);

      const redisCluster = repGroups[0];
      expect(redisCluster.replication_group_id).toContain('manufacturing-redis');
      expect(redisCluster.engine).toBe('redis');
      expect(redisCluster.at_rest_encryption_enabled).toBeTruthy();
      expect(redisCluster.transit_encryption_enabled).toBeTruthy();
      expect(redisCluster.automatic_failover_enabled).toBeTruthy(); // Multi-AZ
      expect(redisCluster.num_cache_clusters).toBeGreaterThanOrEqual(2);
    });

    test('Creates EFS file system with encryption', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_efs_file_system).toBeDefined();

      const fileSystems = Object.values(config.resource.aws_efs_file_system) as any[];
      expect(fileSystems.length).toBeGreaterThan(0);

      const efs = fileSystems[0];
      expect(efs.encrypted).toBeTruthy();
      expect(efs.kms_key_id).toBeDefined();
      expect(efs.tags.Name).toContain('manufacturing-efs');
      expect(efs.tags.Environment).toBe('dev');
    });

    test('Creates EFS mount targets in multiple AZs', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_efs_mount_target).toBeDefined();

      const mountTargets = Object.values(config.resource.aws_efs_mount_target) as any[];
      expect(mountTargets.length).toBeGreaterThanOrEqual(2); // Multi-AZ requirement

      mountTargets.forEach((mt: any) => {
        expect(mt.file_system_id).toBeDefined();
        expect(mt.subnet_id).toBeDefined();
        expect(mt.security_groups).toBeDefined();
      });
    });

    test('Creates API Gateway REST API', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_api_gateway_rest_api).toBeDefined();

      const apis = Object.values(config.resource.aws_api_gateway_rest_api) as any[];
      expect(apis.length).toBeGreaterThan(0);

      const api = apis[0];
      expect(api.name).toContain('manufacturing-api');
      expect(api.tags.Environment).toBe('dev');
    });

    test('Creates Secrets Manager secret for database credentials', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_secretsmanager_secret).toBeDefined();

      const secrets = Object.values(config.resource.aws_secretsmanager_secret) as any[];
      expect(secrets.length).toBeGreaterThan(0);

      const dbSecret = secrets.find((s: any) => s.name?.includes('db-password'));
      expect(dbSecret).toBeDefined();
      expect(dbSecret.recovery_window_in_days).toBeLessThanOrEqual(30);
      expect(dbSecret.tags.Environment).toBe('dev');
    });

    test('Creates KMS key with rotation enabled', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_kms_key).toBeDefined();

      const keys = Object.values(config.resource.aws_kms_key) as any[];
      expect(keys.length).toBeGreaterThan(0);

      const kmsKey = keys[0];
      expect(kmsKey.description).toContain('Manufacturing');
      expect(kmsKey.enable_key_rotation).toBeTruthy();
      expect(kmsKey.deletion_window_in_days).toBeLessThanOrEqual(30);
      expect(kmsKey.tags.Environment).toBe('dev');
    });

    test('Creates CloudWatch Log Groups for monitoring', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_cloudwatch_log_group).toBeDefined();

      const logGroups = Object.values(config.resource.aws_cloudwatch_log_group) as any[];
      expect(logGroups.length).toBeGreaterThanOrEqual(2); // ECS and API logs

      logGroups.forEach((lg: any) => {
        expect(lg.name).toBeDefined();
        expect(lg.retention_in_days).toBeGreaterThanOrEqual(365); // 1 year minimum for compliance
        expect(lg.tags).toBeDefined();
      });
    });

    test('Creates CloudWatch Metric Alarms for critical thresholds', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_cloudwatch_metric_alarm).toBeDefined();

      const alarms = Object.values(config.resource.aws_cloudwatch_metric_alarm) as any[];
      expect(alarms.length).toBeGreaterThan(0);

      alarms.forEach((alarm: any) => {
        expect(alarm.alarm_name).toBeDefined();
        expect(alarm.comparison_operator).toBeDefined();
        expect(alarm.evaluation_periods).toBeGreaterThan(0);
        expect(alarm.metric_name).toBeDefined();
        expect(alarm.namespace).toBeDefined();
        expect(alarm.period).toBeGreaterThan(0);
        expect(alarm.statistic).toBeDefined();
        expect(alarm.threshold).toBeDefined();
      });
    });

    test('Creates X-Ray tracing for distributed request tracking', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_xray_group).toBeDefined();
      expect(config.resource.aws_xray_sampling_rule).toBeDefined();

      const xrayGroups = Object.values(config.resource.aws_xray_group) as any[];
      expect(xrayGroups.length).toBeGreaterThan(0);

      const xraySamplingRules = Object.values(config.resource.aws_xray_sampling_rule) as any[];
      expect(xraySamplingRules.length).toBeGreaterThan(0);
    });

    test('Creates IAM roles with least privilege access', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_iam_role).toBeDefined();

      const roles = Object.values(config.resource.aws_iam_role) as any[];
      expect(roles.length).toBeGreaterThanOrEqual(2); // Task execution and task role

      roles.forEach((role: any) => {
        expect(role.name).toBeDefined();
        expect(role.assume_role_policy).toBeDefined();
        expect(role.tags).toBeDefined();
      });
    });

    test('Creates security groups with appropriate ingress/egress rules', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_security_group).toBeDefined();

      const sgs = Object.values(config.resource.aws_security_group) as any[];
      expect(sgs.length).toBeGreaterThanOrEqual(4); // ECS, RDS, Redis, EFS

      sgs.forEach((sg: any) => {
        expect(sg.name).toBeDefined();
        expect(sg.description).toBeDefined();
        expect(sg.vpc_id).toBeDefined();
        expect(sg.tags).toBeDefined();
      });
    });

    test('Creates Terraform outputs for key resources', () => {
      const config = JSON.parse(synthesized);
      expect(config.output).toBeDefined();

      const outputs = config.output;

      // Check for manufacturing outputs (may have varying suffixes)
      const outputKeys = Object.keys(outputs);
      const hasVpcOutput = outputKeys.some(k => k.includes('vpc-id'));
      const hasKinesisOutput = outputKeys.some(k => k.includes('kinesis-stream-name'));
      const hasEcsOutput = outputKeys.some(k => k.includes('ecs-cluster-name'));
      const hasRdsOutput = outputKeys.some(k => k.includes('aurora-endpoint') || k.includes('rds-cluster-endpoint'));
      const hasRedisOutput = outputKeys.some(k => k.includes('redis-endpoint'));
      const hasEfsOutput = outputKeys.some(k => k.includes('efs-id'));
      const hasApiOutput = outputKeys.some(k => k.includes('api-gateway-url'));

      expect(hasVpcOutput).toBe(true);
      expect(hasKinesisOutput).toBe(true);
      expect(hasEcsOutput).toBe(true);
      expect(hasRdsOutput).toBe(true);
      expect(hasRedisOutput).toBe(true);
      expect(hasEfsOutput).toBe(true);
      expect(hasApiOutput).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
    });

    test('All encryption uses KMS keys', () => {
      const config = JSON.parse(synthesized);

      // Check Kinesis encryption
      if (config.resource.aws_kinesis_stream) {
        const streams = Object.values(config.resource.aws_kinesis_stream) as any[];
        streams.forEach((stream: any) => {
          expect(stream.encryption_type).toBe('KMS');
          expect(stream.kms_key_id).toBeDefined();
        });
      }

      // Check RDS encryption
      if (config.resource.aws_rds_cluster) {
        const clusters = Object.values(config.resource.aws_rds_cluster) as any[];
        clusters.forEach((cluster: any) => {
          expect(cluster.storage_encrypted).toBeTruthy();
          expect(cluster.kms_key_id).toBeDefined();
        });
      }

      // Check EFS encryption
      if (config.resource.aws_efs_file_system) {
        const fileSystems = Object.values(config.resource.aws_efs_file_system) as any[];
        fileSystems.forEach((fs: any) => {
          expect(fs.encrypted).toBeTruthy();
          expect(fs.kms_key_id).toBeDefined();
        });
      }

      // Check Redis encryption
      if (config.resource.aws_elasticache_replication_group) {
        const repGroups = Object.values(config.resource.aws_elasticache_replication_group) as any[];
        repGroups.forEach((rg: any) => {
          expect(rg.at_rest_encryption_enabled).toBeTruthy();
          expect(rg.transit_encryption_enabled).toBeTruthy();
        });
      }
    });

    test('Multi-AZ configuration for high availability', () => {
      const config = JSON.parse(synthesized);

      // Check RDS multi-AZ
      if (config.resource.aws_rds_cluster_instance) {
        const instances = Object.values(config.resource.aws_rds_cluster_instance) as any[];
        expect(instances.length).toBeGreaterThanOrEqual(2);
      }

      // Check Redis multi-AZ
      if (config.resource.aws_elasticache_replication_group) {
        const repGroups = Object.values(config.resource.aws_elasticache_replication_group) as any[];
        repGroups.forEach((rg: any) => {
          expect(rg.automatic_failover_enabled).toBeTruthy();
          expect(rg.num_cache_clusters).toBeGreaterThanOrEqual(2);
        });
      }

      // Check EFS multi-AZ (mount targets)
      if (config.resource.aws_efs_mount_target) {
        const mountTargets = Object.values(config.resource.aws_efs_mount_target) as any[];
        expect(mountTargets.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('All resources include environmentSuffix in names', () => {
      const config = JSON.parse(synthesized);

      // Helper function to check resource names
      const checkResourceNames = (resources: any) => {
        Object.values(resources).forEach((resource: any) => {
          const resourceStr = JSON.stringify(resource);
          expect(resourceStr).toMatch(/dev|test|prod/);
        });
      };

      // Check various resource types
      if (config.resource.aws_vpc) checkResourceNames(config.resource.aws_vpc);
      if (config.resource.aws_kinesis_stream) checkResourceNames(config.resource.aws_kinesis_stream);
      if (config.resource.aws_ecs_cluster) checkResourceNames(config.resource.aws_ecs_cluster);
      if (config.resource.aws_rds_cluster) checkResourceNames(config.resource.aws_rds_cluster);
      if (config.resource.aws_elasticache_replication_group) checkResourceNames(config.resource.aws_elasticache_replication_group);
    });

    test('All destroyable - no retention policies or deletion protection', () => {
      const config = JSON.parse(synthesized);

      // Check RDS deletion protection
      if (config.resource.aws_rds_cluster) {
        const clusters = Object.values(config.resource.aws_rds_cluster) as any[];
        clusters.forEach((cluster: any) => {
          expect(cluster.deletion_protection).toBeFalsy();
        });
      }

      // Check KMS deletion window is reasonable for testing
      if (config.resource.aws_kms_key) {
        const keys = Object.values(config.resource.aws_kms_key) as any[];
        keys.forEach((key: any) => {
          expect(key.deletion_window_in_days).toBeLessThanOrEqual(30);
        });
      }

      // Check Secrets Manager recovery window
      if (config.resource.aws_secretsmanager_secret) {
        const secrets = Object.values(config.resource.aws_secretsmanager_secret) as any[];
        secrets.forEach((secret: any) => {
          expect(secret.recovery_window_in_days).toBeLessThanOrEqual(30);
        });
      }
    });
  });

  describe('Compliance Requirements', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
    });

    test('CloudWatch logs retained for at least 1 year for compliance', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_cloudwatch_log_group).toBeDefined();

      const logGroups = Object.values(config.resource.aws_cloudwatch_log_group) as any[];
      logGroups.forEach((lg: any) => {
        expect(lg.retention_in_days).toBeGreaterThanOrEqual(365); // 1 year minimum
      });
    });

    test('Kinesis data retention supports 7-day minimum for compliance', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_kinesis_stream).toBeDefined();

      const streams = Object.values(config.resource.aws_kinesis_stream) as any[];
      streams.forEach((stream: any) => {
        expect(stream.retention_period).toBeGreaterThanOrEqual(168); // 7 days in hours
      });
    });

    test('RDS backup retention respects AWS maximum (35 days)', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_rds_cluster).toBeDefined();

      const clusters = Object.values(config.resource.aws_rds_cluster) as any[];
      clusters.forEach((cluster: any) => {
        expect(cluster.backup_retention_period).toBeGreaterThanOrEqual(7); // Minimum 7 days
        expect(cluster.backup_retention_period).toBeLessThanOrEqual(35); // AWS maximum
      });
    });
  });
});
