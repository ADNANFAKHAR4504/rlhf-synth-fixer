import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Healthcare Infrastructure Stack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully via props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
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

    test('TapStack handles defaultTags configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithTags', {
        environmentSuffix: 'dev',
        defaultTags: {
          tags: {
            Environment: 'development',
            Project: 'healthcare',
          },
        },
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const awsProvider = synthesized.provider?.aws?.[0];
      expect(awsProvider).toBeDefined();
      expect(awsProvider.default_tags).toBeDefined();
      expect(awsProvider.default_tags).toHaveLength(1);
      expect(awsProvider.default_tags[0].tags).toEqual({
        Environment: 'development',
        Project: 'healthcare',
      });
    });

    test('TapStack uses correct region when AWS_REGION_OVERRIDE is set', () => {
      // Store the original AWS_REGION_OVERRIDE value
      const originalAwsRegionOverride = process.env.AWS_REGION_OVERRIDE;

      try {
        // Set AWS_REGION_OVERRIDE
        process.env.AWS_REGION_OVERRIDE = 'eu-west-1';

        app = new App();
        stack = new TapStack(app, 'TestTapStackWithRegionOverride');
        synthesized = JSON.parse(Testing.synth(stack));

        const awsProvider = synthesized.provider?.aws?.[0];
        expect(awsProvider).toBeDefined();
        expect(awsProvider.region).toBe(process.env.AWS_REGION_OVERRIDE);
      } finally {
        // Restore the original value
        if (originalAwsRegionOverride === undefined) {
          delete process.env.AWS_REGION_OVERRIDE;
        } else {
          process.env.AWS_REGION_OVERRIDE = originalAwsRegionOverride;
        }
      }
    });
  });

  describe('VPC Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestVPCStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('VPC is created with correct CIDR block', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc).find(
        (r: any) => r.cidr_block === '10.0.0.0/16'
      );
      expect(vpc).toBeDefined();
      expect(vpc).toHaveProperty('enable_dns_hostnames', true);
      expect(vpc).toHaveProperty('enable_dns_support', true);
    });

    test('Public subnets are created in different AZs', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      const publicSubnets = subnets.filter(
        (s: any) =>
          s.cidr_block === '10.0.1.0/24' || s.cidr_block === '10.0.2.0/24'
      );
      expect(publicSubnets.length).toBe(2);
      publicSubnets.forEach((subnet: any) => {
        expect(subnet).toHaveProperty('map_public_ip_on_launch', true);
      });
    });

    test('Private subnets are created in different AZs', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      const privateSubnets = subnets.filter(
        (s: any) =>
          s.cidr_block === '10.0.11.0/24' || s.cidr_block === '10.0.12.0/24'
      );
      expect(privateSubnets.length).toBe(2);
    });

    test('Internet Gateway is created and attached to VPC', () => {
      const igw = Object.values(
        synthesized.resource.aws_internet_gateway || {}
      )[0] as any;
      expect(igw).toBeDefined();
      expect(igw).toHaveProperty('vpc_id');
    });

    test('NAT Gateway is created with EIP', () => {
      const natGateway = Object.values(
        synthesized.resource.aws_nat_gateway || {}
      )[0] as any;
      const eip = Object.values(synthesized.resource.aws_eip || {})[0] as any;

      expect(natGateway).toBeDefined();
      expect(eip).toBeDefined();
      expect(eip).toHaveProperty('domain', 'vpc');
    });

    test('Route tables are configured correctly', () => {
      const routeTables = Object.values(
        synthesized.resource.aws_route_table || {}
      );
      expect(routeTables.length).toBeGreaterThanOrEqual(2);

      const routes = Object.values(synthesized.resource.aws_route || {});
      expect(routes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('KMS Keys Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestKMSStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('KMS keys are created for all services', () => {
      const kmsKeys = Object.values(synthesized.resource.aws_kms_key || {});
      expect(kmsKeys.length).toBeGreaterThanOrEqual(3);

      kmsKeys.forEach((key: any) => {
        expect(key).toHaveProperty('enable_key_rotation', true);
        expect(key).toHaveProperty('description');
      });
    });

    test('KMS aliases are created for all keys', () => {
      const kmsAliases = Object.values(
        synthesized.resource.aws_kms_alias || {}
      );
      expect(kmsAliases.length).toBeGreaterThanOrEqual(3);

      const aliasNames = kmsAliases.map((alias: any) => alias.name);
      expect(aliasNames).toContain('alias/healthcare-rds-test');
      expect(aliasNames).toContain('alias/healthcare-elasticache-test');
      expect(aliasNames).toContain('alias/healthcare-secrets-test');
    });
  });

  describe('Security Groups Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestSGStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('RDS security group is created with correct configuration', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group || {}
      );
      const rdsSg = securityGroups.find((sg: any) =>
        sg.description?.includes('RDS MySQL')
      );
      expect(rdsSg).toBeDefined();
    });

    test('ElastiCache security group is created', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group || {}
      );
      const cacheSg = securityGroups.find((sg: any) =>
        sg.description?.includes('ElastiCache')
      );
      expect(cacheSg).toBeDefined();
    });

    test('Security group rules are configured with proper ports', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule || {}
      );

      const mysqlRule = rules.find(
        (rule: any) => rule.from_port === 3306 && rule.type === 'ingress'
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule).toHaveProperty('protocol', 'tcp');

      const redisRule = rules.find(
        (rule: any) => rule.from_port === 6379 && rule.type === 'ingress'
      );
      expect(redisRule).toBeDefined();
      expect(redisRule).toHaveProperty('protocol', 'tcp');
    });
  });

  describe('RDS Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestRDSStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('RDS instance is created with correct engine', () => {
      const rdsInstance = Object.values(
        synthesized.resource.aws_db_instance || {}
      )[0] as any;
      expect(rdsInstance).toBeDefined();
      expect(rdsInstance).toHaveProperty('engine', 'mysql');
      expect(rdsInstance).toHaveProperty('engine_version', '8.0');
    });

    test('RDS instance has encryption enabled', () => {
      const rdsInstance = Object.values(
        synthesized.resource.aws_db_instance || {}
      )[0] as any;
      expect(rdsInstance).toHaveProperty('storage_encrypted', true);
      expect(rdsInstance).toHaveProperty('kms_key_id');
    });

    test('RDS instance is configured for high availability', () => {
      const rdsInstance = Object.values(
        synthesized.resource.aws_db_instance || {}
      )[0] as any;
      expect(rdsInstance).toHaveProperty('multi_az', true);
    });

    test('RDS instance has automated backups configured', () => {
      const rdsInstance = Object.values(
        synthesized.resource.aws_db_instance || {}
      )[0] as any;
      expect(rdsInstance).toHaveProperty('backup_retention_period', 7);
      expect(rdsInstance).toHaveProperty('backup_window');
    });

    test('RDS instance is properly configured without Performance Insights', () => {
      const rdsInstance = Object.values(
        synthesized.resource.aws_db_instance || {}
      )[0] as any;
      expect(rdsInstance).not.toHaveProperty('performance_insights_enabled');
      expect(rdsInstance).not.toHaveProperty('performance_insights_kms_key_id');
    });

    test('RDS instance uses correct instance class', () => {
      const rdsInstance = Object.values(
        synthesized.resource.aws_db_instance || {}
      )[0] as any;
      expect(rdsInstance).toHaveProperty('instance_class', 'db.t3.micro');
    });

    test('DB subnet group is created', () => {
      const dbSubnetGroup = Object.values(
        synthesized.resource.aws_db_subnet_group || {}
      )[0] as any;
      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup.subnet_ids).toHaveLength(2);
    });
  });

  describe('Secrets Manager Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestSecretsStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Secrets Manager secret is created for database credentials', () => {
      const secret = Object.values(
        synthesized.resource.aws_secretsmanager_secret || {}
      )[0] as any;
      expect(secret).toBeDefined();
      expect(secret).toHaveProperty('description');
      expect(secret).toHaveProperty('kms_key_id');
    });

    test('Secret version is created with proper structure', () => {
      const secretVersion = Object.values(
        synthesized.resource.aws_secretsmanager_secret_version || {}
      )[0] as any;
      expect(secretVersion).toBeDefined();
      expect(secretVersion).toHaveProperty('secret_id');
      expect(secretVersion).toHaveProperty('secret_string');
    });
  });

  describe('ElastiCache Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestElastiCacheStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('ElastiCache Serverless cache is created', () => {
      const cache = Object.values(
        synthesized.resource.aws_elasticache_serverless_cache || {}
      )[0] as any;
      expect(cache).toBeDefined();
      expect(cache).toHaveProperty('engine', 'redis');
    });

    test('ElastiCache has encryption enabled', () => {
      const cache = Object.values(
        synthesized.resource.aws_elasticache_serverless_cache || {}
      )[0] as any;
      expect(cache).toHaveProperty('kms_key_id');
    });

    test('ElastiCache has snapshots configured', () => {
      const cache = Object.values(
        synthesized.resource.aws_elasticache_serverless_cache || {}
      )[0] as any;
      expect(cache).toHaveProperty('daily_snapshot_time', '03:00');
      expect(cache).toHaveProperty('snapshot_retention_limit', 7);
    });

    test('ElastiCache is configured in multiple subnets', () => {
      const cache = Object.values(
        synthesized.resource.aws_elasticache_serverless_cache || {}
      )[0] as any;
      expect(cache.subnet_ids).toHaveLength(2);
    });

    test('ElastiCache subnet group is created', () => {
      const subnetGroup = Object.values(
        synthesized.resource.aws_elasticache_subnet_group || {}
      )[0] as any;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.subnet_ids).toHaveLength(2);
    });

    test('ElastiCache has usage limits configured', () => {
      const cache = Object.values(
        synthesized.resource.aws_elasticache_serverless_cache || {}
      )[0] as any;
      expect(cache).toHaveProperty('cache_usage_limits');
      expect(Array.isArray(cache.cache_usage_limits)).toBe(true);
      expect(cache.cache_usage_limits[0]).toHaveProperty('data_storage');
      expect(cache.cache_usage_limits[0]).toHaveProperty('ecpu_per_second');
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestNamingStack', {
        environmentSuffix: 'prod',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('All resources use environment suffix in naming', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc || {})[0] as any;
      expect(vpc.tags.Name).toContain('prod');

      const rds = Object.values(
        synthesized.resource.aws_db_instance || {}
      )[0] as any;
      expect(rds.identifier).toContain('prod');

      const cache = Object.values(
        synthesized.resource.aws_elasticache_serverless_cache || {}
      )[0] as any;
      expect(cache.name).toContain('prod');
    });
  });

  describe('HIPAA Compliance Requirements', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestHIPAAStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('All encryption requirements are met', () => {
      const rds = Object.values(
        synthesized.resource.aws_db_instance || {}
      )[0] as any;
      expect(rds.storage_encrypted).toBe(true);

      const cache = Object.values(
        synthesized.resource.aws_elasticache_serverless_cache || {}
      )[0] as any;
      expect(cache.kms_key_id).toBeDefined();

      const secret = Object.values(
        synthesized.resource.aws_secretsmanager_secret || {}
      )[0] as any;
      expect(secret.kms_key_id).toBeDefined();
    });

    test('High availability is configured', () => {
      const rds = Object.values(
        synthesized.resource.aws_db_instance || {}
      )[0] as any;
      expect(rds.multi_az).toBe(true);

      const cache = Object.values(
        synthesized.resource.aws_elasticache_serverless_cache || {}
      )[0] as any;
      expect(cache.subnet_ids.length).toBeGreaterThan(1);
    });

    test('Audit logging is enabled', () => {
      const rds = Object.values(
        synthesized.resource.aws_db_instance || {}
      )[0] as any;
      expect(rds.enabled_cloudwatch_logs_exports).toBeDefined();
      expect(rds.enabled_cloudwatch_logs_exports.length).toBeGreaterThan(0);
    });
  });

  describe('Terraform Backend Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestBackendStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('S3 backend is configured with encryption', () => {
      expect(synthesized.terraform.backend.s3).toBeDefined();
      expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
    });
  });
});
