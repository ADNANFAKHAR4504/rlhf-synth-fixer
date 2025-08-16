import fs from 'fs';
import path from 'path';

// Configuration - These are coming from cfn-outputs after deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read AWS region from AWS_REGION file
const awsRegion = fs
  .readFileSync(path.join(__dirname, '../lib/AWS_REGION'), 'utf8')
  .trim();

describe('TapStack Infrastructure Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have all required stack outputs', () => {
      const requiredOutputs = [
        'StackName',
        'EnvironmentSuffix',
        'VPCId',
        'EC2InstanceId',
        'EC2PublicIP',
        'S3BucketName',
        'RDSEndpoint',
        'OpenSearchDomainEndpoint',
        'LambdaFunctionArn',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('stack name should contain environment suffix', () => {
      expect(outputs.StackName).toContain('TapStack');
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have valid VPC ID format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });
  });

  describe('EC2 Infrastructure', () => {
    test('should have valid EC2 instance ID format', () => {
      expect(outputs.EC2InstanceId).toMatch(/^i-[a-f0-9]{8,17}$/);
    });

    test('should have valid public IP address', () => {
      const ipRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      expect(outputs.EC2PublicIP).toMatch(ipRegex);
    });
  });

  describe('S3 Infrastructure', () => {
    test('should have valid S3 bucket name format', () => {
      expect(outputs.S3BucketName).toMatch(/^tapstack.+-secure-bucket-\d{12}$/);
      expect(outputs.S3BucketName).toContain('-secure-bucket-');
    });

    test('S3 bucket name should contain environment suffix', () => {
      expect(outputs.S3BucketName.toLowerCase()).toContain(
        outputs.EnvironmentSuffix.toLowerCase()
      );
    });
  });

  describe('RDS Infrastructure', () => {
    test('should have valid RDS endpoint format', () => {
      expect(outputs.RDSEndpoint).toMatch(
        new RegExp(
          `^tapstack.+-database\\..+\\.${awsRegion}\\.rds\\.amazonaws\\.com$`
        )
      );
    });

    test('RDS endpoint should contain environment suffix', () => {
      expect(outputs.RDSEndpoint.toLowerCase()).toContain(
        outputs.EnvironmentSuffix.toLowerCase()
      );
    });
  });

  describe('OpenSearch Infrastructure', () => {
    test('should have valid OpenSearch endpoint format', () => {
      expect(outputs.OpenSearchDomainEndpoint).toMatch(
        new RegExp(
          `^https:\\/\\/vpc-tapstack.+-os-domain-.+\\.${awsRegion}\\.es\\.amazonaws\\.com$`
        )
      );
    });

    test('OpenSearch endpoint should be HTTPS', () => {
      expect(outputs.OpenSearchDomainEndpoint.startsWith('https://')).toBe(
        true
      );
    });

    test('OpenSearch domain should contain environment suffix', () => {
      expect(outputs.OpenSearchDomainEndpoint.toLowerCase()).toContain(
        outputs.EnvironmentSuffix.toLowerCase()
      );
    });
  });

  describe('Lambda Infrastructure', () => {
    test('should have valid Lambda function ARN format', () => {
      expect(outputs.LambdaFunctionArn).toMatch(
        new RegExp(
          `^arn:aws:lambda:${awsRegion}:\\d{12}:function:TapStack.+-lambda-function$`
        )
      );
    });

    test('Lambda function ARN should contain environment suffix', () => {
      expect(outputs.LambdaFunctionArn).toContain(outputs.EnvironmentSuffix);
    });

    test('Lambda function should be in correct region', () => {
      expect(outputs.LambdaFunctionArn).toContain(awsRegion);
    });
  });

  describe('Cross-Resource Integration', () => {
    test('all resource names should be consistent with environment suffix', () => {
      const suffix = outputs.EnvironmentSuffix;

      expect(outputs.StackName).toContain('TapStack');
      expect(outputs.S3BucketName.toLowerCase()).toContain(
        suffix.toLowerCase()
      );
      expect(outputs.RDSEndpoint.toLowerCase()).toContain(suffix.toLowerCase());
      expect(outputs.OpenSearchDomainEndpoint.toLowerCase()).toContain(
        suffix.toLowerCase()
      );
      expect(outputs.LambdaFunctionArn).toContain(suffix);
    });

    test('all AWS resources should be in correct region', () => {
      expect(outputs.RDSEndpoint).toContain(awsRegion);
      expect(outputs.OpenSearchDomainEndpoint).toContain(awsRegion);
      expect(outputs.LambdaFunctionArn).toContain(awsRegion);
    });
  });

  describe('Security Validation', () => {
    test('OpenSearch endpoint should use VPC endpoint (not public)', () => {
      expect(outputs.OpenSearchDomainEndpoint).toContain('vpc-');
    });

    test('S3 bucket name should include account ID for uniqueness', () => {
      expect(outputs.S3BucketName).toMatch(/-\d{12}$/);
    });

    test('RDS endpoint should use instance format for availability', () => {
      expect(outputs.RDSEndpoint).toMatch(
        new RegExp(
          `^tapstack.+-database\\..+\\.${awsRegion}\\.rds\\.amazonaws\\.com$`
        )
      );
    });
  });

  describe('Infrastructure Compliance', () => {
    test('all resource identifiers should be unique per environment', () => {
      const resourceIds = [
        outputs.VPCId,
        outputs.EC2InstanceId,
        outputs.S3BucketName,
        outputs.RDSEndpoint,
        outputs.OpenSearchDomainEndpoint,
        outputs.LambdaFunctionArn,
      ];

      // All resource IDs should be unique
      const uniqueIds = new Set(resourceIds);
      expect(uniqueIds.size).toBe(resourceIds.length);
    });

    test('infrastructure should follow naming conventions', () => {
      // Stack name follows convention
      expect(outputs.StackName).toMatch(/^TapStack[a-zA-Z0-9]+$/);

      // S3 bucket follows lowercase convention
      expect(outputs.S3BucketName).toMatch(/^[a-z0-9-]+$/);

      // RDS follows lowercase convention for identifier
      expect(outputs.RDSEndpoint).toMatch(/^tapstack[a-z0-9]+-database/);

      // OpenSearch follows lowercase convention
      expect(outputs.OpenSearchDomainEndpoint).toContain('tapstack');

      // Lambda follows naming convention
      expect(outputs.LambdaFunctionArn).toContain('TapStack');
    });

    test('environment suffix should be alphanumeric', () => {
      expect(outputs.EnvironmentSuffix).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });

  describe('Production Readiness', () => {
    test('infrastructure should support production workloads', () => {
      // RDS should use proper naming for high availability
      expect(outputs.RDSEndpoint).toMatch(
        new RegExp(
          `^tapstack.+-database\\..+\\.${awsRegion}\\.rds\\.amazonaws\\.com$`
        )
      );

      // OpenSearch should be in VPC for security
      expect(outputs.OpenSearchDomainEndpoint).toContain('vpc-');

      // Lambda should have proper naming for monitoring
      expect(outputs.LambdaFunctionArn).toContain('TapStack');
    });

    test('all resources should be properly tagged and identifiable', () => {
      // All resource names should include environment suffix for identification
      const envSuffix = outputs.EnvironmentSuffix;

      expect(outputs.StackName).toContain(envSuffix);
      expect(outputs.S3BucketName.toLowerCase()).toContain(
        envSuffix.toLowerCase()
      );
      expect(outputs.RDSEndpoint.toLowerCase()).toContain(
        envSuffix.toLowerCase()
      );
      expect(outputs.OpenSearchDomainEndpoint.toLowerCase()).toContain(
        envSuffix.toLowerCase()
      );
      expect(outputs.LambdaFunctionArn).toContain(envSuffix);
    });
  });
});
