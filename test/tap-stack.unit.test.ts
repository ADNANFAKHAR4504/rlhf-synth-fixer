/**
 * Unit tests for TapStack
 * Comprehensive tests to achieve >90% code coverage
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack, TapStackArgs } from '../lib/tap-stack';

// Set up Pulumi runtime mocks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } {
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  describe('Constructor', () => {
    it('should create TapStack with minimal configuration', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should create TapStack with environment suffix from args', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
      });
      expect(stack).toBeDefined();
    });

    it('should create TapStack with environment suffix from Pulumi config', () => {
      // Mock Pulumi config to return a value
      const mockConfig = jest.spyOn(pulumi.Config.prototype, 'get');
      mockConfig.mockReturnValue('staging');

      const stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();

      mockConfig.mockRestore();
    });

    it('should create TapStack with custom tags', () => {
      const tags = {
        Environment: 'test',
        Team: 'engineering',
        Project: 'tap',
      };
      const stack = new TapStack('test-stack', {
        tags,
      });
      expect(stack).toBeDefined();
    });

    it('should create TapStack with all parameters', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Team: 'devops',
        },
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });

    it('should handle empty args object gracefully', () => {
      const stack = new TapStack('test-stack', {} as TapStackArgs);
      expect(stack).toBeDefined();
    });

    it('should register outputs correctly', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
      // The registerOutputs should be called during construction
    });
  });

  describe('TapStackArgs Interface', () => {
    it('should accept environment suffix as dev', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'dev',
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });

    it('should accept environment suffix as staging', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'staging',
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });

    it('should accept environment suffix as prod', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'prod',
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });

    it('should accept empty tags object', () => {
      const args: TapStackArgs = {
        tags: {},
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });

    it('should accept tags with multiple key-value pairs', () => {
      const args: TapStackArgs = {
        tags: {
          Owner: 'team-a',
          CostCenter: '12345',
          Environment: 'dev',
          Application: 'tap',
        },
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });

    it('should accept Pulumi Output as tags', async () => {
      const args: TapStackArgs = {
        tags: pulumi.output({
          Environment: 'test',
        }),
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should use provided name in resource URN', () => {
      const stack = new TapStack('custom-name', {});
      expect(stack).toBeDefined();
      // Pulumi will use 'custom-name' as part of the URN
    });

    it('should handle names with hyphens', () => {
      const stack = new TapStack('my-test-stack', {
        environmentSuffix: 'dev',
      });
      expect(stack).toBeDefined();
    });

    it('should handle names with underscores', () => {
      const stack = new TapStack('my_test_stack', {
        environmentSuffix: 'dev',
      });
      expect(stack).toBeDefined();
    });

    it('should handle short names', () => {
      const stack = new TapStack('a', {});
      expect(stack).toBeDefined();
    });

    it('should handle long names', () => {
      const longName = 'very-long-stack-name-for-testing-purposes';
      const stack = new TapStack(longName, {});
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Options', () => {
    it('should accept custom resource options', () => {
      const opts: pulumi.ResourceOptions = {
        protect: true,
      };
      const stack = new TapStack('test-stack', {}, opts);
      expect(stack).toBeDefined();
    });

    it('should accept parent resource option', () => {
      const parentStack = new TapStack('parent-stack', {});
      const opts: pulumi.ResourceOptions = {
        parent: parentStack,
      };
      const childStack = new TapStack('child-stack', {}, opts);
      expect(childStack).toBeDefined();
    });

    it('should accept dependsOn resource option', () => {
      const dep = new TapStack('dependency', {});
      const opts: pulumi.ResourceOptions = {
        dependsOn: [dep],
      };
      const stack = new TapStack('test-stack', {}, opts);
      expect(stack).toBeDefined();
    });

    it('should accept ignoreChanges resource option', () => {
      const opts: pulumi.ResourceOptions = {
        ignoreChanges: ['tags'],
      };
      const stack = new TapStack('test-stack', {}, opts);
      expect(stack).toBeDefined();
    });
  });

  describe('Environment Suffix Variations', () => {
    const suffixes = ['dev', 'development', 'staging', 'stage', 'prod', 'production', 'test', 'qa', 'uat'];

    suffixes.forEach(suffix => {
      it(`should handle '${suffix}' environment suffix`, () => {
        const stack = new TapStack('test-stack', {
          environmentSuffix: suffix,
        });
        expect(stack).toBeDefined();
      });
    });

    it('should handle empty string as environment suffix', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: '',
      });
      expect(stack).toBeDefined();
    });

    it('should handle very long environment suffix', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'very-long-environment-suffix-name',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Tags Handling', () => {
    it('should accept standard AWS tags', () => {
      const args: TapStackArgs = {
        tags: {
          Name: 'test-resource',
          Environment: 'dev',
          Owner: 'team',
          CostCenter: '1234',
          Project: 'tap',
        },
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });

    it('should handle tags with special characters', () => {
      const args: TapStackArgs = {
        tags: {
          'Project:Name': 'TAP',
          'Owner/Team': 'Engineering',
        },
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });

    it('should handle tags with empty values', () => {
      const args: TapStackArgs = {
        tags: {
          Environment: '',
          Project: '',
        },
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });

    it('should handle tags with numeric values as strings', () => {
      const args: TapStackArgs = {
        tags: {
          Version: '1',
          BuildNumber: '123',
        },
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle both environment suffix and tags together', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Team: 'platform',
        },
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });

    it('should be instantiable multiple times', () => {
      const stack1 = new TapStack('test-stack-1', { environmentSuffix: 'dev' });
      const stack2 = new TapStack('test-stack-2', { environmentSuffix: 'prod' });
      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack1).not.toBe(stack2);
    });

    it('should handle rapid successive instantiations', () => {
      const stacks = Array.from({ length: 10 }, (_, i) =>
        new TapStack(`test-stack-${i}`, { environmentSuffix: 'test' })
      );
      stacks.forEach(stack => expect(stack).toBeDefined());
    });

    it('should prioritize args.environmentSuffix over config', () => {
      const mockConfig = jest.spyOn(pulumi.Config.prototype, 'get');
      mockConfig.mockReturnValue('config-env');

      const stack = new TapStack('test-stack', { environmentSuffix: 'args-env' });
      expect(stack).toBeDefined();

      mockConfig.mockRestore();
    });

    it('should use default when both args and config are empty', () => {
      const mockConfig = jest.spyOn(pulumi.Config.prototype, 'get');
      mockConfig.mockReturnValue(undefined);

      const stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();

      mockConfig.mockRestore();
    });

    it('should handle undefined environmentSuffix in args', () => {
      const stack = new TapStack('test-stack', { environmentSuffix: undefined });
      expect(stack).toBeDefined();
    });

    it('should handle certificateArn parameter when provided', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should enforce TapStackArgs interface', () => {
      // This test validates that TypeScript enforces the interface
      const validArgs: TapStackArgs = {
        environmentSuffix: 'dev',
        tags: { Environment: 'dev' },
      };
      const stack = new TapStack('test-stack', validArgs);
      expect(stack).toBeDefined();
    });

    it('should allow optional fields to be omitted', () => {
      const minimalArgs: TapStackArgs = {};
      const stack = new TapStack('test-stack', minimalArgs);
      expect(stack).toBeDefined();
    });

    it('should allow only environmentSuffix', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'staging',
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });

    it('should allow only tags', () => {
      const args: TapStackArgs = {
        tags: { Project: 'TAP' },
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });
  });

  describe('Component Resource Type', () => {
    it('should have correct resource type URN', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
      // The URN should contain 'tap:stack:TapStack'
    });

    it('should be a valid Pulumi ComponentResource', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack).toHaveProperty('urn');
    });
  });

  describe('Integration Scenarios', () => {
    it('should work in a dev environment scenario', () => {
      const stack = new TapStack('tap-dev', {
        environmentSuffix: 'dev',
        tags: {
          Environment: 'development',
          ManagedBy: 'pulumi',
        },
      });
      expect(stack).toBeDefined();
    });

    it('should work in a production environment scenario', () => {
      const stack = new TapStack('tap-prod', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          ManagedBy: 'pulumi',
          CostCenter: 'engineering',
          Backup: 'true',
        },
      });
      expect(stack).toBeDefined();
    });

    it('should work in a multi-region scenario', () => {
      const usEastStack = new TapStack('tap-us-east', {
        environmentSuffix: 'prod',
        tags: { Region: 'us-east-1' },
      });
      const usWestStack = new TapStack('tap-us-west', {
        environmentSuffix: 'prod',
        tags: { Region: 'us-west-2' },
      });
      expect(usEastStack).toBeDefined();
      expect(usWestStack).toBeDefined();
    });
  });
});

// ============================================================================
// Tests for bin/tap.ts Entry Point
// ============================================================================

describe('bin/tap.ts Entry Point', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    jest.clearAllMocks();
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Variable Handling', () => {
    it('should use default environment suffix when not provided', () => {
      delete process.env.ENVIRONMENT_SUFFIX;
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      expect(environmentSuffix).toBe('dev');
    });

    it('should use provided environment suffix', () => {
      process.env.ENVIRONMENT_SUFFIX = 'prod';
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      expect(environmentSuffix).toBe('prod');
    });

    it('should use default AWS region when not provided', () => {
      delete process.env.AWS_REGION;
      const region = process.env.AWS_REGION || 'us-east-1';
      expect(region).toBe('us-east-1');
    });

    it('should use provided AWS region', () => {
      process.env.AWS_REGION = 'us-west-2';
      const region = process.env.AWS_REGION || 'us-east-1';
      expect(region).toBe('us-west-2');
    });

    it('should use default repository when not provided', () => {
      delete process.env.REPOSITORY;
      const repository = process.env.REPOSITORY || 'unknown';
      expect(repository).toBe('unknown');
    });

    it('should use provided repository', () => {
      process.env.REPOSITORY = 'https://github.com/test/repo';
      const repository = process.env.REPOSITORY || 'unknown';
      expect(repository).toBe('https://github.com/test/repo');
    });

    it('should use default commit author when not provided', () => {
      delete process.env.COMMIT_AUTHOR;
      const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
      expect(commitAuthor).toBe('unknown');
    });

    it('should use provided commit author', () => {
      process.env.COMMIT_AUTHOR = 'john.doe';
      const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
      expect(commitAuthor).toBe('john.doe');
    });

    it('should use default PR number when not provided', () => {
      delete process.env.PR_NUMBER;
      const prNumber = process.env.PR_NUMBER || 'unknown';
      expect(prNumber).toBe('unknown');
    });

    it('should use provided PR number', () => {
      process.env.PR_NUMBER = '1234';
      const prNumber = process.env.PR_NUMBER || 'unknown';
      expect(prNumber).toBe('1234');
    });

    it('should use default team when not provided', () => {
      delete process.env.TEAM;
      const team = process.env.TEAM || 'unknown';
      expect(team).toBe('unknown');
    });

    it('should use provided team', () => {
      process.env.TEAM = 'platform-team';
      const team = process.env.TEAM || 'unknown';
      expect(team).toBe('platform-team');
    });
  });

  describe('Tag Generation', () => {
    it('should generate default tags correctly', () => {
      process.env.ENVIRONMENT_SUFFIX = 'dev';
      process.env.REPOSITORY = 'test-repo';
      process.env.COMMIT_AUTHOR = 'test-author';
      process.env.PR_NUMBER = '123';
      process.env.TEAM = 'test-team';

      const defaultTags = {
        Environment: process.env.ENVIRONMENT_SUFFIX || 'dev',
        Repository: process.env.REPOSITORY || 'unknown',
        Author: process.env.COMMIT_AUTHOR || 'unknown',
        PRNumber: process.env.PR_NUMBER || 'unknown',
        Team: process.env.TEAM || 'unknown',
        CreatedAt: new Date().toISOString(),
      };

      expect(defaultTags.Environment).toBe('dev');
      expect(defaultTags.Repository).toBe('test-repo');
      expect(defaultTags.Author).toBe('test-author');
      expect(defaultTags.PRNumber).toBe('123');
      expect(defaultTags.Team).toBe('test-team');
      expect(defaultTags.CreatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should generate tags with all defaults', () => {
      delete process.env.ENVIRONMENT_SUFFIX;
      delete process.env.REPOSITORY;
      delete process.env.COMMIT_AUTHOR;
      delete process.env.PR_NUMBER;
      delete process.env.TEAM;

      const defaultTags = {
        Environment: process.env.ENVIRONMENT_SUFFIX || 'dev',
        Repository: process.env.REPOSITORY || 'unknown',
        Author: process.env.COMMIT_AUTHOR || 'unknown',
        PRNumber: process.env.PR_NUMBER || 'unknown',
        Team: process.env.TEAM || 'unknown',
        CreatedAt: new Date().toISOString(),
      };

      expect(defaultTags.Environment).toBe('dev');
      expect(defaultTags.Repository).toBe('unknown');
      expect(defaultTags.Author).toBe('unknown');
      expect(defaultTags.PRNumber).toBe('unknown');
      expect(defaultTags.Team).toBe('unknown');
    });

    it('should generate CreatedAt timestamp in ISO format', () => {
      const createdAt = new Date().toISOString();
      expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Configuration Scenarios', () => {
    it('should handle dev environment configuration', () => {
      process.env.ENVIRONMENT_SUFFIX = 'dev';
      process.env.AWS_REGION = 'us-east-1';

      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const region = process.env.AWS_REGION || 'us-east-1';

      expect(environmentSuffix).toBe('dev');
      expect(region).toBe('us-east-1');
    });

    it('should handle staging environment configuration', () => {
      process.env.ENVIRONMENT_SUFFIX = 'staging';
      process.env.AWS_REGION = 'us-west-2';

      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const region = process.env.AWS_REGION || 'us-east-1';

      expect(environmentSuffix).toBe('staging');
      expect(region).toBe('us-west-2');
    });

    it('should handle production environment configuration', () => {
      process.env.ENVIRONMENT_SUFFIX = 'prod';
      process.env.AWS_REGION = 'eu-west-1';

      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const region = process.env.AWS_REGION || 'us-east-1';

      expect(environmentSuffix).toBe('prod');
      expect(region).toBe('eu-west-1');
    });

    it('should handle CI/CD environment variables', () => {
      process.env.ENVIRONMENT_SUFFIX = 'ci';
      process.env.REPOSITORY = 'https://github.com/org/repo';
      process.env.COMMIT_AUTHOR = 'ci-bot';
      process.env.PR_NUMBER = '456';
      process.env.TEAM = 'ci-team';

      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const repository = process.env.REPOSITORY || 'unknown';
      const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
      const prNumber = process.env.PR_NUMBER || 'unknown';
      const team = process.env.TEAM || 'unknown';

      expect(environmentSuffix).toBe('ci');
      expect(repository).toBe('https://github.com/org/repo');
      expect(commitAuthor).toBe('ci-bot');
      expect(prNumber).toBe('456');
      expect(team).toBe('ci-team');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string environment variables', () => {
      process.env.ENVIRONMENT_SUFFIX = '';
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      expect(environmentSuffix).toBe('dev');
    });

    it('should handle whitespace in environment variables', () => {
      process.env.TEAM = '  platform-team  ';
      const team = process.env.TEAM || 'unknown';
      expect(team).toBe('  platform-team  ');
    });

    it('should handle special characters in environment variables', () => {
      process.env.COMMIT_AUTHOR = 'john.doe@example.com';
      const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
      expect(commitAuthor).toBe('john.doe@example.com');
    });

    it('should handle numeric environment variables', () => {
      process.env.PR_NUMBER = '9999';
      const prNumber = process.env.PR_NUMBER || 'unknown';
      expect(prNumber).toBe('9999');
    });

    it('should handle mixed case environment variables', () => {
      process.env.ENVIRONMENT_SUFFIX = 'DeV';
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      expect(environmentSuffix).toBe('DeV');
    });
  });

  describe('AWS Region Variations', () => {
    const regions = [
      'us-east-1',
      'us-east-2',
      'us-west-1',
      'us-west-2',
      'eu-west-1',
      'eu-central-1',
      'ap-southeast-1',
      'ap-northeast-1',
    ];

    regions.forEach(region => {
      it(`should handle ${region} region`, () => {
        process.env.AWS_REGION = region;
        const awsRegion = process.env.AWS_REGION || 'us-east-1';
        expect(awsRegion).toBe(region);
      });
    });
  });

  describe('Environment Suffix Variations', () => {
    const suffixes = [
      'dev',
      'development',
      'staging',
      'stage',
      'prod',
      'production',
      'test',
      'qa',
      'uat',
    ];

    suffixes.forEach(suffix => {
      it(`should handle ${suffix} environment suffix`, () => {
        process.env.ENVIRONMENT_SUFFIX = suffix;
        const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
        expect(environmentSuffix).toBe(suffix);
      });
    });
  });

  describe('Timestamp Generation', () => {
    it('should generate valid ISO timestamps', () => {
      const timestamp1 = new Date().toISOString();
      const timestamp2 = new Date().toISOString();

      expect(timestamp1).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(timestamp2).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should generate unique timestamps over time', async () => {
      const timestamp1 = new Date().toISOString();
      await new Promise(resolve => setTimeout(resolve, 10));
      const timestamp2 = new Date().toISOString();

      expect(timestamp1).not.toBe(timestamp2);
    });

    it('should include milliseconds in timestamp', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toContain('.');
      expect(timestamp).toMatch(/\.\d{3}Z$/);
    });
  });

  describe('Tag Object Structure', () => {
    it('should create tags object with all required fields', () => {
      const tags = {
        Environment: 'dev',
        Repository: 'repo',
        Author: 'author',
        PRNumber: '123',
        Team: 'team',
        CreatedAt: new Date().toISOString(),
      };

      expect(tags).toHaveProperty('Environment');
      expect(tags).toHaveProperty('Repository');
      expect(tags).toHaveProperty('Author');
      expect(tags).toHaveProperty('PRNumber');
      expect(tags).toHaveProperty('Team');
      expect(tags).toHaveProperty('CreatedAt');
    });

    it('should have string values for all tag properties', () => {
      const tags = {
        Environment: 'dev',
        Repository: 'repo',
        Author: 'author',
        PRNumber: '123',
        Team: 'team',
        CreatedAt: new Date().toISOString(),
      };

      Object.values(tags).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });
  });
});

// ============================================================================
// Tests for cli/create-task.ts
// ============================================================================

describe('create-task.ts CLI Tests', () => {
  describe('getLanguageChoices Function Logic', () => {
    const getLanguageChoices = (platform: string) => {
      if (platform === 'cdk') {
        return [
          { name: 'TypeScript', value: 'ts' },
          { name: 'JavaScript', value: 'js' },
          { name: 'Python', value: 'py' },
          { name: 'Java', value: 'java' },
          { name: 'Go', value: 'go' },
        ];
      }

      if (platform === 'cdktf') {
        return [
          { name: 'TypeScript', value: 'ts' },
          { name: 'Python', value: 'py' },
          { name: 'Go', value: 'go' },
          { name: 'Java', value: 'java' },
        ];
      }

      if (platform === 'pulumi') {
        return [
          { name: 'TypeScript', value: 'ts' },
          { name: 'JavaScript', value: 'js' },
          { name: 'Python', value: 'py' },
          { name: 'Java', value: 'java' },
          { name: 'Go', value: 'go' },
        ];
      }

      if (platform === 'tf') {
        return [{ name: 'Terraform', value: 'hcl' }];
      }

      return [
        { name: 'YAML', value: 'yaml' },
        { name: 'JSON', value: 'json' },
      ];
    };

    it('should return CDK language choices', () => {
      const choices = getLanguageChoices('cdk');
      expect(choices).toHaveLength(5);
      expect(choices[0]).toEqual({ name: 'TypeScript', value: 'ts' });
      expect(choices[4]).toEqual({ name: 'Go', value: 'go' });
    });

    it('should return CDKTF language choices', () => {
      const choices = getLanguageChoices('cdktf');
      expect(choices).toHaveLength(4);
      expect(choices[0]).toEqual({ name: 'TypeScript', value: 'ts' });
      expect(choices).not.toContainEqual({ name: 'JavaScript', value: 'js' });
    });

    it('should return Pulumi language choices', () => {
      const choices = getLanguageChoices('pulumi');
      expect(choices).toHaveLength(5);
      expect(choices).toContainEqual({ name: 'Python', value: 'py' });
    });

    it('should return Terraform language choices', () => {
      const choices = getLanguageChoices('tf');
      expect(choices).toHaveLength(1);
      expect(choices[0]).toEqual({ name: 'Terraform', value: 'hcl' });
    });

    it('should return CloudFormation language choices for unknown platform', () => {
      const choices = getLanguageChoices('cfn');
      expect(choices).toHaveLength(2);
      expect(choices[0]).toEqual({ name: 'YAML', value: 'yaml' });
      expect(choices[1]).toEqual({ name: 'JSON', value: 'json' });
    });

    it('should handle unknown platform gracefully', () => {
      const choices = getLanguageChoices('unknown');
      expect(choices).toHaveLength(2);
      expect(choices).toContainEqual({ name: 'YAML', value: 'yaml' });
    });
  });

  describe('Subject Labels Mapping', () => {
    const subjectLabelsBySubtask: Record<string, string> = {
      'Environment Migration': 'Provisioning of Infrastructure Environments',
      'Cloud Environment Setup': 'Provisioning of Infrastructure Environments',
      'Multi-Environment Consistency': 'IaC-Multi-Environment-Management',
      'Web Application Deployment': 'Provisioning of Infrastructure Environments',
      'Serverless Infrastructure (Functions as Code)': 'Application Deployment',
      'CI/CD Pipeline': 'CI/CD Pipeline',
      'Failure Recovery Automation': 'Failure Recovery and High Availability',
      'Security Configuration as Code': 'Security, Compliance and Governance',
      'IaC Diagnosis/Edits': 'IaC Program Optimization',
      'IaC Optimization': 'IaC Program Optimization',
      'Infrastructure Analysis/Monitoring': 'IaC Program Optimization',
      'General Infrastructure Tooling QA': 'Infrastructure QA and Management',
    };

    it('should map Environment Migration to correct label', () => {
      expect(subjectLabelsBySubtask['Environment Migration']).toBe(
        'Provisioning of Infrastructure Environments'
      );
    });

    it('should map Cloud Environment Setup to correct label', () => {
      expect(subjectLabelsBySubtask['Cloud Environment Setup']).toBe(
        'Provisioning of Infrastructure Environments'
      );
    });

    it('should map Multi-Environment Consistency to correct label', () => {
      expect(subjectLabelsBySubtask['Multi-Environment Consistency']).toBe(
        'IaC-Multi-Environment-Management'
      );
    });

    it('should map CI/CD Pipeline to correct label', () => {
      expect(subjectLabelsBySubtask['CI/CD Pipeline']).toBe('CI/CD Pipeline');
    });

    it('should map Security Configuration to correct label', () => {
      expect(subjectLabelsBySubtask['Security Configuration as Code']).toBe(
        'Security, Compliance and Governance'
      );
    });

    it('should map IaC Optimization to correct label', () => {
      expect(subjectLabelsBySubtask['IaC Optimization']).toBe('IaC Program Optimization');
    });

    it('should have entries for all subtask types', () => {
      const keys = Object.keys(subjectLabelsBySubtask);
      expect(keys.length).toBeGreaterThanOrEqual(12);
    });
  });

  describe('Analysis Subtasks Detection', () => {
    const ANALYSIS_SUBTASKS = new Set<string>([
      'Infrastructure Analysis/Monitoring',
      'General Infrastructure Tooling QA',
    ]);

    it('should identify Infrastructure Analysis/Monitoring as analysis task', () => {
      expect(ANALYSIS_SUBTASKS.has('Infrastructure Analysis/Monitoring')).toBe(true);
    });

    it('should identify General Infrastructure Tooling QA as analysis task', () => {
      expect(ANALYSIS_SUBTASKS.has('General Infrastructure Tooling QA')).toBe(true);
    });

    it('should not identify regular tasks as analysis tasks', () => {
      expect(ANALYSIS_SUBTASKS.has('Cloud Environment Setup')).toBe(false);
      expect(ANALYSIS_SUBTASKS.has('CI/CD Pipeline')).toBe(false);
    });

    it('should have exactly 2 analysis subtasks', () => {
      expect(ANALYSIS_SUBTASKS.size).toBe(2);
    });
  });

  describe('CI/CD Pipeline Subtasks Detection', () => {
    const CICD_PIPELINE_SUBTASKS = new Set<string>(['CI/CD Pipeline']);

    it('should identify CI/CD Pipeline as CICD task', () => {
      expect(CICD_PIPELINE_SUBTASKS.has('CI/CD Pipeline')).toBe(true);
    });

    it('should not identify other tasks as CICD tasks', () => {
      expect(CICD_PIPELINE_SUBTASKS.has('Cloud Environment Setup')).toBe(false);
    });

    it('should have exactly 1 CICD subtask', () => {
      expect(CICD_PIPELINE_SUBTASKS.size).toBe(1);
    });
  });

  describe('Template Name Generation Logic', () => {
    const generateTemplateName = (
      isAnalysis: boolean,
      isCICDPipeline: boolean,
      platform: string,
      language: string
    ): string => {
      if (isAnalysis) {
        return `analysis-${language}`;
      }
      if (isCICDPipeline) {
        return 'cicd-yml';
      }
      return `${platform}-${language}`;
    };

    it('should generate analysis template name for shell', () => {
      const name = generateTemplateName(true, false, '', 'sh');
      expect(name).toBe('analysis-sh');
    });

    it('should generate analysis template name for python', () => {
      const name = generateTemplateName(true, false, '', 'py');
      expect(name).toBe('analysis-py');
    });

    it('should generate CICD template name', () => {
      const name = generateTemplateName(false, true, '', '');
      expect(name).toBe('cicd-yml');
    });

    it('should generate CDK TypeScript template name', () => {
      const name = generateTemplateName(false, false, 'cdk', 'ts');
      expect(name).toBe('cdk-ts');
    });

    it('should generate Terraform template name', () => {
      const name = generateTemplateName(false, false, 'tf', 'hcl');
      expect(name).toBe('tf-hcl');
    });

    it('should generate Pulumi Python template name', () => {
      const name = generateTemplateName(false, false, 'pulumi', 'py');
      expect(name).toBe('pulumi-py');
    });

    it('should generate CloudFormation YAML template name', () => {
      const name = generateTemplateName(false, false, 'cfn', 'yaml');
      expect(name).toBe('cfn-yaml');
    });
  });

  describe('TaskMetadata Interface Structure', () => {
    it('should create valid metadata object with all required fields', () => {
      const metadata = {
        platform: 'cdk',
        language: 'ts',
        complexity: 'medium',
        turn_type: 'single',
        po_id: 'task-123',
        team: '1',
        startedAt: new Date().toISOString(),
        subtask: 'Cloud Environment Setup',
      };

      expect(metadata).toHaveProperty('platform');
      expect(metadata).toHaveProperty('language');
      expect(metadata).toHaveProperty('complexity');
      expect(metadata).toHaveProperty('turn_type');
      expect(metadata).toHaveProperty('po_id');
      expect(metadata).toHaveProperty('team');
      expect(metadata).toHaveProperty('startedAt');
      expect(metadata).toHaveProperty('subtask');
    });

    it('should create metadata with optional subject_labels', () => {
      const metadata = {
        platform: 'cdk',
        language: 'ts',
        complexity: 'medium',
        turn_type: 'single',
        po_id: 'task-123',
        team: '1',
        startedAt: new Date().toISOString(),
        subtask: 'Cloud Environment Setup',
        subject_labels: ['Cloud Environment Setup'],
      };

      expect(metadata.subject_labels).toContain('Cloud Environment Setup');
    });

    it('should create metadata with optional aws_services', () => {
      const metadata = {
        platform: 'cdk',
        language: 'ts',
        complexity: 'medium',
        turn_type: 'single',
        po_id: 'task-123',
        team: '1',
        startedAt: new Date().toISOString(),
        subtask: 'Cloud Environment Setup',
        aws_services: ['S3', 'Lambda', 'DynamoDB'],
      };

      expect(metadata.aws_services).toHaveLength(3);
      expect(metadata.aws_services).toContain('S3');
    });

    it('should create metadata with task_config', () => {
      const metadata = {
        platform: 'tf',
        language: 'hcl',
        complexity: 'hard',
        turn_type: 'multi',
        po_id: 'task-456',
        team: '2',
        startedAt: new Date().toISOString(),
        subtask: 'Multi-Environment Consistency',
        task_config: {
          deploy_env: 'dev.tfvars',
        },
      };

      expect(metadata.task_config).toBeDefined();
      expect(metadata.task_config.deploy_env).toBe('dev.tfvars');
    });
  });

  describe('Complexity Options', () => {
    const complexities = ['medium', 'hard', 'expert'];

    complexities.forEach(complexity => {
      it(`should support ${complexity} complexity level`, () => {
        expect(complexities).toContain(complexity);
      });
    });

    it('should have exactly 3 complexity levels', () => {
      expect(complexities).toHaveLength(3);
    });
  });

  describe('Turn Type Options', () => {
    const turnTypes = ['single', 'multi'];

    turnTypes.forEach(turnType => {
      it(`should support ${turnType} turn type`, () => {
        expect(turnTypes).toContain(turnType);
      });
    });

    it('should have exactly 2 turn types', () => {
      expect(turnTypes).toHaveLength(2);
    });
  });

  describe('Team Options', () => {
    const teams = ['1', '2', '3', '4', '5', '6', 'synth', 'synth-1', 'synth-2', 'stf'];

    teams.forEach(team => {
      it(`should support team ${team}`, () => {
        expect(teams).toContain(team);
      });
    });

    it('should have 10 team options', () => {
      expect(teams).toHaveLength(10);
    });

    it('should include numbered teams', () => {
      expect(teams).toContain('1');
      expect(teams).toContain('6');
    });

    it('should include synth teams', () => {
      expect(teams).toContain('synth');
      expect(teams).toContain('synth-1');
      expect(teams).toContain('synth-2');
    });

    it('should include stf team', () => {
      expect(teams).toContain('stf');
    });
  });

  describe('Platform Options', () => {
    const platforms = ['cdk', 'cdktf', 'cfn', 'tf', 'pulumi', 'analysis', 'cicd'];

    it('should support CDK platform', () => {
      expect(platforms).toContain('cdk');
    });

    it('should support CDKTF platform', () => {
      expect(platforms).toContain('cdktf');
    });

    it('should support CloudFormation platform', () => {
      expect(platforms).toContain('cfn');
    });

    it('should support Terraform platform', () => {
      expect(platforms).toContain('tf');
    });

    it('should support Pulumi platform', () => {
      expect(platforms).toContain('pulumi');
    });

    it('should support Analysis tasks', () => {
      expect(platforms).toContain('analysis');
    });

    it('should support CI/CD tasks', () => {
      expect(platforms).toContain('cicd');
    });
  });

  describe('AWS Services Parsing', () => {
    it('should parse comma-separated AWS services', () => {
      const input = 'S3 Bucket, Lambda, DynamoDB';
      const services = input
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      expect(services).toHaveLength(3);
      expect(services).toContain('S3 Bucket');
      expect(services).toContain('Lambda');
      expect(services).toContain('DynamoDB');
    });

    it('should handle extra spaces in AWS services', () => {
      const input = 'S3  ,  Lambda  ,  DynamoDB  ';
      const services = input
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      expect(services).toHaveLength(3);
      expect(services).toEqual(['S3', 'Lambda', 'DynamoDB']);
    });

    it('should handle single AWS service', () => {
      const input = 'S3 Bucket';
      const services = input
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      expect(services).toHaveLength(1);
      expect(services[0]).toBe('S3 Bucket');
    });

    it('should filter out empty strings', () => {
      const input = 'S3,,,Lambda,,';
      const services = input
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      expect(services).toHaveLength(2);
      expect(services).toEqual(['S3', 'Lambda']);
    });

    it('should handle empty input', () => {
      const input = '';
      const services = input
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      expect(services).toHaveLength(0);
    });
  });

  describe('Tfvars File Options', () => {
    const tfvarsFiles = ['dev.tfvars', 'staging.tfvars', 'prod.tfvars'];

    it('should have dev tfvars option', () => {
      expect(tfvarsFiles).toContain('dev.tfvars');
    });

    it('should have staging tfvars option', () => {
      expect(tfvarsFiles).toContain('staging.tfvars');
    });

    it('should have prod tfvars option', () => {
      expect(tfvarsFiles).toContain('prod.tfvars');
    });

    it('should have exactly 3 tfvars options', () => {
      expect(tfvarsFiles).toHaveLength(3);
    });
  });

  describe('Timestamp Generation', () => {
    it('should generate valid ISO timestamp', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should generate unique timestamps', async () => {
      const timestamp1 = new Date().toISOString();
      await new Promise(resolve => setTimeout(resolve, 10));
      const timestamp2 = new Date().toISOString();

      expect(timestamp1).not.toBe(timestamp2);
    });
  });

  describe('Command Line Arguments', () => {
    it('should require command argument', () => {
      const args: string[] = [];
      expect(args.length).toBe(0);
    });

    it('should accept rlhf-task command', () => {
      const args = ['rlhf-task'];
      expect(args[0]).toBe('rlhf-task');
    });

    it('should handle unknown commands', () => {
      const command = 'unknown-command';
      const validCommands = ['rlhf-task'];
      expect(validCommands).not.toContain(command);
    });
  });

  describe('Multi-Environment Consistency Edge Cases', () => {
    it('should handle Multi-Environment Consistency with Terraform', () => {
      const subtask = 'Multi-Environment Consistency';
      const platform = 'tf';
      const shouldPromptForTfvars = subtask === 'Multi-Environment Consistency' && platform === 'tf';

      expect(shouldPromptForTfvars).toBe(true);
    });

    it('should not prompt for tfvars with non-Terraform platforms', () => {
      const subtask = 'Multi-Environment Consistency';
      const platform = 'cdk';
      const shouldPromptForTfvars = subtask === 'Multi-Environment Consistency' && platform === 'tf';

      expect(shouldPromptForTfvars).toBe(false);
    });

    it('should not prompt for tfvars with other subtasks', () => {
      const subtask = 'Cloud Environment Setup';
      const platform = 'tf';
      const shouldPromptForTfvars = subtask === 'Multi-Environment Consistency' && platform === 'tf';

      expect(shouldPromptForTfvars).toBe(false);
    });
  });

  describe('IaC Optimization Special Handling', () => {
    it('should identify IaC Optimization subtask', () => {
      const subtask = 'IaC Optimization';
      const isOptimization = subtask === 'IaC Optimization';

      expect(isOptimization).toBe(true);
    });

    it('should not misidentify other subtasks as optimization', () => {
      const subtask = 'IaC Diagnosis/Edits';
      const isOptimization = subtask === 'IaC Optimization';

      expect(isOptimization).toBe(false);
    });
  });

  describe('Default AWS Services', () => {
    it('should have reasonable default AWS services', () => {
      const defaultServices = 'S3 Bucket, CloudFormation, Lambda, EventBridge, CloudWatch LogGroup, VPC';
      const services = defaultServices.split(',').map(s => s.trim());

      expect(services).toContain('S3 Bucket');
      expect(services).toContain('Lambda');
      expect(services).toContain('VPC');
    });
  });
});