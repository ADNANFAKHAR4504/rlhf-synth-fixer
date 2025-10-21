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

  test('TapStack handles different prop combinations correctly', () => {
    app = new App();

    // Test with minimal props
    const stack1 = new TapStack(app, 'TestMinimalProps', {
      environmentSuffix: 'test',
    });
    expect(stack1).toBeDefined();

    // Test with all props
    const stack2 = new TapStack(app, 'TestAllProps', {
      environmentSuffix: 'prod',
      stateBucket: 'my-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
      defaultTags: {
        tags: {
          Project: 'Healthcare',
          Team: 'Platform',
        },
      },
    });
    expect(stack2).toBeDefined();
  });

  test('TapStack synthesizes valid Terraform configuration', () => {
    app = new App();
    stack = new TapStack(app, 'TestSynthesis', {
      environmentSuffix: 'dev',
    });
    synthesized = Testing.synth(stack);

    // Verify key resources are present in synthesized config
    expect(synthesized).toContain('aws_vpc');
    expect(synthesized).toContain('aws_rds_cluster');
    expect(synthesized).toContain('aws_ecs_cluster');
    expect(synthesized).toContain('aws_secretsmanager_secret');
    expect(synthesized).toContain('aws_kms_key');
  });
});

// add more test suites and cases as needed
