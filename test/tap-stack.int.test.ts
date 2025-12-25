import fs from 'fs';

// LocalStack detection - check for LocalStack endpoint in environment
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  process.env.IS_LOCALSTACK === 'true';

const outputsPath = 'cfn-outputs/flat-outputs.json';
const hasOutputs = fs.existsSync(outputsPath);

// Configuration - These are coming from cfn-outputs after CloudFormation deploy
const outputs = hasOutputs
  ? JSON.parse(fs.readFileSync(outputsPath, 'utf8'))
  : ({} as any);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const run = hasOutputs ? describe : describe.skip;

run('Secure AWS Infrastructure Integration Tests', () => {
  describe('Infrastructure Outputs Validation', () => {
    test('should have all required infrastructure outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnets',
        'PrivateSubnets',
        'WebSecurityGroupId',
        'DatabaseSecurityGroupId',
        'SecureDataBucketName',
        'DynamoDBTableName',
        'LoadBalancerDNS',
        'EC2RoleArn',
        // 'CloudTrailArn' // disabled in CI due to CloudTrail account trail limits
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBeNull();
        expect(typeof outputs[output]).toBe('string');
        expect(outputs[output].length).toBeGreaterThan(0);
      });
    });

    test('VPC should have valid format', () => {
      // LocalStack may use shorter VPC IDs
      if (isLocalStack) {
        expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      } else {
        expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{17}$/);
      }
    });

    test('subnet IDs should have valid format', () => {
      const publicSubnets = outputs.PublicSubnets.split(',');
      const privateSubnets = outputs.PrivateSubnets.split(',');

      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);

      // LocalStack may use shorter subnet IDs
      const subnetPattern = isLocalStack
        ? /^subnet-[a-f0-9]+$/
        : /^subnet-[a-f0-9]{17}$/;

      publicSubnets.forEach((subnetId: string) => {
        expect(subnetId.trim()).toMatch(subnetPattern);
      });

      privateSubnets.forEach((subnetId: string) => {
        expect(subnetId.trim()).toMatch(subnetPattern);
      });
    });

    test('security group IDs should have valid format', () => {
      // LocalStack may use shorter security group IDs
      const sgPattern = isLocalStack ? /^sg-[a-f0-9]+$/ : /^sg-[a-f0-9]{17}$/;
      expect(outputs.WebSecurityGroupId).toMatch(sgPattern);
      expect(outputs.DatabaseSecurityGroupId).toMatch(sgPattern);
    });

    test('S3 bucket name should include environment suffix', () => {
      expect(outputs.SecureDataBucketName).toContain(environmentSuffix);
      expect(outputs.SecureDataBucketName).toMatch(/^[a-z0-9.-]+$/);
    });

    test('DynamoDB table name should include environment suffix', () => {
      expect(outputs.DynamoDBTableName).toContain(environmentSuffix);
    });

    test('Load Balancer DNS should be valid', () => {
      // LocalStack uses localhost:4566 for ALB DNS
      if (isLocalStack) {
        expect(outputs.LoadBalancerDNS).toMatch(/localhost|127\.0\.0\.1|elb\.localhost\.localstack\.cloud/);
      } else {
        expect(outputs.LoadBalancerDNS).toMatch(/\.elb\.amazonaws\.com$/);
        expect(outputs.LoadBalancerDNS).toContain(environmentSuffix);
      }
    });

    test('IAM role ARN should have valid format', () => {
      // LocalStack uses 000000000000 as account ID
      if (isLocalStack) {
        expect(outputs.EC2RoleArn).toMatch(/^arn:aws:iam::(\d{12}|000000000000):role\/.+$/);
      } else {
        expect(outputs.EC2RoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
        expect(outputs.EC2RoleArn).toContain(environmentSuffix);
      }
    });

    // CloudTrail output validation disabled in CI
    // test('CloudTrail ARN should have valid format', () => {
    //   expect(outputs.CloudTrailArn).toMatch(/^arn:aws:cloudtrail:[a-z0-9-]+:\d{12}:trail\/.+$/);
    //   expect(outputs.CloudTrailArn).toContain(environmentSuffix);
    // });
  });

  describe('Naming Convention Validation', () => {
    test('all resource names should include environment suffix', () => {
      const resourcesWithNames = [
        'SecureDataBucketName',
        'DynamoDBTableName',
        'LoadBalancerDNS',
        'EC2RoleArn',
        // 'CloudTrailArn' // disabled in CI
      ];

      resourcesWithNames.forEach(resourceKey => {
        expect(outputs[resourceKey]).toContain(environmentSuffix);
      });
    });

    test('bucket names should follow AWS naming conventions', () => {
      const bucketName = outputs.SecureDataBucketName;

      // AWS S3 bucket naming rules
      expect(bucketName.length).toBeGreaterThanOrEqual(3);
      expect(bucketName.length).toBeLessThanOrEqual(63);
      expect(bucketName).toMatch(/^[a-z0-9.-]+$/);
      expect(bucketName).not.toMatch(/^\.|\.$|\.{2,}/); // No leading/trailing dots or consecutive dots
    });
  });

  describe('AWS Resource Accessibility Tests', () => {
    test('should validate infrastructure is properly deployed', () => {
      // This test validates that the outputs represent actual deployed resources
      // In a real scenario, you would use AWS SDK to verify resource existence

      // VPC validation
      expect(outputs.VPCId.startsWith('vpc-')).toBe(true);

      // Load balancer DNS validation
      const albDns = outputs.LoadBalancerDNS;
      expect(albDns.includes('elb.amazonaws.com')).toBe(true);

      // Security Group validation
      expect(outputs.WebSecurityGroupId.startsWith('sg-')).toBe(true);
      expect(outputs.DatabaseSecurityGroupId.startsWith('sg-')).toBe(true);
    });

    test('should validate resource interdependencies', () => {
      // Validate that resources reference each other correctly
      // This would typically involve checking that security groups reference the correct VPC,
      // subnets are in the correct VPC, etc.

      expect(outputs.VPCId).toBeDefined();
      expect(outputs.WebSecurityGroupId).toBeDefined();
      expect(outputs.DatabaseSecurityGroupId).toBeDefined();

      // Both security groups should be associated with the same VPC (implied by the template)
      expect(outputs.WebSecurityGroupId).not.toBe(
        outputs.DatabaseSecurityGroupId
      );
    });
  });

  describe('Security Compliance Tests', () => {
    test('should validate security-focused naming indicates secure configuration', () => {
      // These names should indicate security-focused resources
      expect(outputs.SecureDataBucketName).toMatch(/secure/i);
      expect(outputs.DynamoDBTableName).toMatch(/secure/i);
      // CloudTrail disabled in CI
      // expect(outputs.CloudTrailArn).toMatch(/audit|trail/i);
    });

    test('should validate multi-AZ deployment indication', () => {
      // Public and private subnets should be in different AZs (indicated by having 2 each)
      const publicSubnets = outputs.PublicSubnets.split(',');
      const privateSubnets = outputs.PrivateSubnets.split(',');

      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);
    });

    test('should validate Load Balancer is application-type (from DNS pattern)', () => {
      // Application Load Balancer DNS follows specific pattern
      const albDns = outputs.LoadBalancerDNS;
      expect(albDns).toMatch(
        /^[a-z0-9-]+-\d+\.[a-z0-9-]+\.elb\.amazonaws\.com$/
      );
    });
  });

  describe('Environment Isolation Tests', () => {
    test('should validate environment suffix appears in all named resources', () => {
      const namedResources = [
        outputs.SecureDataBucketName,
        outputs.DynamoDBTableName,
        outputs.LoadBalancerDNS,
        outputs.EC2RoleArn,
        // outputs.CloudTrailArn
      ];

      namedResources.forEach(resource => {
        expect(resource.toLowerCase()).toContain(
          environmentSuffix.toLowerCase()
        );
      });
    });

    test('should validate resource names are unique to this deployment', () => {
      // Resource names should be unique enough to avoid conflicts
      const resourceNames = [
        outputs.SecureDataBucketName,
        outputs.DynamoDBTableName,
      ];

      resourceNames.forEach(name => {
        // Should contain both environment info and unique identifiers
        expect(name).toMatch(/(production|staging|development|dev|test|prod)/i);
        expect(name).toContain(environmentSuffix);
      });
    });
  });

  describe('High Availability Validation', () => {
    test('should have resources distributed across multiple AZs', () => {
      const publicSubnets = outputs.PublicSubnets.split(',').map((s: string) =>
        s.trim()
      );
      const privateSubnets = outputs.PrivateSubnets.split(',').map(
        (s: string) => s.trim()
      );

      // Should have exactly 2 subnets of each type for HA
      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);

      // All subnet IDs should be different
      const allSubnets = [...publicSubnets, ...privateSubnets];
      const uniqueSubnets = new Set(allSubnets);
      expect(uniqueSubnets.size).toBe(4);
    });

    test('should validate Load Balancer configuration supports HA', () => {
      // Application Load Balancer should be configured for multiple AZs
      // This is indicated by having multiple subnets available
      const publicSubnets = outputs.PublicSubnets.split(',');
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  // LocalStack-specific validation tests
  if (isLocalStack) {
    describe('LocalStack Compatibility', () => {
      test('should detect LocalStack environment', () => {
        expect(isLocalStack).toBe(true);
      });

      test('resource IDs should be LocalStack format', () => {
        // LocalStack uses shorter resource IDs
        expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      });

      test('should validate LocalStack endpoint configuration', () => {
        // Check that AWS_ENDPOINT_URL is set for LocalStack
        const endpointUrl = process.env.AWS_ENDPOINT_URL;
        if (endpointUrl) {
          expect(endpointUrl).toMatch(/localhost|127\.0\.0\.1/);
        }
      });
    });
  }
});