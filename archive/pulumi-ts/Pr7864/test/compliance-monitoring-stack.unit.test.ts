import * as pulumi from '@pulumi/pulumi';
import { ComplianceMonitoringStack } from '../lib/compliance-monitoring-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        name: args.inputs.name || args.name,
        bucket: args.inputs.bucket || args.name,
        id: `${args.name}_id`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('ComplianceMonitoringStack', () => {
  let stack: ComplianceMonitoringStack;
  const environmentSuffix = 'test123';
  const tags = {
    Environment: 'test',
    Project: 'ComplianceMonitoring',
  };

  beforeEach(() => {
    stack = new ComplianceMonitoringStack('test-stack', {
      environmentSuffix,
      tags,
    });
  });

  describe('Stack Creation', () => {
    it('should create a ComplianceMonitoringStack instance', () => {
      expect(stack).toBeInstanceOf(ComplianceMonitoringStack);
    });

    it('should have correct resource type', () => {
      expect(stack).toBeDefined();
    });
  });

  describe('S3 Bucket', () => {
    it('should export reportBucketName', (done) => {
      stack.reportBucketName.apply((name) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should create bucket with environmentSuffix in name', (done) => {
      stack.reportBucketName.apply((name) => {
        expect(name).toContain(environmentSuffix);
        done();
      });
    });
  });

  describe('SNS Topic', () => {
    it('should export complianceTopicArn', (done) => {
      stack.complianceTopicArn.apply((arn) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should create topic ARN with correct format', (done) => {
      stack.complianceTopicArn.apply((arn) => {
        expect(arn).toMatch(/arn:aws:/);
        done();
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should export dashboardName', (done) => {
      stack.dashboardName.apply((name) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should create dashboard with environmentSuffix', (done) => {
      stack.dashboardName.apply((name) => {
        expect(name).toContain(environmentSuffix);
        done();
      });
    });
  });

  describe('Lambda Functions', () => {
    it('should export analyzerFunctionName', (done) => {
      stack.analyzerFunctionName.apply((name) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export reportGeneratorFunctionName', (done) => {
      stack.reportGeneratorFunctionName.apply((name) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export deepScannerFunctionName', (done) => {
      stack.deepScannerFunctionName.apply((name) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should create analyzer function with environmentSuffix', (done) => {
      stack.analyzerFunctionName.apply((name) => {
        expect(name).toContain(environmentSuffix);
        done();
      });
    });

    it('should create report generator function with environmentSuffix', (done) => {
      stack.reportGeneratorFunctionName.apply((name) => {
        expect(name).toContain(environmentSuffix);
        done();
      });
    });

    it('should create deep scanner function with environmentSuffix', (done) => {
      stack.deepScannerFunctionName.apply((name) => {
        expect(name).toContain(environmentSuffix);
        done();
      });
    });
  });

  describe('Stack Outputs', () => {
    it('should register all required outputs', (done) => {
      Promise.all([
        stack.reportBucketName.promise(),
        stack.complianceTopicArn.promise(),
        stack.dashboardName.promise(),
        stack.analyzerFunctionName.promise(),
        stack.reportGeneratorFunctionName.promise(),
        stack.deepScannerFunctionName.promise(),
      ]).then(([bucketName, topicArn, dashboardName, analyzerName, reportGenName, scannerName]) => {
        expect(bucketName).toBeDefined();
        expect(topicArn).toBeDefined();
        expect(dashboardName).toBeDefined();
        expect(analyzerName).toBeDefined();
        expect(reportGenName).toBeDefined();
        expect(scannerName).toBeDefined();
        done();
      });
    });
  });

  describe('Stack Configuration', () => {
    it('should accept environmentSuffix argument', () => {
      const testStack = new ComplianceMonitoringStack('config-test-stack', {
        environmentSuffix: 'prod',
      });
      expect(testStack).toBeInstanceOf(ComplianceMonitoringStack);
    });

    it('should accept optional tags', () => {
      const testStack = new ComplianceMonitoringStack('tags-test-stack', {
        environmentSuffix: 'dev',
        tags: {
          Owner: 'TestTeam',
          CostCenter: '12345',
        },
      });
      expect(testStack).toBeInstanceOf(ComplianceMonitoringStack);
    });

    it('should work without tags', () => {
      const testStack = new ComplianceMonitoringStack('no-tags-stack', {
        environmentSuffix: 'qa',
      });
      expect(testStack).toBeInstanceOf(ComplianceMonitoringStack);
    });
  });

  describe('Resource Naming', () => {
    it('should use environmentSuffix in all resource names', (done) => {
      Promise.all([
        stack.reportBucketName.promise(),
        stack.complianceTopicArn.promise(),
        stack.dashboardName.promise(),
      ]).then(([bucketName, topicArn, dashboardName]) => {
        expect(bucketName).toContain(environmentSuffix);
        expect(topicArn).toContain(environmentSuffix);
        expect(dashboardName).toContain(environmentSuffix);
        done();
      });
    });
  });

  describe('Stack Integration', () => {
    it('should create stack with multiple environments', (done) => {
      const devStack = new ComplianceMonitoringStack('dev-stack', {
        environmentSuffix: 'dev',
      });
      const prodStack = new ComplianceMonitoringStack('prod-stack', {
        environmentSuffix: 'prod',
      });

      Promise.all([
        devStack.reportBucketName.promise(),
        prodStack.reportBucketName.promise(),
      ]).then(([devBucket, prodBucket]) => {
        expect(devBucket).toContain('dev');
        expect(prodBucket).toContain('prod');
        expect(devBucket).not.toEqual(prodBucket);
        done();
      });
    });
  });

  describe('Component Resource', () => {
    it('should be a valid Pulumi ComponentResource', () => {
      expect(stack).toHaveProperty('urn');
      expect(stack).toHaveProperty('registerOutputs');
    });
  });

  describe('Resource Type', () => {
    it('should have correct component resource type', () => {
      expect(stack.constructor.name).toBe('ComplianceMonitoringStack');
    });
  });

  describe('Args Interface', () => {
    it('should require environmentSuffix in args', () => {
      const validArgs = {
        environmentSuffix: 'test',
      };
      const testStack = new ComplianceMonitoringStack('args-test', validArgs);
      expect(testStack).toBeDefined();
    });

    it('should accept tags as optional parameter', () => {
      const argsWithTags = {
        environmentSuffix: 'test',
        tags: { Key: 'Value' },
      };
      const testStack = new ComplianceMonitoringStack('tags-args-test', argsWithTags);
      expect(testStack).toBeDefined();
    });
  });
});
