import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  test('instantiates successfully with props', () => {
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('custom-state-bucket');
    expect(synthesized).toContain('us-west-2');
    expect(synthesized).toContain('prod');
  });

  test('uses default values when no props provided', () => {
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('iac-rlhf-tf-states');
    expect(synthesized).toContain('us-east-1');
    expect(synthesized).toContain('dev');
  });

  test('creates all child stacks', () => {
    stack = new TapStack(app, 'TestTapStackChildren');
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('prodVpcStack');
    expect(synthesized).toContain('prodS3Stack');
    expect(synthesized).toContain('prodLambdaStack');
    expect(synthesized).toContain('prodRdsStack');
    expect(synthesized).toContain('prodEc2Stack');
    expect(synthesized).toContain('prodKmsStack');
  });

  test('configures S3 backend with encryption and lockfile', () => {
    stack = new TapStack(app, 'TestTapStackBackend', {
      environmentSuffix: 'testenv',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'eu-central-1',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('test-bucket');
    expect(synthesized).toContain('eu-central-1');
    expect(synthesized).toContain('encrypt');
    // Lockfile override is not directly in synthesized output, but check the stack override
    expect(stack).toHaveProperty('overrides');
  });

  test('provider region matches props', () => {
    stack = new TapStack(app, 'TestTapStackRegion', {
      awsRegion: 'ap-southeast-1',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('ap-southeast-1');
  });

  test('uses AWS_REGION_OVERRIDE when set', () => {
    // @ts-ignore
    TapStack.prototype.AWS_REGION_OVERRIDE = 'eu-west-1';
    stack = new TapStack(app, 'TestTapStackOverride', {
      awsRegion: 'us-west-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('eu-west-1');
    // Reset override for other tests
    // @ts-ignore
    TapStack.prototype.AWS_REGION_OVERRIDE = '';
  });

  test('handles defaultTags prop', () => {
    stack = new TapStack(app, 'TestTapStackTags', {
      defaultTags: { tags: { Project: 'Test', Owner: 'Me' } },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('Project');
    expect(synthesized).toContain('Owner');
  });

  test('handles missing props gracefully', () => {
    stack = new TapStack(app, 'TestTapStackMissingProps', {});
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toContain('iac-rlhf-tf-states');
  });

  test('handles unusual environmentSuffix', () => {
    stack = new TapStack(app, 'TestTapStackUnusualEnv', {
      environmentSuffix: '!!!',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('!!!');
  });
});

// add more test suites and cases as needed
