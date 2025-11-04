import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;

  beforeEach(() => {
    app = new App();
  });

  describe('CDKTF Stack Synthesis Integration', () => {
    test('Stack synthesizes to valid Terraform JSON without errors', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'testenv';

      stack = new TapStack(app, `TapStack${environmentSuffix}`, {
        environmentSuffix,
        awsRegion: process.env.AWS_REGION || 'ap-northeast-2',
        stateBucket: process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states',
        stateBucketRegion: process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1',
      });

      const synthesized = Testing.synth(stack);

      expect(synthesized).toBeDefined();
      expect(() => JSON.parse(synthesized)).not.toThrow();

      const config = JSON.parse(synthesized);
      expect(config.provider).toBeDefined();
      expect(config.provider.aws).toBeDefined();
      expect(config.terraform).toBeDefined();
      expect(config.terraform.backend).toBeDefined();
    });

    test('Stack uses environment-specific configuration from environment variables', () => {
      const testEnvironment = 'integration-test';
      const testRegion = 'us-west-1';
      const testBucket = 'test-state-bucket';

      stack = new TapStack(app, `TapStack${testEnvironment}`, {
        environmentSuffix: testEnvironment,
        awsRegion: testRegion,
        stateBucket: testBucket,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      expect(config.provider.aws[0].region).toBe(testRegion);
      expect(config.terraform.backend.s3.bucket).toBe(testBucket);
      expect(config.terraform.backend.s3.key).toContain(testEnvironment);
    });

    test('Stack properly configures AWS provider with tags', () => {
      const tags = {
        tags: {
          Environment: 'integration',
          Repository: 'iac-test-automations',
          CommitAuthor: 'test-user',
        },
      };

      stack = new TapStack(app, 'TapStackIntegrationTags', {
        environmentSuffix: 'integration',
        defaultTags: tags,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      expect(config.provider.aws[0].default_tags).toBeDefined();
      expect(config.provider.aws[0].default_tags[0]).toMatchObject(tags);
    });

    test('Stack backend configuration supports state isolation by environment', () => {
      const environments = ['dev', 'staging', 'prod'];

      environments.forEach((env) => {
        const testStack = new TapStack(app, `TapStack${env}`, {
          environmentSuffix: env,
        });

        const synthesized = Testing.synth(testStack);
        const config = JSON.parse(synthesized);

        expect(config.terraform.backend.s3.key).toContain(`${env}/TapStack${env}.tfstate`);
      });
    });

    test('Stack handles concurrent multi-environment deployments', () => {
      const env1 = 'env1';
      const env2 = 'env2';

      const stack1 = new TapStack(app, `TapStack${env1}`, {
        environmentSuffix: env1,
      });

      const stack2 = new TapStack(app, `TapStack${env2}`, {
        environmentSuffix: env2,
      });

      const synth1 = Testing.synth(stack1);
      const synth2 = Testing.synth(stack2);

      const config1 = JSON.parse(synth1);
      const config2 = JSON.parse(synth2);

      expect(config1.terraform.backend.s3.key).not.toBe(config2.terraform.backend.s3.key);
      expect(config1.terraform.backend.s3.key).toContain(env1);
      expect(config2.terraform.backend.s3.key).toContain(env2);
    });
  });

  describe('Terraform Backend State Management Integration', () => {
    test('Backend configuration includes encryption for security', () => {
      stack = new TapStack(app, 'TapStackSecure', {
        environmentSuffix: 'secure',
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      expect(config.terraform.backend.s3.encrypt).toBe(true);
    });

    test('Backend configuration uses state locking', () => {
      stack = new TapStack(app, 'TapStackLocking', {
        environmentSuffix: 'locking',
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      expect(config.terraform.backend.s3.use_lockfile).toBe(true);
    });

    test('Backend supports multi-region state bucket configuration', () => {
      const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-northeast-2'];

      regions.forEach((region) => {
        const testStack = new TapStack(app, `TapStack${region.replace(/-/g, '')}`, {
          environmentSuffix: 'test',
          stateBucketRegion: region,
        });

        const synthesized = Testing.synth(testStack);
        const config = JSON.parse(synthesized);

        expect(config.terraform.backend.s3.region).toBe(region);
      });
    });
  });

  describe('Multi-Region AWS Provider Integration', () => {
    test('Stack can be configured for different AWS regions', () => {
      const regions = ['us-east-1', 'eu-central-1', 'ap-northeast-2', 'sa-east-1'];

      regions.forEach((region) => {
        const testStack = new TapStack(app, `TapStack${region.replace(/-/g, '')}`, {
          environmentSuffix: 'test',
          awsRegion: region,
        });

        const synthesized = Testing.synth(testStack);
        const config = JSON.parse(synthesized);

        expect(config.provider.aws[0].region).toBe(region);
      });
    });

    test('Stack correctly handles ap-northeast-2 region specified in metadata', () => {
      const metadataRegion = 'ap-northeast-2';

      stack = new TapStack(app, 'TapStackAPNortheast2', {
        environmentSuffix: 'duoct',
        awsRegion: metadataRegion,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      expect(config.provider.aws[0].region).toBe(metadataRegion);
    });
  });

  describe('Stack Deployment Readiness', () => {
    test('Synthesized Terraform configuration is deployment-ready', () => {
      stack = new TapStack(app, 'TapStackDeployment', {
        environmentSuffix: process.env.ENVIRONMENT_SUFFIX || 'deploy-test',
        awsRegion: 'ap-northeast-2',
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Verify all required sections exist for deployment
      expect(config.provider).toBeDefined();
      expect(config.terraform).toBeDefined();
      expect(config.terraform.backend).toBeDefined();
      expect(config.terraform.required_providers).toBeDefined();
      expect(config.terraform.required_providers.aws).toBeDefined();
    });

    test('Stack configuration follows infrastructure best practices', () => {
      stack = new TapStack(app, 'TapStackBestPractices', {
        environmentSuffix: 'best-practice',
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Backend encryption enabled
      expect(config.terraform.backend.s3.encrypt).toBe(true);

      // State locking enabled
      expect(config.terraform.backend.s3.use_lockfile).toBe(true);

      // Provider properly configured
      expect(config.provider.aws).toHaveLength(1);
      expect(config.provider.aws[0].region).toBeDefined();
    });
  });

  describe('Resource Naming and Tagging Integration', () => {
    test('Stack name includes environment suffix for resource isolation', () => {
      const suffix = 'isolated';

      stack = new TapStack(app, `TapStack${suffix}`, {
        environmentSuffix: suffix,
      });

      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain(suffix);
    });

    test('Default tags propagate to all resources when configured', () => {
      const tags = {
        tags: {
          Environment: 'production',
          CostCenter: 'engineering',
          Project: 'infrastructure',
        },
      };

      stack = new TapStack(app, 'TapStackPropagation', {
        environmentSuffix: 'prod',
        defaultTags: tags,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      expect(config.provider.aws[0].default_tags[0].tags).toMatchObject(tags.tags);
    });
  });
});
