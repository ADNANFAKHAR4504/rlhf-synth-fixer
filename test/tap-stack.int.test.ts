import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack'; // Adjust path if necessary

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any; // Using 'any' for easier JSON property access

  // beforeEach hook to set up a new App and synthesize the stack for each test
  beforeEach(() => {
    app = new App();
    // Synthesize the stack with default properties for most tests
    stack = new TapStack(app, 'TestTapStackInt');
    synthesized = JSON.parse(Testing.synth(stack));
  });

  // afterEach hook to clean up mocks (though not strictly necessary for simple synthesis tests)
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('synthesizes to valid Terraform JSON', () => {
    // Objective: Ensure the synthesized output is a valid JSON object with core Terraform properties.
    expect(typeof synthesized).toBe('object');
    expect(synthesized).toHaveProperty('provider');
    expect(synthesized).toHaveProperty('terraform');
  });

  test('AWS provider is configured with default region and no default tags by default', () => {
    // Objective: Verify that the AWS provider uses 'us-east-1' as the default region
    // and that defaultTags are not present if not explicitly provided.
    expect(synthesized.provider.aws.region).toBe('us-east-1');
    expect(synthesized.provider.aws.default_tags).toBeUndefined();
  });

  test('AWS provider is configured with specified region and default tags', () => {
    // Objective: Confirm that the AWS provider correctly applies a custom region and default tags
    // when provided via props.
    const customTags = { // This is the map of tags
      Project: 'CustomProject',
      Owner: 'TestUser',
    };
    const customStack = new TapStack(app, 'TestTapStackCustom', {
      awsRegion: 'us-west-2',
      defaultTags: customTags, // Pass the map directly
    });
    const customSynthesized = JSON.parse(Testing.synth(customStack));

    expect(customSynthesized.provider.aws.region).toBe('us-west-2');
    // CDKTF wraps default_tags in an array, so we access the first element
    expect(customSynthesized.provider.aws.default_tags[0].tags).toEqual(customTags);
  });

  test('S3 backend is configured with default bucket, key, region, and encryption', () => {
    // Objective: Validate that the S3 backend uses its default configuration.
    const s3Backend = synthesized.terraform.backend.s3;
    expect(s3Backend.bucket).toBe('iac-rlhf-tf-states');
    expect(s3Backend.key).toBe('dev/TestTapStackInt.tfstate'); // 'dev' from default environmentSuffix
    expect(s3Backend.region).toBe('us-east-1');
    expect(s3Backend.encrypt).toBe(true);
  });

  test('S3 backend uses custom properties when provided', () => {
    // Objective: Ensure the S3 backend correctly applies custom bucket, key, and region
    // when specified in TapStackProps.
    const customStack = new TapStack(app, 'TestTapStackCustomBackend', {
      environmentSuffix: 'prod',
      stateBucket: 'my-custom-bucket',
      stateBucketRegion: 'eu-central-1',
    });
    const customSynthesized = JSON.parse(Testing.synth(customStack));
    const s3Backend = customSynthesized.terraform.backend.s3;

    expect(s3Backend.bucket).toBe('my-custom-bucket');
    expect(s3Backend.key).toBe('prod/TestTapStackCustomBackend.tfstate');
    expect(s3Backend.region).toBe('eu-central-1');
  });

  test('S3 backend has use_lockfile override set to true', () => {
    // Objective: Confirm that the Terraform backend override for `use_lockfile` is set.
    const s3Backend = synthesized.terraform.backend.s3;
    expect(s3Backend.use_lockfile).toBe(true);
  });

  test('MyStack is NOT instantiated by default', () => {
    // Objective: Verify that the MyStack module is not present in the synthesized output
    // when `createMyStack` is not explicitly set to true.
    expect(synthesized.module).toBeUndefined();
  });

  test('MyStack IS instantiated when createMyStack prop is true', () => {
    // Objective: Confirm that MyStack is correctly instantiated and its properties are passed
    // when `createMyStack` is true.
    const stackWithMyStack = new TapStack(app, 'TestTapStackWithMyStack', {
      createMyStack: true,
      environmentSuffix: 'test',
    });
    const synthesizedWithMyStack = JSON.parse(Testing.synth(stackWithMyStack));

    // Check if the 'MyModularStack' module is present in the synthesized output
    expect(synthesizedWithMyStack.module).toHaveProperty('MyModularStack');

    // Verify properties passed to MyStack's constructor via the module's inputs
    const myStackModule = synthesizedWithMyStack.module.MyModularStack;
    expect(myStackModule.bucketName).toBe('test-my-example-bucket');
    expect(myStackModule.tags.Project).toBe('TestProject');
    expect(myStackModule.tags.Environment).toBe('test');
    expect(myStackModule.tags.ManagedBy).toBe('CDKTF'); // Verify additional tag
  });

  test('MyStack S3 bucket resource is created with correct properties when instantiated', () => {
    // Objective: Dig deeper into the synthesized output to ensure the S3 bucket
    // within MyStack has the expected properties.
    const stackWithMyStack = new TapStack(app, 'TestMyStackResource', {
      createMyStack: true,
      environmentSuffix: 'prod',
    });
    const synthesizedWithMyStack = JSON.parse(Testing.synth(stackWithMyStack));

    // Navigate to the S3 bucket resource within the MyModularStack module
    const s3BucketResource = synthesizedWithMyStack.resource.MyModularStack.my_example_bucket;

    expect(s3BucketResource).toBeDefined();
    expect(s3BucketResource.bucket).toBe('prod-my-example-bucket');
    expect(s3BucketResource.acl).toBe('private');
    expect(s3BucketResource.force_destroy).toBe(true);
    expect(s3BucketResource.tags.Project).toBe('TestProject');
    expect(s3BucketResource.tags.Environment).toBe('prod');
  });
});
