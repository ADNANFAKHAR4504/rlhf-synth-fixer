import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: Record<string, string>;
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

  beforeAll(() => {
    // Load deployment outputs
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}. Please deploy the stack first.`);
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  });

  describe('Deployment Outputs Validation', () => {
    it('should have deployment outputs file', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    it('should have valid JSON in outputs file', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('VPC Infrastructure Validation', () => {
    it('should have VPC ID output', () => {
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    it('should have VPC CIDR output', () => {
      expect(outputs.VpcCidrOutput).toBeDefined();
      expect(outputs.VpcCidrOutput).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
    });

    it('should have primary region CIDR (10.0.0.0/16)', () => {
      expect(outputs.VpcCidrOutput).toBe('10.0.0.0/16');
    });

    it('should have database security group ID', () => {
      expect(outputs.DbSecurityGroupId).toBeDefined();
      expect(outputs.DbSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
    });

    it('should have Lambda security group ID', () => {
      expect(outputs.LambdaSecurityGroupId).toBeDefined();
      expect(outputs.LambdaSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
    });

    it('should have private database subnets (3 AZs)', () => {
      const subnetKeys = Object.keys(outputs).filter(key =>
        key.includes('privatedbpr') && key.includes('Subnet') && key.includes('Ref')
      );

      expect(subnetKeys.length).toBeGreaterThanOrEqual(3);

      subnetKeys.slice(0, 3).forEach(key => {
        expect(outputs[key]).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    it('should have private Lambda subnets (3 AZs)', () => {
      const subnetKeys = Object.keys(outputs).filter(key =>
        key.includes('privatelambdapr') && key.includes('Subnet') && key.includes('Ref')
      );

      expect(subnetKeys.length).toBeGreaterThanOrEqual(3);

      subnetKeys.slice(0, 3).forEach(key => {
        expect(outputs[key]).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });
  });

  describe('Storage Stack Validation', () => {
    it('should have KMS key ID', () => {
      expect(outputs.KmsKeyId).toBeDefined();
      expect(outputs.KmsKeyId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    it('should have KMS key ARN', () => {
      expect(outputs.KmsKeyArn).toBeDefined();
      expect(outputs.KmsKeyArn).toMatch(/^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-f0-9-]+$/);
      expect(outputs.KmsKeyArn).toContain(outputs.KmsKeyId);
    });

    it('should have backup bucket name', () => {
      expect(outputs.BackupBucketName).toBeDefined();
      expect(outputs.BackupBucketName).toMatch(/^postgres-dr-backups-[a-z0-9-]+-\d{12}$/);
    });

    it('should have backup bucket ARN', () => {
      expect(outputs.BackupBucketArn).toBeDefined();
      expect(outputs.BackupBucketArn).toMatch(/^arn:aws:s3:::[a-z0-9-]+$/);
      expect(outputs.BackupBucketArn).toBe(`arn:aws:s3:::${outputs.BackupBucketName}`);
    });

    it('should have S3 metrics enabled', () => {
      expect(outputs.S3MetricsEnabled).toBe('true');
    });

    it('should have backup bucket output matching BackupBucket', () => {
      expect(outputs.BackupBucket).toBe(outputs.BackupBucketName);
    });
  });

  describe('Database Stack Validation', () => {
    it('should have primary database endpoint', () => {
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabaseEndpoint).toMatch(/^[a-z0-9-]+\.([a-z0-9]+\.)?[a-z0-9-]+\.rds\.amazonaws\.com$/);
    });

    it('should have database port', () => {
      expect(outputs.DatabasePort).toBe('5432');
    });

    it('should have database identifier', () => {
      expect(outputs.DatabaseIdentifier).toBeDefined();
      expect(outputs.DatabaseIdentifier).toMatch(/^postgres-dr-[a-z0-9-]+$/);
    });

    it('should have read replica endpoint', () => {
      expect(outputs.ReadReplicaEndpoint).toBeDefined();
      expect(outputs.ReadReplicaEndpoint).toMatch(/^[a-z0-9-]+\.([a-z0-9]+\.)?[a-z0-9-]+\.rds\.amazonaws\.com$/);
    });

    it('should have different endpoints for primary and replica', () => {
      expect(outputs.DatabaseEndpoint).not.toBe(outputs.ReadReplicaEndpoint);
    });

    it('should have credentials secret ARN', () => {
      expect(outputs.CredentialsSecretArn).toBeDefined();
      expect(outputs.CredentialsSecretArn).toMatch(/^arn:aws:secretsmanager:[a-z0-9-]+:\d{12}:secret:[a-zA-Z0-9/_+=.@-]+$/);
    });

    it('should have database endpoint matching internal reference', () => {
      const internalKey = Object.keys(outputs).find(key =>
        key.includes('DatabaseStack') && key.includes('Database') && key.includes('EndpointAddress') && !key.includes('Replica')
      );

      if (internalKey) {
        expect(outputs[internalKey]).toBe(outputs.DatabaseEndpoint);
      }
    });

    it('should have read replica endpoint matching internal reference', () => {
      const internalKey = Object.keys(outputs).find(key =>
        key.includes('DatabaseStack') && key.includes('ReadReplica') && key.includes('EndpointAddress')
      );

      if (internalKey) {
        expect(outputs[internalKey]).toBe(outputs.ReadReplicaEndpoint);
      }
    });
  });

  describe('Monitoring Stack Validation', () => {
    it('should have alarm topic ARN', () => {
      expect(outputs.AlarmTopicArn).toBeDefined();
      expect(outputs.AlarmTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d{12}:[a-z0-9-]+$/);
    });

    it('should have composite alarm name', () => {
      expect(outputs.CompositeAlarmName).toBeDefined();
      expect(outputs.CompositeAlarmName).toMatch(/^postgres-dr-composite-[a-z0-9-]+$/);
    });

    it('should have replication lag function ARN', () => {
      expect(outputs.ReplicationLagFunctionArn).toBeDefined();
      expect(outputs.ReplicationLagFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-z0-9-]+$/);
    });

    it('should have alarm topic matching internal reference', () => {
      const internalKey = Object.keys(outputs).find(key =>
        key.includes('MonitoringStack') && key.includes('AlarmTopic') && key.includes('Ref')
      );

      if (internalKey) {
        expect(outputs[internalKey]).toBe(outputs.AlarmTopicArn);
      }
    });
  });

  describe('Failover Stack Validation', () => {
    it('should have failover function ARN', () => {
      expect(outputs.FailoverFunctionArn).toBeDefined();
      expect(outputs.FailoverFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-z0-9-]+$/);
    });

    it('should have failover rule name', () => {
      expect(outputs.FailoverRuleName).toBeDefined();
      expect(outputs.FailoverRuleName).toMatch(/^postgres-dr-failover-rule-[a-z0-9-]+$/);
    });

    it('should have RDS event rule name', () => {
      expect(outputs.RdsEventRuleName).toBeDefined();
      expect(outputs.RdsEventRuleName).toMatch(/^postgres-dr-rds-events-[a-z0-9-]+$/);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use consistent environment suffix across resources', () => {
      const suffixMatch = outputs.DatabaseIdentifier.match(/postgres-dr-([a-z0-9-]+)$/);
      if (suffixMatch) {
        const suffix = suffixMatch[1];
        expect(outputs.CompositeAlarmName).toContain(suffix.split('-')[0]);
      }
    });

    it('should prefix database resources with "postgres-dr"', () => {
      expect(outputs.DatabaseIdentifier.startsWith('postgres-dr')).toBe(true);
      expect(outputs.BackupBucketName.startsWith('postgres-dr-backups')).toBe(true);
      expect(outputs.CompositeAlarmName.startsWith('postgres-dr-composite')).toBe(true);
      expect(outputs.FailoverRuleName.startsWith('postgres-dr-failover-rule')).toBe(true);
      expect(outputs.RdsEventRuleName.startsWith('postgres-dr-rds-events')).toBe(true);
    });
  });

  describe('ARN Format Validation', () => {
    it('should have valid Lambda ARN format', () => {
      const lambdaArns = [
        outputs.FailoverFunctionArn,
        outputs.ReplicationLagFunctionArn,
      ];

      lambdaArns.forEach((arn) => {
        expect(arn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-z0-9-]+$/);
        const parts = arn.split(':');
        expect(parts[0]).toBe('arn');
        expect(parts[1]).toBe('aws');
        expect(parts[2]).toBe('lambda');
        expect(parts[4]).toMatch(/^\d{12}$/); // AWS Account ID
      });
    });

    it('should have valid SNS ARN format', () => {
      const snsArn = outputs.AlarmTopicArn;
      expect(snsArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d{12}:[a-z0-9-]+$/);

      const parts = snsArn.split(':');
      expect(parts[0]).toBe('arn');
      expect(parts[1]).toBe('aws');
      expect(parts[2]).toBe('sns');
      expect(parts[4]).toMatch(/^\d{12}$/); // AWS Account ID
    });

    it('should have valid KMS ARN format', () => {
      const kmsArn = outputs.KmsKeyArn;
      expect(kmsArn).toMatch(/^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-f0-9-]+$/);

      const parts = kmsArn.split(':');
      expect(parts[0]).toBe('arn');
      expect(parts[1]).toBe('aws');
      expect(parts[2]).toBe('kms');
      expect(parts[4]).toMatch(/^\d{12}$/); // AWS Account ID
    });

    it('should have valid Secrets Manager ARN format', () => {
      const secretArn = outputs.CredentialsSecretArn;
      expect(secretArn).toMatch(/^arn:aws:secretsmanager:[a-z0-9-]+:\d{12}:secret:.+$/);

      const parts = secretArn.split(':');
      expect(parts[0]).toBe('arn');
      expect(parts[1]).toBe('aws');
      expect(parts[2]).toBe('secretsmanager');
      expect(parts[4]).toMatch(/^\d{12}$/); // AWS Account ID
    });

    it('should have valid S3 ARN format', () => {
      const s3Arn = outputs.BackupBucketArn;
      expect(s3Arn).toMatch(/^arn:aws:s3:::[a-z0-9-]+$/);

      const parts = s3Arn.split(':');
      expect(parts[0]).toBe('arn');
      expect(parts[1]).toBe('aws');
      expect(parts[2]).toBe('s3');
      expect(parts[3]).toBe(''); // S3 ARNs don't have region
      expect(parts[4]).toBe(''); // S3 ARNs don't have account ID
    });
  });

  describe('Account ID Consistency', () => {
    it('should use same AWS account ID across all ARNs', () => {
      const extractAccountId = (arn: string): string | null => {
        const match = arn.match(/:(\d{12}):/);
        return match ? match[1] : null;
      };

      const accountIds = [
        extractAccountId(outputs.FailoverFunctionArn),
        extractAccountId(outputs.ReplicationLagFunctionArn),
        extractAccountId(outputs.AlarmTopicArn),
        extractAccountId(outputs.KmsKeyArn),
        extractAccountId(outputs.CredentialsSecretArn),
      ].filter(Boolean);

      const uniqueAccountIds = new Set(accountIds);
      expect(uniqueAccountIds.size).toBe(1);

      // Account ID should also be in bucket name
      const accountId = accountIds[0];
      expect(outputs.BackupBucketName).toContain(accountId!);
    });
  });

  describe('Output Completeness', () => {
    it('should have all required VPC outputs', () => {
      const requiredVpcOutputs = [
        'VpcId',
        'VpcCidrOutput',
        'DbSecurityGroupId',
        'LambdaSecurityGroupId',
      ];

      requiredVpcOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    it('should have all required storage outputs', () => {
      const requiredStorageOutputs = [
        'KmsKeyId',
        'KmsKeyArn',
        'BackupBucketName',
        'BackupBucketArn',
        'BackupBucket',
      ];

      requiredStorageOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    it('should have all required database outputs', () => {
      const requiredDatabaseOutputs = [
        'DatabaseEndpoint',
        'DatabasePort',
        'DatabaseIdentifier',
        'ReadReplicaEndpoint',
        'CredentialsSecretArn',
      ];

      requiredDatabaseOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    it('should have all required monitoring outputs', () => {
      const requiredMonitoringOutputs = [
        'AlarmTopicArn',
        'CompositeAlarmName',
        'ReplicationLagFunctionArn',
      ];

      requiredMonitoringOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    it('should have all required failover outputs', () => {
      const requiredFailoverOutputs = [
        'FailoverFunctionArn',
        'FailoverRuleName',
        'RdsEventRuleName',
      ];

      requiredFailoverOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });
  });

  describe('Resource Count Validation', () => {
    it('should have at least 1 VPC', () => {
      const vpcIds = Object.values(outputs).filter(value =>
        typeof value === 'string' && value.startsWith('vpc-')
      );
      expect(vpcIds.length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least 6 subnets', () => {
      const subnetIds = Object.values(outputs).filter(value =>
        typeof value === 'string' && value.startsWith('subnet-')
      );
      expect(subnetIds.length).toBeGreaterThanOrEqual(6);
    });

    it('should have at least 2 security groups', () => {
      const sgIds = Object.values(outputs).filter(value =>
        typeof value === 'string' && value.startsWith('sg-')
      );
      expect(sgIds.length).toBeGreaterThanOrEqual(2);
    });

    it('should have at least 1 KMS key', () => {
      const kmsKeyPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
      const kmsKeys = Object.values(outputs).filter(value =>
        typeof value === 'string' && kmsKeyPattern.test(value)
      );
      expect(kmsKeys.length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least 1 backup bucket', () => {
      const buckets = Object.values(outputs).filter(value =>
        typeof value === 'string' && value.startsWith('postgres-dr-backups-')
      );
      expect(buckets.length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least 2 Lambda functions', () => {
      const lambdaArns = Object.values(outputs).filter(value =>
        typeof value === 'string' && value.includes(':lambda:') && value.includes(':function:')
      );
      expect(lambdaArns.length).toBeGreaterThanOrEqual(2);
    });

    it('should have at least 1 SNS topic', () => {
      const snsArns = Object.values(outputs).filter(value =>
        typeof value === 'string' && value.includes(':sns:')
      );
      expect(snsArns.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Database Endpoint Validation', () => {
    it('should have valid RDS endpoint format for primary database', () => {
      const endpoint = outputs.DatabaseEndpoint;
      expect(endpoint).toMatch(/^[a-z0-9-]+\.[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/);
      expect(endpoint).toContain('.rds.amazonaws.com');
    });

    it('should have valid RDS endpoint format for read replica', () => {
      const endpoint = outputs.ReadReplicaEndpoint;
      expect(endpoint).toMatch(/^[a-z0-9-]+\.[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/);
      expect(endpoint).toContain('.rds.amazonaws.com');
    });

    it('should have database identifier in endpoint', () => {
      const dbId = outputs.DatabaseIdentifier;
      expect(outputs.DatabaseEndpoint).toContain(dbId);
    });
  });

  describe('Integration Test Summary', () => {
    it('should have deployed all required infrastructure components', () => {
      const componentChecklist = {
        'VPC and Networking': outputs.VpcId && outputs.DbSecurityGroupId,
        'Storage (S3 + KMS)': outputs.BackupBucketName && outputs.KmsKeyId,
        'Database (RDS)': outputs.DatabaseEndpoint && outputs.ReadReplicaEndpoint,
        'Monitoring': outputs.AlarmTopicArn && outputs.CompositeAlarmName,
        'Failover': outputs.FailoverFunctionArn && outputs.FailoverRuleName,
        'Lambda Functions': outputs.ReplicationLagFunctionArn,
      };

      Object.entries(componentChecklist).forEach(([_component, isDeployed]) => {
        expect(isDeployed).toBeTruthy();
      });
    });

    it('should pass all integration validations', () => {
      // Summary check - all critical outputs exist
      const criticalOutputs = [
        'VpcId',
        'DatabaseEndpoint',
        'ReadReplicaEndpoint',
        'BackupBucketName',
        'KmsKeyId',
        'AlarmTopicArn',
        'FailoverFunctionArn',
        'ReplicationLagFunctionArn',
      ];

      const missingOutputs = criticalOutputs.filter(key => !outputs[key]);
      expect(missingOutputs).toEqual([]);
    });
  });
});
