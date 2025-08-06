import { App, Testing, Fn } from 'cdktf';
import { TapStack } from '../lib/tap-stack'; // Adjust path if necessary
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table'; // Import RouteTable for mocking


// Mock DataAwsAvailabilityZones to return predictable AZs for testing
jest.mock('@cdktf/provider-aws/lib/data-aws-availability-zones', () => ({
  DataAwsAvailabilityZones: jest.fn().mockImplementation((scope, id, config) => ({
    id: `mock-data-aws-availability-zones-id-${id}`,
    names: ['us-east-1a', 'us-east-1b', 'us-east-1c'], // Provide exactly 3 AZs
    get stringified() { return JSON.stringify(this.names); }
  })),
}));

// Mock DataAwsAmi to return a predictable AMI ID
jest.mock('@cdktf/provider-aws/lib/data-aws-ami', () => ({
  DataAwsAmi: jest.fn().mockImplementation((scope, id, config) => ({
    id: `mock-ami-id-${id}`,
    get id() { return `ami-mocked12345`; } // Return a fixed mock AMI ID
  })),
}));

// Mock RouteTable to allow .addRoute to be called during synthesis
// This mock is crucial because `addRoute` is a method on the construct,
// and `Testing.synth()` needs it to be callable in unit tests.
jest.mock('@cdktf/provider-aws/lib/route-table', () => ({
  RouteTable: jest.fn().mockImplementation((scope, id, config) => {
    const mockRoutes: any[] = [];
    return {
      id: `mock-rt-id-${id}`,
      get id() { return `mock-rt-id-${id}`; }, // Ensure a consistent ID for assertions
      addRoute: jest.fn((name, routeConfig) => {
        mockRoutes.push(routeConfig); // Capture routes added
      }),
      // Expose captured routes for potential assertions if needed, though not strictly necessary for this error
      get route() { return mockRoutes; },
      ...config,
      tags: config.tags || {}, // Ensure tags are present
    };
  }),
}));


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
    // This will show you the exact structure of the generated Terraform JSON
    // Make sure to check the output for the specific test that's failing.
    // console.log('--- Synthesized Output for TestTapStackDefault (from beforeEach) ---');
    // console.log(JSON.stringify(synthesized, null, 2));
    // console.log('--------------------------------------------------');
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
        Project: 'CustomProject',
        Environment: 'test',
        Owner: 'TestUser',
        Service: 'CDKTF',
      },
      vpcCidr: '172.16.0.0/16',
      allowedIngressIpRange: '192.0.2.0/24',
    });
    const propsSynthesized = JSON.parse(Testing.synth(propsStack));

    // Assertions for propsStack
    expect(propsSynthesized.terraform.backend.s3.bucket).toBe('custom-state-bucket');
    expect(propsSynthesized.terraform.backend.s3.region).toBe('us-west-2');
    expect(propsSynthesized.provider.aws[0].region).toBe('us-west-2');
    // Verify that defaultTags are merged and applied correctly
    expect(propsSynthesized.provider.aws[0].default_tags[0].tags).toEqual({
      Project: 'CustomProject', // Overridden by props
      Environment: 'test', // Overridden by props
      Owner: 'TestUser', // Overridden by props
      Service: 'CDKTF', // Added by props
    });
    // Verify NetworkingConstruct props
    const vpcResources = propsSynthesized.resource.aws_vpc;
    const vpcName = Object.keys(vpcResources)[0];
    const vpc = vpcResources[vpcName];
    expect(vpc.cidr_block).toBe('172.16.0.0/16');

    // Verify SecurityConstruct props - check for the rule in the synthesized output
    const sgRuleResources = propsSynthesized.resource.aws_security_group_rule;
    const httpRule = Object.values(sgRuleResources).find(
      (rule: any) => rule.from_port === 80 && rule.to_port === 80 && rule.protocol === 'tcp'
    );
    expect(httpRule).toBeDefined();
    expect(httpRule.cidr_blocks).toEqual(['192.0.2.0/24']);
  });

  test('TapStack uses default values when no props provided', () => {
    // Objective: Verify that the TapStack uses correct default values
    // for region, state bucket, and default tags when no props are given.
    expect(synthesized.provider.aws[0].region).toBe('us-east-1');
    expect(synthesized.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
    expect(synthesized.terraform.backend.s3.key).toBe('dev/TestTapStackDefault.tfstate');
    expect(synthesized.terraform.backend.s3.region).toBe('us-east-1');
    expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
    expect(synthesized.terraform.backend.s3.use_lockfile).toBe(true);

    // Now, default_tags will always be present with the required values
    expect(synthesized.provider.aws[0].default_tags).toEqual([
      {
        tags: {
          Environment: 'Dev',
          Owner: 'Akshat Jain',
          Project: 'MyProject',
        },
      },
    ]);
    // MyStack should not be created by default, but other core constructs should be
    expect(synthesized.resource.aws_s3_bucket).toBeUndefined(); // MyStack's S3 bucket
    expect(synthesized.resource.aws_vpc).toBeDefined(); // NetworkingConstruct's VPC
    expect(synthesized.resource.aws_security_group).toBeDefined(); // SecurityConstruct's SG
    expect(synthesized.resource.aws_iam_role).toBeDefined(); // IamConstruct's Role
    expect(synthesized.resource.aws_instance).toBeDefined(); // ComputeConstruct's Instance
  });

  test('AWS Provider region is correctly set from props', () => {
    // Objective: Verify that the AWS provider's region is set correctly
    // when provided via props.
    const customRegionStack = new TapStack(app, 'TestCustomRegion', {
      awsRegion: 'us-west-2',
    });
    const customRegionSynthesized = JSON.parse(Testing.synth(customRegionStack));
    expect(customRegionSynthesized.provider.aws[0].region).toBe('us-west-2');
  });

  test('AWS Provider region defaults to us-east-1 if not specified', () => {
    // Objective: Verify that the AWS provider's region defaults to 'us-east-1'
    // when no region is specified in props.
    expect(synthesized.provider.aws[0].region).toBe('us-east-1');
  });

  test('AWS Provider defaultTags are correctly applied', () => {
    // Objective: Verify that defaultTags provided in props are correctly applied
    // and merged with the required default tags.
    const testTags = {
      Owner: 'TeamA',
      Service: 'CDKTF',
    };
    const tagsStack = new TapStack(app, 'TestDefaultTags', {
      defaultTags: testTags,
    });
    const tagsSynthesized = JSON.parse(Testing.synth(tagsStack));

    expect(tagsSynthesized.provider.aws[0]).toHaveProperty('default_tags');
    // The expected tags should be a merge of requiredDefaultTags and testTags
    expect(tagsSynthesized.provider.aws[0].default_tags[0].tags).toEqual({
      Project: 'MyProject',
      Environment: 'Dev',
      Owner: 'TeamA', // Overridden by testTags
      Service: 'CDKTF', // Added by testTags
    });
  });

  test('S3 Backend bucket is correctly set from props', () => {
    // Objective: Verify that the S3 backend bucket name is correctly set
    // when provided via props.
    const customBucketStack = new TapStack(app, 'TestCustomBucket', {
      stateBucket: 'my-custom-tf-state-bucket',
    });
    const customBucketSynthesized = JSON.parse(Testing.synth(customBucketStack));
    expect(customBucketSynthesized.terraform.backend.s3.bucket).toBe('my-custom-tf-state-bucket');
  });

  test('S3 Backend key includes environment suffix and stack ID', () => {
    // Objective: Verify that the S3 backend key is correctly formatted
    // with the environment suffix and stack ID.
    const envStack = new TapStack(app, 'TestEnvStack', {
      environmentSuffix: 'prod',
    });
    const envSynthesized = JSON.parse(Testing.synth(envStack));
    expect(envSynthesized.terraform.backend.s3.key).toBe('prod/TestEnvStack.tfstate');
  });

  test('S3 Backend region is correctly set from props', () => {
    // Objective: Verify that the S3 backend region is correctly set
    // when provided via props.
    const customRegionBackendStack = new TapStack(app, 'TestCustomRegionBackend', {
      stateBucketRegion: 'eu-west-1',
    });
    const customRegionBackendSynthesized = JSON.parse(Testing.synth(customRegionBackendStack));
    expect(customRegionBackendSynthesized.terraform.backend.s3.region).toBe('eu-west-1');
  });

  test('S3 Backend encryption is enabled by default', () => {
    // Objective: Verify that S3 backend encryption is enabled.
    expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
  });

  test('S3 Backend use_lockfile override is always true', () => {
    // Objective: Verify that the use_lockfile override is always set to true.
    expect(synthesized.terraform.backend.s3.use_lockfile).toBe(true);
  });

  test('MyStack is instantiated when createMyStack is true', () => {
    // Objective: Confirm that MyStack is instantiated when `createMyStack` is true,
    // and its S3 bucket resource has the correct properties, including the updated tags.
    const myStackInstance = new TapStack(app, 'TestMyStackInstance', {
      createMyStack: true,
      environmentSuffix: 'test', // For bucket naming and environment tag
    });
    const myStackSynthesized = JSON.parse(Testing.synth(myStackInstance));

    // Check for the presence of the S3 bucket resource
    const s3BucketResources = myStackSynthesized.resource.aws_s3_bucket;
    expect(s3BucketResources).toBeDefined();
    const s3ResourceNames = Object.keys(s3BucketResources);
    expect(s3ResourceNames.length).toBe(1); // Ensure only one S3 bucket
    const s3ResourceName = s3ResourceNames[0];

    const s3BucketResource = s3BucketResources[s3ResourceName];
    expect(s3BucketResource).toBeDefined();
    expect(s3BucketResource.bucket).toBe('test-my-example-bucket');
    expect(s3BucketResource.acl).toBe('private');
    expect(s3BucketResource.force_destroy).toBe(true);
    // Assert the updated tags for MyStack's S3 bucket
    expect(s3BucketResource.tags.Project).toBe('MyProject'); // Updated
    expect(s3BucketResource.tags.Environment).toBe('test');
    expect(s3BucketResource.tags.Owner).toBe('Akshat Jain'); // Updated
  });

  test('MyStack is NOT instantiated when createMyStack is false or undefined', () => {
    // Objective: Confirm that MyStack is NOT instantiated when `createMyStack` is
    // explicitly false or completely omitted (undefined).

    // Test with createMyStack explicitly false
    const noMyStackFalse = new TapStack(app, 'TestNoMyStackFalse', { createMyStack: false });
    const noMyStackFalseSynthesized = JSON.parse(Testing.synth(noMyStackFalse));
    // Check for absence of the specific S3 bucket resource
    // The 'resource' key itself might be undefined if no resources are created.
    // So, we need to check if 'resource' exists first, then check for 'aws_s3_bucket'.
    if (noMyStackFalseSynthesized.resource) {
      expect(noMyStackFalseSynthesized.resource).not.toHaveProperty('aws_s3_bucket');
    } else {
      expect(noMyStackFalseSynthesized.resource).toBeUndefined(); // If no resources at all, this is also valid
    }


    // Test with createMyStack undefined (default behavior)
    const noMyStackUndefined = new TapStack(app, 'TestNoMyStackUndefined');
    const noMyStackUndefinedSynthesized = JSON.parse(Testing.synth(noMyStackUndefined));
    // Check for absence of the specific S3 bucket resource
    if (noMyStackUndefinedSynthesized.resource) {
      expect(noMyStackUndefinedSynthesized.resource).not.toHaveProperty('aws_s3_bucket');
    } else {
      expect(noMyStackUndefinedSynthesized.resource).toBeUndefined(); // If no resources at all, this is also valid
    }
  });
});
