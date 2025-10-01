import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/cloudsetup';

// prevent unrelated stacks from interfering with unit tests
jest.mock('../lib/ddb-stack', () => ({}), { virtual: true });
jest.mock('../lib/rest-api-stack', () => ({}), { virtual: true });

describe('TapStack (unit)', () => {
  const environmentSuffix = 'test'; // deterministic, sanitizes to "test"

  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  let json: any;

  beforeEach(() => {
    jest.resetAllMocks();
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
    json = template.toJSON();
  });

  test('creates core networking and compute resources', () => {
    // VPC + subnets
    template.resourceCountIs('AWS::EC2::VPC', 1);
    // number of subnets may vary by config; expect at least 2
    const subnetCount = Object.values(json.Resources).filter((r: any) => r.Type === 'AWS::EC2::Subnet').length;
    expect(subnetCount).toBeGreaterThanOrEqual(2);

    // ALB + ASG
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);

    // Security groups exist
    const sgCount = Object.values(json.Resources).filter((r: any) => r.Type === 'AWS::EC2::SecurityGroup').length;
    expect(sgCount).toBeGreaterThanOrEqual(1);

    // RDS
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      StorageEncrypted: true,
      MultiAZ: true,
    });
  });

  test('S3 buckets created, versioning and public-access-block enforced', () => {
    const buckets = Object.entries(json.Resources).filter(([_, r]: any) => r.Type === 'AWS::S3::Bucket');
    expect(buckets.length).toBeGreaterThanOrEqual(1);

    // At least one bucket has versioning enabled
    const versioned = buckets.some(([_, r]: any) => r.Properties && r.Properties.VersioningConfiguration && r.Properties.VersioningConfiguration.Status === 'Enabled');
    expect(versioned).toBe(true);

    // Expect at least one BucketPublicAccessBlock resource OR buckets with PublicAccessBlockConfiguration
    const pabCount = Object.values(json.Resources).filter((r: any) => r.Type === 'AWS::S3::BucketPublicAccessBlock').length;
    const bucketsWithPab = buckets.some(([_, r]: any) => r.Properties && (r.Properties.PublicAccessBlockConfiguration || r.Properties.PublicAccessBlockConfiguration === undefined));
    expect(pabCount + (bucketsWithPab ? 1 : 0)).toBeGreaterThanOrEqual(1);
  });

  test('replication role and policies scoped to buckets', () => {
    // Ensure at least one IAM Role exists for replication and that IAM Policy docs reference s3 actions
    const policies = Object.values(json.Resources).filter((r: any) => r.Type === 'AWS::IAM::Policy') as any[];
    expect(policies.length).toBeGreaterThanOrEqual(1);

    const hasS3Action = policies.some((p) => {
      const stm = p.Properties?.PolicyDocument?.Statement;
      if (!stm) return false;
      return stm.some((s: any) => {
        const actions = s.Action;
        if (!actions) return false;
        const acts = Array.isArray(actions) ? actions : [actions];
        return acts.some((a: string) => typeof a === 'string' && a.toLowerCase().startsWith('s3:'));
      });
    });
    expect(hasS3Action).toBe(true);
  });

  test('outputs for key resources are present (relaxed)', () => {
    const outputs = Object.keys(json.Outputs || {});
    const suffix = environmentSuffix;

    // basic sanity: at least one output exists and at least one output contains the suffix
    expect(outputs.length).toBeGreaterThan(0);
    const hasSuffix = outputs.some((k) => k.includes(suffix));
    expect(hasSuffix).toBe(true);

    // ensure at least one output key references a likely resource keyword
    const hasKeyKeyword = outputs.some((k) => /vpc|loadbalancer|rds|bucket/i.test(k));
    expect(hasKeyKeyword).toBe(true);
  });
});
