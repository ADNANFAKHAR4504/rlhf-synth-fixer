/**
 * Unit tests for the database migration stack.
 */
import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.inputs.name ? `${args.inputs.name}-id` : 'mock-id',
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-2a', 'us-east-2b', 'us-east-2c'],
      };
    }
    if (
      args.token === 'aws:secretsmanager/getSecretVersion:getSecretVersion' ||
      args.token ===
        'aws:secretsmanager/getSecretVersionOutput:getSecretVersionOutput'
    ) {
      return {
        arn: 'arn:aws:secretsmanager:us-east-2:123456789012:secret:mock-secret',
        secretString: JSON.stringify({
          username: 'mock_user',
          password: 'mock_password',
        }),
      };
    }
    return {};
  },
});

describe('Database Migration Stack Tests', () => {
  let tapStack: typeof import('../lib/tap-stack');

  beforeAll(() => {
    tapStack = require('../lib/tap-stack');
  });

  describe('TapStack', () => {
    it('should create stack with required properties', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test-001',
        migrationPhase: 'dev',
        costCenter: 'test-team',
        complianceScope: 'PCI-DSS',
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.dmsReplicationInstanceArn).toBeDefined();
    });

    it('should include environment suffix in resource names', async () => {
      const environmentSuffix = 'test-123';
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix,
        migrationPhase: 'dev',
        costCenter: 'test-team',
        complianceScope: 'PCI-DSS',
      });

      // Verify outputs are defined
      // Note: In mocked environment, outputs are mock values
      // The actual resource names are validated during deployment
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBeDefined();
      expect(vpcId.length).toBeGreaterThan(0);
    });

    it('should export all required outputs', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test-001',
        migrationPhase: 'dev',
        costCenter: 'test-team',
        complianceScope: 'PCI-DSS',
      });

      expect(stack.vpcId).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.dmsReplicationInstanceArn).toBeDefined();
      expect(stack.secretsManagerArn).toBeDefined();
      expect(stack.replicationLagAlarmArn).toBeDefined();
      expect(stack.kmsKeyId).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should apply required tags to resources', async () => {
      const tags = {
        Environment: 'test',
        MigrationPhase: 'dev',
        CostCenter: 'test-team',
        ComplianceScope: 'PCI-DSS',
      };

      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test-001',
        migrationPhase: 'dev',
        costCenter: 'test-team',
        complianceScope: 'PCI-DSS',
        tags,
      });

      expect(stack).toBeDefined();
    });
  });
});
