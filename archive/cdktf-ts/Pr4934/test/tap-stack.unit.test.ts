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

  // Additional unit tests
  test('Synthesized template contains S3 backend key with environmentSuffix', () => {
    app = new App();
    stack = new TapStack(app, 'S3BackendKeyTest', { environmentSuffix: 'staging' });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('staging/S3BackendKeyTest.tfstate');
  });

  test('AwsProvider set with provided region', () => {
    app = new App();
    stack = new TapStack(app, 'AwsProviderRegionTest', { awsRegion: 'eu-west-1' });
    synthesized = Testing.synth(stack);

    expect(synthesized).toMatch(/region.*eu-west-1/);
  });

  test('Default tags propagate when provided', () => {
    app = new App();
    stack = new TapStack(app, 'DefaultTagsTest', {
      defaultTags: { tags: { Team: 'devops' } as any },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toMatch(/devops/);
  });

  test('LMS stack resources named with environment suffix', () => {
    app = new App();
    stack = new TapStack(app, 'LmsNameTest', { environmentSuffix: 'e2e' });
    synthesized = Testing.synth(stack);

    // Check for a few representative resource name fragments
    expect(synthesized).toContain('lms-vpc-e2e');
    expect(synthesized).toContain('lms-alb-e2e');
    expect(synthesized).toContain('lms-db-e2e');
  });

  test('RDS instance configured with storageEncrypted and multiAz', () => {
    app = new App();
    stack = new TapStack(app, 'RdsPropsTest');
    synthesized = Testing.synth(stack);

    expect(synthesized).toMatch(/storage_encrypted\W*:\W*true|storageEncrypted/);
    expect(synthesized).toMatch(/multi_az\W*:\W*true|multiAz/);
  });

  test('ECS task definition includes container with expected image and port', () => {
    app = new App();
    stack = new TapStack(app, 'EcsTaskDefTest');
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('nginx:latest');
    expect(synthesized).toContain('8080');
  });

  test('Secrets manager secret created for DB credentials', () => {
    app = new App();
    stack = new TapStack(app, 'SecretsTest');
    synthesized = Testing.synth(stack);

    expect(synthesized).toMatch(/lms-db-credentials/);
  });

  test('ALB target group health check configured', () => {
    app = new App();
    stack = new TapStack(app, 'TgHealthCheckTest');
    synthesized = Testing.synth(stack);

    expect(synthesized).toMatch(/health_check|healthCheck/);
    expect(synthesized).toMatch(/path.*\//);
  });
});

// add more test suites and cases as needed
