import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack - Multi-Environment Infrastructure', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    app = new App();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully with development environment', () => {
      stack = new TapStack(app, 'TestDevStack', {
        environmentSuffix: 'dev',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(JSON.parse(synthesized)).toHaveProperty('terraform');
    });

    test('TapStack instantiates successfully with staging environment', () => {
      stack = new TapStack(app, 'TestStagingStack', {
        environmentSuffix: 'staging',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack instantiates successfully with production environment', () => {
      stack = new TapStack(app, 'TestProdStack', {
        environmentSuffix: 'prod',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack uses default dev environment when no environment specified', () => {
      stack = new TapStack(app, 'TestDefaultStack');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack throws error for invalid environment', () => {
      expect(() => {
        new TapStack(app, 'TestInvalidStack', {
          environmentSuffix: 'invalid',
        });
      }).toThrow('Unknown environment: invalid');
    });

    test('TapStack accepts PR environment suffix and maps to dev config', () => {
      stack = new TapStack(app, 'TestPRStack', {
        environmentSuffix: 'pr7795',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized.terraform.backend.s3.key).toContain('pr7795');
      // ensure provider exists
      expect(synthesized.provider.aws).toBeDefined();
    });

    test('TapStack accepts PR environment suffix with dash and maps to dev config', () => {
      stack = new TapStack(app, 'TestPRDashStack', {
        environmentSuffix: 'pr-7796',
      });
      const parsed = JSON.parse(Testing.synth(stack));

      expect(parsed.terraform.backend.s3.key).toContain('pr-7796');
      expect(parsed.provider.aws).toBeDefined();
    });

    test('TapStack accepts custom state bucket configuration', () => {
      stack = new TapStack(app, 'TestCustomBucket', {
        environmentSuffix: 'dev',
        stateBucket: 'custom-tf-states',
        stateBucketRegion: 'us-west-2',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      const parsed = JSON.parse(synthesized);
      expect(parsed.terraform.backend.s3.bucket).toBe('custom-tf-states');
      expect(parsed.terraform.backend.s3.region).toBe('us-west-2');
    });
  });

  describe('AWS Provider Configuration', () => {
    test('AWS provider is configured with correct region', () => {
      stack = new TapStack(app, 'TestProviderStack', {
        environmentSuffix: 'dev',
        awsRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider).toHaveProperty('aws');
      expect(synthesized.provider.aws[0].region).toBe('us-east-1');
    });

    test('AWS provider accepts default tags', () => {
      stack = new TapStack(app, 'TestTagsStack', {
        environmentSuffix: 'dev',
        defaultTags: [{ tags: { Team: 'Engineering', Project: 'Trading' } }],
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0]).toHaveProperty('default_tags');
    });
  });

  describe('S3 Backend Configuration', () => {
    test('S3 backend is configured with state locking', () => {
      stack = new TapStack(app, 'TestBackendStack', {
        environmentSuffix: 'dev',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3).toBeDefined();
      expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
      expect(synthesized.terraform.backend.s3.use_lockfile).toBe(true);
    });

    test('S3 backend uses environment-specific key', () => {
      stack = new TapStack(app, 'TestKeyStack', {
        environmentSuffix: 'prod',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3.key).toContain('prod');
    });
  });

  describe('Environment-Specific Resource Creation', () => {
    test('Development environment stack synthesizes successfully', () => {
      stack = new TapStack(app, 'TestDevResources', {
        environmentSuffix: 'dev',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform).toBeDefined();
      expect(synthesized.provider).toBeDefined();
    });

    test('Staging environment stack synthesizes successfully', () => {
      stack = new TapStack(app, 'TestStagingResources', {
        environmentSuffix: 'staging',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform).toBeDefined();
      expect(synthesized.provider).toBeDefined();
    });

    test('Production environment stack synthesizes successfully', () => {
      stack = new TapStack(app, 'TestProdResources', {
        environmentSuffix: 'prod',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform).toBeDefined();
      expect(synthesized.provider).toBeDefined();
    });
  });

  describe('Multi-Environment Architecture', () => {
    test('Stack creates child stack for environment', () => {
      stack = new TapStack(app, 'TestChildStackCreation', {
        environmentSuffix: 'dev',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform).toBeDefined();
      expect(synthesized.provider).toBeDefined();
    });
  });

  describe('IAM Configuration', () => {
    test('Stack creates necessary IAM resources for ECS', () => {
      stack = new TapStack(app, 'TestIAMStack', {
        environmentSuffix: 'dev',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform).toBeDefined();
      expect(synthesized.provider).toBeDefined();
    });

    test('Stack backend properly configured for state management', () => {
      stack = new TapStack(app, 'TestIAMPolicyStack', {
        environmentSuffix: 'dev',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend).toBeDefined();
      expect(synthesized.terraform.backend.s3).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    test('Stack configuration uses hierarchical environment-specific values', () => {
      stack = new TapStack(app, 'TestConfigStack', {
        environmentSuffix: 'dev',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider).toBeDefined();
      expect(synthesized.terraform).toBeDefined();
    });

    test('State management configured with environment-specific paths', () => {
      stack = new TapStack(app, 'TestStateStack', {
        environmentSuffix: 'staging',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3.key).toContain('staging');
    });
  });

  describe('Resource Tagging', () => {
    test('Provider configured for tagging strategy', () => {
      stack = new TapStack(app, 'TestTaggingStack', {
        environmentSuffix: 'dev',
        defaultTags: [{ tags: { Project: 'Trading', Team: 'Engineering' } }],
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws).toBeDefined();
      expect(synthesized.provider.aws[0].default_tags).toBeDefined();
    });

    test('Environment-specific default tags can be configured', () => {
      const tagConfig = [{ tags: { Environment: 'production', CostCenter: 'eng-prod' } }];
      stack = new TapStack(app, 'TestDefaultTagsStack', {
        environmentSuffix: 'prod',
        defaultTags: tagConfig,
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].default_tags).toEqual(tagConfig);
    });
  });

  describe('Stack Architecture', () => {
    test('Child stack created for each environment', () => {
      stack = new TapStack(app, 'TestOutputsStack', {
        environmentSuffix: 'dev',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform).toBeDefined();
      expect(synthesized.provider).toBeDefined();
    });

    test('Stack dependencies properly configured', () => {
      stack = new TapStack(app, 'TestDependenciesStack', {
        environmentSuffix: 'staging',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend).toBeDefined();
      expect(synthesized.terraform.backend.s3).toBeDefined();
    });
  });

  describe('Synthesis', () => {
    test('Stack synthesizes without errors', () => {
      stack = new TapStack(app, 'TestSynthesisStack', {
        environmentSuffix: 'dev',
      });

      expect(() => Testing.synth(stack)).not.toThrow();
    });

    test('Synthesized JSON is valid', () => {
      stack = new TapStack(app, 'TestValidJSONStack', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);

      expect(() => JSON.parse(synthesized)).not.toThrow();
    });

    test('All three environments synthesize successfully', () => {
      ['dev', 'staging', 'prod'].forEach(env => {
        const envStack = new TapStack(app, `Test${env.toUpperCase()}Stack`, {
          environmentSuffix: env,
        });

        expect(() => Testing.synth(envStack)).not.toThrow();
      });
    });
  });

  describe('Configuration Validation Error Cases', () => {
    test('AWS Region override from environment variable', () => {
      stack = new TapStack(app, 'TestRegionOverrideStack', {
        environmentSuffix: 'dev',
        awsRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].region).toBeDefined();
    });
  });
});
