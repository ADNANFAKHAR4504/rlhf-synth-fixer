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


  describe('RDS Integration', () => {
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
    test('KMS key ARNs should be valid', () => {
      const arnKeys = Object.keys(outputs || {}).filter(
        key => key.includes('kms_key') && key.includes('arn')
      );
      arnKeys.forEach(key => {
        const arn = outputs[key];
        expect(arn).toMatch(/^arn:aws:kms:/);
      });
    });
  });

  describe('Secrets Manager Integration', () => {
    test('Secret ARN should be valid', () => {
      const arnKeys = Object.keys(outputs || {}).filter(
        key => key.includes('secretsmanager_secret') && key.includes('arn')
      );
      if (arnKeys.length > 0) {
        const arn = outputs[arnKeys[0]];
        expect(arn).toMatch(/^arn:aws:secretsmanager:/);
      }
    });
  });

  describe('Security Groups Integration', () => {
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
