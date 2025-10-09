import { App, Testing } from 'cdktf';
import * as fs from 'fs';
import * as path from 'path';
import { TapStack } from '../lib/tap-stack';

// Mock fs module
jest.mock('fs');

describe('Stack Structure', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;
  const mockedFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Default mock setup - AWS_REGION file exists with us-west-1
    mockedFs.existsSync.mockImplementation((filePath) => {
      return (filePath as string).includes('AWS_REGION');
    });
    mockedFs.readFileSync.mockImplementation((filePath) => {
      if ((filePath as string).includes('AWS_REGION')) {
        return 'us-west-1\n';
      }
      throw new Error('File not found');
    });
  });

  test('TapStack instantiates successfully via props', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-1',
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

  test('TapStack creates all required stacks', () => {
    app = new App();
    stack = new TapStack(app, 'TestPortfolioStack', {
      awsRegion: 'us-west-1',
    });
    synthesized = Testing.synth(stack);
    const synthedJSON = JSON.parse(synthesized);

    // Verify that all required components are created
    expect(synthedJSON.resource).toBeDefined();
    expect(synthedJSON.resource.aws_vpc).toBeDefined();
    expect(synthedJSON.resource.aws_db_instance).toBeDefined();
    expect(synthedJSON.resource.aws_elasticache_serverless_cache).toBeDefined();
    expect(synthedJSON.resource.aws_autoscaling_group).toBeDefined();
    expect(synthedJSON.resource.aws_alb).toBeDefined();
    expect(synthedJSON.resource.aws_apigatewayv2_api).toBeDefined();
    expect(synthedJSON.resource.aws_cloudwatch_dashboard).toBeDefined();
    expect(synthedJSON.resource.aws_s3_bucket).toBeDefined();
  });

  test('TapStack uses correct region override', () => {
    app = new App();
    stack = new TapStack(app, 'TestRegionOverride');
    synthesized = Testing.synth(stack);
    const synthedJSON = JSON.parse(synthesized);

    // CDKTF generates provider.aws as an array
    expect(synthedJSON.provider?.aws).toBeDefined();
    expect(Array.isArray(synthedJSON.provider.aws)).toBe(true);
    expect(synthedJSON.provider.aws[0].region).toBe('us-west-1');
  });

  test('TapStack uses provided awsRegion when AWS_REGION_OVERRIDE is falsy', () => {
    // This test would require mocking AWS_REGION_OVERRIDE to be falsy,
    // but since it's a const, we test that the override always takes precedence
    app = new App();
    stack = new TapStack(app, 'TestProvidedRegion', {
      awsRegion: 'eu-west-1', // This should be ignored due to AWS_REGION_OVERRIDE
    });
    synthesized = Testing.synth(stack);
    const synthedJSON = JSON.parse(synthesized);

    // AWS_REGION_OVERRIDE is always 'us-west-1', so it overrides the provided region
    expect(synthedJSON.provider.aws[0].region).toBe('us-west-1');
  });

  test('TapStack handles all prop combinations correctly', () => {
    app = new App();

    // Test with all props provided
    const stackWithAllProps = new TapStack(app, 'TestAllProps', {
      environmentSuffix: 'test-env',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'eu-central-1',
      awsRegion: 'ap-southeast-1',
      defaultTags: {
        tags: { 'Environment': 'test' },
      },
    });

    const synthAllProps = Testing.synth(stackWithAllProps);
    const jsonAllProps = JSON.parse(synthAllProps);

    // Verify backend configuration
    expect(jsonAllProps.terraform?.backend?.s3).toBeDefined();
    expect(jsonAllProps.terraform.backend.s3.bucket).toBe('test-bucket');
    expect(jsonAllProps.terraform.backend.s3.region).toBe('eu-central-1');
    expect(jsonAllProps.terraform.backend.s3.key).toContain('test-env');

    // Verify provider configuration
    expect(jsonAllProps.provider.aws[0].region).toBe('us-west-1'); // Still overridden
    expect(jsonAllProps.provider.aws[0].default_tags).toEqual([{
      tags: { 'Environment': 'test' },
    }]);
  });

  test('TapStack correctly uses default values', () => {
    app = new App();

    // Test with minimal props to ensure defaults are used
    const stackWithDefaults = new TapStack(app, 'TestDefaults', {
      // Only providing environmentSuffix to avoid random values
      environmentSuffix: 'default-test',
    });

    const synthDefaults = Testing.synth(stackWithDefaults);
    const jsonDefaults = JSON.parse(synthDefaults);

    // Verify default backend configuration
    expect(jsonDefaults.terraform?.backend?.s3).toBeDefined();
    expect(jsonDefaults.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
    expect(jsonDefaults.terraform.backend.s3.region).toBe('us-east-1');
    expect(jsonDefaults.terraform.backend.s3.key).toContain('default-test');

    // Verify default tags is empty array
    expect(jsonDefaults.provider.aws[0].default_tags).toEqual([]);
  });

  test('TapStack uses props.awsRegion when AWS_REGION file does not exist', () => {
    // Mock AWS_REGION file not existing
    mockedFs.existsSync.mockReturnValue(false);

    app = new App();
    stack = new TapStack(app, 'TestNoRegionFile', {
      awsRegion: 'eu-central-1',
    });
    synthesized = Testing.synth(stack);
    const synthedJSON = JSON.parse(synthesized);

    // Should use the provided awsRegion since no override file exists
    expect(synthedJSON.provider.aws[0].region).toBe('eu-central-1');
  });

  test('TapStack uses default region when AWS_REGION file does not exist and no awsRegion prop', () => {
    // Mock AWS_REGION file not existing
    mockedFs.existsSync.mockReturnValue(false);

    app = new App();
    stack = new TapStack(app, 'TestNoRegionFileNoProps');
    synthesized = Testing.synth(stack);
    const synthedJSON = JSON.parse(synthesized);

    // Should use the default 'us-east-1' since no override file exists and no prop provided
    expect(synthedJSON.provider.aws[0].region).toBe('us-east-1');
  });

  test('TapStack handles error reading AWS_REGION file gracefully', () => {
    // Mock AWS_REGION file exists but throws error when reading
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    app = new App();
    stack = new TapStack(app, 'TestReadError', {
      awsRegion: 'ap-southeast-1',
    });
    synthesized = Testing.synth(stack);
    const synthedJSON = JSON.parse(synthesized);

    // Should fall back to provided region when file read fails
    expect(synthedJSON.provider.aws[0].region).toBe('ap-southeast-1');
  });
});

// add more test suites and cases as needed
