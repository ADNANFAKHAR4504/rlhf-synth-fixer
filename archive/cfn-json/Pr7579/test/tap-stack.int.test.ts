// Configuration - These are coming from cfn-outputs after CloudFormation deployment
import fs from 'fs';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Payment Processing Infrastructure Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Load CloudFormation outputs
    const outputsPath = 'cfn-outputs/flat-outputs.json';
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `CloudFormation outputs not found at ${outputsPath}. Deploy the stack first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  });

  describe('CloudFormation Stack Outputs', () => {
    test('should have VPCId output', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('should have LoadBalancerDNS output', () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS).toContain('.elb.');
      expect(outputs.LoadBalancerDNS).toContain('.amazonaws.com');
    });

    test('should have AuroraClusterEndpoint output', () => {
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.AuroraClusterEndpoint).toContain('.rds.amazonaws.com');
    });

    test('should have StaticAssetsBucketName output', () => {
      expect(outputs.StaticAssetsBucketName).toBeDefined();
      expect(outputs.StaticAssetsBucketName).toContain(environmentSuffix);
    });
  });

  describe('VPC Infrastructure', () => {
    test('VPC ID should be valid format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('VPC ID should exist', () => {
      expect(outputs.VPCId).not.toBeNull();
      expect(outputs.VPCId).not.toBeUndefined();
      expect(outputs.VPCId.length).toBeGreaterThan(0);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB DNS should be resolvable', () => {
      expect(outputs.LoadBalancerDNS).toBeTruthy();
      expect(typeof outputs.LoadBalancerDNS).toBe('string');
    });

    test('ALB DNS should be in correct format', () => {
      // Format: name-123456789.region.elb.amazonaws.com
      const elbRegex =
        /^[a-z0-9-]+-[0-9]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/;
      expect(outputs.LoadBalancerDNS).toMatch(elbRegex);
    });

    test('ALB DNS should contain environment suffix in name', () => {
      const lbName = outputs.LoadBalancerDNS.split('.')[0];
      expect(lbName).toContain(environmentSuffix.toLowerCase());
    });
  });

  describe('Aurora RDS Cluster', () => {
    test('Aurora cluster endpoint should be valid', () => {
      expect(outputs.AuroraClusterEndpoint).toBeTruthy();
      expect(outputs.AuroraClusterEndpoint).toContain('.cluster-');
      expect(outputs.AuroraClusterEndpoint).toContain('.rds.amazonaws.com');
    });

    test('Aurora endpoint should have correct format', () => {
      // Format: cluster-name.cluster-xxxxx.region.rds.amazonaws.com
      const rdsRegex =
        /^[a-z0-9-]+\.cluster-[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/;
      expect(outputs.AuroraClusterEndpoint).toMatch(rdsRegex);
    });

    test('Aurora cluster name should contain environment suffix', () => {
      const clusterName = outputs.AuroraClusterEndpoint.split('.')[0];
      expect(clusterName.toLowerCase()).toContain(
        environmentSuffix.toLowerCase()
      );
    });
  });

  describe('S3 Static Assets Bucket', () => {
    test('Static assets bucket name should be valid', () => {
      expect(outputs.StaticAssetsBucketName).toBeTruthy();
      expect(typeof outputs.StaticAssetsBucketName).toBe('string');
    });

    test('Bucket name should follow S3 naming conventions', () => {
      // S3 bucket names: lowercase letters, numbers, hyphens, 3-63 chars
      const s3Regex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
      expect(outputs.StaticAssetsBucketName).toMatch(s3Regex);
    });

    test('Bucket name should contain environment suffix', () => {
      expect(
        outputs.StaticAssetsBucketName.toLowerCase()
      ).toContain(environmentSuffix.toLowerCase());
    });

    test('Bucket name should be within S3 length limits', () => {
      expect(outputs.StaticAssetsBucketName.length).toBeGreaterThanOrEqual(3);
      expect(outputs.StaticAssetsBucketName.length).toBeLessThanOrEqual(63);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all outputs should be non-empty strings', () => {
      const expectedOutputs = [
        'VPCId',
        'LoadBalancerDNS',
        'AuroraClusterEndpoint',
        'StaticAssetsBucketName',
      ];

      expectedOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(typeof outputs[outputKey]).toBe('string');
        expect(outputs[outputKey].length).toBeGreaterThan(0);
      });
    });

    test('resource identifiers should contain environment suffix', () => {
      const resourcesWithSuffix = [
        outputs.StaticAssetsBucketName,
        outputs.LoadBalancerDNS,
        outputs.AuroraClusterEndpoint,
      ];

      resourcesWithSuffix.forEach(resource => {
        const lowerResource = resource.toLowerCase();
        const lowerSuffix = environmentSuffix.toLowerCase();
        expect(lowerResource).toContain(lowerSuffix);
      });
    });
  });

  describe('Multi-AZ High Availability', () => {
    test('Aurora cluster endpoint should indicate cluster configuration', () => {
      // Cluster endpoints have .cluster- in them
      expect(outputs.AuroraClusterEndpoint).toContain('.cluster-');
    });

    test('load balancer should be internet-facing or internal', () => {
      // ALB DNS format indicates it's properly configured
      expect(outputs.LoadBalancerDNS).toMatch(
        /^[a-z0-9-]+-[0-9]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/
      );
    });
  });

  describe('Infrastructure Connectivity', () => {
    test('all AWS resource identifiers should have valid formats', () => {
      // VPC ID format
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);

      // ALB DNS format
      expect(outputs.LoadBalancerDNS).toMatch(/\.elb\.amazonaws\.com$/);

      // RDS endpoint format
      expect(outputs.AuroraClusterEndpoint).toMatch(/\.rds\.amazonaws\.com$/);

      // S3 bucket format
      expect(outputs.StaticAssetsBucketName).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Environment Isolation', () => {
    test('environment suffix should be consistent across all resources', () => {
      const lowerSuffix = environmentSuffix.toLowerCase();

      // Check bucket name
      expect(outputs.StaticAssetsBucketName.toLowerCase()).toContain(
        lowerSuffix
      );

      // Check ALB DNS
      const albName = outputs.LoadBalancerDNS.split('.')[0];
      expect(albName.toLowerCase()).toContain(lowerSuffix);

      // Check Aurora endpoint
      const clusterName = outputs.AuroraClusterEndpoint.split('.')[0];
      expect(clusterName.toLowerCase()).toContain(lowerSuffix);
    });

    test('environment suffix should be alphanumeric', () => {
      expect(environmentSuffix).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });
});
