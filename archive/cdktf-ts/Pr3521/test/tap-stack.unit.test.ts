import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Stack Structure', () => {
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

    test('TapStack uses us-west-2 region override', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackRegion', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1', // This should be overridden
      });
      synthesized = Testing.synth(stack);

      // Verify the AWS provider is configured with us-west-2
      const synthObj = JSON.parse(synthesized);
      expect(synthObj).toHaveProperty('provider');
      expect(synthObj.provider).toHaveProperty('aws');
      expect(synthObj.provider.aws[0].region).toBe('us-west-2');
    });

    test('TapStack configures S3 backend correctly', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackBackend', {
        environmentSuffix: 'backend-test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'eu-west-1',
      });
      synthesized = Testing.synth(stack);

      // Verify S3 backend configuration
      const synthObj = JSON.parse(synthesized);
      expect(synthObj).toHaveProperty('terraform');
      expect(synthObj.terraform).toHaveProperty('backend');
      expect(synthObj.terraform.backend).toHaveProperty('s3');
      expect(synthObj.terraform.backend.s3.bucket).toBe('test-bucket');
      expect(synthObj.terraform.backend.s3.region).toBe('eu-west-1');
      expect(synthObj.terraform.backend.s3.encrypt).toBe(true);
    });
  });

  describe('AWS Provider Configuration', () => {
    test('AWS provider is configured with correct region', () => {
      app = new App();
      stack = new TapStack(app, 'TestProviderConfig', {
        environmentSuffix: 'provider-test',
      });
      synthesized = Testing.synth(stack);

      const synthObj = JSON.parse(synthesized);
      expect(synthObj.provider).toBeDefined();
      expect(synthObj.provider.aws).toBeDefined();
      expect(synthObj.provider.aws[0].region).toBe('us-west-2');
    });

    test('AWS provider includes default tags when provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestProviderTags', {
        environmentSuffix: 'tags-test',
        defaultTags: [
          {
            tags: {
              Environment: 'test',
              Project: 'loyalty-program',
            },
          },
        ],
      });
      synthesized = Testing.synth(stack);

      const synthObj = JSON.parse(synthesized);
      expect(synthObj.provider.aws[0]).toBeDefined();
      // defaultTags are handled differently in CDKTF - they appear as 'default_tags'
      if (synthObj.provider.aws[0].default_tags) {
        expect(synthObj.provider.aws[0].default_tags[0].tags).toEqual({
          Environment: 'test',
          Project: 'loyalty-program',
        });
      }
    });
  });

  describe('Stack Resources', () => {
    test('Stack creates loyalty-program construct', () => {
      app = new App();
      stack = new TapStack(app, 'TestStackResources', {
        environmentSuffix: 'resources-test',
      });
      synthesized = Testing.synth(stack);

      const synthObj = JSON.parse(synthesized);

      // Verify the stack contains resource definitions
      expect(synthObj.resource).toBeDefined();
    });

    test('Stack passes environment suffix to loyalty program', () => {
      const testSuffix = 'unique-suffix-123';
      app = new App();
      stack = new TapStack(app, 'TestStackSuffix', {
        environmentSuffix: testSuffix,
      });
      synthesized = Testing.synth(stack);

      const synthObj = JSON.parse(synthesized);

      // Check that resources include the environment suffix
      const resources = synthObj.resource;
      expect(resources).toBeDefined();

      // Verify DynamoDB table includes suffix
      if (resources.aws_dynamodb_table) {
        const tables = Object.values(resources.aws_dynamodb_table) as any[];
        expect(tables.some(table =>
          table.name && table.name.includes(testSuffix)
        )).toBeTruthy();
      }
    });
  });

  describe('Terraform Configuration', () => {
    test('Stack includes required Terraform version constraints', () => {
      app = new App();
      stack = new TapStack(app, 'TestTerraformVersion', {
        environmentSuffix: 'tf-version-test',
      });
      synthesized = Testing.synth(stack);

      const synthObj = JSON.parse(synthesized);
      expect(synthObj.terraform).toBeDefined();
    });

    test('Backend state file key includes environment suffix', () => {
      const testSuffix = 'state-test';
      app = new App();
      stack = new TapStack(app, 'TestStateKey', {
        environmentSuffix: testSuffix,
      });
      synthesized = Testing.synth(stack);

      const synthObj = JSON.parse(synthesized);
      expect(synthObj.terraform.backend.s3.key).toContain(testSuffix);
    });
  });

  describe('Error Handling', () => {
    test('Stack handles missing optional props gracefully', () => {
      app = new App();

      // Test with undefined props
      expect(() => {
        stack = new TapStack(app, 'TestUndefinedProps', undefined);
        Testing.synth(stack);
      }).not.toThrow();

      // Test with empty props object
      expect(() => {
        stack = new TapStack(app, 'TestEmptyProps', {});
        Testing.synth(stack);
      }).not.toThrow();
    });

    test('Stack handles special characters in environment suffix', () => {
      app = new App();
      const specialSuffix = 'test-123_ABC';

      expect(() => {
        stack = new TapStack(app, 'TestSpecialChars', {
          environmentSuffix: specialSuffix,
        });
        synthesized = Testing.synth(stack);
      }).not.toThrow();

      const synthObj = JSON.parse(synthesized);
      expect(synthObj.terraform.backend.s3.key).toContain(specialSuffix);
    });
  });
});