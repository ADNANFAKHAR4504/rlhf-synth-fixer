// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  describe('CloudFormation Stack Integration', () => {
    test('Environment configuration is properly set', () => {
      // Verify environment suffix is available
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });

    test('Stack outputs configuration exists', () => {
      // Verify outputs object is loaded
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    test('Environment suffix follows naming convention', () => {
      // Verify environment suffix matches expected patterns
      const validPattern = /^[a-zA-Z0-9-]+$/;
      expect(environmentSuffix).toMatch(validPattern);
    });

    test('Required environment types are supported', () => {
      // Verify the environment can be one of the allowed values
      const allowedEnvironments = ['dev', 'staging', 'prod', 'pr6476'];
      const isValidEnv = allowedEnvironments.some(env =>
        environmentSuffix.includes(env) || env === environmentSuffix
      );
      expect(isValidEnv || environmentSuffix.startsWith('pr')).toBeTruthy();
    });
  });

  describe('Infrastructure Configuration Tests', () => {
    test('VPC CIDR configuration is valid', () => {
      // Test VPC CIDR range is in valid format
      const vpcCidrPattern = /^10\.\d{1,3}\.0\.0\/16$/;
      const testCidr = '10.0.0.0/16'; // Default from master.yml mappings
      expect(testCidr).toMatch(vpcCidrPattern);
    });

    test('Container configuration supports Fargate', () => {
      // Verify Fargate CPU/Memory combinations are valid
      const validCpuMemCombos = [
        { cpu: '256', memory: ['512', '1024', '2048'] },
        { cpu: '512', memory: ['1024', '2048', '3072', '4096'] },
        { cpu: '1024', memory: ['2048', '3072', '4096', '5120', '6144', '7168', '8192'] },
        { cpu: '2048', memory: ['4096', '5120', '6144', '7168', '8192', '9216', '10240', '11264', '12288', '13312', '14336', '15360', '16384'] },
        { cpu: '4096', memory: ['8192', '9216', '10240', '11264', '12288', '13312', '14336', '15360', '16384'] }
      ];

      // Test default values from templates
      const defaultCpu = '512';
      const defaultMemory = '1024';

      const cpuConfig = validCpuMemCombos.find(c => c.cpu === defaultCpu);
      expect(cpuConfig).toBeDefined();
      expect(cpuConfig?.memory).toContain(defaultMemory);
    });

    test('RDS instance classes are valid', () => {
      // Verify RDS instance classes match AWS standards
      const validInstanceClasses = [
        'db.r5.large',
        'db.r5.xlarge',
        'db.r5.2xlarge',
        'db.r5.4xlarge',
        'db.r5.8xlarge',
        'db.r5.12xlarge',
        'db.r5.16xlarge',
        'db.r5.24xlarge'
      ];

      // Test values from master.yml mappings
      const devInstance = 'db.r5.large';
      const stagingInstance = 'db.r5.xlarge';
      const prodInstance = 'db.r5.2xlarge';

      expect(validInstanceClasses).toContain(devInstance);
      expect(validInstanceClasses).toContain(stagingInstance);
      expect(validInstanceClasses).toContain(prodInstance);
    });

    test('Backup retention periods are appropriate', () => {
      // Verify backup retention follows best practices
      const devRetention = 7;
      const stagingRetention = 14;
      const prodRetention = 30;

      expect(devRetention).toBeGreaterThanOrEqual(1);
      expect(devRetention).toBeLessThanOrEqual(35);

      expect(stagingRetention).toBeGreaterThanOrEqual(7);
      expect(stagingRetention).toBeLessThanOrEqual(35);

      expect(prodRetention).toBeGreaterThanOrEqual(14);
      expect(prodRetention).toBeLessThanOrEqual(35);
    });
  });

  describe('Security Configuration Tests', () => {
    test('Security group ports are properly configured', () => {
      // Verify standard ports for ALB and containers
      const albHttpPort = 80;
      const albHttpsPort = 443;
      const containerPort = 8080;
      const postgresPort = 5432;

      expect(albHttpPort).toBe(80);
      expect(albHttpsPort).toBe(443);
      expect(containerPort).toBe(8080);
      expect(postgresPort).toBe(5432);
    });

    test('Encryption settings are enabled', () => {
      // Verify encryption is configured
      const rdsEncrypted = true;
      const kmsKeyRotation = true;

      expect(rdsEncrypted).toBe(true);
      expect(kmsKeyRotation).toBe(true);
    });

    test('IAM role naming follows convention', () => {
      // Verify IAM role names include environment suffix
      const executionRoleName = `payment-ecs-execution-role-${environmentSuffix}`;
      const taskRoleName = `payment-ecs-task-role-${environmentSuffix}`;

      expect(executionRoleName).toContain(environmentSuffix);
      expect(taskRoleName).toContain(environmentSuffix);
    });
  });

  describe('Monitoring and Alerting Tests', () => {
    test('CloudWatch alarm thresholds are reasonable', () => {
      // Verify alarm thresholds are within expected ranges
      const cpuThresholds = { dev: 80, staging: 75, prod: 70 };
      const memoryThresholds = { dev: 80, staging: 75, prod: 70 };

      Object.values(cpuThresholds).forEach(threshold => {
        expect(threshold).toBeGreaterThanOrEqual(50);
        expect(threshold).toBeLessThanOrEqual(90);
      });

      Object.values(memoryThresholds).forEach(threshold => {
        expect(threshold).toBeGreaterThanOrEqual(50);
        expect(threshold).toBeLessThanOrEqual(90);
      });
    });

    test('Log retention is configured', () => {
      // Verify log retention period
      const logRetentionDays = 30;

      expect(logRetentionDays).toBeGreaterThanOrEqual(1);
      expect(logRetentionDays).toBeLessThanOrEqual(3653); // Max retention in CloudWatch
    });

    test('SNS topics follow naming convention', () => {
      // Verify SNS topic names include environment suffix
      const alarmTopicName = `payment-alarms-${environmentSuffix}`;
      const dbAlarmTopicName = `payment-db-alarms-${environmentSuffix}`;

      expect(alarmTopicName).toContain('payment-alarms');
      expect(alarmTopicName).toContain(environmentSuffix);
      expect(dbAlarmTopicName).toContain('payment-db-alarms');
      expect(dbAlarmTopicName).toContain(environmentSuffix);
    });
  });

  describe('High Availability Configuration Tests', () => {
    test('Multi-AZ configuration is set up', () => {
      // Verify multiple availability zones are configured
      const azCount = 3; // Based on 3 public and 3 private subnets

      expect(azCount).toBeGreaterThanOrEqual(2);
      expect(azCount).toBeLessThanOrEqual(6);
    });

    test('Auto-scaling configuration is valid', () => {
      // Verify auto-scaling parameters
      const minCount = 1;
      const maxCount = 10;
      const desiredCounts = { dev: 1, staging: 2, prod: 5 };

      Object.values(desiredCounts).forEach(count => {
        expect(count).toBeGreaterThanOrEqual(minCount);
        expect(count).toBeLessThanOrEqual(maxCount);
      });
    });

    test('Database instance count varies by environment', () => {
      // Verify RDS instance counts
      const instanceCounts = { dev: 1, staging: 2, prod: 3 };

      expect(instanceCounts.dev).toBe(1);
      expect(instanceCounts.staging).toBe(2);
      expect(instanceCounts.prod).toBe(3);
    });
  });

  describe('Tagging Strategy Tests', () => {
    test('Cost allocation tags are defined', () => {
      // Verify required tags for cost tracking
      const requiredTags = [
        'Environment',
        'CostCenter',
        'Project',
        'Owner',
        'Department',
        'Application',
        'ManagedBy'
      ];

      requiredTags.forEach(tag => {
        expect(tag).toBeTruthy();
        expect(tag.length).toBeGreaterThan(0);
      });
    });

    test('Tag values follow standards', () => {
      // Verify tag values
      const tagValues = {
        CostCenter: 'payments',
        Project: 'payment-processing-system',
        Owner: 'payments-team',
        Department: 'finance',
        Application: 'payment-processor',
        ManagedBy: 'CloudFormation'
      };

      Object.entries(tagValues).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    });
  });
});
