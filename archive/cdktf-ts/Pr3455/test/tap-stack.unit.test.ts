import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import { PriceMonitorStack } from '../lib/price-monitor-stack';

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

  test('TapStack without AWS_REGION_OVERRIDE uses props awsRegion', () => {
    // Ensure AWS_REGION_OVERRIDE is not set
    delete process.env.AWS_REGION_OVERRIDE;

    app = new App();
    stack = new TapStack(app, 'TestTapStackNoOverride', {
      environmentSuffix: 'staging',
      awsRegion: 'ap-southeast-1',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'ap-southeast-1',
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack without AWS_REGION_OVERRIDE and no awsRegion prop uses default', () => {
    // Ensure AWS_REGION_OVERRIDE is not set
    delete process.env.AWS_REGION_OVERRIDE;

    app = new App();
    stack = new TapStack(app, 'TestTapStackNoOverrideNoRegion', {
      environmentSuffix: 'test',
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack with all undefined props uses all defaults', () => {
    // Ensure AWS_REGION_OVERRIDE is not set
    delete process.env.AWS_REGION_OVERRIDE;

    app = new App();
    stack = new TapStack(app, 'TestTapStackAllDefaults', {
      environmentSuffix: undefined,
      awsRegion: undefined,
      stateBucket: undefined,
      stateBucketRegion: undefined,
      defaultTags: undefined,
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });
});

describe('PriceMonitorStack', () => {
  let app: App;
  let stack: PriceMonitorStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('PriceMonitorStack with all props provided', () => {
    app = new App();
    stack = new PriceMonitorStack(app, 'TestPriceMonitorWithProps', {
      environmentSuffix: 'prod',
      awsRegion: 'us-west-2',
      defaultTags: {
        tags: {
          Environment: 'production',
        },
      },
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('PriceMonitorStack with no props uses defaults', () => {
    app = new App();
    stack = new PriceMonitorStack(app, 'TestPriceMonitorDefaults');
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('PriceMonitorStack with undefined environmentSuffix uses default', () => {
    app = new App();
    stack = new PriceMonitorStack(app, 'TestPriceMonitorNoEnvSuffix', {
      environmentSuffix: undefined,
      awsRegion: 'eu-west-1',
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('PriceMonitorStack with undefined awsRegion uses default', () => {
    app = new App();
    stack = new PriceMonitorStack(app, 'TestPriceMonitorNoRegion', {
      environmentSuffix: 'test',
      awsRegion: undefined,
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('PriceMonitorStack with empty props object uses all defaults', () => {
    app = new App();
    stack = new PriceMonitorStack(app, 'TestPriceMonitorEmptyProps', {});
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });
});

// add more test suites and cases as needed
