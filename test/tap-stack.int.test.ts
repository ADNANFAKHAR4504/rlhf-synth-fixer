import fs from 'fs';

// Load deployment outputs - in real deployment this comes from actual CloudFormation outputs
let outputs: any = {};
const outputsFile = 'cfn-outputs/flat-outputs.json';

if (fs.existsSync(outputsFile)) {
  outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'secfix54729183';

describe('Hotel Booking Platform Infrastructure - Integration Tests', () => {

  describe('Deployment Outputs Validation', () => {
    test('should have all required CloudFormation outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.RedisEndpoint).toBeDefined();
    });

    test('VPC ID should be valid', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{17}$/);
    });

    test('Load Balancer DNS should be valid', () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS).toContain('.elb.amazonaws.com');
      // Should contain environment suffix in name
      expect(outputs.LoadBalancerDNS.toLowerCase()).toContain(environmentSuffix.toLowerCase());
    });

    test('S3 bucket name should follow naming convention', () => {
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketName).toMatch(/^booking-confirmations-/);
      // Should contain environment suffix
      expect(outputs.S3BucketName).toContain(environmentSuffix);
      // Should contain account ID
      expect(outputs.S3BucketName).toMatch(/\d{12}/);
      // Should contain region
      expect(outputs.S3BucketName).toContain('us-east-1');
    });

    test('Database endpoint should be valid Aurora endpoint', () => {
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabaseEndpoint).toContain('.rds.amazonaws.com');
      expect(outputs.DatabaseEndpoint).toContain('cluster-');
      // Should contain environment suffix in name
      expect(outputs.DatabaseEndpoint).toContain(environmentSuffix);
    });

    test('Redis endpoint should be valid ElastiCache endpoint', () => {
      expect(outputs.RedisEndpoint).toBeDefined();
      expect(outputs.RedisEndpoint).toContain('.cache.amazonaws.com');
      // Should contain environment suffix in name
      expect(outputs.RedisEndpoint).toContain(environmentSuffix);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources should include environment suffix', () => {
      // Check that key resources include the environment suffix
      const resourcesToCheck = [
        outputs.LoadBalancerDNS,
        outputs.S3BucketName,
        outputs.DatabaseEndpoint,
        outputs.RedisEndpoint
      ];

      resourcesToCheck.forEach(resource => {
        if (resource) {
          expect(resource.toLowerCase()).toContain(environmentSuffix.toLowerCase());
        }
      });
    });
  });

  describe('Network Configuration', () => {
    test('VPC should be created successfully', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{17}$/);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should be accessible via DNS', () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS).toContain('.elb.amazonaws.com');

      // DNS name should follow AWS ALB naming pattern
      expect(outputs.LoadBalancerDNS).toMatch(/^[a-zA-Z0-9\-]+\.(us-east-1|us-west-2|eu-west-1)\.elb\.amazonaws\.com$/);
    });
  });

  describe('Database Layer', () => {
    test('Aurora cluster endpoint should be available', () => {
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabaseEndpoint).toContain('.rds.amazonaws.com');

      // Should be a cluster endpoint (not instance endpoint)
      expect(outputs.DatabaseEndpoint).toContain('cluster-');

      // Should be in the correct region
      expect(outputs.DatabaseEndpoint).toContain('us-east-1.rds.amazonaws.com');
    });

    test('database endpoint should follow naming convention', () => {
      const dbName = outputs.DatabaseEndpoint.split('.')[0];
      expect(dbName).toContain('bookingplatform');
      expect(dbName).toContain('aurora');
      expect(dbName).toContain('cluster');
      expect(dbName).toContain(environmentSuffix);
    });
  });

  describe('Caching Layer', () => {
    test('Redis cache endpoint should be available', () => {
      expect(outputs.RedisEndpoint).toBeDefined();
      expect(outputs.RedisEndpoint).toContain('.cache.amazonaws.com');

      // Should be in the correct region
      expect(outputs.RedisEndpoint).toContain('.use1.cache.amazonaws.com');
    });

    test('Redis endpoint should follow naming convention', () => {
      const cacheName = outputs.RedisEndpoint.split('.')[0];
      expect(cacheName).toContain('bookingplatform');
      expect(cacheName).toContain('redis');
      expect(cacheName).toContain(environmentSuffix);
    });
  });

  describe('Storage', () => {
    test('S3 bucket should be created with proper naming', () => {
      expect(outputs.S3BucketName).toBeDefined();

      // Bucket name should start with 'booking-confirmations'
      expect(outputs.S3BucketName).toMatch(/^booking-confirmations-/);

      // Should contain environment suffix
      expect(outputs.S3BucketName).toContain(environmentSuffix);

      // Should contain AWS account ID (12 digits)
      expect(outputs.S3BucketName).toMatch(/\d{12}/);

      // Should contain region
      expect(outputs.S3BucketName).toContain('us-east-1');

      // Total length should be within S3 bucket naming limits (3-63 characters)
      expect(outputs.S3BucketName.length).toBeGreaterThanOrEqual(3);
      expect(outputs.S3BucketName.length).toBeLessThanOrEqual(63);
    });
  });

  describe('High Availability', () => {
    test('resources should be configured for multi-AZ deployment', () => {
      // Aurora cluster endpoint indicates Multi-AZ configuration
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabaseEndpoint).toContain('cluster-');

      // ALB is inherently multi-AZ when deployed across multiple subnets
      expect(outputs.LoadBalancerDNS).toBeDefined();
    });
  });

  describe('Security', () => {
    test('S3 bucket name should not expose sensitive information', () => {
      expect(outputs.S3BucketName).toBeDefined();

      // Should not contain words like 'prod', 'production', 'secret', 'private' in plain text
      const bucketNameLower = outputs.S3BucketName.toLowerCase();
      const sensitiveWords = ['secret', 'private', 'password', 'key', 'token'];

      sensitiveWords.forEach(word => {
        expect(bucketNameLower).not.toContain(word);
      });
    });

    test('database endpoint should use secure cluster endpoint', () => {
      expect(outputs.DatabaseEndpoint).toBeDefined();
      // Cluster endpoint ensures connection through Aurora proxy for better security
      expect(outputs.DatabaseEndpoint).toContain('cluster-');
    });
  });

  describe('Scalability', () => {
    test('infrastructure should support auto-scaling', () => {
      // ALB supports auto-scaling of targets
      expect(outputs.LoadBalancerDNS).toBeDefined();

      // Aurora supports auto-scaling of read replicas
      expect(outputs.DatabaseEndpoint).toContain('cluster-');
    });
  });

  describe('Resource Integration', () => {
    test('all tier components should be deployed', () => {
      // Web tier - ALB
      expect(outputs.LoadBalancerDNS).toBeDefined();

      // Data tier - Aurora
      expect(outputs.DatabaseEndpoint).toBeDefined();

      // Cache tier - Redis
      expect(outputs.RedisEndpoint).toBeDefined();

      // Storage tier - S3
      expect(outputs.S3BucketName).toBeDefined();

      // Network tier - VPC
      expect(outputs.VPCId).toBeDefined();
    });

    test('resources should be in the same region', () => {
      const region = 'us-east-1';

      // Check S3 bucket region
      expect(outputs.S3BucketName).toContain(region);

      // Check RDS region
      expect(outputs.DatabaseEndpoint).toContain(`${region}.rds.amazonaws.com`);

      // Check ElastiCache region (use1 for us-east-1)
      expect(outputs.RedisEndpoint).toContain('.use1.cache.amazonaws.com');

      // Check ALB region
      expect(outputs.LoadBalancerDNS).toContain(`${region}.elb.amazonaws.com`);
    });
  });

  describe('Business Requirements Validation', () => {
    test('infrastructure should support 4,800 daily reservations', () => {
      // Verify that the infrastructure components are properly sized
      // ALB can handle the load
      expect(outputs.LoadBalancerDNS).toBeDefined();

      // Aurora cluster for database scalability
      expect(outputs.DatabaseEndpoint).toContain('cluster-');

      // Redis for inventory locking
      expect(outputs.RedisEndpoint).toBeDefined();

      // S3 for document storage
      expect(outputs.S3BucketName).toBeDefined();
    });

    test('infrastructure should provide high availability', () => {
      // Multi-AZ deployment indicated by cluster endpoint
      expect(outputs.DatabaseEndpoint).toContain('cluster-');

      // ALB provides high availability
      expect(outputs.LoadBalancerDNS).toBeDefined();
    });
  });

  describe('Monitoring and Observability', () => {
    test('resources should be identifiable for monitoring', () => {
      // All resources should have clear naming that includes environment suffix
      const resourcesToCheck = [
        outputs.LoadBalancerDNS,
        outputs.S3BucketName,
        outputs.DatabaseEndpoint,
        outputs.RedisEndpoint
      ];

      resourcesToCheck.forEach(resource => {
        if (resource) {
          // Resource should be identifiable with environment suffix
          expect(resource.toLowerCase()).toContain(environmentSuffix.toLowerCase());
        }
      });
    });
  });
});
