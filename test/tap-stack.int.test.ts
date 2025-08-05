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
    // Corrected: Access the first element of the 'aws' array
    expect(synthesized.provider.aws[0].region).toBe('us-east-1');
    expect(synthesized.provider.aws[0].default_tags).toEqual([]); // Should be an empty array if no tags
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

    // Corrected: Access the first element of the 'aws' array
    expect(customSynthesized.provider.aws[0].region).toBe('us-west-2');
    // CDKTF wraps default_tags in an array, so we access the first element
    expect(customSynthesized.provider.aws[0].default_tags[0].tags).toEqual(customTags);
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
    // Objective: Verify that the MyStack construct's resources are not present
    // when `createMyStack` is not explicitly set to true.
    // Check for absence of the 'aws_s3_bucket' resource type.
    if (synthesized.resource) {
      expect(synthesized.resource).not.toHaveProperty('aws_s3_bucket');
    } else {
      expect(synthesized.resource).toBeUndefined();
    }
  });

  test('MyStack IS instantiated when createMyStack prop is true', () => {
    // Objective: Confirm that MyStack is correctly instantiated and its resources are present
    // when `createMyStack` is true.
    const stackWithMyStack = new TapStack(app, 'TestTapStackWithMyStack', {
      createMyStack: true,
      environmentSuffix: 'test',
    });
    const synthesizedWithMyStack = JSON.parse(Testing.synth(stackWithMyStack));

    // MyStack resources will appear directly under 'resource' in the parent stack's JSON
    // The resource type is 'aws_s3_bucket' and its name will be a combination of the nested construct ID and the resource ID
    expect(synthesizedWithMyStack).toHaveProperty('resource');
    expect(synthesizedWithMyStack.resource).toHaveProperty('aws_s3_bucket'); // Check for the S3 bucket resource type

    // Dynamically find the resource name, as CDKTF appends a hash
    const s3BucketResources = synthesizedWithMyStack.resource.aws_s3_bucket;
    const s3ResourceNames = Object.keys(s3BucketResources);

    // Expecting exactly one S3 bucket resource from MyStack
    expect(s3ResourceNames.length).toBe(1);

    const s3ResourceName = s3ResourceNames[0]; // Get the actual generated name
    // Verify that the generated name starts with the expected prefix (case-sensitive)
    expect(s3ResourceName).toMatch(/^MyModularStack_my_example_bucket_.*$/); // Corrected regex case

    // Verify properties of the S3 bucket created by MyStack using the dynamically found name
    const s3BucketResource = s3BucketResources[s3ResourceName];
    expect(s3BucketResource.bucket).toBe('test-my-example-bucket');
    expect(s3BucketResource.tags.Project).toBe('TestProject');
    expect(s3BucketResource.tags.Environment).toBe('test');
    expect(s3BucketResource.tags.ManagedBy).toBe('CDKTF'); // Verify additional tag
  });

  test('MyStack S3 bucket resource is created with correct properties when instantiated', () => {
    // Objective: Dig deeper into the synthesized output to ensure the S3 bucket
    // within MyStack has the expected properties.
    const stackWithMyStack = new TapStack(app, 'TestMyStackResource', {
      createMyStack: true,
      environmentSuffix: 'prod',
    });
    const synthesizedWithMyStack = JSON.parse(Testing.synth(stackWithMyStack));

    // Navigate to the S3 bucket resource within the MyModularStack construct
    const s3BucketResources = synthesizedWithMyStack.resource.aws_s3_bucket;
    const s3ResourceNames = Object.keys(s3BucketResources);
    expect(s3ResourceNames.length).toBe(1); // Ensure only one S3 bucket
    const s3ResourceName = s3ResourceNames[0];

    const s3BucketResource = s3BucketResources[s3ResourceName];

    expect(s3BucketResource).toBeDefined();
    expect(s3BucketResource.bucket).toBe('prod-my-example-bucket');
    expect(s3BucketResource.acl).toBe('private');
    expect(s3BucketResource.force_destroy).toBe(true);
    expect(s3BucketResource.tags.Project).toBe('TestProject');
    expect(s3BucketResource.tags.Environment).toBe('prod');
  });
});
