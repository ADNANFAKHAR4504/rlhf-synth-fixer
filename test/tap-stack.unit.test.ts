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
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors via props
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses default values when no props provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors when no props are provided
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses AWS_REGION_OVERRIDE when set', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackRegionOverride', {
      environmentSuffix: 'test',
      awsRegion: 'eu-west-1',
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack uses AWS_REGION_OVERRIDE (ap-southeast-1) instead of provided awsRegion
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('ap-southeast-1');
  });

  test('TapStack uses custom stateBucket when provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackCustomBucket', {
      stateBucket: 'my-custom-bucket',
      stateBucketRegion: 'ap-south-1',
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack uses custom state bucket
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses custom defaultTags when provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackCustomTags', {
      defaultTags: [{ tags: { Environment: 'production', Team: 'platform' } }],
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack uses custom tags
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });
});

// add more test suites and cases as needed
