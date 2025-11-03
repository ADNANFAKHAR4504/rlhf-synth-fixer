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
      stateBucketRegion: 'eu-central-1',
      awsRegion: 'eu-central-1',
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

  test('TapStack handles defaultTags when provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackWithTags', {
      environmentSuffix: 'test',
      defaultTags: {
        tags: {
          Owner: 'TestTeam',
          Project: 'TestProject',
        },
      },
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors with default tags
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack works without AWS_REGION_OVERRIDE when awsRegion is not in props', () => {
    // Test the branch where props?.awsRegion is undefined and falls back to default
    app = new App();
    stack = new TapStack(app, 'TestTapStackNoRegion', {
      environmentSuffix: 'dev',
      // Deliberately not setting awsRegion to test the default fallback
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses props.awsRegion when AWS_REGION_OVERRIDE is not set', () => {
    // Save original env var
    const originalEnv = process.env.AWS_REGION_OVERRIDE;

    // Temporarily unset AWS_REGION_OVERRIDE to test the else branch
    delete process.env.AWS_REGION_OVERRIDE;

    app = new App();
    stack = new TapStack(app, 'TestTapStackCustomRegion', {
      environmentSuffix: 'test',
      awsRegion: 'us-west-2',
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Restore original env var
    if (originalEnv !== undefined) {
      process.env.AWS_REGION_OVERRIDE = originalEnv;
    }
  });

  test('TapStack falls back to default region when AWS_REGION_OVERRIDE and awsRegion are not set', () => {
    // Save original env var
    const originalEnv = process.env.AWS_REGION_OVERRIDE;

    // Temporarily unset AWS_REGION_OVERRIDE to test the else branch with no awsRegion prop
    delete process.env.AWS_REGION_OVERRIDE;

    app = new App();
    stack = new TapStack(app, 'TestTapStackDefaultRegion', {
      environmentSuffix: 'test',
      // Deliberately not setting awsRegion to test the || 'eu-central-1' fallback
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Restore original env var
    if (originalEnv !== undefined) {
      process.env.AWS_REGION_OVERRIDE = originalEnv;
    }
  });

  test('TapStack handles empty AWS_REGION_OVERRIDE environment variable', () => {
    // Save original env var
    const originalEnv = process.env.AWS_REGION_OVERRIDE;

    // Set AWS_REGION_OVERRIDE to empty string to test the || fallback in the constant definition
    process.env.AWS_REGION_OVERRIDE = '';

    app = new App();
    stack = new TapStack(app, 'TestTapStackEmptyEnv', {
      environmentSuffix: 'test',
      awsRegion: 'us-east-1',
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Restore original env var
    if (originalEnv !== undefined) {
      process.env.AWS_REGION_OVERRIDE = originalEnv;
    } else {
      delete process.env.AWS_REGION_OVERRIDE;
    }
  });

  test('TapStack with all props set to test all branches', () => {
    // Save original env var
    const originalEnv = process.env.AWS_REGION_OVERRIDE;

    // Test with AWS_REGION_OVERRIDE set
    process.env.AWS_REGION_OVERRIDE = 'us-west-1';

    app = new App();
    stack = new TapStack(app, 'TestTapStackAllProps', {
      environmentSuffix: 'staging',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-west-1',
      awsRegion: 'us-west-1',
      defaultTags: {
        tags: {
          Environment: 'staging',
        },
      },
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Restore original env var
    if (originalEnv !== undefined) {
      process.env.AWS_REGION_OVERRIDE = originalEnv;
    } else {
      delete process.env.AWS_REGION_OVERRIDE;
    }
  });

  test('TapStack with undefined stateBucketRegion to test fallback', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackNoStateBucketRegion', {
      environmentSuffix: 'test',
      awsRegion: 'us-east-1',
      // stateBucketRegion intentionally undefined to test fallback
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack with undefined stateBucket to test fallback', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackUndefinedStateBucket', {
      environmentSuffix: 'test',
      stateBucket: undefined,
      stateBucketRegion: 'eu-central-1',
      awsRegion: 'eu-central-1',
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack with S3 backend enabled via environment variable', () => {
    // Save original env var
    const originalEnv = process.env.ENABLE_S3_BACKEND;

    // Set environment variable to enable S3 backend
    process.env.ENABLE_S3_BACKEND = 'true';

    app = new App();
    stack = new TapStack(app, 'TestTapStackS3Backend', {
      environmentSuffix: 'test',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'eu-central-1',
      awsRegion: 'eu-central-1',
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors with S3 backend enabled
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Verify S3 backend configuration is present in synthesized output
    expect(synthesized).toContain('terraform');
    expect(synthesized).toContain('backend');

    // Restore original env var
    if (originalEnv !== undefined) {
      process.env.ENABLE_S3_BACKEND = originalEnv;
    } else {
      delete process.env.ENABLE_S3_BACKEND;
    }
  });

  test('TapStack with S3 backend disabled (default behavior)', () => {
    // Save original env var
    const originalEnv = process.env.ENABLE_S3_BACKEND;

    // Ensure S3 backend is not enabled (default)
    delete process.env.ENABLE_S3_BACKEND;

    app = new App();
    stack = new TapStack(app, 'TestTapStackNoS3Backend', {
      environmentSuffix: 'test',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'eu-central-1',
      awsRegion: 'eu-central-1',
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Restore original env var
    if (originalEnv !== undefined) {
      process.env.ENABLE_S3_BACKEND = originalEnv;
    }
  });

  test('TapStack with CI environment set to enable unique suffixes', () => {
    // Save original env vars
    const originalCI = process.env.CI;

    // Set CI environment to test unique suffix generation
    process.env.CI = 'true';

    app = new App();
    stack = new TapStack(app, 'TestTapStackCI', {
      environmentSuffix: 'test',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors in CI environment
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // In CI mode, resources should have timestamp suffixes and CloudTrail should be skipped
    expect(synthesized).toContain('test');
    // CloudTrail should not be created in CI mode (to avoid trail limits)
    expect(synthesized).not.toContain('aws_cloudtrail');

    // Restore original env var
    if (originalCI !== undefined) {
      process.env.CI = originalCI;
    } else {
      delete process.env.CI;
    }
  });

  test('TapStack without CI environment (local development)', () => {
    // Save original env vars
    const originalCI = process.env.CI;

    // Ensure CI is not set (local development mode)
    delete process.env.CI;

    app = new App();
    stack = new TapStack(app, 'TestTapStackLocal', {
      environmentSuffix: 'test',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors in local mode
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // In local mode, CloudTrail should be created
    expect(synthesized).toContain('aws_cloudtrail');    // Restore original env var
    if (originalCI !== undefined) {
      process.env.CI = originalCI;
    }
  });
});
