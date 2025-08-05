import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack'; // Adjust path if necessary

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any; // Using 'any' for easier JSON property access

  // beforeEach hook to set up a new App for each test
  beforeEach(() => {
    jest.clearAllMocks(); // Clear any Jest mocks before each test
    app = new App();
  });

  test('TapStack instantiates successfully via props', () => {
    // Objective: Verify that the TapStack constructor runs without errors when
    // all possible props are provided.
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
      defaultTags: { // Corrected structure for defaultTags
        Project: 'UnitTesting',
        Env: 'Prod',
      },
      createMyStack: true,
    });
    synthesized = JSON.parse(Testing.synth(stack));

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses default values when no props provided', () => {
    // Objective: Ensure that all properties correctly fall back to their default values
    // when no props are supplied to the constructor.
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = JSON.parse(Testing.synth(stack));

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Assert default values in the synthesized output
    expect(synthesized.provider.aws.region).toBe('us-east-1');
    expect(synthesized.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
    expect(synthesized.terraform.backend.s3.key).toBe('dev/TestTapStackDefault.tfstate');
    expect(synthesized.terraform.backend.s3.region).toBe('us-east-1');
    expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
    expect(synthesized.terraform.backend.s3.use_lockfile).toBe(true);
    expect(synthesized.provider.aws.default_tags).toBeUndefined(); // No default tags if not provided
    expect(synthesized.module).toBeUndefined(); // MyStack should not be created by default
  });

  test('AWS Provider region is correctly set from props', () => {
    // Objective: Test that the `awsRegion` prop is correctly passed to the AwsProvider.
    stack = new TapStack(app, 'TestRegion', { awsRegion: 'eu-west-1' });
    synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized.provider.aws.region).toBe('eu-west-1');
  });

  test('AWS Provider region defaults to us-east-1 if not specified', () => {
    // Objective: Confirm that the AWS provider's region defaults to 'us-east-1'
    // when `awsRegion` prop is omitted.
    stack = new TapStack(app, 'TestDefaultRegion');
    synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized.provider.aws.region).toBe('us-east-1');
  });

  test('AWS Provider defaultTags are correctly applied', () => {
    // Objective: Verify that the `defaultTags` prop is correctly applied to the AwsProvider.
    const testTags = { Service: 'CDKTF', Owner: 'TeamA' };
    stack = new TapStack(app, 'TestDefaultTags', { defaultTags: testTags }); // Corrected structure
    synthesized = JSON.parse(Testing.synth(stack));
    // CDKTF wraps default_tags in an array
    expect(synthesized.provider.aws.default_tags[0].tags).toEqual(testTags);
  });

  test('S3 Backend bucket is correctly set from props', () => {
    // Objective: Test that the `stateBucket` prop is correctly used for the S3 backend bucket name.
    stack = new TapStack(app, 'TestS3Bucket', { stateBucket: 'my-custom-bucket' });
    synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized.terraform.backend.s3.bucket).toBe('my-custom-bucket');
  });

  test('S3 Backend key includes environment suffix and stack ID', () => {
    // Objective: Verify that the S3 backend key is correctly constructed using
    // `environmentSuffix` and the stack ID.
    stack = new TapStack(app, 'MySpecificStack', { environmentSuffix: 'qa' });
    synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized.terraform.backend.s3.key).toBe('qa/MySpecificStack.tfstate');
  });

  test('S3 Backend region is correctly set from props', () => {
    // Objective: Test that the `stateBucketRegion` prop is correctly used for the S3 backend region.
    stack = new TapStack(app, 'TestS3Region', { stateBucketRegion: 'ap-southeast-2' });
    synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized.terraform.backend.s3.region).toBe('ap-southeast-2');
  });

  test('S3 Backend encryption is enabled by default', () => {
    // Objective: Confirm that S3 backend encryption is enabled by default.
    stack = new TapStack(app, 'TestS3Encrypt');
    synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
  });

  test('S3 Backend use_lockfile override is always true', () => {
    // Objective: Verify that the `use_lockfile` escape hatch is always applied.
    stack = new TapStack(app, 'TestLockfile');
    synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized.terraform.backend.s3.use_lockfile).toBe(true);
  });

  test('MyStack is instantiated when createMyStack is true', () => {
    // Objective: Ensure that MyStack is instantiated when `createMyStack` is true,
    // and that its constructor receives the correct props.
    stack = new TapStack(app, 'TestMyStackInstantiation', { createMyStack: true, environmentSuffix: 'dev' });
    synthesized = JSON.parse(Testing.synth(stack));
    // Check if the module for MyStack exists in the synthesized output
    expect(synthesized.module).toHaveProperty('MyModularStack');
    // Verify properties passed to MyStack's constructor via the module's inputs
    const myStackModule = synthesized.module.MyModularStack;
    expect(myStackModule.bucketName).toBe('dev-my-example-bucket');
    expect(myStackModule.tags.Project).toBe('TestProject');
    expect(myStackModule.tags.Environment).toBe('dev');
    expect(myStackModule.tags.ManagedBy).toBe('CDKTF');
  });

  test('MyStack is NOT instantiated when createMyStack is false or undefined', () => {
    // Objective: Confirm that MyStack is NOT instantiated when `createMyStack` is
    // explicitly false or completely omitted (undefined).

    // Test with createMyStack explicitly false
    stack = new TapStack(app, 'TestNoMyStackFalse', { createMyStack: false });
    synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized.module).toBeUndefined();

    // Test with createMyStack undefined (default behavior)
    stack = new TapStack(app, 'TestNoMyStackUndefined');
    synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized.module).toBeUndefined();
  });
});
