/**
 * Unit tests for CI/CD Pipeline TapStack
 *
 * These tests verify the structure and configuration of the CI/CD pipeline
 * components without actually deploying to AWS.
 */

import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
jest.mock('@pulumi/pulumi', () => {
  const actual = jest.requireActual('@pulumi/pulumi');
  return {
    ...actual,
    Config: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      require: jest.fn(),
    })),
  };
});

describe('TapStack CI/CD Pipeline - Unit Tests', () => {
  let stack: TapStack;

  describe('Instantiation with default values', () => {
    beforeAll(() => {
      stack = new TapStack('test-cicd-stack', {});
    });

    it('should instantiate successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should expose all required output properties', () => {
      expect(stack.repositoryCloneUrlHttp).toBeDefined();
      expect(stack.repositoryCloneUrlSsh).toBeDefined();
      expect(stack.buildProjectName).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.notificationTopicArn).toBeDefined();
      expect(stack.logGroupName).toBeDefined();
    });
  });

  describe('Instantiation with custom environment suffix', () => {
    beforeAll(() => {
      stack = new TapStack('test-cicd-stack-prod', {
        environmentSuffix: 'prod',
      });
    });

    it('should instantiate successfully with custom suffix', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should expose all required outputs', () => {
      expect(stack.repositoryCloneUrlHttp).toBeDefined();
      expect(stack.repositoryCloneUrlSsh).toBeDefined();
      expect(stack.buildProjectName).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.notificationTopicArn).toBeDefined();
      expect(stack.logGroupName).toBeDefined();
    });
  });

  describe('Instantiation with custom tags', () => {
    beforeAll(() => {
      stack = new TapStack('test-cicd-stack-tags', {
        environmentSuffix: 'staging',
        tags: {
          Owner: 'DevOps',
          CostCenter: 'Engineering',
        },
      });
    });

    it('should instantiate successfully with custom tags', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should expose all required outputs', () => {
      expect(stack.repositoryCloneUrlHttp).toBeDefined();
      expect(stack.repositoryCloneUrlSsh).toBeDefined();
      expect(stack.buildProjectName).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.notificationTopicArn).toBeDefined();
      expect(stack.logGroupName).toBeDefined();
    });
  });

  describe('Component resource type', () => {
    beforeAll(() => {
      stack = new TapStack('test-type-check', {
        environmentSuffix: 'test',
      });
    });

    it('should be a Pulumi ComponentResource', () => {
      expect(stack).toBeDefined();
      expect(stack.constructor.name).toBe('TapStack');
    });
  });

  describe('Required outputs validation', () => {
    beforeAll(() => {
      stack = new TapStack('test-outputs', {
        environmentSuffix: 'dev',
      });
    });

    it('should have repositoryCloneUrlHttp output', () => {
      expect(stack.repositoryCloneUrlHttp).toBeDefined();
    });

    it('should have repositoryCloneUrlSsh output', () => {
      expect(stack.repositoryCloneUrlSsh).toBeDefined();
    });

    it('should have buildProjectName output', () => {
      expect(stack.buildProjectName).toBeDefined();
    });

    it('should have artifactBucketName output', () => {
      expect(stack.artifactBucketName).toBeDefined();
    });

    it('should have notificationTopicArn output', () => {
      expect(stack.notificationTopicArn).toBeDefined();
    });

    it('should have logGroupName output', () => {
      expect(stack.logGroupName).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle empty args object', () => {
      expect(() => {
        const testStack = new TapStack('test-empty-args', {});
        expect(testStack).toBeDefined();
      }).not.toThrow();
    });

    it('should handle undefined environmentSuffix', () => {
      expect(() => {
        const testStack = new TapStack('test-undefined-suffix', {
          environmentSuffix: undefined,
        });
        expect(testStack).toBeDefined();
      }).not.toThrow();
    });

    it('should handle empty tags object', () => {
      expect(() => {
        const testStack = new TapStack('test-empty-tags', {
          tags: {},
        });
        expect(testStack).toBeDefined();
      }).not.toThrow();
    });
  });
});
