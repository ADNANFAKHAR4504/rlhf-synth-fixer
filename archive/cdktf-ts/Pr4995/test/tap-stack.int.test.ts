import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should create TapStack with all required infrastructure modules', () => {
    app = new App();
    stack = new TapStack(app, 'TapStackIntegrationTest', {
      environmentSuffix: 'integration',
      awsRegion: 'eu-west-2',
    });
    synthesized = Testing.synth(stack);

    // Verify stack is created successfully
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized.length).toBeGreaterThan(0);
  });

  test('Should configure AWS provider with correct region', () => {
    app = new App();
    stack = new TapStack(app, 'TapStackRegionTest', {
      environmentSuffix: 'test',
      awsRegion: 'eu-west-2',
    });
    synthesized = Testing.synth(stack);

    // Verify AWS provider is configured
    expect(synthesized).toContain('"provider"');
    expect(synthesized).toContain('"region": "eu-west-2"');
  });

  test('Should configure S3 backend with encryption enabled', () => {
    app = new App();
    stack = new TapStack(app, 'TapStackBackendTest', {
      environmentSuffix: 'backend-test',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'eu-west-2',
    });
    synthesized = Testing.synth(stack);

    // Verify S3 backend configuration
    expect(synthesized).toContain('"s3"');
    expect(synthesized).toContain('"encrypt": true');
  });

  test('Should create networking infrastructure components', () => {
    app = new App();
    stack = new TapStack(app, 'TapStackNetworkingTest', {
      environmentSuffix: 'network',
      awsRegion: 'eu-west-2',
    });
    synthesized = Testing.synth(stack);

    // Verify networking components are created
    expect(synthesized).toContain('aws_vpc');
    expect(synthesized).toContain('aws_subnet');
    expect(synthesized).toContain('aws_security_group');
  });

  test('Should create data storage infrastructure with encryption', () => {
    app = new App();
    stack = new TapStack(app, 'TapStackStorageTest', {
      environmentSuffix: 'storage',
      awsRegion: 'eu-west-2',
    });
    synthesized = Testing.synth(stack);

    // Verify storage components with encryption
    expect(synthesized).toContain('aws_s3_bucket');
    expect(synthesized).toContain('aws_kms_key');
    expect(synthesized).toBeDefined();
  });

  test('Should create data processing infrastructure with ECS', () => {
    app = new App();
    stack = new TapStack(app, 'TapStackProcessingTest', {
      environmentSuffix: 'processing',
      awsRegion: 'eu-west-2',
    });
    synthesized = Testing.synth(stack);

    // Verify ECS and processing components
    expect(synthesized).toContain('aws_ecs_cluster');
    expect(synthesized).toContain('aws_ecs_service');
    expect(synthesized).toBeDefined();
  });

  test('Should apply custom tags to infrastructure resources', () => {
    app = new App();
    stack = new TapStack(app, 'TapStackTagsTest', {
      environmentSuffix: 'tagged',
      awsRegion: 'eu-west-2',
      defaultTags: {
        tags: {
          Environment: 'integration',
          ManagedBy: 'CDKTF',
          Project: 'TAP',
        },
      },
    });
    synthesized = Testing.synth(stack);

    // Verify tags are applied
    expect(synthesized).toContain('default_tags');
    expect(synthesized).toContain('"Environment": "integration"');
    expect(synthesized).toContain('"ManagedBy": "CDKTF"');
  });

  test('Should create API Gateway for external integrations', () => {
    app = new App();
    stack = new TapStack(app, 'TapStackApiTest', {
      environmentSuffix: 'api',
      awsRegion: 'eu-west-2',
    });
    synthesized = Testing.synth(stack);

    // Verify API Gateway components
    expect(synthesized).toContain('aws_apigatewayv2_api');
    expect(synthesized).toContain('aws_apigatewayv2_stage');
    expect(synthesized).toBeDefined();
  });
});
