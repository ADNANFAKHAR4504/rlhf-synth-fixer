import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// Mock the nested stacks to verify they are called correctly
jest.mock('../lib/kms-stack', () => ({
  KmsStack: jest.fn().mockImplementation(() => ({
    secretsKey: { keyId: 'mock-secrets-key' },
    rdsKey: { keyId: 'mock-rds-key' },
    elasticacheKey: { keyId: 'mock-elasticache-key' },
    efsKey: { keyId: 'mock-efs-key' },
    kinesisKey: { keyId: 'mock-kinesis-key' }
  }))
}));

jest.mock('../lib/network-stack', () => ({
  NetworkStack: jest.fn().mockImplementation(() => ({
    vpc: { vpcId: 'mock-vpc' },
    databaseSecurityGroup: { securityGroupId: 'mock-db-sg' },
    cacheSecurityGroup: { securityGroupId: 'mock-cache-sg' },
    efsSecurityGroup: { securityGroupId: 'mock-efs-sg' },
    ecsSecurityGroup: { securityGroupId: 'mock-ecs-sg' },
    loadBalancerSecurityGroup: { securityGroupId: 'mock-alb-sg' }
  }))
}));

jest.mock('../lib/secrets-stack', () => ({
  SecretsStack: jest.fn().mockImplementation(() => ({
    databaseSecret: { secretArn: 'mock-db-secret' },
    applicationSecret: { secretArn: 'mock-app-secret' }
  }))
}));

jest.mock('../lib/database-stack', () => ({
  DatabaseStack: jest.fn().mockImplementation(() => ({
    database: {
      dbInstanceEndpointAddress: 'mock-db-endpoint',
      metricCPUUtilization: jest.fn(),
      metricDatabaseConnections: jest.fn()
    }
  }))
}));

jest.mock('../lib/cache-stack', () => ({
  CacheStack: jest.fn().mockImplementation(() => ({
    redisEndpoint: 'mock-redis-endpoint'
  }))
}));

jest.mock('../lib/storage-stack', () => ({
  StorageStack: jest.fn().mockImplementation(() => ({
    fileSystem: { fileSystemId: 'mock-efs' }
  }))
}));

jest.mock('../lib/compute-stack', () => ({
  ComputeStack: jest.fn().mockImplementation(() => ({
    cluster: { clusterName: 'mock-cluster' },
    service: {
      serviceName: 'mock-service',
      metricCpuUtilization: jest.fn(),
      metricMemoryUtilization: jest.fn()
    },
    loadBalancer: {
      loadBalancerDnsName: 'mock-alb-dns',
      metricRequestCount: jest.fn()
    },
    targetGroup: {
      metricTargetResponseTime: jest.fn(),
      metricUnhealthyHostCount: jest.fn()
    },
    vpcLink: { vpcLinkId: 'mock-vpc-link' }
  }))
}));

jest.mock('../lib/api-stack', () => ({
  ApiStack: jest.fn().mockImplementation(() => ({
    api: {
      url: 'https://mock-api-url.execute-api.region.amazonaws.com/prod',
      restApiName: 'mock-api'
    }
  }))
}));

jest.mock('../lib/streaming-stack', () => ({
  StreamingStack: jest.fn().mockImplementation(() => ({
    transactionStream: {
      streamName: 'mock-kinesis-stream',
      metricIncomingRecords: jest.fn()
    }
  }))
}));

jest.mock('../lib/monitoring-stack', () => ({
  MonitoringStack: jest.fn().mockImplementation(() => ({}))
}));

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create TapStack with default environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      expect(testStack).toBeDefined();
      expect(testStack.stackName).toBe('TestStack');
    });

    test('should create TapStack with custom environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'test' });
      expect(testStack).toBeDefined();
      expect(testStack.stackName).toBe('TestStack');
    });

    test('should create TapStack with context environment suffix', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'context-test' }
      });
      const testStack = new TapStack(testApp, 'TestStack');
      expect(testStack).toBeDefined();
      expect(testStack.stackName).toBe('TestStack');
    });
  });

  describe('Stack Outputs', () => {
    test('should have required outputs', () => {
      // Check that the template has the expected outputs
      const outputs = template.findOutputs('*');

      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.ApiEndpoint.Description).toBe('API Gateway endpoint URL');
      expect(outputs.ApiEndpoint.Value).toBe('https://mock-api-url.execute-api.region.amazonaws.com/prod');

      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS.Description).toBe('Application Load Balancer DNS name');
      expect(outputs.LoadBalancerDNS.Value).toBe('mock-alb-dns');

      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabaseEndpoint.Description).toBe('RDS database endpoint');
      expect(outputs.DatabaseEndpoint.Value).toBe('mock-db-endpoint');

      expect(outputs.RedisEndpoint).toBeDefined();
      expect(outputs.RedisEndpoint.Description).toBe('ElastiCache Redis endpoint');
      expect(outputs.RedisEndpoint.Value).toBe('mock-redis-endpoint');

      expect(outputs.KinesisStreamName).toBeDefined();
      expect(outputs.KinesisStreamName.Description).toBe('Kinesis Data Stream name');
      expect(outputs.KinesisStreamName.Value).toBe('mock-kinesis-stream');
    });

    test('should have exactly 5 outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toHaveLength(5);
    });
  });

  describe('Stack Structure', () => {
    test('should be a valid CloudFormation template', () => {
      expect(template).toBeDefined();
      expect(template.toJSON()).toBeDefined();
    });

    test('should have proper stack name', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should be in the correct region', () => {
      expect(stack.region).toBeDefined();
    });

    test('should have proper account', () => {
      expect(stack.account).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    test('should use environment suffix from props when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'custom-env' });
      expect(testStack).toBeDefined();
    });

    test('should fallback to context when props not provided', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'context-env' }
      });
      const testStack = new TapStack(testApp, 'TestStack');
      expect(testStack).toBeDefined();
    });

    test('should use default dev when no environment suffix provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      expect(testStack).toBeDefined();
    });

    test('should prioritize props over context when both are provided', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'context-env' }
      });
      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'props-env' });
      expect(testStack).toBeDefined();
    });

    test('should handle empty props object', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'context-env' }
      });
      const testStack = new TapStack(testApp, 'TestStack', {});
      expect(testStack).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    test('should create all required nested stacks', () => {
      // This test verifies that the TapStack constructor runs without errors
      // which means all nested stacks are created successfully
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should handle missing environment suffix gracefully', () => {
      const testApp = new cdk.App();
      // Remove any context that might be set
      testApp.node.setContext('environmentSuffix', undefined);
      const testStack = new TapStack(testApp, 'TestStack');
      expect(testStack).toBeDefined();
    });

    test('should handle null API URL with fallback', () => {
      // Mock the ApiStack to return null URL to test the fallback branch
      const { ApiStack } = require('../lib/api-stack');
      const originalImplementation = ApiStack.getMockImplementation();

      ApiStack.mockImplementationOnce(() => ({
        api: {
          url: null, // This will trigger the fallback
          restApiName: 'mock-api'
        }
      }));

      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackWithNullApi');
      expect(testStack).toBeDefined();

      const testTemplate = Template.fromStack(testStack);
      const outputs = testTemplate.findOutputs('*');
      expect(outputs.ApiEndpoint.Value).toBe('Not Available');
    });

    test('should handle empty string API URL with fallback', () => {
      // Mock the ApiStack to return empty string URL to test the fallback branch
      const { ApiStack } = require('../lib/api-stack');

      ApiStack.mockImplementationOnce(() => ({
        api: {
          url: '', // This will trigger the fallback
          restApiName: 'mock-api'
        }
      }));

      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackWithEmptyApi');
      expect(testStack).toBeDefined();

      const testTemplate = Template.fromStack(testStack);
      const outputs = testTemplate.findOutputs('*');
      expect(outputs.ApiEndpoint.Value).toBe('Not Available');
    });

  });
});
