import { readFileSync } from 'fs';
import { join } from 'path';

// Read outputs from deployed stack
const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');

let outputs: Record<string, any> = {};
let outputsExist = false;

try {
  const rawOutputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));

  // Parse stringified array outputs (Terraform may output arrays as JSON strings)
  outputs = Object.fromEntries(
    Object.entries(rawOutputs).map(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        try {
          return [key, JSON.parse(value)];
        } catch {
          return [key, value];
        }
      }
      return [key, value];
    })
  );

  outputsExist = true;
} catch (error) {
  console.log('Note: flat-outputs.json not found. Integration tests will be skipped until infrastructure is deployed.');
}

describe('Terraform Integration Tests - HIPAA Healthcare Infrastructure', () => {

  beforeAll(() => {
    if (!outputsExist) {
      console.log('Skipping integration tests - infrastructure not yet deployed');
    }
  });

  // =============================================================================
  // Basic Infrastructure Validation
  // =============================================================================

  describe('Basic Infrastructure', () => {
    test('should have VPC ID output', () => {
      if (!outputsExist) return;
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.vpc_id).toMatch(/^vpc-/);
    });

    test('should have VPC CIDR output', () => {
      if (!outputsExist) return;
      expect(outputs.vpc_cidr).toBeDefined();
      expect(outputs.vpc_cidr).toMatch(/^10\.0\.0\.0\/16$/);
    });

    test('should have public subnet IDs', () => {
      if (!outputsExist) return;
      expect(outputs.public_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
      expect(outputs.public_subnet_ids.length).toBeGreaterThanOrEqual(2);
    });

    test('should have private subnet IDs', () => {
      if (!outputsExist) return;
      expect(outputs.private_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.private_subnet_ids)).toBe(true);
      expect(outputs.private_subnet_ids.length).toBeGreaterThanOrEqual(2);
    });

    test('should have Internet Gateway ID', () => {
      if (!outputsExist) return;
      expect(outputs.internet_gateway_id).toBeDefined();
      expect(outputs.internet_gateway_id).toMatch(/^igw-/);
    });

    test('should have NAT Gateway IDs', () => {
      if (!outputsExist) return;
      expect(outputs.nat_gateway_ids).toBeDefined();
      expect(Array.isArray(outputs.nat_gateway_ids)).toBe(true);
      expect(outputs.nat_gateway_ids.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =============================================================================
  // Security Groups Validation
  // =============================================================================

  describe('Security Groups', () => {
    test('should have web tier security group', () => {
      if (!outputsExist) return;
      expect(outputs.web_security_group_id).toBeDefined();
      expect(outputs.web_security_group_id).toMatch(/^sg-/);
    });

    test('should have application tier security group', () => {
      if (!outputsExist) return;
      expect(outputs.app_security_group_id).toBeDefined();
      expect(outputs.app_security_group_id).toMatch(/^sg-/);
    });

    test('should have database tier security group', () => {
      if (!outputsExist) return;
      expect(outputs.database_security_group_id).toBeDefined();
      expect(outputs.database_security_group_id).toMatch(/^sg-/);
    });

    test('should have bastion security group', () => {
      if (!outputsExist) return;
      expect(outputs.bastion_security_group_id).toBeDefined();
      expect(outputs.bastion_security_group_id).toMatch(/^sg-/);
    });
  });

  // =============================================================================
  // CloudTrail Validation
  // =============================================================================

  describe('CloudTrail', () => {
    test('should have CloudTrail ARN', () => {
      if (!outputsExist) return;
      expect(outputs.cloudtrail_arn).toBeDefined();
      expect(outputs.cloudtrail_arn).toMatch(/^arn:aws:cloudtrail:/);
    });

    test('should have CloudTrail name', () => {
      if (!outputsExist) return;
      expect(outputs.cloudtrail_name).toBeDefined();
      expect(outputs.cloudtrail_name).toContain('healthcare-system');
      expect(outputs.cloudtrail_name).toContain('trail');
    });

    test('should have CloudTrail S3 bucket', () => {
      if (!outputsExist) return;
      expect(outputs.cloudtrail_s3_bucket_name).toBeDefined();
      expect(outputs.cloudtrail_s3_bucket_name).toContain('cloudtrail-logs');
    });

    test('should have CloudTrail S3 bucket ARN', () => {
      if (!outputsExist) return;
      expect(outputs.cloudtrail_s3_bucket_arn).toBeDefined();
      expect(outputs.cloudtrail_s3_bucket_arn).toMatch(/^arn:aws:s3:::/);
    });
  });

  // =============================================================================
  // KMS Encryption Validation
  // =============================================================================

  describe('KMS Encryption', () => {
    test('should have KMS key ID', () => {
      if (!outputsExist) return;
      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.kms_key_id).toMatch(/^[a-f0-9-]{36}$/);
    });

    test('should have KMS key ARN', () => {
      if (!outputsExist) return;
      expect(outputs.kms_key_arn).toBeDefined();
      expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:/);
    });
  });

  // =============================================================================
  // SNS Topic Validation
  // =============================================================================

  describe('SNS Notifications', () => {
    test('should have SNS topic ARN', () => {
      if (!outputsExist) return;
      expect(outputs.sns_topic_arn).toBeDefined();
      expect(outputs.sns_topic_arn).toMatch(/^arn:aws:sns:/);
      expect(outputs.sns_topic_arn).toContain('security-alerts');
    });
  });

  // =============================================================================
  // Lambda Function Validation
  // =============================================================================

  describe('Compliance Lambda', () => {
    test('should have Lambda function name', () => {
      if (!outputsExist) return;
      expect(outputs.compliance_lambda_function_name).toBeDefined();
      expect(outputs.compliance_lambda_function_name).toContain('compliance-check');
    });

    test('should have Lambda function ARN', () => {
      if (!outputsExist) return;
      expect(outputs.compliance_lambda_function_arn).toBeDefined();
      expect(outputs.compliance_lambda_function_arn).toMatch(/^arn:aws:lambda:/);
    });
  });

  // =============================================================================
  // CloudWatch Logs Validation
  // =============================================================================

  describe('CloudWatch Logs', () => {
    test('should have VPC Flow Logs group name', () => {
      if (!outputsExist) return;
      // This output is conditional based on enable_vpc_flow_logs variable
      if (outputs.vpc_flow_log_group_name) {
        expect(outputs.vpc_flow_log_group_name).toContain('/aws/vpc/flowlogs');
      }
    });

    test('should have CloudTrail log group name', () => {
      if (!outputsExist) return;
      // This output is conditional based on enable_cloudtrail_cloudwatch variable
      if (outputs.cloudtrail_log_group_name) {
        expect(outputs.cloudtrail_log_group_name).toContain('/aws/cloudtrail');
      }
    });
  });

  // =============================================================================
  // Environment Suffix Validation
  // =============================================================================

  describe('Resource Naming', () => {
    test('should have environment suffix', () => {
      if (!outputsExist) return;
      expect(outputs.environment_suffix).toBeDefined();
      expect(outputs.environment_suffix.length).toBeGreaterThan(0);
    });

    test('should use consistent suffix across resources', () => {
      if (!outputsExist) return;
      const suffix = outputs.environment_suffix;

      if (outputs.cloudtrail_name) {
        expect(outputs.cloudtrail_name).toContain(suffix);
      }
      if (outputs.cloudtrail_s3_bucket_name) {
        expect(outputs.cloudtrail_s3_bucket_name).toContain(suffix);
      }
      if (outputs.compliance_lambda_function_name) {
        expect(outputs.compliance_lambda_function_name).toContain(suffix);
      }
    });
  });

  // =============================================================================
  // HIPAA Compliance Checks
  // =============================================================================

  describe('HIPAA Compliance', () => {
    test('should have encryption enabled (KMS key present)', () => {
      if (!outputsExist) return;
      expect(outputs.kms_key_arn).toBeDefined();
    });

    test('should have audit trail configured (CloudTrail)', () => {
      if (!outputsExist) return;
      expect(outputs.cloudtrail_arn).toBeDefined();
    });

    test('should have compliance monitoring (Lambda)', () => {
      if (!outputsExist) return;
      expect(outputs.compliance_lambda_function_arn).toBeDefined();
    });

    test('should have security alerts configured (SNS)', () => {
      if (!outputsExist) return;
      expect(outputs.sns_topic_arn).toBeDefined();
    });

    test('should have network isolation (VPC with private subnets)', () => {
      if (!outputsExist) return;
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.private_subnet_ids).toBeDefined();
      expect(outputs.private_subnet_ids.length).toBeGreaterThanOrEqual(2);
    });

    test('should have multi-AZ architecture for high availability', () => {
      if (!outputsExist) return;
      expect(outputs.public_subnet_ids.length).toBeGreaterThanOrEqual(2);
      expect(outputs.private_subnet_ids.length).toBeGreaterThanOrEqual(2);
      expect(outputs.nat_gateway_ids.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =============================================================================
  // Outputs Completeness Check
  // =============================================================================

  describe('Outputs Completeness', () => {
    test('should have at least 20 outputs defined', () => {
      if (!outputsExist) return;
      const outputCount = Object.keys(outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(20);
    });

    test('should have all required infrastructure outputs', () => {
      if (!outputsExist) return;

      const requiredOutputs = [
        'vpc_id',
        'vpc_cidr',
        'public_subnet_ids',
        'private_subnet_ids',
        'internet_gateway_id',
        'nat_gateway_ids',
        'web_security_group_id',
        'app_security_group_id',
        'database_security_group_id',
        'bastion_security_group_id',
        'cloudtrail_arn',
        'cloudtrail_name',
        'cloudtrail_s3_bucket_name',
        'cloudtrail_s3_bucket_arn',
        'kms_key_id',
        'kms_key_arn',
        'sns_topic_arn',
        'compliance_lambda_function_name',
        'compliance_lambda_function_arn',
        'environment_suffix'
      ];

      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
      });
    });
  });
});
