import * as pulumi from '@pulumi/pulumi';

describe('AWS Compliance Scanner - Default Region Configuration', () => {
  let stack: typeof import('../tap-stack');

  beforeAll(async () => {
    // Mock Pulumi runtime
    pulumi.runtime.setMocks(
      {
        newResource: function (args: pulumi.runtime.MockResourceArgs): {
          id: string;
          state: any;
        } {
          return {
            id: args.inputs.name ? `${args.name}_id` : args.name,
            state: args.inputs,
          };
        },
        call: function (args: pulumi.runtime.MockCallArgs) {
          return args.inputs;
        },
      },
      'TapStack',
      'TapStack',
      false // dryRun
    );

    // Set only environmentSuffix, NOT awsRegion to test the default
    pulumi.runtime.setConfig('TapStack:environmentSuffix', 'test-default');
    // Explicitly do NOT set awsRegion to trigger the default value

    // Import the stack
    stack = require('../tap-stack');
  });

  it('should use us-east-1 as default region when awsRegion is not provided', (done) => {
    stack.complianceDashboardUrl.apply((dashboardUrl) => {
      expect(dashboardUrl).toContain('us-east-1');
      done();
    });
  });

  it('should create resources with default region', (done) => {
    stack.complianceReportBucketName.apply((bucketName) => {
      expect(bucketName).toBe('compliance-reports-test-default');
      done();
    });
  });
});
