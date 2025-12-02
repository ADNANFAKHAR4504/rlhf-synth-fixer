import * as pulumi from '@pulumi/pulumi';

// Configure mocks before any infrastructure code is loaded
pulumi.runtime.setMocks({
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
    return args.inputs;
  },
});

// Set configuration using environment variables (Pulumi Config convention)
process.env.PULUMI_CONFIG = JSON.stringify({
  'rds-optimization:environmentSuffix': 'test',
  'rds-optimization:dbPassword': {
    secure: 'v1:TestPassword123!',
  },
});

describe('RDS Optimization Infrastructure - Unit Tests', () => {
  let infra: typeof import('../index');

  beforeAll(() => {
    // Load infrastructure after mocks are configured
    infra = require('../index');
  });

  describe('Stack Outputs', () => {
    it('should export vpcId', (done) => {
      infra.vpcId.apply((id: string) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });

    it('should export dbInstanceId', (done) => {
      infra.dbInstanceId.apply((id: string) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });

    it('should export dbInstanceEndpoint', (done) => {
      infra.dbInstanceEndpoint.apply((endpoint: string) => {
        expect(endpoint).toBeDefined();
        expect(endpoint).toContain('rds.amazonaws.com');
        done();
      });
    });

    it('should export dbInstanceAddress', (done) => {
      infra.dbInstanceAddress.apply((address: string) => {
        expect(address).toBeDefined();
        expect(address).toContain('rds.amazonaws.com');
        done();
      });
    });

    it('should export readReplicaEndpoint', (done) => {
      infra.readReplicaEndpoint.apply((endpoint: string) => {
        expect(endpoint).toBeDefined();
        expect(endpoint).toContain('rds.amazonaws.com');
        done();
      });
    });

    it('should export readReplicaAddress', (done) => {
      infra.readReplicaAddress.apply((address: string) => {
        expect(address).toBeDefined();
        expect(address).toContain('rds.amazonaws.com');
        done();
      });
    });

    it('should export dbSecurityGroupId', (done) => {
      infra.dbSecurityGroupId.apply((id: string) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });

    it('should export dbParameterGroupName', (done) => {
      infra.dbParameterGroupName.apply((name: string) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export snsTopicArn', (done) => {
      infra.snsTopicArn.apply((arn: string) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:sns:');
        done();
      });
    });

    it('should export cpuAlarmName', (done) => {
      infra.cpuAlarmName.apply((name: string) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export storageAlarmName', (done) => {
      infra.storageAlarmName.apply((name: string) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export replicaLagAlarmName', (done) => {
      infra.replicaLagAlarmName.apply((name: string) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });
  });

  describe('Output Types', () => {
    it('should export all outputs as Pulumi Output objects', () => {
      expect(pulumi.Output.isInstance(infra.vpcId)).toBe(true);
      expect(pulumi.Output.isInstance(infra.dbInstanceId)).toBe(true);
      expect(pulumi.Output.isInstance(infra.dbInstanceEndpoint)).toBe(true);
      expect(pulumi.Output.isInstance(infra.dbInstanceAddress)).toBe(true);
      expect(pulumi.Output.isInstance(infra.readReplicaEndpoint)).toBe(true);
      expect(pulumi.Output.isInstance(infra.readReplicaAddress)).toBe(true);
      expect(pulumi.Output.isInstance(infra.dbSecurityGroupId)).toBe(true);
      expect(pulumi.Output.isInstance(infra.dbParameterGroupName)).toBe(true);
      expect(pulumi.Output.isInstance(infra.snsTopicArn)).toBe(true);
      expect(pulumi.Output.isInstance(infra.cpuAlarmName)).toBe(true);
      expect(pulumi.Output.isInstance(infra.storageAlarmName)).toBe(true);
      expect(pulumi.Output.isInstance(infra.replicaLagAlarmName)).toBe(true);
    });
  });

  describe('Infrastructure Completeness', () => {
    it('should have all required exports defined', () => {
      expect(infra.vpcId).toBeDefined();
      expect(infra.dbInstanceId).toBeDefined();
      expect(infra.dbInstanceEndpoint).toBeDefined();
      expect(infra.dbInstanceAddress).toBeDefined();
      expect(infra.readReplicaEndpoint).toBeDefined();
      expect(infra.readReplicaAddress).toBeDefined();
      expect(infra.dbSecurityGroupId).toBeDefined();
      expect(infra.dbParameterGroupName).toBeDefined();
      expect(infra.snsTopicArn).toBeDefined();
      expect(infra.cpuAlarmName).toBeDefined();
      expect(infra.storageAlarmName).toBeDefined();
      expect(infra.replicaLagAlarmName).toBeDefined();
    });
  });

  describe('Resource Validation', () => {
    it('should validate all resources resolve successfully', async () => {
      await Promise.all([
        infra.vpcId.apply((id) => expect(id).toBeDefined()),
        infra.dbInstanceId.apply((id) => expect(id).toBeDefined()),
        infra.readReplicaEndpoint.apply((endpoint) =>
          expect(endpoint).toBeDefined()
        ),
        infra.snsTopicArn.apply((arn) => expect(arn).toBeDefined()),
        infra.cpuAlarmName.apply((name) => expect(name).toBeDefined()),
        infra.storageAlarmName.apply((name) => expect(name).toBeDefined()),
        infra.replicaLagAlarmName.apply((name) => expect(name).toBeDefined()),
      ]);
    });
  });
});
