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

  test('TapStack uses custom tags when provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackTags', {
      environmentSuffix: 'custom',
      defaultTags: [
        {
          tags: {
            Project: 'TestProject',
            Owner: 'TestOwner',
          },
        },
      ],
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    const parsed = JSON.parse(synthesized);
    expect(parsed.provider.aws[0].default_tags).toBeDefined();
    expect(parsed.provider.aws[0].default_tags[0].tags.Project).toBe(
      'TestProject'
    );
    expect(parsed.provider.aws[0].default_tags[0].tags.Owner).toBe('TestOwner');
  });

  test('TapStack configures S3 backend with custom values', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackBackend', {
      environmentSuffix: 'backend-test',
      stateBucket: 'test-backend-bucket',
      stateBucketRegion: 'eu-central-1',
      awsRegion: 'eu-central-1',
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    const parsed = JSON.parse(synthesized);
    expect(parsed.terraform.backend.s3.bucket).toBe('test-backend-bucket');
    expect(parsed.terraform.backend.s3.region).toBe('eu-central-1');
    expect(parsed.terraform.backend.s3.key).toBe(
      'backend-test/TestTapStackBackend.tfstate'
    );
    expect(parsed.terraform.backend.s3.encrypt).toBe(true);
    expect(parsed.terraform.backend.s3.use_lockfile).toBe(true);
  });

  test('TapStack uses default region when awsRegion not provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackDefaultRegion', {
      environmentSuffix: 'test',
    });
    synthesized = Testing.synth(stack);

    const parsed = JSON.parse(synthesized);
    expect(parsed.provider.aws[0].region).toBe('us-east-1');
  });
});

// add more test suites and cases as needed
