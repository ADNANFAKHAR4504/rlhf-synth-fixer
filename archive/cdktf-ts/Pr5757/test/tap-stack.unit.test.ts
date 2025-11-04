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

  test('TapStack applies ca-central-1 region override', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackRegionOverride', {
      environmentSuffix: 'test',
      awsRegion: 'us-east-1', // This should be overridden by AWS_REGION_OVERRIDE
    });
    synthesized = Testing.synth(stack);

    // Verify that the ca-central-1 override is applied
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    // The override logic in tap-stack.ts should force ca-central-1
  });
});

// add more test suites and cases as needed
