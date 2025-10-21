import { Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  const testEnvironmentSuffix = 'test123';

  let app: any;
  let stack: TapStack;
  let synthesized: string;
  let resources: any;

  beforeEach(() => {
    app = Testing.app();
    stack = new TapStack(app, 'test-stack', {
      environmentSuffix: testEnvironmentSuffix,
      awsRegion: 'us-west-2',
    });
    synthesized = Testing.synth(stack);
    resources = JSON.parse(synthesized);
  });

  describe('Synthesis and Stack Structure', () => {
    it('should synthesize successfully', () => {
      expect(synthesized).toBeDefined();
      expect(resources).toHaveProperty('resource');
    });

    it('should have terraform configuration', () => {
      expect(resources).toHaveProperty('terraform');
      expect(resources.terraform).toHaveProperty('backend');
    });

    it('should configure AWS provider', () => {
      expect(resources).toHaveProperty('provider');
      expect(resources.provider).toHaveProperty('aws');
    });

    it('should use default region when not specified', () => {
      const appNoRegion = Testing.app();
      const stackNoRegion = new TapStack(appNoRegion, 'test-stack-no-region', {
        environmentSuffix: testEnvironmentSuffix,
      });
      const synthesizedNoRegion = Testing.synth(stackNoRegion);
      const resourcesNoRegion = JSON.parse(synthesizedNoRegion);

      expect(resourcesNoRegion.provider?.aws[0]?.region).toBe('us-west-2');
    });

    it('should use default environment suffix when not provided', () => {
      const appNoSuffix = Testing.app();
      const stackNoSuffix = new TapStack(appNoSuffix, 'test-stack-no-suffix', {});
      const synthesizedNoSuffix = Testing.synth(stackNoSuffix);
      const resourcesNoSuffix = JSON.parse(synthesizedNoSuffix);

      const vpcs = resourcesNoSuffix.resource?.aws_vpc || {};
      const vpc = vpcs[Object.keys(vpcs)[0]];
      expect(vpc.tags?.Environment).toBe('dev');
    });

    it('should handle custom state bucket configuration', () => {
      const appCustom = Testing.app();
      const stackCustom = new TapStack(appCustom, 'test-stack-custom', {
        environmentSuffix: testEnvironmentSuffix,
        stateBucket: 'custom-bucket',
        stateBucketRegion: 'us-east-1',
      });
      const synthesizedCustom = Testing.synth(stackCustom);
      const resourcesCustom = JSON.parse(synthesizedCustom);

      expect(resourcesCustom.terraform?.backend?.s3?.bucket).toBe('custom-bucket');
      expect(resourcesCustom.terraform?.backend?.s3?.region).toBe('us-east-1');
    });

    it('should use default state bucket when not provided', () => {
      const appDefault = Testing.app();
      const stackDefault = new TapStack(appDefault, 'test-stack-default', {
        environmentSuffix: testEnvironmentSuffix,
      });
      const synthesizedDefault = Testing.synth(stackDefault);
      const resourcesDefault = JSON.parse(synthesizedDefault);

      expect(resourcesDefault.terraform?.backend?.s3?.bucket).toBe('iac-rlhf-tf-states');
      expect(resourcesDefault.terraform?.backend?.s3?.region).toBe('us-east-1');
    });

    it('should handle custom AWS region override', () => {
      const appCustomRegion = Testing.app();
      const stackCustomRegion = new TapStack(appCustomRegion, 'test-stack-custom-region', {
        environmentSuffix: testEnvironmentSuffix,
        awsRegion: 'eu-west-1',
      });
      const synthesizedCustomRegion = Testing.synth(stackCustomRegion);
      const resourcesCustomRegion = JSON.parse(synthesizedCustomRegion);

      // AWS_REGION_OVERRIDE is set to us-west-2, so it should always use that
      expect(resourcesCustomRegion.provider?.aws[0]?.region).toBe('us-west-2');
    });

    it('should apply default tags when provided', () => {
      const appWithTags = Testing.app();
      const stackWithTags = new TapStack(appWithTags, 'test-stack-tags', {
        environmentSuffix: testEnvironmentSuffix,
        defaultTags: {
          tags: {
            Project: 'PaymentProcessing',
            Team: 'Platform',
          },
        },
      });
      const synthesizedWithTags = Testing.synth(stackWithTags);
      expect(synthesizedWithTags).toBeDefined();
    });
  });

  describe('Networking Resources', () => {
    it('should create VPC with correct CIDR', () => {
      const vpcs = resources.resource?.aws_vpc || {};
      const vpcKeys = Object.keys(vpcs);
      expect(vpcKeys.length).toBeGreaterThan(0);

      const vpc = vpcs[vpcKeys[0]];
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
    });

    it('should use default VPC CIDR when not provided', () => {
      // This test covers the default parameter branch in networking-construct
      const appDefaultVpc = Testing.app();
      const stackDefaultVpc = new TapStack(appDefaultVpc, 'test-stack-default-vpc', {
        environmentSuffix: testEnvironmentSuffix,
        awsRegion: 'us-west-2',
        // Explicitly NOT providing vpcCidr to test default
      });
      const synthesizedDefaultVpc = Testing.synth(stackDefaultVpc);
      const resourcesDefaultVpc = JSON.parse(synthesizedDefaultVpc);

      const vpcs = resourcesDefaultVpc.resource?.aws_vpc || {};
      const vpc = vpcs[Object.keys(vpcs)[0]];
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
    });

    it('should use custom VPC CIDR when provided', () => {
      // This test covers the custom vpcCidr parameter branch
      const appCustomVpc = Testing.app();
      const stackCustomVpc = new TapStack(appCustomVpc, 'test-stack-custom-vpc', {
        environmentSuffix: testEnvironmentSuffix,
        awsRegion: 'us-west-2',
        vpcCidr: '192.168.0.0/16',
      });
      const synthesizedCustomVpc = Testing.synth(stackCustomVpc);
      const resourcesCustomVpc = JSON.parse(synthesizedCustomVpc);

      const vpcs = resourcesCustomVpc.resource?.aws_vpc || {};
      const vpc = vpcs[Object.keys(vpcs)[0]];
      expect(vpc.cidr_block).toBe('192.168.0.0/16');
    });

    it('should create public and private subnets', () => {
      const subnets = resources.resource?.aws_subnet || {};
      const subnetKeys = Object.keys(subnets);
      expect(subnetKeys.length).toBeGreaterThanOrEqual(4); // At least 2 public + 2 private
    });

    it('should create internet gateway', () => {
      const igws = resources.resource?.aws_internet_gateway || {};
      expect(Object.keys(igws).length).toBeGreaterThan(0);
    });

    it('should create NAT gateway', () => {
      const natGateways = resources.resource?.aws_nat_gateway || {};
      expect(Object.keys(natGateways).length).toBeGreaterThan(0);
    });

    it('should create EIP for NAT gateway', () => {
      const eips = resources.resource?.aws_eip || {};
      expect(Object.keys(eips).length).toBeGreaterThan(0);
    });

    it('should create route tables', () => {
      const routeTables = resources.resource?.aws_route_table || {};
      expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(2); // public + private
    });
  });

  describe('KMS Encryption Keys', () => {
    it('should create three KMS keys for different services', () => {
      const kmsKeys = resources.resource?.aws_kms_key || {};
      const keyCount = Object.keys(kmsKeys).length;
      expect(keyCount).toBe(3); // RDS, Secrets Manager, ElastiCache
    });

    it('should enable key rotation for all KMS keys', () => {
      const kmsKeys = resources.resource?.aws_kms_key || {};
      Object.values(kmsKeys).forEach((key: any) => {
        expect(key.enable_key_rotation).toBe(true);
      });
    });

    it('should set deletion window for KMS keys', () => {
      const kmsKeys = resources.resource?.aws_kms_key || {};
      Object.values(kmsKeys).forEach((key: any) => {
        expect(key.deletion_window_in_days).toBe(7);
      });
    });

    it('should create KMS aliases', () => {
      const aliases = resources.resource?.aws_kms_alias || {};
      expect(Object.keys(aliases).length).toBe(3);
    });
  });

  describe('RDS Database', () => {
    it('should create RDS PostgreSQL instance', () => {
      const dbInstances = resources.resource?.aws_db_instance || {};
      expect(Object.keys(dbInstances).length).toBe(1);

      const dbInstance = dbInstances[Object.keys(dbInstances)[0]];
      expect(dbInstance.engine).toBe('postgres');
    });

    it('should enable Multi-AZ for RDS', () => {
      const dbInstances = resources.resource?.aws_db_instance || {};
      const dbInstance = dbInstances[Object.keys(dbInstances)[0]];
      expect(dbInstance.multi_az).toBe(true);
    });

    it('should enable storage encryption', () => {
      const dbInstances = resources.resource?.aws_db_instance || {};
      const dbInstance = dbInstances[Object.keys(dbInstances)[0]];
      expect(dbInstance.storage_encrypted).toBe(true);
    });

    it('should disable public accessibility', () => {
      const dbInstances = resources.resource?.aws_db_instance || {};
      const dbInstance = dbInstances[Object.keys(dbInstances)[0]];
      expect(dbInstance.publicly_accessible).toBe(false);
    });

    it('should create DB subnet group', () => {
      const subnetGroups = resources.resource?.aws_db_subnet_group || {};
      expect(Object.keys(subnetGroups).length).toBe(1);
    });

    it('should create DB security group', () => {
      const securityGroups = resources.resource?.aws_security_group || {};
      const dbSgKey = Object.keys(securityGroups).find(key =>
        securityGroups[key].name?.includes('db-sg')
      );
      expect(dbSgKey).toBeDefined();
    });
  });

  describe('Secrets Manager', () => {
    it('should create Secrets Manager secret', () => {
      const secrets = resources.resource?.aws_secretsmanager_secret || {};
      expect(Object.keys(secrets).length).toBe(1);
    });

    it('should create secret version', () => {
      const secretVersions = resources.resource?.aws_secretsmanager_secret_version || {};
      expect(Object.keys(secretVersions).length).toBe(1);
    });

    it('should configure 30-day automatic rotation', () => {
      const rotations = resources.resource?.aws_secretsmanager_secret_rotation || {};
      expect(Object.keys(rotations).length).toBe(1);

      const rotation = rotations[Object.keys(rotations)[0]];
      expect(rotation.rotation_rules?.automatically_after_days).toBe(30);
    });

    it('should create rotation Lambda function', () => {
      const lambdas = resources.resource?.aws_lambda_function || {};
      expect(Object.keys(lambdas).length).toBeGreaterThan(0);

      const rotationLambda = Object.values(lambdas).find((lambda: any) =>
        lambda.function_name?.includes('rotation')
      );
      expect(rotationLambda).toBeDefined();
    });

    it('should create IAM role for rotation Lambda', () => {
      const roles = resources.resource?.aws_iam_role || {};
      const rotationRole = Object.values(roles).find((role: any) =>
        role.name?.includes('rotation-lambda-role')
      );
      expect(rotationRole).toBeDefined();
    });
  });

  describe('ElastiCache Redis', () => {
    it('should create ElastiCache replication group', () => {
      const replicationGroups = resources.resource?.aws_elasticache_replication_group || {};
      expect(Object.keys(replicationGroups).length).toBe(1);
    });

    it('should use Redis engine', () => {
      const replicationGroups = resources.resource?.aws_elasticache_replication_group || {};
      const rg = replicationGroups[Object.keys(replicationGroups)[0]];
      expect(rg.engine).toBe('redis');
    });

    it('should enable Multi-AZ', () => {
      const replicationGroups = resources.resource?.aws_elasticache_replication_group || {};
      const rg = replicationGroups[Object.keys(replicationGroups)[0]];
      expect(rg.multi_az_enabled).toBe(true);
      expect(rg.automatic_failover_enabled).toBe(true);
    });

    it('should enable encryption at rest', () => {
      const replicationGroups = resources.resource?.aws_elasticache_replication_group || {};
      const rg = replicationGroups[Object.keys(replicationGroups)[0]];
      expect(rg.at_rest_encryption_enabled).toBe('true');
    });

    it('should enable encryption in transit', () => {
      const replicationGroups = resources.resource?.aws_elasticache_replication_group || {};
      const rg = replicationGroups[Object.keys(replicationGroups)[0]];
      expect(rg.transit_encryption_enabled).toBe(true);
    });

    it('should create ElastiCache subnet group', () => {
      const subnetGroups = resources.resource?.aws_elasticache_subnet_group || {};
      expect(Object.keys(subnetGroups).length).toBe(1);
    });

    it('should create ElastiCache security group', () => {
      const securityGroups = resources.resource?.aws_security_group || {};
      const cacheSgKey = Object.keys(securityGroups).find(key =>
        securityGroups[key].name?.includes('cache-sg')
      );
      expect(cacheSgKey).toBeDefined();
    });
  });

  describe('ECS Cluster and Services', () => {
    it('should create ECS cluster', () => {
      const clusters = resources.resource?.aws_ecs_cluster || {};
      expect(Object.keys(clusters).length).toBe(1);
    });

    it('should enable container insights', () => {
      const clusters = resources.resource?.aws_ecs_cluster || {};
      const cluster = clusters[Object.keys(clusters)[0]];
      const containerInsightsSetting = cluster.setting?.find((s: any) =>
        s.name === 'containerInsights'
      );
      expect(containerInsightsSetting?.value).toBe('enabled');
    });

    it('should create ECS task definition', () => {
      const taskDefs = resources.resource?.aws_ecs_task_definition || {};
      expect(Object.keys(taskDefs).length).toBe(1);
    });

    it('should use Fargate launch type', () => {
      const taskDefs = resources.resource?.aws_ecs_task_definition || {};
      const taskDef = taskDefs[Object.keys(taskDefs)[0]];
      expect(taskDef.requires_compatibilities).toContain('FARGATE');
      expect(taskDef.network_mode).toBe('awsvpc');
    });

    it('should create ECS service', () => {
      const services = resources.resource?.aws_ecs_service || {};
      expect(Object.keys(services).length).toBe(1);
    });

    it('should create task execution role', () => {
      const roles = resources.resource?.aws_iam_role || {};
      const taskExecRole = Object.values(roles).find((role: any) =>
        role.name?.includes('ecs-execution-role')
      );
      expect(taskExecRole).toBeDefined();
    });

    it('should create task role', () => {
      const roles = resources.resource?.aws_iam_role || {};
      const taskRole = Object.values(roles).find((role: any) =>
        role.name?.includes('task-role') && !role.name?.includes('execution')
      );
      expect(taskRole).toBeDefined();
    });

    it('should create CloudWatch log group', () => {
      const logGroups = resources.resource?.aws_cloudwatch_log_group || {};
      expect(Object.keys(logGroups).length).toBeGreaterThan(0);
    });
  });

  describe('Application Load Balancer', () => {
    it('should create Application Load Balancer', () => {
      const albs = resources.resource?.aws_lb || {};
      expect(Object.keys(albs).length).toBe(1);

      const alb = albs[Object.keys(albs)[0]];
      expect(alb.load_balancer_type).toBe('application');
    });

    it('should create target group', () => {
      const targetGroups = resources.resource?.aws_lb_target_group || {};
      expect(Object.keys(targetGroups).length).toBe(1);
    });

    it('should create ALB listener', () => {
      const listeners = resources.resource?.aws_lb_listener || {};
      expect(Object.keys(listeners).length).toBe(1);
    });

    it('should create ALB security group', () => {
      const securityGroups = resources.resource?.aws_security_group || {};
      const albSgKey = Object.keys(securityGroups).find(key =>
        securityGroups[key].name?.includes('alb-sg')
      );
      expect(albSgKey).toBeDefined();
    });
  });

  describe('Resource Naming and Tagging', () => {
    it('should include environment suffix in resource names', () => {
      // Check VPC name
      const vpcs = resources.resource?.aws_vpc || {};
      const vpc = vpcs[Object.keys(vpcs)[0]];
      expect(vpc.tags?.Name).toContain(testEnvironmentSuffix);

      // Check RDS name
      const dbInstances = resources.resource?.aws_db_instance || {};
      const db = dbInstances[Object.keys(dbInstances)[0]];
      expect(db.identifier).toContain(testEnvironmentSuffix);
    });

    it('should tag resources with environment', () => {
      const vpcs = resources.resource?.aws_vpc || {};
      const vpc = vpcs[Object.keys(vpcs)[0]];
      expect(vpc.tags?.Environment).toBe(testEnvironmentSuffix);
    });
  });

  describe('Stack Outputs', () => {
    it('should export VPC ID', () => {
      expect(resources.output).toHaveProperty('vpc-id');
    });

    it('should export RDS endpoint', () => {
      expect(resources.output).toHaveProperty('rds-endpoint');
    });

    it('should export RDS secret ARN', () => {
      expect(resources.output).toHaveProperty('rds-secret-arn');
    });

    it('should export ElastiCache endpoint', () => {
      expect(resources.output).toHaveProperty('elasticache-endpoint');
    });

    it('should export ECS cluster name', () => {
      expect(resources.output).toHaveProperty('ecs-cluster-name');
    });

    it('should export ALB DNS name', () => {
      expect(resources.output).toHaveProperty('alb-dns-name');
    });
  });

  describe('Security Group Rules', () => {
    it('should create security group rules', () => {
      const rules = resources.resource?.aws_security_group_rule || {};
      expect(Object.keys(rules).length).toBeGreaterThan(0);
    });

    it('should allow PostgreSQL traffic to RDS from VPC', () => {
      const rules = resources.resource?.aws_security_group_rule || {};
      const postgresRule = Object.values(rules).find((rule: any) =>
        rule.from_port === 5432 && rule.type === 'ingress'
      );
      expect(postgresRule).toBeDefined();
    });

    it('should allow Redis traffic to ElastiCache from VPC', () => {
      const rules = resources.resource?.aws_security_group_rule || {};
      const redisRule = Object.values(rules).find((rule: any) =>
        rule.from_port === 6379 && rule.type === 'ingress'
      );
      expect(redisRule).toBeDefined();
    });

    it('should allow HTTP traffic to ALB', () => {
      const rules = resources.resource?.aws_security_group_rule || {};
      const httpRule = Object.values(rules).find((rule: any) =>
        rule.from_port === 80 && rule.type === 'ingress'
      );
      expect(httpRule).toBeDefined();
    });
  });

  describe('Environment Variable Handling', () => {
    it('should use AWS_REGION environment variable in ECS logs when set', () => {
      const originalRegion = process.env.AWS_REGION;
      process.env.AWS_REGION = 'eu-central-1';

      const appWithRegion = Testing.app();
      const stackWithRegion = new TapStack(appWithRegion, 'test-stack-env-region', {
        environmentSuffix: testEnvironmentSuffix,
      });
      const synthesizedWithRegion = Testing.synth(stackWithRegion);
      const resourcesWithRegion = JSON.parse(synthesizedWithRegion);

      const taskDefs = resourcesWithRegion.resource?.aws_ecs_task_definition || {};
      const taskDef = taskDefs[Object.keys(taskDefs)[0]];
      const containerDefs = JSON.parse(taskDef.container_definitions);
      const logConfig = containerDefs[0].logConfiguration.options;

      expect(logConfig['awslogs-region']).toBe('eu-central-1');

      // Restore original
      if (originalRegion) {
        process.env.AWS_REGION = originalRegion;
      } else {
        delete process.env.AWS_REGION;
      }
    });

    it('should use default region in ECS logs when AWS_REGION not set', () => {
      const originalRegion = process.env.AWS_REGION;
      delete process.env.AWS_REGION;

      const appNoRegion = Testing.app();
      const stackNoRegion = new TapStack(appNoRegion, 'test-stack-no-env-region', {
        environmentSuffix: testEnvironmentSuffix,
      });
      const synthesizedNoRegion = Testing.synth(stackNoRegion);
      const resourcesNoRegion = JSON.parse(synthesizedNoRegion);

      const taskDefs = resourcesNoRegion.resource?.aws_ecs_task_definition || {};
      const taskDef = taskDefs[Object.keys(taskDefs)[0]];
      const containerDefs = JSON.parse(taskDef.container_definitions);
      const logConfig = containerDefs[0].logConfiguration.options;

      expect(logConfig['awslogs-region']).toBe('us-west-2');

      // Restore original
      if (originalRegion) {
        process.env.AWS_REGION = originalRegion;
      }
    });

    it('should use AWS_REGION environment variable in RDS rotation Lambda when set', () => {
      const originalRegion = process.env.AWS_REGION;
      process.env.AWS_REGION = 'ap-southeast-1';

      const appWithRegion = Testing.app();
      const stackWithRegion = new TapStack(appWithRegion, 'test-stack-rds-env-region', {
        environmentSuffix: testEnvironmentSuffix,
      });
      const synthesizedWithRegion = Testing.synth(stackWithRegion);
      const resourcesWithRegion = JSON.parse(synthesizedWithRegion);

      const lambdas = resourcesWithRegion.resource?.aws_lambda_function || {};
      const rotationLambda = Object.values(lambdas).find((lambda: any) =>
        lambda.function_name?.includes('rotation')
      );

      expect(rotationLambda).toBeDefined();
      const lambdaEnv = (rotationLambda as any).environment?.variables;
      expect(lambdaEnv?.SECRETS_MANAGER_ENDPOINT).toContain('ap-southeast-1');

      // Restore original
      if (originalRegion) {
        process.env.AWS_REGION = originalRegion;
      } else {
        delete process.env.AWS_REGION;
      }
    });

    it('should use default region in RDS rotation Lambda when AWS_REGION not set', () => {
      const originalRegion = process.env.AWS_REGION;
      delete process.env.AWS_REGION;

      const appNoRegion = Testing.app();
      const stackNoRegion = new TapStack(appNoRegion, 'test-stack-rds-no-env-region', {
        environmentSuffix: testEnvironmentSuffix,
      });
      const synthesizedNoRegion = Testing.synth(stackNoRegion);
      const resourcesNoRegion = JSON.parse(synthesizedNoRegion);

      const lambdas = resourcesNoRegion.resource?.aws_lambda_function || {};
      const rotationLambda = Object.values(lambdas).find((lambda: any) =>
        lambda.function_name?.includes('rotation')
      );

      expect(rotationLambda).toBeDefined();
      const lambdaEnv = (rotationLambda as any).environment?.variables;
      expect(lambdaEnv?.SECRETS_MANAGER_ENDPOINT).toContain('us-west-2');

      // Restore original
      if (originalRegion) {
        process.env.AWS_REGION = originalRegion;
      }
    });
  });
});
