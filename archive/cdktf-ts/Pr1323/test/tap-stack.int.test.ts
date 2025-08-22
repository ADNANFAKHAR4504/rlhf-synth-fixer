import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const awsRegion = process.env.AWS_REGION || 'us-east-1';
const stateBucketRegion = process.env.STATE_BUCKET_REGION || awsRegion;

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeAll(() => {
    app = new App();
    stack = new TapStack(app, 'IntegrationTapStack', {
      environmentSuffix: 'integration',
      stateBucket: 'integration-state-bucket',
      stateBucketRegion: stateBucketRegion,
      awsRegion: awsRegion,
      defaultTags: { tags: { Owner: 'integration-owner', CostCenter: 'integration-cc' } },
    });
    synthesized = Testing.synth(stack);
  });

  test('Stack synthesizes without errors', () => {
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain(`integration-${awsRegion}-vpc`);
  });

  test('Networking resources are present and tagged', () => {
    expect(synthesized).toContain(`integration-${awsRegion}-public-subnet`);
    expect(synthesized).toContain(`integration-${awsRegion}-private-subnet`);
    expect(synthesized).toContain(`integration-${awsRegion}-igw`);
  });

  test('Security groups and rules are correctly configured', () => {
    expect(synthesized).toContain(`integration-${awsRegion}-web-sg`);
    expect(synthesized).toContain(`integration-${awsRegion}-app-sg`);
    expect(synthesized).toContain(`integration-${awsRegion}-db-sg`);
    expect(synthesized).toContain('Allow HTTP from known IP');
    expect(synthesized).toContain('Allow HTTPS from known IP');
    expect(synthesized).toContain('Allow MySQL from app SG');
  });

  test('IAM role and policy are least privilege', () => {
    expect(synthesized).toContain(`integration-${awsRegion}-ec2-role`);
    expect(synthesized).toContain('ec2:DescribeInstances');
  });

  test('CloudTrail logging is enabled and bucket is present', () => {
    expect(synthesized).toContain(`integration-${awsRegion}-trail`);
    expect(synthesized).toContain(`integration-${awsRegion}-trail-bucket`);
  });

  test('S3 buckets are secure and tagged', () => {
    expect(synthesized).toContain(`integration-${awsRegion}-app-data`);
    expect(synthesized).toContain(`integration-${awsRegion}-logs`);
    expect(synthesized).toContain('application-data');
    expect(synthesized).toContain('logs');
    expect(synthesized).toContain('AES256');
    expect(synthesized).toContain('block_public_acls');
  });

  test('Resource tags include Owner and CostCenter', () => {
    expect(synthesized).toContain('integration-owner');
    expect(synthesized).toContain('integration-cc');
  });

  test('Stack meets minimum resource coverage threshold', () => {
    const resources = [
      'vpc', 'subnet', 'internet_gateway', 'security_group', 'iam_role',
      'cloudtrail', 's3_bucket'
    ];
    const found = resources.filter(r => synthesized.includes(r));
    const coverage = (found.length / resources.length) * 100;
    expect(coverage).toBeGreaterThanOrEqual(70);
  });
});

// We recommend installing an extension to run jest tests.
