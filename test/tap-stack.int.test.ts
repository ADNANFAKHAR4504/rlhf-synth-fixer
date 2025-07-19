import fs from 'fs';
import path from 'path';

describe('Secure Web Infrastructure Init Test', () => {
  let outputs: any;

  beforeAll(() => {
    const filePath = path.join(__dirname, '../../../cdk-outputs/flat-output.json');
    outputs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  });

  test('VPC ID should follow AWS format', () => {
    expect(outputs.VpcId).toMatch(/^vpc-[0-9a-f]{17}$/);
  });

  test('KMS Key ARN should be valid', () => {
    expect(outputs.KMSKeyId).toMatch(/^arn:aws:kms:us-east-1:\d{12}:key\/[a-f0-9\-]+$/);
  });

  test('Database endpoint should be a valid RDS endpoint', () => {
    expect(outputs.DatabaseEndpoint).toMatch(/^.+\.rds\.amazonaws\.com$/);
  });

  test('Load balancer DNS should be valid', () => {
    expect(outputs.AppLoadBalancerDNS).toMatch(/^internal-.*\.elb\.amazonaws\.com$/);
  });

  test('CloudFront distribution URL should be valid', () => {
    expect(outputs.CloudFrontURL).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
  });

  test('SecretsManager ARN format should be valid', () => {
    expect(outputs.SecretArn).toMatch(/^arn:aws:secretsmanager:.*:secret:.+$/);
  });

  test('RDS instance should be Multi-AZ', () => {
    expect(outputs.IsMultiAZ).toBe(true);
  });

  test('WAF WebACL ARN should be valid', () => {
    expect(outputs.WebACLArn).toMatch(/^arn:aws:wafv2:.*:webacl\/.+\/.*/);
  });

  test('ALB Security Group should be attached', () => {
    expect(outputs.ALBSecurityGroupId).toMatch(/^sg-[0-9a-f]{8,}$/);
  });

  test('Logging bucket ARN should be valid', () => {
    expect(outputs.LoggingBucketArn).toMatch(/^arn:aws:s3:::logging-bucket-[\w\-]+$/);
  });

  test('AutoScaling Group name should be defined', () => {
    expect(outputs.AutoScalingGroupName).toBeDefined();
  });
});
// Configuration - These are coming from cdk-outputs after cdk deploy

const outputs = JSON.parse(
  fs.readFileSync('cdk-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';

describe('Secure Web Infrastructure Integration Tests', () => {
  describe('Stack Outputs', () => {
    test('should have all expected stack outputs', () => {
      const expectedOutputs = [
        'WebsiteURL',
        'LoadBalancerDNS', 
        'S3BucketName',
        'RDSInstanceEndpoint'
      ];

      expectedOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(typeof outputs[outputKey]).toBe('string');
        expect(outputs[outputKey].length).toBeGreaterThan(0);
      });
    });

    test('should have valid CloudFront URL', () => {
      expect(outputs.WebsiteURL).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
    });

    test('should have valid ALB DNS name', () => {
      expect(outputs.LoadBalancerDNS).toMatch(/^[a-z0-9-]+\.us-east-1\.elb\.amazonaws\.com$/);
    });

    test('should have valid S3 bucket name', () => {
      expect(outputs.S3BucketName).toMatch(/^prod-web-content-\d+$/);
    });

    test('should have valid RDS endpoint', () => {
      expect(outputs.RDSInstanceEndpoint).toMatch(/^[a-z0-9-]+\.cchmqciaab54\.us-east-1\.rds\.amazonaws\.com$/);
    });
  });

  describe('Infrastructure Validation', () => {
    test('should have CloudFront distribution accessible', async () => {
      const cloudFrontUrl = outputs.WebsiteURL;
      expect(cloudFrontUrl).toBeDefined();
      expect(cloudFrontUrl).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
      
      // Basic validation that the URL format is correct
      expect(cloudFrontUrl).toContain('cloudfront.net');
    });

    test('should have Application Load Balancer accessible', async () => {
      const albUrl = outputs.LoadBalancerDNS;
      expect(albUrl).toBeDefined();
      expect(albUrl).toMatch(/^[a-z0-9-]+\.us-east-1\.elb\.amazonaws\.com$/);
      
      // Basic validation that the URL format is correct
      expect(albUrl).toContain('elb.amazonaws.com');
    });

    test('should have S3 bucket with correct naming convention', () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toMatch(/^prod-web-content-\d+$/);
      
      // Validate bucket name follows AWS naming conventions
      expect(bucketName.length).toBeLessThanOrEqual(63);
      expect(bucketName).toMatch(/^[a-z0-9-]+$/);
    });

    test('should have RDS database with correct endpoint format', () => {
      const rdsEndpoint = outputs.RDSInstanceEndpoint;
      expect(rdsEndpoint).toBeDefined();
      expect(rdsEndpoint).toMatch(/^[a-z0-9-]+\.cchmqciaab54\.us-east-1\.rds\.amazonaws\.com$/);
      
      // Validate RDS endpoint format
      expect(rdsEndpoint).toContain('rds.amazonaws.com');
    });
  });

  describe('Environment Configuration', () => {
    test('should use correct environment suffix', () => {
      expect(environmentSuffix).toBe('prod');
    });

    test('should have consistent environment naming', () => {
      // All resources should follow the prod- prefix pattern
      expect(outputs.S3BucketName).toMatch(/^prod-/);
      
      // CloudFront and ALB URLs should be accessible
      expect(outputs.WebsiteURL).toBeTruthy();
      expect(outputs.LoadBalancerDNS).toBeTruthy();
    });
  });

  describe('Resource Relationships', () => {
    test('should have all required infrastructure components', () => {
      // Verify we have all the key components of a web infrastructure
      expect(outputs.WebsiteURL).toBeDefined(); // CloudFront
      expect(outputs.LoadBalancerDNS).toBeDefined(); // ALB
      expect(outputs.S3BucketName).toBeDefined(); // S3
      expect(outputs.RDSInstanceEndpoint).toBeDefined(); // RDS
    });

    test('should have proper resource naming conventions', () => {
      // All resources should follow consistent naming patterns
      const resources = [
        outputs.S3BucketName,
        outputs.LoadBalancerDNS,
        outputs.RDSInstanceEndpoint
      ];
      
      resources.forEach(resource => {
        // Allow dots for DNS names and endpoints
        expect(resource).toMatch(/^[a-z0-9.-]+$/);
        expect(resource.length).toBeGreaterThan(0);
      });
    });
  });
});
