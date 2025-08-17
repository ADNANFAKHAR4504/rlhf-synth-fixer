import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let stack: TapStack;
  const environmentSuffix = 'test';
  const region = 'us-east-1';

  beforeEach(() => {
    const app = Testing.app();
    stack = new TapStack(app, 'test-tap-stack', {
      region: region,
      environmentSuffix: environmentSuffix,
      crossAccountId: '123456789012', // Added crossAccountId for testing
      tags: {
        Environment: environmentSuffix,
        Repository: 'test-repo',
        Author: 'test-user',
      },
    });
  });

  describe('Stack Configuration', () => {
    it('should create a TapStack with correct configuration', () => {
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.vpcId).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.s3BucketName).toBeDefined(); // Added check for S3 bucket
    });
  });

  // ... [Previous test cases remain the same until the end] ...

  describe('S3 Resources', () => {
    it('should create S3 bucket with correct configuration', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const s3Buckets = resources.aws_s3_bucket || {};
      const bucketKeys = Object.keys(s3Buckets);

      expect(bucketKeys).toHaveLength(1);
      const bucket = s3Buckets[bucketKeys[0]];

      expect(bucket.tags.Name).toContain(
        `prod-${environmentSuffix}-storage-${region}`
      );
    });

    it('should create S3 lifecycle configuration', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const lifecycleConfigs =
        resources.aws_s3_bucket_lifecycle_configuration || {};
      expect(Object.keys(lifecycleConfigs)).toHaveLength(1);

      const lifecycle = Object.values(lifecycleConfigs)[0] as any;
      expect(lifecycle.rule[0].status).toBe('Enabled');
      expect(lifecycle.rule[0].transition[0].days).toBe(30);
      expect(lifecycle.rule[0].transition[0].storage_class).toBe('STANDARD_IA');
    });
  });

  describe('Cross-Account IAM', () => {
    it('should create cross-account IAM role when crossAccountId is provided', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const iamRoles = resources.aws_iam_role || {};
      const crossAccountRole = Object.entries(iamRoles).find(([key, _]) =>
        key.includes('cross-account-role')
      );

      expect(crossAccountRole).toBeDefined();
      const [_, roleConfig] = crossAccountRole!;
      const role = roleConfig as any;

      const assumeRolePolicy = JSON.parse(role.assume_role_policy);
      expect(assumeRolePolicy.Statement[0].Principal.AWS).toBe(
        'arn:aws:iam::123456789012:root'
      );
      expect(
        assumeRolePolicy.Statement[0].Condition.StringEquals['sts:ExternalId']
      ).toBe('secure-external-id-123');
    });

    it('should not create cross-account IAM role when crossAccountId is not provided', () => {
      const app = Testing.app();
      const noCrossAccountStack = new TapStack(app, 'no-cross-account', {
        region: 'us-east-1',
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(noCrossAccountStack);
      const resources = JSON.parse(synthesized).resource;

      const iamRoles = resources.aws_iam_role || {};
      const crossAccountRoles = Object.entries(iamRoles).filter(([key, _]) =>
        key.includes('cross-account')
      );

      expect(crossAccountRoles).toHaveLength(0);
    });
  });

  describe('Network ACLs', () => {
    it('should create public network ACL with correct rules', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const networkAcls = resources.aws_network_acl || {};
      const publicAcl = Object.entries(networkAcls).find(([key, _]) =>
        key.includes('public-nacl')
      );

      expect(publicAcl).toBeDefined();
      const [_, aclConfig] = publicAcl!;
      const acl = aclConfig as any;

      expect(acl.tags.Name).toContain(
        `prod-${environmentSuffix}-public-nacl-${region}`
      );

      const aclRules = resources.aws_network_acl_rule || {};
      const publicAclRules = Object.entries(aclRules).filter(([key, _]) =>
        key.includes('public-nacl')
      );

      expect(publicAclRules.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Lifecycle Configurations', () => {
    it('should configure ALB with ignoreChanges for name', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const albs = resources.aws_lb || {};
      const alb = Object.values(albs)[0] as any;

      expect(alb.lifecycle).toBeDefined();
      expect(alb.lifecycle.ignore_changes).toEqual(['name']);
    });

    it('should protect CloudWatch log groups from destruction', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const logGroups = resources.aws_cloudwatch_log_group || {};
      const groups = Object.values(logGroups) as any[];

      groups.forEach(group => {
        expect(group.lifecycle).toBeDefined();
        expect(group.lifecycle.prevent_destroy).toBe(true);
      });
    });

    it('should ignore changes to RDS identifier', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const rdsInstances = resources.aws_db_instance || {};
      const rds = Object.values(rdsInstances)[0] as any;

      expect(rds.lifecycle).toBeDefined();
      expect(rds.lifecycle.ignore_changes).toEqual(['identifier']);
    });
  });
});
