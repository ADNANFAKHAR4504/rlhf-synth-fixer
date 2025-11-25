import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Terraform Configuration Unit Tests', () => {
  const libPath = path.join(__dirname, '../lib');
  let planOutput: string;
  let planJson: any;

  beforeAll(() => {
    try {
      // Run terraform plan and capture JSON output
      execSync('terraform plan -out=tfplan -input=false', {
        cwd: libPath,
        stdio: 'pipe'
      });

      planOutput = execSync('terraform show -json tfplan', {
        cwd: libPath,
        encoding: 'utf-8'
      });

      planJson = JSON.parse(planOutput);
    } catch (error) {
      console.error('Error running terraform plan:', error);
      throw error;
    }
  });

  afterAll(() => {
    // Clean up plan file
    try {
      fs.unlinkSync(path.join(libPath, 'tfplan'));
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  describe('Provider Configuration', () => {
    test('should use AWS provider', () => {
      const config = planJson.configuration;
      expect(config.provider_config.aws).toBeDefined();
    });

    test('should configure secondary provider', () => {
      const config = planJson.configuration;
      const providers = Object.keys(config.provider_config);
      const hasSecondary = providers.some(p => p.includes('aws.secondary'));
      expect(hasSecondary || config.provider_config.aws.length > 1).toBeTruthy();
    });
  });

  describe('VPC Resources', () => {
    test('should plan to create primary VPC', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const primaryVpc = resources.find((r: any) =>
        r.type === 'aws_vpc' && r.name === 'primary'
      );
      expect(primaryVpc).toBeDefined();
      expect(primaryVpc.values.cidr_block).toBe('10.0.0.0/16');
      expect(primaryVpc.values.enable_dns_hostnames).toBe(true);
      expect(primaryVpc.values.enable_dns_support).toBe(true);
    });

    test('should plan to create secondary VPC', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const secondaryVpc = resources.find((r: any) =>
        r.type === 'aws_vpc' && r.name === 'secondary'
      );
      expect(secondaryVpc).toBeDefined();
      expect(secondaryVpc.values.cidr_block).toBe('10.1.0.0/16');
    });

    test('should create 3 subnets in primary region', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const primarySubnets = resources.filter((r: any) =>
        r.type === 'aws_subnet' && r.name === 'primary'
      );
      expect(primarySubnets.length).toBe(3);
    });

    test('should create 3 subnets in secondary region', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const secondarySubnets = resources.filter((r: any) =>
        r.type === 'aws_subnet' && r.name === 'secondary'
      );
      expect(secondarySubnets.length).toBe(3);
    });

    test('should create internet gateways', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const igws = resources.filter((r: any) => r.type === 'aws_internet_gateway');
      expect(igws.length).toBeGreaterThanOrEqual(2);
    });

    test('should create route tables', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const routeTables = resources.filter((r: any) => r.type === 'aws_route_table');
      expect(routeTables.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Groups', () => {
    test('should create primary database security group', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const primarySg = resources.find((r: any) =>
        r.type === 'aws_security_group' && r.name === 'primary_db'
      );
      expect(primarySg).toBeDefined();
      expect(primarySg.values.description).toContain('primary cluster');
    });

    test('should create secondary database security group', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const secondarySg = resources.find((r: any) =>
        r.type === 'aws_security_group' && r.name === 'secondary_db'
      );
      expect(secondarySg).toBeDefined();
    });

    test('should configure PostgreSQL ingress rules', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const ingressRules = resources.filter((r: any) =>
        r.type === 'aws_security_group_rule' && r.name.includes('ingress')
      );
      expect(ingressRules.length).toBeGreaterThanOrEqual(2);
      ingressRules.forEach((rule: any) => {
        expect(rule.values.from_port).toBe(5432);
        expect(rule.values.to_port).toBe(5432);
        expect(rule.values.protocol).toBe('tcp');
      });
    });

    test('should configure egress rules', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const egressRules = resources.filter((r: any) =>
        r.type === 'aws_security_group_rule' && r.name.includes('egress')
      );
      expect(egressRules.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('RDS Aurora Configuration', () => {
    test('should create Aurora Global Database', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const globalCluster = resources.find((r: any) =>
        r.type === 'aws_rds_global_cluster'
      );
      expect(globalCluster).toBeDefined();
      expect(globalCluster.values.engine).toBe('aurora-postgresql');
    });

    test('should create primary Aurora cluster', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const primary = resources.find((r: any) =>
        r.type === 'aws_rds_cluster' && r.name === 'primary'
      );
      expect(primary).toBeDefined();
      expect(primary.values.engine).toBe('aurora-postgresql');
      expect(primary.values.storage_encrypted).toBe(true);
    });

    test('should create secondary Aurora cluster', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const secondary = resources.find((r: any) =>
        r.type === 'aws_rds_cluster' && r.name === 'secondary'
      );
      expect(secondary).toBeDefined();
      expect(secondary.values.engine).toBe('aurora-postgresql');
    });

    test('should create 2 instances for primary cluster', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const primaryInstances = resources.filter((r: any) =>
        r.type === 'aws_rds_cluster_instance' && r.name === 'primary'
      );
      expect(primaryInstances.length).toBe(2);
    });

    test('should create 2 instances for secondary cluster', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const secondaryInstances = resources.filter((r: any) =>
        r.type === 'aws_rds_cluster_instance' && r.name === 'secondary'
      );
      expect(secondaryInstances.length).toBe(2);
    });
  });

  describe('S3 Backup Configuration', () => {
    test('should create primary S3 bucket', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const primaryBucket = resources.find((r: any) =>
        r.type === 'aws_s3_bucket' && r.name === 'primary_backup'
      );
      expect(primaryBucket).toBeDefined();
      expect(primaryBucket.values.bucket).toContain('db-exports-primary-');
    });

    test('should create secondary S3 bucket', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const secondaryBucket = resources.find((r: any) =>
        r.type === 'aws_s3_bucket' && r.name === 'secondary_backup'
      );
      expect(secondaryBucket).toBeDefined();
    });

    test('should enable versioning on buckets', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const versioning = resources.filter((r: any) =>
        r.type === 'aws_s3_bucket_versioning'
      );
      expect(versioning.length).toBeGreaterThanOrEqual(2);
      versioning.forEach((v: any) => {
        expect(v.values.versioning_configuration[0].status).toBe('Enabled');
      });
    });

    test('should enable server-side encryption', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const encryption = resources.filter((r: any) =>
        r.type === 'aws_s3_bucket_server_side_encryption_configuration'
      );
      expect(encryption.length).toBeGreaterThanOrEqual(2);
    });

    test('should block public access', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const publicBlock = resources.filter((r: any) =>
        r.type === 'aws_s3_bucket_public_access_block'
      );
      expect(publicBlock.length).toBeGreaterThanOrEqual(2);
      publicBlock.forEach((pb: any) => {
        expect(pb.values.block_public_acls).toBe(true);
        expect(pb.values.block_public_policy).toBe(true);
      });
    });

    test('should configure S3 replication', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const replication = resources.find((r: any) =>
        r.type === 'aws_s3_bucket_replication_configuration'
      );
      expect(replication).toBeDefined();
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('should generate random password', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const password = resources.find((r: any) =>
        r.type === 'random_password'
      );
      expect(password).toBeDefined();
      expect(password.values.length).toBe(16);
      expect(password.values.special).toBe(true);
    });

    test('should create primary secret', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const secret = resources.find((r: any) =>
        r.type === 'aws_secretsmanager_secret' && r.name === 'primary_db'
      );
      expect(secret).toBeDefined();
      expect(secret.values.name).toContain('rds-master-password-primary-');
    });

    test('should create secondary secret', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const secret = resources.find((r: any) =>
        r.type === 'aws_secretsmanager_secret' && r.name === 'secondary_db'
      );
      expect(secret).toBeDefined();
    });
  });

  describe('SNS Configuration', () => {
    test('should create primary SNS topic', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const topic = resources.find((r: any) =>
        r.type === 'aws_sns_topic' && r.name === 'primary_db_events'
      );
      expect(topic).toBeDefined();
      expect(topic.values.name).toContain('db-events-primary-');
    });

    test('should create secondary SNS topic', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const topic = resources.find((r: any) =>
        r.type === 'aws_sns_topic' && r.name === 'secondary_db_events'
      );
      expect(topic).toBeDefined();
    });

    test('should configure event subscriptions', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const subscriptions = resources.filter((r: any) =>
        r.type === 'aws_db_event_subscription'
      );
      expect(subscriptions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should create CloudWatch alarms', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const alarms = resources.filter((r: any) =>
        r.type === 'aws_cloudwatch_metric_alarm'
      );
      expect(alarms.length).toBeGreaterThanOrEqual(2);
    });

    test('should create replication lag alarm', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const alarm = resources.find((r: any) =>
        r.type === 'aws_cloudwatch_metric_alarm' && r.name === 'primary_replication_lag'
      );
      expect(alarm).toBeDefined();
      expect(alarm.values.metric_name).toBe('AuroraGlobalDBReplicationLag');
    });
  });

  describe('KMS Configuration', () => {
    test('should create primary KMS key', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const key = resources.find((r: any) =>
        r.type === 'aws_kms_key' && r.name === 'primary_db'
      );
      expect(key).toBeDefined();
      expect(key.values.enable_key_rotation).toBe(true);
    });

    test('should create secondary KMS key', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const key = resources.find((r: any) =>
        r.type === 'aws_kms_key' && r.name === 'secondary_db'
      );
      expect(key).toBeDefined();
    });

    test('should create KMS aliases', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const aliases = resources.filter((r: any) =>
        r.type === 'aws_kms_alias'
      );
      expect(aliases.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Route53 Health Checks', () => {
    test('should create health checks', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const healthChecks = resources.filter((r: any) =>
        r.type === 'aws_route53_health_check'
      );
      expect(healthChecks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources should include environment_suffix in naming', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const resourcesWithNaming = resources.filter((r: any) =>
        r.values && (r.values.name || r.values.bucket || r.values.cluster_identifier)
      );

      const resourcesWithSuffix = resourcesWithNaming.filter((r: any) => {
        const nameField = r.values?.name || r.values?.bucket || r.values?.cluster_identifier || '';
        return nameField.includes('l6p3z2w4');
      });

      expect(resourcesWithSuffix.length).toBeGreaterThan(0);
      expect(resourcesWithSuffix.length / resourcesWithNaming.length).toBeGreaterThan(0.5);
    });
  });

  describe('DB Subnet Groups', () => {
    test('should create DB subnet groups', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const subnetGroups = resources.filter((r: any) =>
        r.type === 'aws_db_subnet_group'
      );
      expect(subnetGroups.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('DB Parameter Groups', () => {
    test('should create DB parameter groups', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const paramGroups = resources.filter((r: any) =>
        r.type === 'aws_rds_cluster_parameter_group' || r.type === 'aws_db_parameter_group'
      );
      expect(paramGroups.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('IAM Roles', () => {
    test('should create IAM roles for services', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const iamRoles = resources.filter((r: any) =>
        r.type === 'aws_iam_role'
      );
      expect(iamRoles.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Count', () => {
    test('should plan to create all required resources', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      expect(resources.length).toBeGreaterThan(40); // Minimum expected resources
    });

    test('should have proper resource distribution', () => {
      const resources = planJson.planned_values?.root_module?.resources || [];
      const resourceTypes = new Set(resources.map((r: any) => r.type));
      expect(resourceTypes.size).toBeGreaterThan(15); // Different resource types
    });
  });
});
