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
    stack = new TapStack(app, 'TestTapStackDefault'); // Use a simple stack for initial debug
    synthesized = JSON.parse(Testing.synth(stack));

    // --- DEBUGGING AID: Log the synthesized output ---
    console.log('--- Synthesized Output for TestTapStackDefault ---');
    console.log(JSON.stringify(synthesized, null, 2));
    console.log('--------------------------------------------------');
    // --- END DEBUGGING AID ---
  });

  test('TapStack instantiates successfully via props', () => {
    // Objective: Verify that the TapStack constructor runs without errors when
    // all possible props are provided.
    const propsStack = new TapStack(app, 'TestTapStackWithProps', {
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
    const propsSynthesized = JSON.parse(Testing.synth(propsStack));

    expect(propsStack).toBeDefined();
    expect(propsSynthesized).toBeDefined();
  });

  test('TapStack uses default values when no props provided', () => {
    // Objective: Ensure that all properties correctly fall back to their default values
    // when no props are supplied to the constructor.
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Assert default values in the synthesized output
    expect(synthesized).toHaveProperty('provider');
    expect(synthesized.provider).toHaveProperty('aws');
    expect(synthesized.provider.aws).toHaveProperty('region');
    expect(synthesized.provider.aws.region).toBe('us-east-1');

    expect(synthesized).toHaveProperty('terraform');
    expect(synthesized.terraform).toHaveProperty('backend');
    expect(synthesized.terraform.backend).toHaveProperty('s3');
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
    const regionStack = new TapStack(app, 'TestRegion', { awsRegion: 'eu-west-1' });
    const regionSynthesized = JSON.parse(Testing.synth(regionStack));

    expect(regionSynthesized).toHaveProperty('provider');
    expect(regionSynthesized.provider).toHaveProperty('aws');
    expect(regionSynthesized.provider.aws).toHaveProperty('region');
    expect(regionSynthesized.provider.aws.region).toBe('eu-west-1');
  });

  test('AWS Provider region defaults to us-east-1 if not specified', () => {
    // Objective: Confirm that the AWS provider's region defaults to 'us-east-1'
    // when `awsRegion` prop is omitted.
    const defaultRegionStack = new TapStack(app, 'TestDefaultRegion');
    const defaultRegionSynthesized = JSON.parse(Testing.synth(defaultRegionStack));

    expect(defaultRegionSynthesized).toHaveProperty('provider');
    expect(defaultRegionSynthesized.provider).toHaveProperty('aws');
    expect(defaultRegionSynthesized.provider.aws).toHaveProperty('region');
    expect(defaultRegionSynthesized.provider.aws.region).toBe('us-east-1');
  });

  test('AWS Provider defaultTags are correctly applied', () => {
    // Objective: Verify that the `defaultTags` prop is correctly applied to the AwsProvider.
    const testTags = { Service: 'CDKTF', Owner: 'TeamA' };
    const tagsStack = new TapStack(app, 'TestDefaultTags', { defaultTags: testTags }); // Corrected structure
    const tagsSynthesized = JSON.parse(Testing.synth(tagsStack));

    expect(tagsSynthesized).toHaveProperty('provider');
    expect(tagsSynthesized.provider).toHaveProperty('aws');
    expect(tagsSynthesized.provider.aws).toHaveProperty('default_tags');
    // CDKTF wraps default_tags in an array
    expect(tagsSynthesized.provider.aws.default_tags[0].tags).toEqual(testTags);
  });

  test('S3 Backend bucket is correctly set from props', () => {
    // Objective: Test that the `stateBucket` prop is correctly used for the S3 backend bucket name.
    const bucketStack = new TapStack(app, 'TestS3Bucket', { stateBucket: 'my-custom-bucket' });
    const bucketSynthesized = JSON.parse(Testing.synth(bucketStack));
    expect(bucketSynthesized.terraform.backend.s3.bucket).toBe('my-custom-bucket');
  });

  test('S3 Backend key includes environment suffix and stack ID', () => {
    // Objective: Verify that the S3 backend key is correctly constructed using
    // `environmentSuffix` and the stack ID.
    const keyStack = new TapStack(app, 'MySpecificStack', { environmentSuffix: 'qa' });
    const keySynthesized = JSON.parse(Testing.synth(keyStack));
    expect(keySynthesized.terraform.backend.s3.key).toBe('qa/MySpecificStack.tfstate');
  });

  test('S3 Backend region is correctly set from props', () => {
    // Objective: Test that the `stateBucketRegion` prop is correctly used for the S3 backend region.
    const regionS3Stack = new TapStack(app, 'TestS3Region', { stateBucketRegion: 'ap-southeast-2' });
    const regionS3Synthesized = JSON.parse(Testing.synth(regionS3Stack));
    expect(regionS3Synthesized.terraform.backend.s3.region).toBe('ap-southeast-2');
  });

  test('S3 Backend encryption is enabled by default', () => {
    // Objective: Confirm that S3 backend encryption is enabled by default.
    const encryptStack = new TapStack(app, 'TestS3Encrypt');
    const encryptSynthesized = JSON.parse(Testing.synth(encryptStack));
    expect(encryptSynthesized.terraform.backend.s3.encrypt).toBe(true);
  });

  test('S3 Backend use_lockfile override is always true', () => {
    // Objective: Verify that the `use_lockfile` escape hatch is always applied.
    const lockfileStack = new TapStack(app, 'TestLockfile');
    const lockfileSynthesized = JSON.parse(Testing.synth(lockfileStack));
    expect(lockfileSynthesized.terraform.backend.s3.use_lockfile).toBe(true);
  });

  test('MyStack is instantiated when createMyStack is true', () => {
    // Objective: Ensure that MyStack is instantiated when `createMyStack` is true,
    // and that its constructor receives the correct props.
    const myStackInstance = new TapStack(app, 'TestMyStackInstantiation', { createMyStack: true, environmentSuffix: 'dev' });
    const myStackSynthesized = JSON.parse(Testing.synth(myStackInstance));

    // Check if the module for MyStack exists in the synthesized output
    expect(myStackSynthesized).toHaveProperty('module');
    expect(myStackSynthesized.module).toHaveProperty('MyModularStack');

    // Verify properties passed to MyStack's constructor via the module's inputs
    const myStackModule = myStackSynthesized.module.MyModularStack;
    expect(myStackModule.bucketName).toBe('dev-my-example-bucket');
    expect(myStackModule.tags.Project).toBe('TestProject');
    expect(myStackModule.tags.Environment).toBe('dev');
    expect(myStackModule.tags.ManagedBy).toBe('CDKTF');
  });

  test('MyStack is NOT instantiated when createMyStack is false or undefined', () => {
    // Objective: Confirm that MyStack is NOT instantiated when `createMyStack` is
    // explicitly false or completely omitted (undefined).

    // Test with createMyStack explicitly false
    const noMyStackFalse = new TapStack(app, 'TestNoMyStackFalse', { createMyStack: false });
    const noMyStackFalseSynthesized = JSON.parse(Testing.synth(noMyStackFalse));
    expect(noMyStackFalseSynthesized.module).toBeUndefined();

    // Test with createMyStack undefined (default behavior)
    const noMyStackUndefined = new TapStack(app, 'TestNoMyStackUndefined');
    const noMyStackUndefinedSynthesized = JSON.parse(Testing.synth(noMyStackUndefined));
    expect(noMyStackUndefinedSynthesized.module).toBeUndefined();
  });
});
