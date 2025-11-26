import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  const testConfig = {
    environmentSuffix: 'test',
    stateBucket: 'test-bucket',
    stateBucketRegion: 'eu-west-2',
    awsRegion: 'eu-west-2',
    defaultTags: {
      tags: {
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        ManagedBy: 'cdktf',
        EnvironmentSuffix: 'test',
      },
    },
  };

  beforeEach(() => {
    app = Testing.app();
    stack = new TapStack(app, 'TestStack', testConfig);
  });

  describe('Basic Stack Configuration', () => {
    it('should create a valid CDKTF stack', () => {
      expect(stack).toBeDefined();
      expect(stack.node.id).toBe('TestStack');
    });

    it('should have correct AWS provider configuration', () => {
      const synthesis = Testing.synth(stack);
      const providers = JSON.parse(synthesis).provider?.aws;
      expect(providers).toBeDefined();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers[0].region).toBe('eu-west-2');
    });

    it('should have S3 backend configured', () => {
      const synthesis = Testing.synth(stack);
      const backend = JSON.parse(synthesis).terraform?.backend?.s3;
      expect(backend).toBeDefined();
      expect(backend.bucket).toBe('test-bucket');
      expect(backend.key).toBe('test/terraform.tfstate');
      expect(backend.region).toBe('eu-west-2');
      expect(backend.encrypt).toBe(true);
    });
  });

  describe('Database Resources', () => {
    it('should create RDS PostgreSQL instance with correct configuration', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_db_instance
        ?.rdsInstance;

      expect(resources).toBeDefined();
      expect(resources.engine).toBe('postgres');
      expect(resources.engine_version).toBe('14.15');
      expect(resources.instance_class).toBe('db.t3.large');
      expect(resources.allocated_storage).toBe(100);
      expect(resources.storage_type).toBe('gp3');
      expect(resources.storage_encrypted).toBe(true);
      expect(resources.multi_az).toBe(true);
    });

    it('should have RDS instance name with environmentSuffix', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_db_instance
        ?.rdsInstance;

      expect(resources.identifier).toContain('test');
      expect(resources.identifier).toBe('rds-prod-test-postgres');
    });

    it('should configure RDS backup settings correctly', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_db_instance
        ?.rdsInstance;

      expect(resources.backup_retention_period).toBe(7);
      expect(resources.backup_window).toBeDefined();
      expect(resources.maintenance_window).toBeDefined();
    });

    it('should have deletion protection disabled for CI/CD', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_db_instance
        ?.rdsInstance;

      expect(resources.deletion_protection).toBe(false);
      expect(resources.skip_final_snapshot).toBe(true);
    });

    it('should enable enhanced monitoring with 60 second interval', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_db_instance
        ?.rdsInstance;

      expect(resources.monitoring_interval).toBe(60);
      expect(resources.enabled_cloudwatch_logs_exports).toContain('postgresql');
      expect(resources.enabled_cloudwatch_logs_exports).toContain('upgrade');
    });

    it('should enable Performance Insights', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_db_instance
        ?.rdsInstance;

      expect(resources.performance_insights_enabled).toBe(true);
      expect(resources.performance_insights_retention_period).toBe(7);
    });
  });

  describe('Database Parameter Group', () => {
    it('should create parameter group with PostgreSQL 14 family', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_db_parameter_group
        ?.rdsParameterGroup;

      expect(resources).toBeDefined();
      expect(resources.family).toBe('postgres14');
      expect(resources.name).toContain('test');
    });

    it('should configure pg_stat_statements', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_db_parameter_group
        ?.rdsParameterGroup;

      const pgStatParam = resources.parameter.find(
        (p: any) => p.name === 'shared_preload_libraries'
      );
      expect(pgStatParam).toBeDefined();
      expect(pgStatParam.value).toBe('pg_stat_statements');
    });

    it('should configure logging parameters', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_db_parameter_group
        ?.rdsParameterGroup;

      const logStatementParam = resources.parameter.find(
        (p: any) => p.name === 'log_statement'
      );
      expect(logStatementParam).toBeDefined();
      expect(logStatementParam.value).toBe('all');

      const logDurationParam = resources.parameter.find(
        (p: any) => p.name === 'log_min_duration_statement'
      );
      expect(logDurationParam).toBeDefined();
      expect(logDurationParam.value).toBe('1000');
    });
  });

  describe('Security Resources', () => {
    it('should create KMS key for encryption', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_kms_key?.rdsKmsKey;

      expect(resources).toBeDefined();
      expect(resources.enable_key_rotation).toBe(true);
      expect(resources.deletion_window_in_days).toBe(10);
    });

    it('should create security group with correct VPC configuration', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_security_group
        ?.rdsSecurityGroup;

      expect(resources).toBeDefined();
      expect(resources.name).toContain('test');
      expect(resources.description).toContain('RDS PostgreSQL');
    });

    it('should configure security group rules for application subnets', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource;

      const rule1 = resources.aws_security_group_rule?.rdsIngressApp1;
      const rule2 = resources.aws_security_group_rule?.rdsIngressApp2;

      expect(rule1).toBeDefined();
      expect(rule1.type).toBe('ingress');
      expect(rule1.from_port).toBe(5432);
      expect(rule1.to_port).toBe(5432);
      expect(rule1.protocol).toBe('tcp');
      expect(rule1.cidr_blocks).toContain('10.0.4.0/24');

      expect(rule2).toBeDefined();
      expect(rule2.cidr_blocks).toContain('10.0.5.0/24');
    });

    it('should create Secrets Manager secret with KMS encryption', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource
        ?.aws_secretsmanager_secret?.dbCredentials;

      expect(resources).toBeDefined();
      expect(resources.name).toContain('test');
      expect(resources.description).toContain('credentials');
    });
  });

  describe('Monitoring Resources', () => {
    it('should create SNS topic for alerts', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_sns_topic
        ?.dbAlertsTopic;

      expect(resources).toBeDefined();
      expect(resources.name).toContain('test');
      expect(resources.display_name).toContain('RDS Production Database Alerts');
    });

    it('should create SNS email subscription', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource
        ?.aws_sns_topic_subscription?.opsEmailSubscription;

      expect(resources).toBeDefined();
      expect(resources.protocol).toBe('email');
      expect(resources.endpoint).toBe('ops@company.com');
    });

    it('should create CloudWatch alarm for CPU utilization', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_cloudwatch_metric_alarm
        ?.cpuAlarm;

      expect(resources).toBeDefined();
      expect(resources.metric_name).toBe('CPUUtilization');
      expect(resources.namespace).toBe('AWS/RDS');
      expect(resources.comparison_operator).toBe('GreaterThanThreshold');
      expect(resources.threshold).toBe(80);
      expect(resources.statistic).toBe('Average');
    });

    it('should create CloudWatch alarm for storage space', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_cloudwatch_metric_alarm
        ?.storageAlarm;

      expect(resources).toBeDefined();
      expect(resources.metric_name).toBe('FreeStorageSpace');
      expect(resources.comparison_operator).toBe('LessThanThreshold');
      expect(resources.threshold).toBe(10737418240); // 10GB in bytes
    });

    it('should create CloudWatch alarm for database connections', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_cloudwatch_metric_alarm
        ?.connectionsAlarm;

      expect(resources).toBeDefined();
      expect(resources.metric_name).toBe('DatabaseConnections');
      expect(resources.comparison_operator).toBe('GreaterThanThreshold');
      expect(resources.threshold).toBe(121); // 90% of 135
    });

    it('should create IAM role for enhanced monitoring', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_iam_role
        ?.rdsMonitoringRole;

      expect(resources).toBeDefined();
      expect(resources.name).toContain('test');
    });

    it('should attach monitoring policy to IAM role', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource
        ?.aws_iam_role_policy_attachment?.monitoringRolePolicy;

      expect(resources).toBeDefined();
      expect(resources.policy_arn).toContain('AmazonRDSEnhancedMonitoringRole');
    });
  });

  describe('Network Resources', () => {
    it('should create DB subnet group', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.aws_db_subnet_group
        ?.rdsSubnetGroup;

      expect(resources).toBeDefined();
      expect(resources.name).toContain('test');
      expect(resources.description).toContain('Subnet group');
    });

    it('should discover default VPC', () => {
      const synthesis = Testing.synth(stack);
      const dataResources = JSON.parse(synthesis).data?.aws_vpc?.prodVpc;

      expect(dataResources).toBeDefined();
      expect(dataResources.default).toBe(true);
    });

    it('should discover subnets in VPC', () => {
      const synthesis = Testing.synth(stack);
      const dataResources = JSON.parse(synthesis).data?.aws_subnets
        ?.privateSubnets;

      expect(dataResources).toBeDefined();
      expect(dataResources.filter).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should tag all resources with environmentSuffix', () => {
      const synthesis = Testing.synth(stack);
      const parsed = JSON.parse(synthesis);

      const checkTags = (resource: any) => {
        if (resource?.tags) {
          expect(resource.tags.EnvironmentSuffix).toBe('test');
          expect(resource.tags.Environment).toBe('production');
          expect(resource.tags.Team).toBe('platform');
          expect(resource.tags.CostCenter).toBe('engineering');
        }
      };

      // Check RDS instance tags
      checkTags(parsed.resource?.aws_db_instance?.rdsInstance);
      // Check KMS key tags
      checkTags(parsed.resource?.aws_kms_key?.rdsKmsKey);
      // Check security group tags
      checkTags(parsed.resource?.aws_security_group?.rdsSecurityGroup);
      // Check SNS topic tags
      checkTags(parsed.resource?.aws_sns_topic?.dbAlertsTopic);
    });

    it('should include all required tags in resources', () => {
      const synthesis = Testing.synth(stack);
      const parsed = JSON.parse(synthesis);
      const rdsInstance = parsed.resource?.aws_db_instance?.rdsInstance;

      expect(rdsInstance.tags.Name).toContain('test');
      expect(rdsInstance.tags.Environment).toBe('production');
      expect(rdsInstance.tags.Team).toBe('platform');
      expect(rdsInstance.tags.CostCenter).toBe('engineering');
      expect(rdsInstance.tags.EnvironmentSuffix).toBe('test');
    });
  });

  describe('Stack Outputs', () => {
    it('should define all required outputs', () => {
      const synthesis = Testing.synth(stack);
      const outputs = JSON.parse(synthesis).output;

      expect(outputs).toBeDefined();
      expect(outputs.dbEndpoint).toBeDefined();
      expect(outputs.dbAddress).toBeDefined();
      expect(outputs.dbPort).toBeDefined();
      expect(outputs.dbSecretArn).toBeDefined();
      expect(outputs.snsTopicArn).toBeDefined();
      expect(outputs.dbInstanceId).toBeDefined();
      expect(outputs.dbSecurityGroupId).toBeDefined();
      expect(outputs.environmentSuffix).toBeDefined();
    });

    it('should have correct environmentSuffix in outputs', () => {
      const synthesis = Testing.synth(stack);
      const outputs = JSON.parse(synthesis).output;

      expect(outputs.environmentSuffix.value).toBe('test');
    });

    it('should have dbInstanceId output defined', () => {
      const synthesis = Testing.synth(stack);
      const outputs = JSON.parse(synthesis).output;

      expect(outputs.dbInstanceId.value).toContain('rdsInstance.identifier');
    });

    it('should have dbPort output defined', () => {
      const synthesis = Testing.synth(stack);
      const outputs = JSON.parse(synthesis).output;

      expect(outputs.dbPort.value).toContain('rdsInstance.port');
    });
  });

  describe('Password Generation', () => {
    it('should create random password with correct configuration', () => {
      const synthesis = Testing.synth(stack);
      const resources = JSON.parse(synthesis).resource?.random_password
        ?.dbPassword;

      expect(resources).toBeDefined();
      expect(resources.length).toBe(32);
      expect(resources.special).toBe(true);
      expect(resources.override_special).toBe('!#$%&*()-_=+[]{}<>:?');
    });
  });
});
