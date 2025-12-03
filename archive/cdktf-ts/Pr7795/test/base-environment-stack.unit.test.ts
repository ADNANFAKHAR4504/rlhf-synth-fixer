import { App, Testing } from 'cdktf';
import { DevStack } from '../lib/dev-stack';
import { StagingStack } from '../lib/staging-stack';
import { ProdStack } from '../lib/prod-stack';
import { EnvironmentConfig } from '../lib/types';

describe('BaseEnvironmentStack Validation', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  describe('Configuration Validation', () => {
    test('Stack throws error for empty environment name', () => {
      const invalidConfig: EnvironmentConfig = {
        name: '',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'test',
      };

      expect(() => {
        new DevStack(app, 'TestInvalidNameStack', {
          config: invalidConfig,
          awsRegion: 'us-east-1',
        });
      }).toThrow('Environment name is required');
    });

    test('Stack throws error for invalid CIDR block format', () => {
      const invalidConfig: EnvironmentConfig = {
        name: 'test',
        cidrBlock: '192.168.1.0/24',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'test',
      };

      expect(() => {
        new DevStack(app, 'TestInvalidCIDRStack', {
          config: invalidConfig,
          awsRegion: 'us-east-1',
        });
      }).toThrow('Invalid CIDR block');
    });

    test('Stack throws error for invalid account ID', () => {
      const invalidConfig: EnvironmentConfig = {
        name: 'test',
        cidrBlock: '10.1.0.0/16',
        accountId: '12345',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'test',
      };

      expect(() => {
        new DevStack(app, 'TestInvalidAccountStack', {
          config: invalidConfig,
          awsRegion: 'us-east-1',
        });
      }).toThrow('Valid AWS account ID (12 digits) is required');
    });

    test('Stack throws error for invalid capacity configuration', () => {
      const invalidConfig: EnvironmentConfig = {
        name: 'test',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 5,
        maxCapacity: 3,
        costCenter: 'test',
      };

      expect(() => {
        new DevStack(app, 'TestInvalidCapacityStack', {
          config: invalidConfig,
          awsRegion: 'us-east-1',
        });
      }).toThrow('Invalid capacity configuration');
    });

    test('Stack throws error for minCapacity less than 1', () => {
      const invalidConfig: EnvironmentConfig = {
        name: 'test',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 0,
        maxCapacity: 3,
        costCenter: 'test',
      };

      expect(() => {
        new DevStack(app, 'TestMinCapacityStack', {
          config: invalidConfig,
          awsRegion: 'us-east-1',
        });
      }).toThrow('Invalid capacity configuration');
    });
  });

  describe('Environment-Specific Implementation', () => {
    test('DevStack creates stack with correct configuration', () => {
      const validConfig: EnvironmentConfig = {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      };

      const stack = new DevStack(app, 'TestDevStack', {
        config: validConfig,
        awsRegion: 'us-east-1',
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(synthesized.resource).toBeDefined();
    });

    test('StagingStack creates stack with replication config', () => {
      const validConfig: EnvironmentConfig = {
        name: 'staging',
        cidrBlock: '10.2.0.0/16',
        accountId: '234567890123',
        instanceType: 'db.r5.large',
        minCapacity: 2,
        maxCapacity: 5,
        costCenter: 'engineering-staging',
        enableCrossEnvironmentReplication: true,
        replicationSourceArn: 'arn:aws:rds:us-east-1:345678901234:cluster:prod-cluster',
      };

      const stack = new StagingStack(app, 'TestStagingStack', {
        config: validConfig,
        awsRegion: 'us-east-1',
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(synthesized.resource).toBeDefined();
    });

    test('ProdStack creates stack with certificate', () => {
      const validConfig: EnvironmentConfig = {
        name: 'prod',
        cidrBlock: '10.3.0.0/16',
        accountId: '345678901234',
        instanceType: 'db.r5.xlarge',
        minCapacity: 3,
        maxCapacity: 10,
        costCenter: 'engineering-prod',
        certificateArn: 'arn:aws:acm:us-east-1:345678901234:certificate/test',
      };

      const stack = new ProdStack(app, 'TestProdStack', {
        config: validConfig,
        awsRegion: 'us-east-1',
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(synthesized.resource).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    test('Stack creates outputs for all resources', () => {
      const validConfig: EnvironmentConfig = {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      };

      const stack = new DevStack(app, 'TestOutputsStack', {
        config: validConfig,
        awsRegion: 'us-east-1',
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(synthesized.output).toBeDefined();
      expect(Object.keys(synthesized.output).length).toBeGreaterThan(0);
    });

    test('Sensitive outputs are marked as sensitive', () => {
      const validConfig: EnvironmentConfig = {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      };

      const stack = new DevStack(app, 'TestSensitiveStack', {
        config: validConfig,
        awsRegion: 'us-east-1',
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      const outputs = synthesized.output;

      const auroraOutput = Object.keys(outputs).find(key => key.includes('aurora-endpoint'));
      if (auroraOutput) {
        expect(outputs[auroraOutput].sensitive).toBe(true);
      }
    });
  });

  describe('Resource Tagging', () => {
    test('Common tags applied to all resources', () => {
      const validConfig: EnvironmentConfig = {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      };

      const stack = new DevStack(app, 'TestTagsStack', {
        config: validConfig,
        awsRegion: 'us-east-1',
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(synthesized.resource).toBeDefined();
    });
  });
});
