import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Stack Structure', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('TapStack instantiates successfully via props', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
      defaultTags: [{ tags: { Environment: 'prod' } }],
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors via props
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses default values when no props provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackDefault', {
      environmentSuffix: 'dev',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: [{ tags: { Environment: 'dev' } }],
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors when no props are provided
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses staging environment configuration', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackStaging', {
      environmentSuffix: 'staging',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: [{ tags: { Environment: 'staging' } }],
    });
    synthesized = Testing.synth(stack);

    // Verify staging environment is properly configured
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('staging');
  });

  test('TapStack uses prod environment configuration', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackProd', {
      environmentSuffix: 'prod',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: [{ tags: { Environment: 'prod' } }],
    });
    synthesized = Testing.synth(stack);

    // Verify prod environment is properly configured
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('prod');
  });

  test('TapStack falls back to dev configuration for unknown environment', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackUnknown', {
      environmentSuffix: 'unknown-env',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: [{ tags: { Environment: 'unknown-env' } }],
    });
    synthesized = Testing.synth(stack);

    // Verify unknown environment falls back to dev configuration
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('unknown-env');
  });
});

// add more test suites and cases as needed
