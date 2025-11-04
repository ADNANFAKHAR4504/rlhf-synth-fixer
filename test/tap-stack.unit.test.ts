import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    app = new App();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully with custom props', () => {
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('"region": "us-west-2"');
      expect(synthesized).toContain('"bucket": "custom-state-bucket"');
    });

    test('TapStack uses default values when no props provided', () => {
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('"region": "us-east-1"');
      expect(synthesized).toContain('"bucket": "iac-rlhf-tf-states"');
    });

    test('TapStack handles partial props correctly', () => {
      stack = new TapStack(app, 'TestTapStackPartial', {
        environmentSuffix: 'staging',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('staging');
    });

    test('TapStack handles custom default tags', () => {
      const customTags = {
        tags: {
          Environment: 'test',
          Owner: 'test-team',
        },
      };

      stack = new TapStack(app, 'TestTapStackTags', {
        environmentSuffix: 'test',
        defaultTags: customTags,
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('test-team');
    });
  });

  describe('AWS Provider Configuration', () => {
    test('AWS Provider is configured with correct region', () => {
      stack = new TapStack(app, 'TestAwsProvider', {
        awsRegion: 'eu-west-1',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"region": "eu-west-1"');
      expect(synthesized).toContain('"aws"');
    });

    test('AWS Provider uses default region when not specified', () => {
      stack = new TapStack(app, 'TestAwsProviderDefault');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"region": "us-east-1"');
    });

    test('AWS Provider accepts default tags', () => {
      const tags = {
        tags: {
          Project: 'TAP',
          ManagedBy: 'CDKTF',
        },
      };

      stack = new TapStack(app, 'TestAwsProviderTags', {
        defaultTags: tags,
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('Project');
      expect(synthesized).toContain('TAP');
    });
  });

  describe('S3 Backend Configuration', () => {
    test('S3 Backend is configured with correct bucket', () => {
      stack = new TapStack(app, 'TestS3Backend', {
        stateBucket: 'my-terraform-states',
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"bucket": "my-terraform-states"');
      expect(synthesized).toContain('dev/TestS3Backend.tfstate');
    });

    test('S3 Backend uses default bucket when not specified', () => {
      stack = new TapStack(app, 'TestS3BackendDefault');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"bucket": "iac-rlhf-tf-states"');
    });

    test('S3 Backend key includes environment suffix', () => {
      stack = new TapStack(app, 'TestS3BackendKey', {
        environmentSuffix: 'qa',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('qa/TestS3BackendKey.tfstate');
    });

    test('S3 Backend has encryption enabled', () => {
      stack = new TapStack(app, 'TestS3BackendEncryption');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"encrypt": true');
    });

    test('S3 Backend has state locking enabled', () => {
      stack = new TapStack(app, 'TestS3BackendLocking');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"use_lockfile": true');
    });

    test('S3 Backend uses correct region', () => {
      stack = new TapStack(app, 'TestS3BackendRegion', {
        stateBucketRegion: 'ap-northeast-1',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"region": "ap-northeast-1"');
    });
  });

  describe('Environment Suffix Handling', () => {
    test('Environment suffix defaults to dev when not provided', () => {
      stack = new TapStack(app, 'TestEnvSuffixDefault');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('dev/TestEnvSuffixDefault.tfstate');
    });

    test('Environment suffix is used in state file key', () => {
      stack = new TapStack(app, 'TestEnvSuffixCustom', {
        environmentSuffix: 'production',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('production/TestEnvSuffixCustom.tfstate');
    });

    test('Environment suffix handles special characters', () => {
      stack = new TapStack(app, 'TestEnvSuffixSpecial', {
        environmentSuffix: 'pr-123',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('pr-123/TestEnvSuffixSpecial.tfstate');
    });
  });

  describe('Synthesized Output', () => {
    test('Synthesized output is valid JSON', () => {
      stack = new TapStack(app, 'TestSynthOutput');
      synthesized = Testing.synth(stack);

      expect(() => JSON.parse(synthesized)).not.toThrow();
    });

    test('Synthesized output contains terraform configuration', () => {
      stack = new TapStack(app, 'TestTerraformConfig');
      synthesized = Testing.synth(stack);

      const config = JSON.parse(synthesized);
      expect(config.terraform).toBeDefined();
      expect(config.terraform.backend).toBeDefined();
      expect(config.terraform.backend.s3).toBeDefined();
    });

    test('Synthesized output contains provider configuration', () => {
      stack = new TapStack(app, 'TestProviderConfig');
      synthesized = Testing.synth(stack);

      const config = JSON.parse(synthesized);
      expect(config.provider).toBeDefined();
      expect(config.provider.aws).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('TapStack handles empty environment suffix', () => {
      stack = new TapStack(app, 'TestEmptyEnvSuffix', {
        environmentSuffix: '',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack handles undefined props gracefully', () => {
      stack = new TapStack(app, 'TestUndefinedProps', undefined);
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack handles very long environment suffix', () => {
      const longSuffix = 'a'.repeat(100);
      stack = new TapStack(app, 'TestLongEnvSuffix', {
        environmentSuffix: longSuffix,
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toContain(longSuffix);
    });
  });
})
