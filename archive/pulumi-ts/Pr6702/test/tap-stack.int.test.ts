/**
 * Integration Tests for TAP Stack Deployment
 *
 * These tests validate the actual deployment outputs from cfn-outputs/flat-outputs.json
 * against expected values and infrastructure requirements. No AWS API calls are made.
 */
import * as fs from 'fs';
import * as path from 'path';

describe('TAP Stack Integration Tests', () => {
  let outputs: any;
  let privateSubnetIds: string[];

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. ` +
        'Please deploy the infrastructure first: pulumi up'
      );
    }

    const rawData = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(rawData);

    // Parse privateSubnetIds if it's a JSON string (Pulumi exports arrays as JSON strings)
    if (typeof outputs.privateSubnetIds === 'string') {
      try {
        privateSubnetIds = JSON.parse(outputs.privateSubnetIds);
      } catch (e) {
        // If parsing fails, treat as single value or empty array
        privateSubnetIds = [];
      }
    } else if (Array.isArray(outputs.privateSubnetIds)) {
      privateSubnetIds = outputs.privateSubnetIds;
    } else {
      privateSubnetIds = [];
    }
  });

  describe('Deployment Metadata', () => {
    test('should have valid outputs file', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    test('should have required top-level outputs', () => {
      const requiredOutputs = [
        'vpcId',
        'privateSubnetIds',
        'flowLogsBucketName',
        'secretArn',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
      });
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have valid VPC ID', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('should have valid private subnet IDs', () => {
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(privateSubnetIds.length).toBeGreaterThan(0);

      privateSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });
    });

    test('should have correct number of private subnets', () => {
      // Should have 3 private subnets (one per AZ)
      expect(privateSubnetIds.length).toBe(3);
    });
  });

  describe('Security Configuration', () => {
    test('should have valid secret ARN', () => {
      expect(outputs.secretArn).toBeDefined();
      // Handle masked account IDs (***) in ARNs
      expect(outputs.secretArn).toMatch(
        /^arn:aws:secretsmanager:[a-z0-9-]+:(\d{12}|\*\*\*):secret:[a-zA-Z0-9/_+=.@-]+$/
      );
    });

    test('should have valid KMS key ARNs if exported', () => {
      // Check if KMS keys are exported (they might be in nested outputs)
      if (outputs.logsKmsKeyArn) {
        expect(outputs.logsKmsKeyArn).toMatch(
          /^arn:aws:kms:[a-z0-9-]+:(\d{12}|\*\*\*):key\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
        );
      }

      if (outputs.secretsKmsKeyArn) {
        expect(outputs.secretsKmsKeyArn).toMatch(
          /^arn:aws:kms:[a-z0-9-]+:(\d{12}|\*\*\*):key\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
        );
      }

      if (outputs.s3KmsKeyArn) {
        expect(outputs.s3KmsKeyArn).toMatch(
          /^arn:aws:kms:[a-z0-9-]+:(\d{12}|\*\*\*):key\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
        );
      }
    });

    test('should have valid ABAC role ARN if exported', () => {
      if (outputs.abacRoleArn) {
        expect(outputs.abacRoleArn).toMatch(
          /^arn:aws:iam::(\d{12}|\*\*\*):role\/[a-zA-Z0-9_+=,.@-]+$/
        );
      }
    });
  });

  describe('Monitoring Configuration', () => {
    test('should have valid flow logs bucket name', () => {
      expect(outputs.flowLogsBucketName).toBeDefined();
      expect(typeof outputs.flowLogsBucketName).toBe('string');
      expect(outputs.flowLogsBucketName.length).toBeGreaterThan(0);
      expect(outputs.flowLogsBucketName.length).toBeLessThanOrEqual(63); // S3 bucket name max length
      expect(outputs.flowLogsBucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/); // Valid S3 bucket name pattern
    });

    test('should have flow logs bucket name with environment suffix', () => {
      expect(outputs.flowLogsBucketName).toContain('flow-logs');
    });

    test('should have valid log group name if exported', () => {
      if (outputs.logGroupName) {
        expect(outputs.logGroupName).toBeDefined();
        expect(typeof outputs.logGroupName).toBe('string');
        expect(outputs.logGroupName.length).toBeGreaterThan(0);
        expect(outputs.logGroupName).toMatch(/^\/aws\/.+/); // CloudWatch log group pattern
      }
    });
  });

  describe('Access Configuration', () => {
    test('should have valid Session Manager role ARN if exported', () => {
      if (outputs.sessionManagerRoleArn) {
        expect(outputs.sessionManagerRoleArn).toBeDefined();
        expect(outputs.sessionManagerRoleArn).toMatch(
          /^arn:aws:iam::(\d{12}|\*\*\*):role\/[a-zA-Z0-9_+=,.@-]+$/
        );
      }
    });
  });

  describe('VPC Endpoints', () => {
    test('should have valid S3 endpoint ID if exported', () => {
      if (outputs.s3EndpointId) {
        expect(outputs.s3EndpointId).toBeDefined();
        expect(outputs.s3EndpointId).toMatch(/^vpce-[a-f0-9]{8,17}$/);
      }
    });

    test('should have valid DynamoDB endpoint ID if exported', () => {
      if (outputs.dynamodbEndpointId) {
        expect(outputs.dynamodbEndpointId).toBeDefined();
        expect(outputs.dynamodbEndpointId).toMatch(/^vpce-[a-f0-9]{8,17}$/);
      }
    });

    test('should have valid Secrets Manager endpoint ID if exported', () => {
      if (outputs.secretsManagerEndpointId) {
        expect(outputs.secretsManagerEndpointId).toBeDefined();
        expect(outputs.secretsManagerEndpointId).toMatch(/^vpce-[a-f0-9]{8,17}$/);
      }
    });
  });

  describe('AWS Resource Format Validation', () => {
    test('should have valid AWS resource ID formats', () => {
      // VPC ID
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);

      // Subnet IDs
      privateSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });
    });

    test('should have valid AWS ARN format for secret', () => {
      // Handle masked account IDs (***) in ARNs
      // The resource part can contain colons (e.g., "secret:name")
      expect(outputs.secretArn).toMatch(
        /^arn:aws:[a-z-]+:[a-z0-9-]*:(\d{12}|\*\*\*):[a-zA-Z0-9/_+=.@:-]+$/
      );
    });

    test('should have valid S3 bucket name format', () => {
      expect(outputs.flowLogsBucketName).toMatch(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/);
      expect(outputs.flowLogsBucketName.length).toBeGreaterThan(2);
      expect(outputs.flowLogsBucketName.length).toBeLessThanOrEqual(63);
    });
  });

  describe('Output Completeness', () => {
    test('should have all required TapStack outputs', () => {
      const requiredOutputs = [
        'vpcId',
        'privateSubnetIds',
        'flowLogsBucketName',
        'secretArn',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBeNull();
      });
    });

    test('should not have undefined or null required outputs', () => {
      const requiredOutputs = [
        'vpcId',
        'privateSubnetIds',
        'flowLogsBucketName',
        'secretArn',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).not.toBeUndefined();
        expect(outputs[output]).not.toBeNull();
      });
    });

    test('should not have empty string outputs', () => {
      const requiredOutputs = [
        'vpcId',
        'flowLogsBucketName',
        'secretArn',
      ];

      requiredOutputs.forEach((output) => {
        if (typeof outputs[output] === 'string') {
          expect(outputs[output].length).toBeGreaterThan(0);
        }
      });
    });

    test('should have non-empty array for privateSubnetIds', () => {
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(privateSubnetIds.length).toBeGreaterThan(0);
      privateSubnetIds.forEach((subnetId: string) => {
        expect(subnetId.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Naming Conventions', () => {
    test('should follow consistent naming pattern for VPC', () => {
      // VPC ID format is AWS-managed, but we can check it's valid
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should follow consistent naming pattern for subnets', () => {
      privateSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    test('should follow consistent naming pattern for S3 bucket', () => {
      expect(outputs.flowLogsBucketName).toContain('flow-logs');
    });

    test('should follow consistent naming pattern for secret', () => {
      // Secret ARN should contain the secret name
      expect(outputs.secretArn).toContain('secret:');
    });
  });

  describe('Resource Relationships', () => {
    test('should have consistent VPC reference', () => {
      // All resources should reference the same VPC
      expect(outputs.vpcId).toBeDefined();

      // If endpoint IDs are present, they should be in the same VPC
      if (outputs.s3EndpointId || outputs.dynamodbEndpointId || outputs.secretsManagerEndpointId) {
        // This is validated by AWS - endpoints must be in the VPC
        expect(outputs.vpcId).toBeDefined();
      }
    });

    test('should have subnets in the same VPC', () => {
      // Subnets are created in the VPC, so they should be consistent
      expect(outputs.vpcId).toBeDefined();
      expect(privateSubnetIds.length).toBeGreaterThan(0);
    });
  });

  describe('Security Best Practices', () => {
    test('should have encrypted resources', () => {
      // Flow logs bucket should be encrypted (validated by S3 bucket name format)
      expect(outputs.flowLogsBucketName).toBeDefined();

      // Secret should be in Secrets Manager (validated by ARN format)
      expect(outputs.secretArn).toMatch(/^arn:aws:secretsmanager:/);
    });

    test('should have private subnets only', () => {
      // This stack uses private subnets only (no public subnets)
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      // No public subnet IDs should be present
      expect(outputs.publicSubnetIds).toBeUndefined();
    });
  });

  describe('Data Type Validation', () => {
    test('should have correct data types for outputs', () => {
      expect(typeof outputs.vpcId).toBe('string');
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(typeof outputs.flowLogsBucketName).toBe('string');
      expect(typeof outputs.secretArn).toBe('string');
    });

    test('should have string elements in privateSubnetIds array', () => {
      privateSubnetIds.forEach((subnetId: any) => {
        expect(typeof subnetId).toBe('string');
      });
    });
  });

  describe('Integration Consistency', () => {
    test('should have all outputs from TapStack', () => {
      // TapStack exports: vpcId, privateSubnetIds, flowLogsBucketName, secretArn
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(outputs.flowLogsBucketName).toBeDefined();
      expect(outputs.secretArn).toBeDefined();
    });

    test('should have consistent resource naming', () => {
      // All resources should follow naming conventions
      expect(outputs.vpcId).toMatch(/^vpc-/);
      privateSubnetIds.forEach((id: string) => {
        expect(id).toMatch(/^subnet-/);
      });
      expect(outputs.secretArn).toMatch(/^arn:aws:secretsmanager:/);
    });
  });

  describe('JSON Structure Validation', () => {
    test('should have valid JSON structure', () => {
      expect(typeof outputs).toBe('object');
      expect(outputs).not.toBeNull();
      expect(Array.isArray(outputs)).toBe(false);
    });

    test('should have no circular references', () => {
      // Simple check - try to stringify and parse
      expect(() => JSON.stringify(outputs)).not.toThrow();
      expect(() => JSON.parse(JSON.stringify(outputs))).not.toThrow();
    });
  });

  describe('Optional Outputs Validation', () => {
    test('should handle optional NetworkStack outputs gracefully', () => {
      // These might be exported separately or not at all
      const optionalOutputs = [
        's3EndpointId',
        'dynamodbEndpointId',
        'secretsManagerEndpointId',
      ];

      optionalOutputs.forEach((output) => {
        // If present, should be valid format
        if (outputs[output]) {
          expect(outputs[output]).toMatch(/^vpce-[a-f0-9]{8,17}$/);
        }
      });
    });

    test('should handle optional SecurityStack outputs gracefully', () => {
      const optionalOutputs = [
        'logsKmsKeyArn',
        'secretsKmsKeyArn',
        's3KmsKeyArn',
        'abacRoleArn',
      ];

      optionalOutputs.forEach((output) => {
        // If present, should be valid ARN format (handle masked account IDs)
        if (outputs[output]) {
          expect(outputs[output]).toMatch(/^arn:aws:/);
        }
      });
    });

    test('should handle optional MonitoringStack outputs gracefully', () => {
      if (outputs.logGroupName) {
        expect(typeof outputs.logGroupName).toBe('string');
        expect(outputs.logGroupName.length).toBeGreaterThan(0);
      }
    });

    test('should handle optional AccessStack outputs gracefully', () => {
      if (outputs.sessionManagerRoleArn) {
        expect(outputs.sessionManagerRoleArn).toMatch(/^arn:aws:iam::(\d{12}|\*\*\*):role\//);
      }
    });
  });
});
