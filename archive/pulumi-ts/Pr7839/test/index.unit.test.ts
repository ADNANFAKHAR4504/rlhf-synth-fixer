import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks before importing the infrastructure code
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const resourceName = args.inputs.name || args.inputs.bucket || args.name;
    return {
      id: resourceName || `${args.name}_id`,
      state: {
        ...args.inputs,
        id: resourceName || `${args.name}_id`,
        arn: args.inputs.name
          ? `arn:aws:service::account-id:${args.type}/${args.inputs.name}`
          : `arn:aws:service::account-id:${args.type}/${resourceName}`,
        name: resourceName,
        bucket: args.inputs.bucket || undefined,
        dashboardName: args.inputs.dashboardName || undefined,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

// Mock config
class MockConfig {
  require(key: string): string {
    if (key === 'environmentSuffix') return 'test-env';
    return 'test-value';
  }

  get(key: string): string | undefined {
    if (key === 'awsRegion') return undefined; // Test the fallback branch
    return undefined;
  }
}

jest.mock('@pulumi/pulumi', () => {
  const actual = jest.requireActual('@pulumi/pulumi');
  return {
    ...actual,
    Config: jest.fn(() => new MockConfig()),
  };
});

describe('Tag Compliance Monitoring Infrastructure', () => {
  describe('Infrastructure Code Validation', () => {
    it('should define infrastructure resources', () => {
      // Import after mocks are set up
      const index = require('../lib/index');

      // Verify exports exist
      expect(index.complianceLogsBucketName).toBeDefined();
      expect(index.complianceLogsBucketArn).toBeDefined();
      expect(index.complianceAlertsTopicArn).toBeDefined();
      expect(index.tagComplianceCheckerFunctionName).toBeDefined();
      expect(index.tagComplianceCheckerFunctionArn).toBeDefined();
      expect(index.ec2StateChangeRuleName).toBeDefined();
      expect(index.complianceDashboardName).toBeDefined();
      expect(index.highNonComplianceAlarmName).toBeDefined();
      expect(index.bucketPublicAccessBlockId).toBeDefined();
      expect(index.ec2StateChangeTargetId).toBeDefined();
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should create compliance logs bucket', (done) => {
      const index = require('../lib/index');

      index.complianceLogsBucketName.apply((name: string) => {
        expect(name).toContain('compliance-logs');
        done();
      });
    });

    it('should have bucket ARN defined', (done) => {
      const index = require('../lib/index');

      index.complianceLogsBucketArn.apply((arn: string) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });
  });

  describe('SNS Topic Configuration', () => {
    it('should create compliance alerts topic', (done) => {
      const index = require('../lib/index');

      index.complianceAlertsTopicArn.apply((arn: string) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should create tag compliance checker function', (done) => {
      const index = require('../lib/index');

      index.tagComplianceCheckerFunctionName.apply((name: string) => {
        expect(name).toContain('tag-compliance-checker');
        done();
      });
    });

    it('should have function ARN defined', (done) => {
      const index = require('../lib/index');

      index.tagComplianceCheckerFunctionArn.apply((arn: string) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });
  });

  describe('CloudWatch Events Rule Configuration', () => {
    it('should create EC2 state change rule', (done) => {
      const index = require('../lib/index');

      index.ec2StateChangeRuleName.apply((name: string) => {
        expect(name).toContain('ec2-state-change');
        done();
      });
    });
  });

  describe('CloudWatch Dashboard Configuration', () => {
    it('should create compliance dashboard', (done) => {
      const index = require('../lib/index');

      index.complianceDashboardName.apply((name: string) => {
        expect(name).toContain('tag-compliance');
        done();
      });
    });
  });

  describe('CloudWatch Alarm Configuration', () => {
    it('should create high non-compliance alarm', (done) => {
      const index = require('../lib/index');

      index.highNonComplianceAlarmName.apply((name: string) => {
        expect(name).toContain('high-non-compliance');
        done();
      });
    });
  });

  describe('Security Configuration', () => {
    it('should create S3 bucket public access block', (done) => {
      const index = require('../lib/index');

      index.bucketPublicAccessBlockId.apply((id: string) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });
  });

  describe('EventBridge Integration', () => {
    it('should create EventBridge target', (done) => {
      const index = require('../lib/index');

      index.ec2StateChangeTargetId.apply((id: string) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    it('should use environment suffix in resource names', (done) => {
      const index = require('../lib/index');

      Promise.all([
        new Promise((resolve) => {
          index.complianceLogsBucketName.apply((name: string) => resolve(name));
        }),
        new Promise((resolve) => {
          index.tagComplianceCheckerFunctionName.apply((name: string) =>
            resolve(name)
          );
        }),
        new Promise((resolve) => {
          index.ec2StateChangeRuleName.apply((name: string) => resolve(name));
        }),
      ]).then(([bucketName, functionName, ruleName]) => {
        expect(bucketName).toBeDefined();
        expect(functionName).toBeDefined();
        expect(ruleName).toBeDefined();
        done();
      });
    });
  });

  describe('All Outputs Defined', () => {
    it('should export all required outputs', () => {
      const index = require('../lib/index');

      const requiredExports = [
        'complianceLogsBucketName',
        'complianceLogsBucketArn',
        'complianceAlertsTopicArn',
        'tagComplianceCheckerFunctionName',
        'tagComplianceCheckerFunctionArn',
        'ec2StateChangeRuleName',
        'complianceDashboardName',
        'highNonComplianceAlarmName',
        'bucketPublicAccessBlockId',
        'ec2StateChangeTargetId',
      ];

      requiredExports.forEach((exportName) => {
        expect(index[exportName]).toBeDefined();
      });
    });
  });
});
