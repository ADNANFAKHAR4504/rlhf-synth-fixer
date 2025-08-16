import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import { getEnvironmentConfig } from '../lib/config/environment';

describe('TAP Stack Integration Tests', () => {
  let config: ReturnType<typeof getEnvironmentConfig>;
  let app: any;
  let stack: TapStack;
  let synthesized: string;
  let parsed: any;

  beforeAll(() => {
    // Set environment suffix for integration tests
    process.env.ENVIRONMENT_SUFFIX = 'int-test';

    config = getEnvironmentConfig('dev');
    app = Testing.app();
    stack = new TapStack(app, 'integration-test-stack', {
      region: 'us-east-1',
      environmentSuffix: 'int-test',
      crossAccountId: '123456789012',
    });
    synthesized = Testing.synth(stack);
    parsed = JSON.parse(synthesized);
  });

  describe('Core Infrastructure Validation', () => {
    test('should create VPC with correct configuration', () => {
      const vpcs = parsed.resource?.aws_vpc || {};
      const vpc = Object.values(vpcs)[0] as any;

      expect(vpc).toBeDefined();
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
      expect(vpc.tags.Name).toBe('prod-int-test-vpc-us-east-1');
    });

    test('should create subnets across multiple AZs', () => {
      const subnets = parsed.resource?.aws_subnet || {};
      const subnetArray = Object.values(subnets);

      expect(subnetArray.length).toBeGreaterThan(1);

      const uniqueAZs = new Set(
        subnetArray.map((s: any) => s.availability_zone)
      );
      expect(uniqueAZs.size).toBeGreaterThan(1);
    });
  });

  describe('Storage Configuration', () => {
    test('should create S3 bucket with correct settings', () => {
      const buckets = parsed.resource?.aws_s3_bucket || {};
      const bucket = Object.values(buckets)[0] as any;

      expect(bucket).toBeDefined();
      expect(bucket.bucket).toMatch(/prod-int-test-storage-us-east-1/);
      expect(bucket.force_destroy).toBe(true);
    });

    test('should configure S3 bucket lifecycle policies', () => {
      const lifecycleConfigs =
        parsed.resource?.aws_s3_bucket_lifecycle_configuration || {};
      const config = Object.values(lifecycleConfigs)[0] as any;

      expect(config).toBeDefined();
      expect(config.rule.length).toBeGreaterThan(0);

      const ruleIds = config.rule.map((r: any) => r.id);
      expect(ruleIds).toContain('transition-to-ia');
    });

    test('should enable versioning and block public access', () => {
      const versioning = parsed.resource?.aws_s3_bucket_versioning || {};
      const publicAccess =
        parsed.resource?.aws_s3_bucket_public_access_block || {};

      expect(Object.keys(versioning).length).toBe(1);
      expect(Object.keys(publicAccess).length).toBe(1);

      const versioningConfig = Object.values(versioning)[0] as any;
      expect(versioningConfig.versioning_configuration.status).toBe('Enabled');

      const publicAccessConfig = Object.values(publicAccess)[0] as any;
      expect(publicAccessConfig.block_public_acls).toBe(true);
    });
  });

  describe('IAM Configuration', () => {
    test('should create cross-account IAM role', () => {
      const roles = parsed.resource?.aws_iam_role || {};
      const crossAccountRole = Object.values(roles).find((r: any) =>
        r.name.includes('cross-account-role')
      ) as any;

      expect(crossAccountRole).toBeDefined();
      expect(crossAccountRole.assume_role_policy).toContain('123456789012');
    });

    test('should create necessary IAM policies', () => {
      const policies = parsed.resource?.aws_iam_role_policy || {};
      expect(Object.keys(policies).length).toBeGreaterThan(0);
    });
  });

  describe('Networking Security', () => {
    test('should create security groups with proper rules', () => {
      const securityGroups = parsed.resource?.aws_security_group || {};
      const sg = Object.values(securityGroups)[0] as any;

      expect(sg).toBeDefined();
      expect(sg.ingress.length).toBeGreaterThan(0);
      expect(sg.egress.length).toBeGreaterThan(0);
    });

    test('should create network ACLs', () => {
      const nacls = parsed.resource?.aws_network_acl || {};
      expect(Object.keys(nacls).length).toBeGreaterThan(0);
    });

    test('should create internet and NAT gateways', () => {
      const igws = parsed.resource?.aws_internet_gateway || {};
      const nats = parsed.resource?.aws_nat_gateway || {};

      expect(Object.keys(igws).length).toBe(1);
      expect(Object.keys(nats).length).toBeGreaterThan(0);
    });
  });

  describe('Tagging Compliance', () => {
    test('should apply consistent tags across all resources', () => {
      const requiredTags = ['Environment', 'Project', 'ManagedBy'];

      Object.values(parsed.resource || {}).forEach((resourceType: any) => {
        Object.values(resourceType).forEach((resource: any) => {
          if (resource.tags) {
            requiredTags.forEach(tag => {
              expect(resource.tags).toHaveProperty(tag);
            });
            expect(resource.tags.ManagedBy).toBe('terraform');
            expect(resource.tags.Environment).toBe('prod-int-test');
          }
        });
      });
    });
  });
});
