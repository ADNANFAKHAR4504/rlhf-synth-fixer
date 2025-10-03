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

  test('TapStack with partial props uses defaults for unspecified values', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackPartial', {
      environmentSuffix: 'qa',
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack with empty defaultTags', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackEmptyTags', {
      defaultTags: undefined,
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack with AWS_REGION_OVERRIDE', () => {
    process.env.AWS_REGION_OVERRIDE = 'eu-west-1';
    app = new App();
    stack = new TapStack(app, 'TestTapStackOverride', {
      environmentSuffix: 'test',
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Clean up
    delete process.env.AWS_REGION_OVERRIDE;
  });

  test('TapStack with valid defaultTags', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackWithTags', {
      defaultTags: {
        tags: {
          Environment: 'production',
          Team: 'DevOps',
        },
      },
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });
});

// add more test suites and cases as needed
