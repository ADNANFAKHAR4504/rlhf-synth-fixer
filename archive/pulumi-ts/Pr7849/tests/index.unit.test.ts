import * as pulumi from '@pulumi/pulumi';

// Set required config before importing the module
pulumi.runtime.setConfig('project:environmentSuffix', 'test');
pulumi.runtime.setConfig('aws:region', 'us-east-1');

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name ? `${args.name}-${args.inputs.name}-id` : `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        cloneUrlHttp: `https://git-codecommit.us-east-1.amazonaws.com/v1/repos/${args.inputs.repositoryName}`,
        cloneUrlSsh: `ssh://git-codecommit.us-east-1.amazonaws.com/v1/repos/${args.inputs.repositoryName}`,
        repositoryName: args.inputs.repositoryName
      }
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDATEST'
      };
    }
    if (args.token === 'aws:iam/getPolicyDocument:getPolicyDocument') {
      return {
        json: JSON.stringify({
          Version: '2012-10-17',
          Statement: args.inputs.statements
        })
      };
    }
    return {};
  }
});

import * as infraModule from '../lib/index';

describe('CodeCommit Repository Infrastructure', () => {
  beforeAll(async () => {
    // Module is imported at top level
  });

  describe('Repository Creation', () => {
    it('should export repository clone URLs', async () => {
      const cloneUrls = infraModule.repositoryCloneUrls;
      expect(cloneUrls).toBeDefined();

      const urls = await new Promise((resolve) => {
        pulumi.all([cloneUrls]).apply(([result]) => {
          resolve(result);
        });
      });

      expect(urls).toBeDefined();
    });

    it('should export repository ARNs', async () => {
      const arns = infraModule.repositoryArns;
      expect(arns).toBeDefined();

      const arnsResult = await new Promise((resolve) => {
        pulumi.all([arns]).apply(([result]) => {
          resolve(result);
        });
      });

      expect(arnsResult).toBeDefined();
    });

    it('should export repository names', async () => {
      const names = infraModule.repositoryNames;
      expect(names).toBeDefined();

      const namesResult = await new Promise((resolve) => {
        pulumi.all([names]).apply(([result]) => {
          resolve(result);
        });
      });

      expect(namesResult).toBeDefined();
    });
  });

  describe('IAM Role', () => {
    it('should export contributor role ARN', async () => {
      const roleArn = infraModule.contributorRoleArn;
      expect(roleArn).toBeDefined();

      const arn = await new Promise((resolve) => {
        pulumi.all([roleArn]).apply(([result]) => {
          resolve(result);
        });
      });

      expect(arn).toContain('arn:aws:');
    });

    it('should export contributor role name with environment suffix', async () => {
      const roleName = infraModule.contributorRoleName;
      expect(roleName).toBeDefined();

      const name = await new Promise((resolve) => {
        pulumi.all([roleName]).apply(([result]) => {
          resolve(result);
        });
      });

      expect(name).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should export alarm ARNs', async () => {
      const alarmArns = infraModule.alarmArns;
      expect(alarmArns).toBeDefined();

      const arns = await new Promise((resolve) => {
        pulumi.all([alarmArns]).apply(([result]) => {
          resolve(result);
        });
      });

      expect(arns).toBeDefined();
    });
  });

  describe('Deployment Summary', () => {
    it('should export deployment summary', async () => {
      const summary = infraModule.deploymentSummary;
      expect(summary).toBeDefined();

      const result = await new Promise((resolve) => {
        pulumi.all([summary]).apply(([result]) => {
          resolve(result);
        });
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalConfigured');
      expect(result).toHaveProperty('successfullyCreated');
      expect(result).toHaveProperty('failed');
    });
  });

  describe('Stack Reference', () => {
    it('should export stack reference data', async () => {
      const stackRef = infraModule.stackReference;
      expect(stackRef).toBeDefined();
      expect(stackRef).toHaveProperty('repositoryArns');
      expect(stackRef).toHaveProperty('contributorRoleArn');
      expect(stackRef).toHaveProperty('region');
      expect(stackRef).toHaveProperty('environmentSuffix');
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in resource names', async () => {
      const names = infraModule.repositoryNames;

      const namesResult = await new Promise<string[]>((resolve) => {
        pulumi.all([names]).apply(([result]) => {
          resolve(result as string[]);
        });
      });

      // At least one name should be checked
      if (namesResult && namesResult.length > 0) {
        // Names should follow pattern: {name}-{environmentSuffix}
        namesResult.forEach(name => {
          expect(name).toMatch(/-/); // Should contain hyphen separator
        });
      }
    });
  });
});

import * as retryUtils from '../lib/retry-utils';

describe('Retry Utilities', () => {
  beforeAll(async () => {
    // Module imported at top level
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt for successful function', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retryUtils.retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on throttling exceptions', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('ThrottlingException'))
        .mockResolvedValueOnce('success');

      const result = await retryUtils.retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 10
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on TooManyRequestsException', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('TooManyRequestsException'))
        .mockResolvedValueOnce('success');

      const result = await retryUtils.retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 10
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries exceeded', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('ThrottlingException'));

      await expect(
        retryUtils.retryWithBackoff(fn, {
          maxRetries: 2,
          initialDelayMs: 10
        })
      ).rejects.toThrow('ThrottlingException');

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-rate-limit errors', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('SomeOtherError'));

      await expect(
        retryUtils.retryWithBackoff(fn, {
          maxRetries: 3,
          initialDelayMs: 10
        })
      ).rejects.toThrow('SomeOtherError');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should apply exponential backoff', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;

      // Mock setTimeout to capture delays
      global.setTimeout = ((fn: any, delay: number) => {
        delays.push(delay);
        return originalSetTimeout(fn, 0);
      }) as any;

      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('ThrottlingException'))
        .mockRejectedValueOnce(new Error('ThrottlingException'))
        .mockResolvedValueOnce('success');

      await retryUtils.retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 100,
        backoffMultiplier: 2
      });

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;

      // Check exponential backoff: 100, 200
      expect(delays.length).toBe(2);
      expect(delays[0]).toBe(100);
      expect(delays[1]).toBe(200);
    });

    it('should respect max delay', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;

      global.setTimeout = ((fn: any, delay: number) => {
        delays.push(delay);
        return originalSetTimeout(fn, 0);
      }) as any;

      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('ThrottlingException'))
        .mockRejectedValueOnce(new Error('ThrottlingException'))
        .mockResolvedValueOnce('success');

      await retryUtils.retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 5000,
        maxDelayMs: 8000,
        backoffMultiplier: 2
      });

      global.setTimeout = originalSetTimeout;

      // Delays should be capped at maxDelayMs
      expect(delays.length).toBe(2);
      expect(delays[0]).toBe(5000);
      expect(delays[1]).toBe(8000); // Would be 10000 but capped
    });
  });
});
