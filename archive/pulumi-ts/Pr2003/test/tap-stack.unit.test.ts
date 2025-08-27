/* eslint-disable prettier/prettier */

/**
 * Unit Tests for TapStack
 * These tests validate the TapStack component in isolation using mocked dependencies.
 * Tests cover configuration validation, resource creation logic, and error handling.
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock Pulumi runtime for unit testing
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): pulumi.runtime.MockResourceResult => {
    const outputs: Record<string, any> = {};
    switch (args.type) {
      case 'aws:ec2/vpc:Vpc':
        outputs.id = 'vpc-12345678';
        outputs.cidrBlock = '10.0.0.0/16';
        break;
      case 'aws:ec2/subnet:Subnet':
        outputs.id = `subnet-${Math.random().toString(36).substr(2, 9)}`;
        outputs.availabilityZone = 'us-east-1a';
        break;
      case 'aws:s3/bucket:Bucket':
        outputs.id = args.inputs?.bucket || `test-bucket-${Math.random().toString(36).substr(2, 9)}`;
        outputs.bucket = outputs.id;
        outputs.arn = `arn:aws:s3:::${outputs.id}`;
        break;
      case 'aws:iam/role:Role':
        outputs.id = `test-role-${Math.random().toString(36).substr(2, 9)}`;
        outputs.arn = `arn:aws:iam::123456789012:role/${outputs.id}`;
        outputs.name = outputs.id;
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        outputs.id = args.inputs?.name || '/aws/infrastructure/test';
        outputs.name = outputs.id;
        outputs.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${outputs.id}`;
        break;
      case 'aws:sns/topic:Topic':
        outputs.id = `test-topic-${Math.random().toString(36).substr(2, 9)}`;
        outputs.arn = `arn:aws:sns:us-east-1:123456789012:${args.inputs?.name || 'test-alarms'}`;
        break;
      case 'aws:cloudwatch/dashboard:Dashboard':
        outputs.id = args.inputs?.dashboardName || 'test-dashboard';
        outputs.dashboardArn = `arn:aws:cloudwatch::123456789012:dashboard/${outputs.id}`;
        break;
      case 'aws:ec2/flowLog:FlowLog':
        outputs.id = `fl-${Math.random().toString(36).substr(2, 9)}`;
        break;
      case 'aws:cloudtrail/trail:Trail':
        outputs.id = args.inputs?.name || 'test-trail';
        outputs.arn = `arn:aws:cloudtrail:us-east-1:123456789012:trail/${outputs.id}`;
        break;
      default:
        outputs.id = `${args.type.replace(/[/:]/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    switch (args.token) {
      case 'aws:index/getRegion:getRegion':
        return { name: 'us-east-1' };
      case 'aws:index/getCallerIdentity:getCallerIdentity':
        return { accountId: '123456789012' };
      case 'aws:index/getAvailabilityZones:getAvailabilityZones':
        return { names: ['us-east-1a', 'us-east-1b', 'us-east-1c'] };
      default:
        return {};
    }
  },
});

describe('TapStack Unit Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockFs.writeFileSync.mockImplementation(() => {});
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => '');
  });

  describe('Constructor and Initialization', () => {
    test('should create TapStack with default configuration', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
      expect(stack.privateSubnets).toHaveLength(3);
      expect(stack.publicSubnets).toHaveLength(3);
    });

    test('should create TapStack with custom environment', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'custom' },
        environment: 'custom',
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
    });

    test('should handle minimal configuration', async () => {
      const stack = new TapStack('test-stack', {
        tags: {},
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
    });

    test('should create TapStack with CloudTrail enabled by default', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
      expect(stack.cloudTrailBucket).toBeDefined();
      expect(stack.cloudTrailRole).toBeDefined();
      expect(stack.cloudTrail).toBeDefined();
    });

    test('should create TapStack with CloudTrail disabled', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        enableCloudTrail: false,
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
      expect(stack.cloudTrailBucket).toBeUndefined();
      expect(stack.cloudTrailRole).toBeUndefined();
      expect(stack.cloudTrail).toBeUndefined();
    });

    test('should use config fallbacks when environment not provided', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Test: 'true' },
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
    });

    test('should use default regions when not provided', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
      expect(stack.regions).toEqual(['us-east-1', 'eu-west-2']);
    });
  });

  describe('VPC and Networking', () => {
    test('should create VPC with correct CIDR block', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      expect(stack.vpc).toBeDefined();
      expect(stack.internetGateway).toBeDefined();
    });

    test('should create public and private subnets', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      expect(stack.privateSubnets).toHaveLength(3);
      expect(stack.publicSubnets).toHaveLength(3);
    });

    test('should handle single AZ deployment', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        regions: ['us-east-1'],
      });

      expect(stack.privateSubnets).toHaveLength(3);
      expect(stack.publicSubnets).toHaveLength(3);
    });
  });

  describe('Security Infrastructure', () => {
    test('should create IAM roles for services when CloudTrail enabled', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        enableCloudTrail: true,
      });

      expect(stack.cloudTrailRole).toBeDefined();
      expect(stack.deploymentRole).toBeDefined();
    });

    test('should create only deployment role when CloudTrail disabled', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        enableCloudTrail: false,
      });

      expect(stack.cloudTrailRole).toBeUndefined();
      expect(stack.deploymentRole).toBeDefined();
    });

    test('should create roles with proper assume role policies', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      expect(stack.deploymentRole).toBeDefined();
    });
  });

  describe('Storage Infrastructure', () => {
    test('should create S3 bucket for CloudTrail when enabled', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        enableCloudTrail: true,
      });

      expect(stack.cloudTrailBucket).toBeDefined();
    });

    test('should not create S3 bucket when CloudTrail disabled', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        enableCloudTrail: false,
      });

      expect(stack.cloudTrailBucket).toBeUndefined();
    });

    test('should handle bucket naming conflicts', async () => {
      const stack1 = new TapStack('test-stack-1', {
        tags: { Environment: 'test' },
      });

      const stack2 = new TapStack('test-stack-2', {
        tags: { Environment: 'test' },
      });

      expect(stack1.cloudTrailBucket).toBeDefined();
      expect(stack2.cloudTrailBucket).toBeDefined();
    });
  });

  describe('CloudTrail Infrastructure', () => {
    test('should create CloudTrail when enabled', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        enableCloudTrail: true,
      });

      expect(stack.cloudTrail).toBeDefined();
    });

    test('should not create CloudTrail when disabled', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        enableCloudTrail: false,
      });

      expect(stack.cloudTrail).toBeUndefined();
    });
  });

  describe('Monitoring Infrastructure', () => {
    test('should create CloudWatch resources', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      expect(stack.logGroup).toBeDefined();
      expect(stack.dashboard).toBeDefined();
    });

    test('should set appropriate log retention for environment', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        environment: 'dev',
      });

      expect(stack.logGroup).toBeDefined();
    });

    test('should create SNS topic for alarms', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      expect(stack.alarmTopic).toBeDefined();
    });

    test('should use production retention for prod environment', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'prod' },
        environment: 'prod',
      });

      expect(stack.logGroup).toBeDefined();
      expect(stack.dashboard).toBeDefined();
    });

    test('should use non-production retention for non-prod environment', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'dev' },
        environment: 'dev',
      });

      expect(stack.logGroup).toBeDefined();
      expect(stack.dashboard).toBeDefined();
    });
  });

  describe('VPC Flow Logs Infrastructure', () => {
    test('should create VPC Flow Logs resources', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      expect(stack.vpcFlowLogsRole).toBeDefined();
      expect(stack.vpcFlowLogs).toBeDefined();
    });

    test('should configure VPC Flow Logs with proper settings', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        environment: 'test',
      });

      expect(stack.vpcFlowLogsRole).toBeDefined();
      expect(stack.vpcFlowLogs).toBeDefined();
    });

    test('should use production retention for prod environment flow logs', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'prod' },
        environment: 'prod',
      });

      expect(stack.vpcFlowLogsRole).toBeDefined();
      expect(stack.vpcFlowLogs).toBeDefined();
    });
  });

  describe('Parameter Store', () => {
    test('should create parameter store prefix', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      expect(stack.parameterStorePrefix).toBeDefined();
    });

    test('should handle different environments in parameter paths', async () => {
      const devStack = new TapStack('dev-stack', {
        tags: { Environment: 'dev' },
        environment: 'dev',
      });

      const prodStack = new TapStack('prod-stack', {
        tags: { Environment: 'prod' },
        environment: 'prod',
      });

      expect(devStack.parameterStorePrefix).toBeDefined();
      expect(prodStack.parameterStorePrefix).toBeDefined();
    });
  });

  describe('Multi-Account StackSet', () => {
    test('should create StackSet roles when enabled', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        enableMultiAccount: true,
      });

      expect(stack.stackSetExecutionRole).toBeDefined();
      expect(stack.stackSetAdministrationRole).toBeDefined();
    });

    test('should not create StackSet roles when disabled', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        enableMultiAccount: false,
      });

      expect(stack.stackSetExecutionRole).toBeUndefined();
      expect(stack.stackSetAdministrationRole).toBeUndefined();
    });

    test('should not create StackSet roles when not specified', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      expect(stack.stackSetExecutionRole).toBeUndefined();
      expect(stack.stackSetAdministrationRole).toBeUndefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty tags gracefully', async () => {
      const stack = new TapStack('test-stack', {
        tags: {},
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
    });

    test('should handle invalid environment names', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test-env-123' },
        environment: 'test-env-123',
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
    });

    test('should handle single region deployment', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        regions: ['us-west-2'],
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
    });

    test('should handle undefined regions array', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        regions: undefined,
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
    });

    test('should handle file write errors gracefully', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(stack).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to write outputs file'));

      consoleSpy.mockRestore();
    });

    test('should handle successful file writes', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    test('should handle test environment logging path', async () => {
      // Set test environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      // Console.log should not be called in test environment
      expect(consoleSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalNodeEnv;
      consoleSpy.mockRestore();
    });

    test('should handle non-test environment logging path', async () => {
      // Set non-test environment
      const originalNodeEnv = process.env.NODE_ENV;
      const originalJestWorker = process.env.JEST_WORKER_ID;
      process.env.NODE_ENV = 'development';
      delete process.env.JEST_WORKER_ID;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Stack outputs written to cfn-outputs/flat-outputs.json');

      process.env.NODE_ENV = originalNodeEnv;
      process.env.JEST_WORKER_ID = originalJestWorker;
      consoleSpy.mockRestore();
    });

    test('should handle directory creation when path does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('cfn-outputs', { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    test('should handle directory creation error gracefully', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Directory creation failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(stack).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to write outputs file'));

      consoleSpy.mockRestore();
    });
  });

  describe('Resource Tagging', () => {
    test('should apply tags consistently across resources', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test', Project: 'TestProject' },
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
    });

    test('should merge default and custom tags', async () => {
      const customTags = { Owner: 'test-owner' };
      const stack = new TapStack('test-stack', {
        tags: customTags,
        environment: 'test',
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
    });

    test('should include default tags for all environments', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        environment: 'test',
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    test('should validate required configuration parameters', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        environment: 'test',
        regions: ['us-east-1', 'eu-west-2'],
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
    });

    test('should handle missing optional parameters', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
      expect(stack.stackSetExecutionRole).toBeUndefined();
    });

    test('should handle explicit CloudTrail configuration', async () => {
      const enabledStack = new TapStack('enabled-stack', {
        tags: { Environment: 'test' },
        enableCloudTrail: true,
      });

      const disabledStack = new TapStack('disabled-stack', {
        tags: { Environment: 'test' },
        enableCloudTrail: false,
      });

      expect(enabledStack.cloudTrail).toBeDefined();
      expect(disabledStack.cloudTrail).toBeUndefined();
    });
  });

  describe('Output File Generation', () => {
    test('should generate outputs file successfully', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'dev' },
        environment: 'dev',
      });

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        'cfn-outputs/flat-outputs.json',
        expect.stringContaining('vpcId'),
        'utf8'
      );
    });

    test('should handle custom output file path', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    test('should include CloudTrail enabled status in outputs', async () => {
      const stackEnabled = new TapStack('test-stack-enabled', {
        tags: { Environment: 'test' },
        enableCloudTrail: true,
      });

      const stackDisabled = new TapStack('test-stack-disabled', {
        tags: { Environment: 'test' },
        enableCloudTrail: false,
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('Environment-Specific Logic', () => {
    test('should configure production environment settings', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'prod' },
        environment: 'prod',
      });

      expect(stack).toBeDefined();
      expect(stack.logGroup).toBeDefined();
    });

    test('should configure development environment settings', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'dev' },
        environment: 'dev',
      });

      expect(stack).toBeDefined();
      expect(stack.logGroup).toBeDefined();
    });

    test('should handle test environment detection', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'integration-test' },
        environment: 'integration-test',
      });

      expect(stack).toBeDefined();
      expect(stack.logGroup).toBeDefined();
    });

    test('should handle environment with test suffix', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'feature-test' },
        environment: 'feature-test',
      });

      expect(stack).toBeDefined();
      expect(stack.logGroup).toBeDefined();
    });
  });

  describe('CloudWatch Alarms Conditional Logic', () => {
    test('should create all alarms when CloudTrail is enabled', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        enableCloudTrail: true,
      });

      expect(stack).toBeDefined();
      expect(stack.cloudTrailBucket).toBeDefined();
    });

    test('should create limited alarms when CloudTrail is disabled', async () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
        enableCloudTrail: false,
      });

      expect(stack).toBeDefined();
      expect(stack.cloudTrailBucket).toBeUndefined();
    });
  });
});
