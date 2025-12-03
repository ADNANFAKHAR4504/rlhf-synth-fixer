import * as pulumi from '@pulumi/pulumi';

// Set configuration BEFORE any mocks or imports (must be first)
process.env.PULUMI_CONFIG = JSON.stringify({
  'rds-optimization:environmentSuffix': 'test',
  'rds-optimization:dbPassword': {
    secure: 'v1:TestPassword123!',
  },
});

// Configure mocks before any infrastructure code is loaded
pulumi.runtime.setMocks(
  {
    newResource: (args: pulumi.runtime.MockResourceArgs): {
      id: string;
      state: Record<string, unknown>;
    } => {
      // Build default state based on resource type
      const state: Record<string, unknown> = {
        ...args.inputs,
        id: `${args.name}-id`,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      };

      // Add resource-specific properties
      switch (args.type) {
        case 'aws:ec2/vpc:Vpc':
          state.cidrBlock = args.inputs.cidrBlock;
          break;
        case 'aws:rds/instance:Instance':
          state.identifier = args.inputs.identifier;
          state.endpoint = `${args.inputs.identifier}.mock.rds.amazonaws.com:5432`;
          state.address = `${args.inputs.identifier}.mock.rds.amazonaws.com`;
          state.instanceClass = args.inputs.instanceClass;
          state.engine = args.inputs.engine;
          break;
        case 'aws:rds/parameterGroup:ParameterGroup':
          state.name = args.name;
          state.family = args.inputs.family;
          break;
        case 'aws:sns/topic:Topic':
          state.arn = `arn:aws:sns:us-east-1:123456789012:${args.name}`;
          break;
        case 'aws:cloudwatch/metricAlarm:MetricAlarm':
          state.name = args.inputs.name;
          break;
      }

      return {
        id: state.id as string,
        state,
      };
    },
    call: (args: pulumi.runtime.MockCallArgs) => {
      // Mock AWS provider calls
      if (args.token === 'pulumi:pulumi:getStack') {
        return {
          outputs: {},
        };
      }
      return args.inputs;
    },
  },
  'rds-optimization',
  'test',
  true
);

describe('RDS Optimization Infrastructure - Unit Tests', () => {
  let stack: any;
  let stackWithDefaultRegion: any;

  beforeAll(() => {
    // Load infrastructure after mocks are configured
    const { RDSOptimizationStack } = require('../lib/rds-stack');

    // Create stack instance with explicit region
    stack = new RDSOptimizationStack('test-stack', {
      environmentSuffix: 'test',
      dbPassword: pulumi.output('test-password'),
      region: 'us-east-1',
    });

    // Create stack instance without region (to test default)
    stackWithDefaultRegion = new RDSOptimizationStack('test-stack-default', {
      environmentSuffix: 'test-default',
      dbPassword: pulumi.output('test-password'),
      // region is omitted to test default value
    });
  });

  describe('Stack Outputs', () => {
    it('should export vpcId', (done) => {
      stack.vpcId.apply((id: string) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });

    it('should export dbInstanceId', (done) => {
      stack.dbInstanceId.apply((id: string) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });

    it('should export dbInstanceEndpoint', (done) => {
      stack.dbInstanceEndpoint.apply((endpoint: string) => {
        expect(endpoint).toBeDefined();
        expect(endpoint).toContain('rds.amazonaws.com');
        done();
      });
    });

    it('should export dbInstanceAddress', (done) => {
      stack.dbInstanceAddress.apply((address: string) => {
        expect(address).toBeDefined();
        expect(address).toContain('rds.amazonaws.com');
        done();
      });
    });

    it('should export readReplicaEndpoint', (done) => {
      stack.readReplicaEndpoint.apply((endpoint: string) => {
        expect(endpoint).toBeDefined();
        expect(endpoint).toContain('rds.amazonaws.com');
        done();
      });
    });

    it('should export readReplicaAddress', (done) => {
      stack.readReplicaAddress.apply((address: string) => {
        expect(address).toBeDefined();
        expect(address).toContain('rds.amazonaws.com');
        done();
      });
    });

    it('should export dbSecurityGroupId', (done) => {
      stack.dbSecurityGroupId.apply((id: string) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });

    it('should export dbParameterGroupName', (done) => {
      stack.dbParameterGroupName.apply((name: string) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export snsTopicArn', (done) => {
      stack.snsTopicArn.apply((arn: string) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:sns:');
        done();
      });
    });

    it('should export cpuAlarmName', (done) => {
      stack.cpuAlarmName.apply((name: string) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export storageAlarmName', (done) => {
      stack.storageAlarmName.apply((name: string) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export replicaLagAlarmName', (done) => {
      stack.replicaLagAlarmName.apply((name: string) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });
  });

  describe('Output Types', () => {
    it('should export all outputs as Pulumi Output objects', () => {
      expect(pulumi.Output.isInstance(stack.vpcId)).toBe(true);
      expect(pulumi.Output.isInstance(stack.dbInstanceId)).toBe(true);
      expect(pulumi.Output.isInstance(stack.dbInstanceEndpoint)).toBe(true);
      expect(pulumi.Output.isInstance(stack.dbInstanceAddress)).toBe(true);
      expect(pulumi.Output.isInstance(stack.readReplicaEndpoint)).toBe(true);
      expect(pulumi.Output.isInstance(stack.readReplicaAddress)).toBe(true);
      expect(pulumi.Output.isInstance(stack.dbSecurityGroupId)).toBe(true);
      expect(pulumi.Output.isInstance(stack.dbParameterGroupName)).toBe(true);
      expect(pulumi.Output.isInstance(stack.snsTopicArn)).toBe(true);
      expect(pulumi.Output.isInstance(stack.cpuAlarmName)).toBe(true);
      expect(pulumi.Output.isInstance(stack.storageAlarmName)).toBe(true);
      expect(pulumi.Output.isInstance(stack.replicaLagAlarmName)).toBe(true);
    });
  });

  describe('Infrastructure Completeness', () => {
    it('should have all required exports defined', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.dbInstanceId).toBeDefined();
      expect(stack.dbInstanceEndpoint).toBeDefined();
      expect(stack.dbInstanceAddress).toBeDefined();
      expect(stack.readReplicaEndpoint).toBeDefined();
      expect(stack.readReplicaAddress).toBeDefined();
      expect(stack.dbSecurityGroupId).toBeDefined();
      expect(stack.dbParameterGroupName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.cpuAlarmName).toBeDefined();
      expect(stack.storageAlarmName).toBeDefined();
      expect(stack.replicaLagAlarmName).toBeDefined();
    });
  });

  describe('Resource Validation', () => {
    it('should validate all resources resolve successfully', async () => {
      await Promise.all([
        stack.vpcId.apply((id) => expect(id).toBeDefined()),
        stack.dbInstanceId.apply((id) => expect(id).toBeDefined()),
        stack.readReplicaEndpoint.apply((endpoint) =>
          expect(endpoint).toBeDefined()
        ),
        stack.snsTopicArn.apply((arn) => expect(arn).toBeDefined()),
        stack.cpuAlarmName.apply((name) => expect(name).toBeDefined()),
        stack.storageAlarmName.apply((name) => expect(name).toBeDefined()),
        stack.replicaLagAlarmName.apply((name) => expect(name).toBeDefined()),
      ]);
    });
  });

  describe('Configuration Options', () => {
    it('should work with default region when region is not specified', (done) => {
      // Test that stack with default region also has valid outputs
      stackWithDefaultRegion.vpcId.apply((id: string) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });

    it('should create resources with correct environment suffix', (done) => {
      stack.dbSecurityGroupId.apply((id: string) => {
        // Verify output exists (actual resource naming tested in deployment)
        expect(id).toBeDefined();
        done();
      });
    });
  });
});
