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

  test('TapStack configures LocalStack endpoints when AWS_ENDPOINT_URL is set', () => {
    // Set LocalStack environment variable
    process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';

    app = new App();
    stack = new TapStack(app, 'TestTapStackLocalStack');
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates with LocalStack configuration
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('http://localhost:4566');

    // Clean up
    delete process.env.AWS_ENDPOINT_URL;
  });
});

// add more test suites and cases as needed
