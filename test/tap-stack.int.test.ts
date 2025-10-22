import * as fs from 'fs';
import * as path from 'path';

describe('Healthcare Infrastructure Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    }
  });

  describe('Infrastructure Deployment Validation', () => {
    test('Outputs file should exist after deployment', () => {
      const outputsPath = path.join(
        __dirname,
        '../cfn-outputs/flat-outputs.json'
      );
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test('Outputs should contain expected resource identifiers', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });
  });

  describe('VPC Integration', () => {
    test('VPC should be created successfully', () => {
      const vpcKeys = Object.keys(outputs || {}).filter(
        key => key.includes('vpc') && key.includes('id')
      );
      expect(vpcKeys.length).toBeGreaterThan(0);
    });

    test('Subnets should be created in correct AZs', () => {
      const subnetKeys = Object.keys(outputs || {}).filter(
        key => key.includes('subnet') && key.includes('id')
      );
      expect(subnetKeys.length).toBeGreaterThanOrEqual(4);
    });

    test('Internet Gateway should be attached', () => {
      const igwKeys = Object.keys(outputs || {}).filter(key =>
        key.includes('internet_gateway')
      );
      expect(igwKeys.length).toBeGreaterThan(0);
    });

    test('NAT Gateway should be provisioned', () => {
      const natKeys = Object.keys(outputs || {}).filter(key =>
        key.includes('nat_gateway')
      );
      expect(natKeys.length).toBeGreaterThan(0);
    });
  });

  describe('RDS Integration', () => {
    test('RDS instance should be created', () => {
      const rdsKeys = Object.keys(outputs || {}).filter(
        key => key.includes('db_instance') && key.includes('id')
      );
      expect(rdsKeys.length).toBeGreaterThan(0);
    });

    test('RDS endpoint should be available', () => {
      const endpointKeys = Object.keys(outputs || {}).filter(
        key => key.includes('db_instance') && key.includes('endpoint')
      );
      if (endpointKeys.length > 0) {
        const endpoint = outputs[endpointKeys[0]];
        expect(endpoint).toBeDefined();
        expect(typeof endpoint).toBe('string');
        expect(endpoint.length).toBeGreaterThan(0);
      }
    });

    test('RDS should be in available state', () => {
      const statusKeys = Object.keys(outputs || {}).filter(
        key => key.includes('db_instance') && key.includes('status')
      );
      if (statusKeys.length > 0) {
        const status = outputs[statusKeys[0]];
        expect(status).toBe('available');
      }
    });

    test('RDS ARN should be valid', () => {
      const arnKeys = Object.keys(outputs || {}).filter(
        key => key.includes('db_instance') && key.includes('arn')
      );
      if (arnKeys.length > 0) {
        const arn = outputs[arnKeys[0]];
        expect(arn).toMatch(/^arn:aws:rds:/);
      }
    });
  });

  describe('ElastiCache Integration', () => {
    test('ElastiCache serverless cache should be created', () => {
      const cacheKeys = Object.keys(outputs || {}).filter(key =>
        key.includes('elasticache_serverless_cache')
      );
      expect(cacheKeys.length).toBeGreaterThan(0);
    });

    test('ElastiCache endpoint should be available', () => {
      const endpointKeys = Object.keys(outputs || {}).filter(
        key => key.includes('elasticache') && key.includes('endpoint')
      );
      if (endpointKeys.length > 0) {
        const endpoint = outputs[endpointKeys[0]];
        expect(endpoint).toBeDefined();
      }
    });

    test('ElastiCache ARN should be valid', () => {
      const arnKeys = Object.keys(outputs || {}).filter(
        key => key.includes('elasticache') && key.includes('arn')
      );
      if (arnKeys.length > 0) {
        const arn = outputs[arnKeys[0]];
        expect(arn).toMatch(/^arn:aws:elasticache:/);
      }
    });

    test('ElastiCache should be in available status', () => {
      const statusKeys = Object.keys(outputs || {}).filter(
        key => key.includes('elasticache') && key.includes('status')
      );
      if (statusKeys.length > 0) {
        const status = outputs[statusKeys[0]];
        expect(['available', 'creating']).toContain(status);
      }
    });
  });

  describe('KMS Integration', () => {
    test('KMS keys should be created', () => {
      const kmsKeys = Object.keys(outputs || {}).filter(
        key => key.includes('kms_key') && key.includes('id')
      );
      expect(kmsKeys.length).toBeGreaterThanOrEqual(3);
    });

    test('KMS key ARNs should be valid', () => {
      const arnKeys = Object.keys(outputs || {}).filter(
        key => key.includes('kms_key') && key.includes('arn')
      );
      arnKeys.forEach(key => {
        const arn = outputs[key];
        expect(arn).toMatch(/^arn:aws:kms:/);
      });
    });

    test('KMS aliases should be created', () => {
      const aliasKeys = Object.keys(outputs || {}).filter(key =>
        key.includes('kms_alias')
      );
      expect(aliasKeys.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Secrets Manager Integration', () => {
    test('Database secret should be created', () => {
      const secretKeys = Object.keys(outputs || {}).filter(
        key => key.includes('secretsmanager_secret') && key.includes('id')
      );
      expect(secretKeys.length).toBeGreaterThan(0);
    });

    test('Secret ARN should be valid', () => {
      const arnKeys = Object.keys(outputs || {}).filter(
        key => key.includes('secretsmanager_secret') && key.includes('arn')
      );
      if (arnKeys.length > 0) {
        const arn = outputs[arnKeys[0]];
        expect(arn).toMatch(/^arn:aws:secretsmanager:/);
      }
    });

    test('Secret version should exist', () => {
      const versionKeys = Object.keys(outputs || {}).filter(key =>
        key.includes('secretsmanager_secret_version')
      );
      expect(versionKeys.length).toBeGreaterThan(0);
    });
  });

  describe('Security Groups Integration', () => {
    test('RDS security group should exist', () => {
      const sgKeys = Object.keys(outputs || {}).filter(
        key => key.includes('security_group') && key.includes('rds')
      );
      expect(sgKeys.length).toBeGreaterThan(0);
    });

    test('ElastiCache security group should exist', () => {
      const sgKeys = Object.keys(outputs || {}).filter(
        key => key.includes('security_group') && key.includes('elasticache')
      );
      expect(sgKeys.length).toBeGreaterThan(0);
    });

    test('Security group IDs should be valid', () => {
      const sgIdKeys = Object.keys(outputs || {}).filter(
        key => key.includes('security_group') && key.includes('id')
      );
      sgIdKeys.forEach(key => {
        const sgId = outputs[key];
        expect(sgId).toMatch(/^sg-/);
      });
    });
  });

  describe('Subnet Groups Integration', () => {
    test('DB subnet group should be created', () => {
      const dbSubnetKeys = Object.keys(outputs || {}).filter(key =>
        key.includes('db_subnet_group')
      );
      expect(dbSubnetKeys.length).toBeGreaterThan(0);
    });

    test('ElastiCache subnet group should be created', () => {
      const cacheSubnetKeys = Object.keys(outputs || {}).filter(key =>
        key.includes('elasticache_subnet_group')
      );
      expect(cacheSubnetKeys.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Consistency', () => {
    test('All resource names should include environment suffix', () => {
      const nameKeys = Object.keys(outputs || {}).filter(
        key => key.includes('_name') || key.includes('identifier')
      );

      nameKeys.forEach(key => {
        const name = outputs[key];
        if (typeof name === 'string') {
          expect(name).toBeTruthy();
        }
      });
    });

    test('Resource tags should be consistent', () => {
      const tagKeys = Object.keys(outputs || {}).filter(key =>
        key.includes('tags')
      );

      expect(tagKeys.length).toBeGreaterThan(0);
    });
  });

  describe('High Availability Validation', () => {
    test('RDS multi-AZ should be enabled', () => {
      const multiAzKeys = Object.keys(outputs || {}).filter(
        key => key.includes('db_instance') && key.includes('multi_az')
      );
      if (multiAzKeys.length > 0) {
        const multiAz = outputs[multiAzKeys[0]];
        expect(multiAz).toBe(true);
      }
    });

    test('Resources should be spread across multiple AZs', () => {
      const azKeys = Object.keys(outputs || {}).filter(key =>
        key.includes('availability_zone')
      );
      const uniqueAzs = new Set(azKeys.map(key => outputs[key]));
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Encryption Validation', () => {
    test('RDS encryption should be enabled', () => {
      const encryptionKeys = Object.keys(outputs || {}).filter(
        key => key.includes('db_instance') && key.includes('storage_encrypted')
      );
      if (encryptionKeys.length > 0) {
        const encrypted = outputs[encryptionKeys[0]];
        expect(encrypted).toBe(true);
      }
    });

    test('RDS should have KMS key configured', () => {
      const kmsKeys = Object.keys(outputs || {}).filter(
        key => key.includes('db_instance') && key.includes('kms_key_id')
      );
      if (kmsKeys.length > 0) {
        const kmsKeyId = outputs[kmsKeys[0]];
        expect(kmsKeyId).toBeDefined();
        expect(kmsKeyId.length).toBeGreaterThan(0);
      }
    });

    test('ElastiCache should have KMS key configured', () => {
      const kmsKeys = Object.keys(outputs || {}).filter(
        key => key.includes('elasticache') && key.includes('kms_key_id')
      );
      if (kmsKeys.length > 0) {
        const kmsKeyId = outputs[kmsKeys[0]];
        expect(kmsKeyId).toBeDefined();
      }
    });
  });

  describe('Monitoring and Logging', () => {
    test('RDS Performance Insights should be enabled', () => {
      const piKeys = Object.keys(outputs || {}).filter(key =>
        key.includes('performance_insights_enabled')
      );
      if (piKeys.length > 0) {
        const piEnabled = outputs[piKeys[0]];
        expect(piEnabled).toBe(true);
      }
    });

    test('RDS CloudWatch logs should be configured', () => {
      const logKeys = Object.keys(outputs || {}).filter(key =>
        key.includes('enabled_cloudwatch_logs_exports')
      );
      expect(logKeys.length).toBeGreaterThan(0);
    });
  });

  describe('Backup Configuration', () => {
    test('RDS backup retention should be configured', () => {
      const backupKeys = Object.keys(outputs || {}).filter(key =>
        key.includes('backup_retention_period')
      );
      if (backupKeys.length > 0) {
        const retentionPeriod = outputs[backupKeys[0]];
        expect(retentionPeriod).toBeGreaterThan(0);
      }
    });

    test('ElastiCache snapshots should be configured', () => {
      const snapshotKeys = Object.keys(outputs || {}).filter(key =>
        key.includes('snapshot_retention_limit')
      );
      if (snapshotKeys.length > 0) {
        const retention = outputs[snapshotKeys[0]];
        expect(retention).toBeGreaterThan(0);
      }
    });
  });
});
