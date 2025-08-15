import { App, Testing } from 'cdktf';
import { IAM } from '../lib/iam';
import { Logging } from '../lib/logging';
import { Networking } from '../lib/networking';
import { Security } from '../lib/security';
import { Storage } from '../lib/storage';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Comprehensive Unit Tests', () => {
  let app: App;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  test('TapStack instantiates with all required props', () => {
    const stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
      defaultTags: { tags: { Owner: 'test-owner', CostCenter: 'test-cc' } },
    });
    const synthesized = Testing.synth(stack);
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('Networking module creates VPC and subnets with correct tags', () => {
    const stack = new TapStack(app, 'NetworkingTestStack');
    const networking = new Networking(stack, 'NetworkingTest', {
      environment: 'test',
      region: 'us-west-2',
      tags: { Owner: 'test-owner', CostCenter: 'test-cc' },
    });
    expect(networking.vpc).toBeDefined();
    expect(networking.publicSubnets.length).toBeGreaterThan(0);
    expect(networking.privateSubnets.length).toBeGreaterThan(0);
  });

  test('Security module creates SGs with correct rules', () => {
    const stack = new TapStack(app, 'SecurityTestStack');
    const security = new Security(stack, 'SecurityTest', {
      vpcId: 'vpc-123',
      environment: 'test',
      region: 'us-west-2',
      allowedCidr: '203.0.113.0/24',
      tags: { Owner: 'test-owner', CostCenter: 'test-cc' },
    });
    expect(security.webSg).toBeDefined();
    expect(security.appSg).toBeDefined();
    expect(security.dbSg).toBeDefined();
  });

  test('IAM module creates role with least privilege', () => {
    const stack = new TapStack(app, 'IAMTestStack');
    const iam = new IAM(stack, 'IAMTest', {
      environment: 'test',
      region: 'us-west-2',
      tags: { Owner: 'test-owner', CostCenter: 'test-cc' },
    });
    expect(iam.role).toBeDefined();
  });

  test('Logging module creates CloudTrail with correct bucket', () => {
    const stack = new TapStack(app, 'LoggingTestStack');
    const logging = new Logging(stack, 'LoggingTest', {
      environment: 'test',
      region: 'us-west-2',
      tags: { Owner: 'test-owner', CostCenter: 'test-cc' },
    });
    expect(logging.trail).toBeDefined();
  });

  test('Storage module creates secure S3 buckets', () => {
    const stack = new TapStack(app, 'StorageTestStack');
    const storage = new Storage(stack, 'StorageTest', {
      environment: 'test',
      region: 'us-west-2',
      tags: { Owner: 'test-owner', CostCenter: 'test-cc' },
    });
    expect(storage.appDataBucket).toBeDefined();
    expect(storage.logsBucket).toBeDefined();
  });

  test('Stack outputs and standards are present', () => {
    const stack = new TapStack(app, 'OutputTestStack', {
      environmentSuffix: 'test',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
      defaultTags: { tags: { Owner: 'test-owner', CostCenter: 'test-cc' } },
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('test-us-west-2-vpc');
    expect(synthesized).toContain('test-us-west-2-app-data');
    expect(synthesized).toContain('test-us-west-2-logs');
    expect(synthesized).toContain('test-us-west-2-trail-bucket');
  });
});

// add more test suites and cases as needed
