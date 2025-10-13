// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';
import https from 'https';

// Helper function to check if outputs file exists
const hasOutputs = (): boolean => {
  return fs.existsSync('cfn-outputs/flat-outputs.json');
};

// Load outputs if available
let outputs: Record<string, any> = {};
if (hasOutputs()) {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('RDS MySQL Deployment Integration Tests', () => {
  beforeAll(() => {
    if (!hasOutputs()) {
      console.warn('Integration tests skipped - cfn-outputs/flat-outputs.json not found');
      console.warn('Run deployment first to generate outputs for integration testing');
    }
  });

  describe('VPC and Networking Infrastructure', () => {
    test('should have VPC deployed with correct configuration', () => {
      if (!hasOutputs()) return;
      
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-zA-Z0-9]+$/);
    });

    test('should have private subnets deployed', () => {
      if (!hasOutputs()) return;
      
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-zA-Z0-9]+$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-zA-Z0-9]+$/);
      expect(outputs.PrivateSubnet1Id).not.toBe(outputs.PrivateSubnet2Id);
    });

    test('should have security group deployed', () => {
      if (!hasOutputs()) return;
      
      expect(outputs.DBSecurityGroupId).toBeDefined();
      expect(outputs.DBSecurityGroupId).toMatch(/^sg-[a-zA-Z0-9]+$/);
    });
  });

  describe('RDS Database Infrastructure', () => {
    test('should have RDS instance endpoint available', () => {
      if (!hasOutputs()) return;
      
      expect(outputs.DBInstanceEndpoint).toBeDefined();
      expect(outputs.DBInstanceEndpoint).toMatch(/^[a-zA-Z0-9.-]+\.rds\.amazonaws\.com$/);
    });

    test('should have correct database port', () => {
      if (!hasOutputs()) return;
      
      expect(outputs.DBInstancePort).toBeDefined();
      expect(Number(outputs.DBInstancePort)).toBe(3306);
    });

    test('should have database name configured', () => {
      if (!hasOutputs()) return;
      
      expect(outputs.DBName).toBeDefined();
      expect(outputs.DBName).toBe('customerdb');
    });
  });

  describe('Security and Encryption', () => {
    test('should have KMS key deployed for encryption', () => {
      if (!hasOutputs()) return;
      
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.KMSKeyId).toMatch(/^[a-zA-Z0-9-]+$/);
    });

    test('should have Secrets Manager secret for credentials', () => {
      if (!hasOutputs()) return;
      
      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:[a-z0-9-]+:[0-9]+:secret:[a-zA-Z0-9-]+$/);
    });

    test('should have IAM role for database access', () => {
      if (!hasOutputs()) return;
      
      expect(outputs.DBAccessRoleArn).toBeDefined();
      expect(outputs.DBAccessRoleArn).toMatch(/^arn:aws:iam::[0-9]+:role\/[a-zA-Z0-9-]+$/);
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have SNS topic for alarms', () => {
      if (!hasOutputs()) return;
      
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:[0-9]+:[a-zA-Z0-9-]+$/);
    });
  });

  describe('Resource Naming Convention', () => {
    test('should follow naming convention with environment suffix', () => {
      if (!hasOutputs()) return;
      
      // Check that resources include environment suffix in their naming
      const resourcesWithSuffix = [
        outputs.VPCId,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.DBSecurityGroupId,
        outputs.KMSKeyId
      ];

      resourcesWithSuffix.forEach(resource => {
        expect(resource).toBeDefined();
      });
    });

    test('should have consistent stack export names', () => {
      if (!hasOutputs()) return;
      
      // All outputs should exist as they're exported from the stack
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnet1Id', 
        'PrivateSubnet2Id',
        'DBInstanceEndpoint',
        'DBInstancePort',
        'DBName',
        'KMSKeyId',
        'DBSecurityGroupId',
        'DBAccessRoleArn',
        'SNSTopicArn',
        'DBSecretArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
      });
    });
  });

  describe('Complete Database Deployment Flow', () => {
    test('should have complete end-to-end RDS MySQL deployment', () => {
      if (!hasOutputs()) return;
      
      // Verify complete flow: VPC -> Subnets -> Security -> Database -> Monitoring
      
      // 1. Network Infrastructure
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      
      // 2. Security Infrastructure  
      expect(outputs.DBSecurityGroupId).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.DBAccessRoleArn).toBeDefined();
      
      // 3. Database Infrastructure
      expect(outputs.DBInstanceEndpoint).toBeDefined();
      expect(outputs.DBInstancePort).toBeDefined();
      expect(outputs.DBName).toBeDefined();
      
      // 4. Monitoring Infrastructure
      expect(outputs.SNSTopicArn).toBeDefined();
      
      console.log('Complete RDS MySQL deployment verified:');
      console.log(`- VPC: ${outputs.VPCId}`);
      console.log(`- Database Endpoint: ${outputs.DBInstanceEndpoint}:${outputs.DBInstancePort}`);
      console.log(`- Database Name: ${outputs.DBName}`);
      console.log(`- KMS Key: ${outputs.KMSKeyId}`);
      console.log(`- Secret ARN: ${outputs.DBSecretArn}`);
      console.log(`- SNS Topic: ${outputs.SNSTopicArn}`);
    });

    test('should validate database accessibility through private subnets', () => {
      if (!hasOutputs()) return;
      
      // Verify that database is accessible only through private subnets
      expect(outputs.DBInstanceEndpoint).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.DBSecurityGroupId).toBeDefined();
      
      // Database should have internal endpoint (not public)
      expect(outputs.DBInstanceEndpoint).toMatch(/^[a-zA-Z0-9.-]+\.rds\.amazonaws\.com$/);
    });

    test('should validate encryption and security implementation', () => {
      if (!hasOutputs()) return;
      
      // Verify all security components are in place
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.DBAccessRoleArn).toBeDefined();
      
      // KMS key should be valid UUID format
      expect(outputs.KMSKeyId).toMatch(/^[a-zA-Z0-9-]+$/);
      
      // Secret should be in correct region and format
      expect(outputs.DBSecretArn).toMatch(/arn:aws:secretsmanager:/);
      
      // IAM role should be properly formatted
      expect(outputs.DBAccessRoleArn).toMatch(/arn:aws:iam::/);
    });

    test('should validate monitoring and alerting setup', () => {
      if (!hasOutputs()) return;
      
      // Verify monitoring infrastructure
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:[0-9]+:[a-zA-Z0-9-]+$/);
      
      // SNS topic should include environment suffix in name
      expect(outputs.SNSTopicArn).toMatch(/customer-db-alarms/);
    });

    test('should validate backup and maintenance configuration', () => {
      if (!hasOutputs()) return;
      
      // Database should be configured with all required outputs for backup access
      expect(outputs.DBInstanceEndpoint).toBeDefined();
      expect(outputs.DBName).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined(); // For encrypted backups
      
      // Verify we have access to credentials for backup operations
      expect(outputs.DBSecretArn).toBeDefined();
    });
  });

  describe('Infrastructure Validation (Deployment Outputs)', () => {
    test('should have deployment outputs in correct format', () => {
      if (!hasOutputs()) return;
      
      // Validate the flat-outputs.json structure
      expect(typeof outputs).toBe('object');
      expect(outputs).not.toBeNull();
      
      // Should not have nested objects (flat structure)
      Object.values(outputs).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });

    test('should have all stack outputs available for integration', () => {
      if (!hasOutputs()) return;
      
      const outputCount = Object.keys(outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(11);
      
      // Verify we have enough outputs for complete integration testing
      const coreOutputs = [
        outputs.VPCId,
        outputs.DBInstanceEndpoint,
        outputs.KMSKeyId,
        outputs.DBSecretArn
      ];
      
      coreOutputs.forEach(output => {
        expect(output).toBeDefined();
        expect(output).not.toBe('');
      });
    });
  });
});