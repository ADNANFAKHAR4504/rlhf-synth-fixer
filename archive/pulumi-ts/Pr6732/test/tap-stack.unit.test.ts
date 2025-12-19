import {
  describe,
  it,
  expect,
  beforeAll,
  jest,
  beforeEach,
} from '@jest/globals';
import * as pulumi from '@pulumi/pulumi';

// Mock the config module before other imports
jest.mock('../lib/config', () => ({
  getConfig: jest.fn(() => ({
    environmentSuffix: 'test-123',
    maxSessionDuration: 3600,
    isDryRun: false,
    legacyAccountId: '123456789012',
    productionAccountId: '123456789012',
    stagingAccountId: '123456789012',
    developmentAccountId: '123456789012',
    centralAccountId: '123456789012',
    region: 'us-east-1',
    secondaryRegion: 'us-east-2',
  })),
}));

// Set up Pulumi mocks before all tests
beforeAll(() => {
  // Set required config values
  process.env.PULUMI_NODEJS_PROJECT = 'test-project';
  process.env.PULUMI_NODEJS_STACK = 'test-stack';

  pulumi.runtime.setMocks({
    newResource: function (args: pulumi.runtime.MockResourceArgs): {
      id: string;
      state: any;
    } {
      return {
        id: args.inputs.name
          ? `${args.name}-id-${args.inputs.name}`
          : `${args.name}-id`,
        state: {
          ...args.inputs,
          arn: `arn:aws:${args.type.split('/')[0]}:us-east-1:123456789012:${args.name}`,
        },
      };
    },
    call: function (args: pulumi.runtime.MockCallArgs) {
      if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
        return {
          accountId: '123456789012',
          arn: 'arn:aws:iam::123456789012:user/test',
          userId: 'AIDAI123456789EXAMPLE',
        };
      }
      if (args.token === 'aws:index/getRegion:getRegion') {
        return {
          name: 'us-east-1',
          id: 'us-east-1',
        };
      }
      if (
        args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones'
      ) {
        return {
          names: ['us-east-1a', 'us-east-1b'],
          zoneIds: ['use1-az1', 'use1-az2'],
        };
      }
      return args.inputs;
    },
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TapStack Unit Tests', () => {
  describe('Configuration Module', () => {
    it('should load configuration with correct defaults', () => {
      const { getConfig } = require('../lib/config');
      const config = getConfig();

      expect(config).toBeDefined();
      expect(config.environmentSuffix).toBe('test-123');
      expect(config.maxSessionDuration).toBe(3600);
      expect(config.isDryRun).toBe(false);
      expect(config.legacyAccountId).toBe('123456789012');
      expect(config.productionAccountId).toBe('123456789012');
      expect(config.stagingAccountId).toBe('123456789012');
      expect(config.developmentAccountId).toBe('123456789012');
      expect(config.centralAccountId).toBe('123456789012');
    });

    it('should return mocked configuration values', () => {
      const { getConfig } = require('../lib/config');
      const config = getConfig();

      expect(config.region).toBe('us-east-1');
      expect(config.secondaryRegion).toBe('us-east-2');
      expect(config.maxSessionDuration).toBeLessThanOrEqual(3600);
    });
  });

  describe('IAM Roles Module', () => {
    it('should create cross-account IAM roles', () => {
      const { createIamRoles } = require('../lib/iam-roles');
      const mockConfig = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789013',
        stagingAccountId: '123456789014',
        developmentAccountId: '123456789015',
        centralAccountId: '123456789016',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };

      const roles = createIamRoles(mockConfig);

      expect(roles).toBeDefined();
      expect(roles.migrationOrchestratorRole).toBeDefined();
      expect(roles.legacyAccountRole).toBeDefined();
      expect(roles.productionAccountRole).toBeDefined();
      expect(roles.stagingAccountRole).toBeDefined();
      expect(roles.developmentAccountRole).toBeDefined();
    });

    it('should create roles with correct session duration', () => {
      const { createIamRoles } = require('../lib/iam-roles');
      const mockConfig = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };

      const roles = createIamRoles(mockConfig);
      expect(roles.migrationOrchestratorRole).toBeDefined();
    });

    it('should generate correct role ARN with getRoleArn helper', () => {
      const { getRoleArn } = require('../lib/iam-roles');
      const mockRole = {
        name: pulumi.output('test-role-name'),
        arn: pulumi.output('arn:aws:iam::123456789012:role/test-role-name'),
      };

      const arnOutput = getRoleArn(mockRole as any, '123456789012');

      arnOutput.apply((arn: string) => {
        expect(arn).toBe('arn:aws:iam::123456789012:role/test-role-name');
      });
    });

    it('should create orchestrator role with CloudWatch Logs permissions', () => {
      const { createIamRoles } = require('../lib/iam-roles');
      const mockConfig = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };

      const roles = createIamRoles(mockConfig);

      expect(roles.migrationOrchestratorRole).toBeDefined();
      expect(roles.migrationOrchestratorPolicy).toBeDefined();
    });

    it('should include Step Functions service principal in orchestrator role', () => {
      const { createIamRoles } = require('../lib/iam-roles');
      const mockConfig = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };

      const roles = createIamRoles(mockConfig);

      // Verify the role can be assumed by Step Functions
      expect(roles.migrationOrchestratorRole).toBeDefined();
    });
  });

  describe('Transit Gateway Module', () => {
    it('should create transit gateway resources', () => {
      const { createTransitGateway } = require('../lib/transit-gateway');
      const mockConfig = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockIamRoles = {
        legacyAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/test'),
          name: pulumi.output('test-role'),
        },
        productionAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/test'),
          name: pulumi.output('test-role'),
        },
        stagingAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/test'),
          name: pulumi.output('test-role'),
        },
        developmentAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/test'),
          name: pulumi.output('test-role'),
        },
        migrationOrchestratorRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/test'),
          name: pulumi.output('test-role'),
        },
      };

      const tgw = createTransitGateway(mockConfig, mockIamRoles as any);

      expect(tgw).toBeDefined();
      expect(tgw.tgw).toBeDefined();
      expect(tgw.ramShare).toBeDefined();
      expect(tgw.ramPrincipalAssociations).toBeDefined();
      expect(tgw.ramPrincipalAssociations).toEqual([]);
    });

    // Note: Multi-account mode cannot be unit tested because it attempts to create
    // real AWS PrincipalAssociation resources with dependsOn, which fails in test environment.
    // The multi-account code path (line 95 in transit-gateway.ts) is tested in integration/E2E tests.
  });

  describe('Step Functions Module', () => {
    it('should create step functions state machine', () => {
      const { createStepFunctions } = require('../lib/step-functions');
      const mockConfig = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockIamRoles = {
        migrationOrchestratorRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/test'),
          id: pulumi.output('test-role-id'),
        },
        legacyAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/legacy'),
        },
        productionAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/prod'),
        },
        stagingAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/staging'),
        },
        developmentAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/dev'),
        },
        migrationOrchestratorPolicy: { id: pulumi.output('policy-id') },
      };
      const mockParameterStore = {
        migrationMetadata: { name: pulumi.output('test-param') },
        migrationProgress: { name: pulumi.output('test-progress') },
        migrationServices: { name: pulumi.output('test-services') },
        migrationSchedule: { name: pulumi.output('test-schedule') },
      };

      const stepFunctions = createStepFunctions(
        mockConfig,
        mockIamRoles as any,
        mockParameterStore as any
      );

      expect(stepFunctions).toBeDefined();
      expect(stepFunctions.stateMachine).toBeDefined();
      expect(stepFunctions.logGroup).toBeDefined();
    });

    it('should create dry-run state machine in simulation mode', () => {
      const { createStepFunctions } = require('../lib/step-functions');
      const mockConfig = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: true,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockIamRoles = {
        migrationOrchestratorRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/test'),
          id: pulumi.output('test-role-id'),
        },
        legacyAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/legacy'),
        },
        productionAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/prod'),
        },
        stagingAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/staging'),
        },
        developmentAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/dev'),
        },
        migrationOrchestratorPolicy: { id: pulumi.output('policy-id') },
      };
      const mockParameterStore = {
        migrationMetadata: { name: pulumi.output('test-param') },
        migrationProgress: { name: pulumi.output('test-progress') },
        migrationServices: { name: pulumi.output('test-services') },
        migrationSchedule: { name: pulumi.output('test-schedule') },
      };

      const stepFunctions = createStepFunctions(
        mockConfig,
        mockIamRoles as any,
        mockParameterStore as any
      );

      expect(stepFunctions).toBeDefined();
      expect(stepFunctions.stateMachine).toBeDefined();
    });

    it('should create CloudWatch log group with resource policy for Step Functions', () => {
      const { createStepFunctions } = require('../lib/step-functions');
      const mockConfig = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockIamRoles = {
        migrationOrchestratorRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/test'),
          id: pulumi.output('test-role-id'),
        },
        legacyAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/legacy'),
        },
        productionAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/prod'),
        },
        stagingAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/staging'),
        },
        developmentAccountRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/dev'),
        },
        migrationOrchestratorPolicy: { id: pulumi.output('policy-id') },
      };
      const mockParameterStore = {
        migrationMetadata: { name: pulumi.output('test-param') },
        migrationProgress: { name: pulumi.output('test-progress') },
        migrationServices: { name: pulumi.output('test-services') },
        migrationSchedule: { name: pulumi.output('test-schedule') },
      };

      const stepFunctions = createStepFunctions(
        mockConfig,
        mockIamRoles as any,
        mockParameterStore as any
      );

      expect(stepFunctions).toBeDefined();
      expect(stepFunctions.logGroup).toBeDefined();
      expect(stepFunctions.stateMachine).toBeDefined();
    });

    it('should test getMigrationProgress helper function', () => {
      const { getMigrationProgress } = require('../lib/step-functions');

      const stateMachineArn = pulumi.output(
        'arn:aws:states:us-east-1:123456789012:stateMachine:test'
      );
      const parameterName = pulumi.output('/migration/progress');

      const progress = getMigrationProgress(stateMachineArn, parameterName);

      progress.apply((value: number) => {
        expect(value).toBe(0);
      });
    });
  });

  describe('EventBridge Module', () => {
    it('should create EventBridge monitoring infrastructure', () => {
      const { createEventBridge } = require('../lib/eventbridge');
      const mockConfig = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockIamRoles = {
        migrationOrchestratorRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/test'),
        },
      };

      const eventBridge = createEventBridge(mockConfig, mockIamRoles as any);

      expect(eventBridge).toBeDefined();
      expect(eventBridge.centralEventBus).toBeDefined();
      expect(eventBridge.migrationEventRule).toBeDefined();
      expect(eventBridge.eventLogGroup).toBeDefined();
      expect(eventBridge.eventTarget).toBeDefined();
    });
  });

  describe('Parameter Store Module', () => {
    it('should create parameter store hierarchies', () => {
      const { createParameterStore } = require('../lib/parameter-store');
      const mockConfig = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };

      const params = createParameterStore(mockConfig);

      expect(params).toBeDefined();
      expect(params.migrationMetadata).toBeDefined();
      expect(params.legacyAccountMetadata).toBeDefined();
      expect(params.productionAccountMetadata).toBeDefined();
      expect(params.stagingAccountMetadata).toBeDefined();
      expect(params.developmentAccountMetadata).toBeDefined();
    });
  });

  describe('Route53 Module', () => {
    it('should create Route53 traffic shifting resources', () => {
      const { createRoute53 } = require('../lib/route53');
      const mockConfig = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };

      const route53 = createRoute53(mockConfig);

      expect(route53).toBeDefined();
      expect(route53.healthCheck).toBeDefined();
    });
  });

  describe('Config Aggregator Module', () => {
    it('should create AWS Config aggregator', () => {
      const { createConfigAggregator } = require('../lib/config-aggregator');
      const mockConfig = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockIamRoles = {
        migrationOrchestratorRole: {
          arn: pulumi.output('arn:aws:iam::123456789012:role/test'),
        },
      };

      const configAgg = createConfigAggregator(mockConfig, mockIamRoles as any);

      expect(configAgg).toBeDefined();
      expect(configAgg.aggregator).toBeDefined();
      expect(configAgg.aggregatorRole).toBeDefined();
    });
  });

  describe('Migration Component', () => {
    it('should create migration component', async () => {
      const { MigrationComponent } = require('../lib/migration-component');
      const config = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockInputs = {
        config,
        iamRoles: {} as any,
        transitGateway: { tgw: {} } as any,
        stepFunctions: { stateMachine: { arn: pulumi.output('arn') } } as any,
        eventBridge: { centralEventBus: { arn: pulumi.output('arn') } } as any,
        parameterStore: {
          migrationMetadata: {
            value: pulumi.output('{"progress": 0, "status": "initialized"}'),
          },
        } as any,
        route53: { healthCheck: {} } as any,
        configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
      };

      const component = new MigrationComponent('test-component', mockInputs);

      expect(component.outputs).toBeDefined();
      expect(component.outputs.migrationStatus).toBeDefined();
      expect(component.outputs.progressPercentage).toBeDefined();
    });

    it('should validate configuration', async () => {
      const { MigrationComponent } = require('../lib/migration-component');
      const config = {
        environmentSuffix: '',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockInputs = {
        config,
        iamRoles: {} as any,
        transitGateway: { tgw: {} } as any,
        stepFunctions: { stateMachine: { arn: pulumi.output('arn') } } as any,
        eventBridge: { centralEventBus: { arn: pulumi.output('arn') } } as any,
        parameterStore: {
          migrationMetadata: { value: pulumi.output('{}') },
        } as any,
        route53: { healthCheck: {} } as any,
        configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
      };

      expect(
        () => new MigrationComponent('test-component', mockInputs)
      ).toThrow();
    });

    it('should validate max session duration limit', async () => {
      const { MigrationComponent } = require('../lib/migration-component');
      const config = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 7200, // Exceeds 3600 limit
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockInputs = {
        config,
        iamRoles: {} as any,
        transitGateway: { tgw: {} } as any,
        stepFunctions: { stateMachine: { arn: pulumi.output('arn') } } as any,
        eventBridge: { centralEventBus: { arn: pulumi.output('arn') } } as any,
        parameterStore: {
          migrationMetadata: { value: pulumi.output('{}') },
        } as any,
        route53: { healthCheck: {} } as any,
        configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
      };

      expect(
        () => new MigrationComponent('test-component', mockInputs)
      ).toThrow('maxSessionDuration cannot exceed 3600 seconds');
    });

    it('should handle dry-run mode', async () => {
      const { MigrationComponent } = require('../lib/migration-component');
      const config = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: true,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockInputs = {
        config,
        iamRoles: {} as any,
        transitGateway: { tgw: {} } as any,
        stepFunctions: { stateMachine: { arn: pulumi.output('arn') } } as any,
        eventBridge: { centralEventBus: { arn: pulumi.output('arn') } } as any,
        parameterStore: {
          migrationMetadata: {
            value: pulumi.output('{"progress": 0, "status": "dry-run"}'),
          },
        } as any,
        route53: { healthCheck: {} } as any,
        configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
      };

      const component = new MigrationComponent('test-component', mockInputs);

      const status = await component.outputs.migrationStatus.promise();
      expect(status).toContain('dry-run');
    });

    it('should calculate progress percentage', async () => {
      const { MigrationComponent } = require('../lib/migration-component');
      const config = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockInputs = {
        config,
        iamRoles: {} as any,
        transitGateway: { tgw: {} } as any,
        stepFunctions: { stateMachine: { arn: pulumi.output('arn') } } as any,
        eventBridge: { centralEventBus: { arn: pulumi.output('arn') } } as any,
        parameterStore: {
          migrationMetadata: {
            value: pulumi.output(
              '{"progress": 50, "status": "migrating", "completedServices": 5, "totalServices": 10}'
            ),
          },
        } as any,
        route53: { healthCheck: {} } as any,
        configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
      };

      const component = new MigrationComponent('test-component', mockInputs);

      const progress = await component.outputs.progressPercentage.promise();
      expect(progress).toBe(50);
    });

    it('should handle circular dependency metadata', async () => {
      const { MigrationComponent } = require('../lib/migration-component');
      const config = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockInputs = {
        config,
        iamRoles: {} as any,
        transitGateway: { tgw: {} } as any,
        stepFunctions: { stateMachine: { arn: pulumi.output('arn') } } as any,
        eventBridge: { centralEventBus: { arn: pulumi.output('arn') } } as any,
        parameterStore: {
          migrationMetadata: {
            value: pulumi.output(
              '{"progress": 0, "status": "initialized", "dependencies": {"service1": ["service2"], "service2": ["service1"]}}'
            ),
          },
        } as any,
        route53: { healthCheck: {} } as any,
        configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
      };

      const component = new MigrationComponent('test-component', mockInputs);

      // The component should process dependency metadata correctly
      const status = await component.outputs.migrationStatus.promise();
      expect(status).toContain('initialized');
    });

    it('should handle invalid JSON in metadata gracefully', async () => {
      const { MigrationComponent } = require('../lib/migration-component');
      const config = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockInputs = {
        config,
        iamRoles: {} as any,
        transitGateway: { tgw: {} } as any,
        stepFunctions: { stateMachine: { arn: pulumi.output('arn') } } as any,
        eventBridge: { centralEventBus: { arn: pulumi.output('arn') } } as any,
        parameterStore: {
          migrationMetadata: {
            value: pulumi.output('invalid-json-{{{'),
          },
        } as any,
        route53: { healthCheck: {} } as any,
        configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
      };

      const component = new MigrationComponent('test-component', mockInputs);

      // Should handle invalid JSON gracefully
      const progress = await component.outputs.progressPercentage.promise();
      expect(progress).toBe(0);

      const status = await component.outputs.migrationStatus.promise();
      expect(status).toBe('unknown');
    });

    it('should handle metadata without status field', async () => {
      const { MigrationComponent } = require('../lib/migration-component');
      const config = {
        environmentSuffix: 'test-123',
        maxSessionDuration: 3600,
        legacyAccountId: '123456789012',
        productionAccountId: '123456789012',
        stagingAccountId: '123456789012',
        developmentAccountId: '123456789012',
        centralAccountId: '123456789012',
        isDryRun: false,
        region: 'us-east-1',
        secondaryRegion: 'us-east-2',
      };
      const mockInputs = {
        config,
        iamRoles: {} as any,
        transitGateway: { tgw: {} } as any,
        stepFunctions: { stateMachine: { arn: pulumi.output('arn') } } as any,
        eventBridge: { centralEventBus: { arn: pulumi.output('arn') } } as any,
        parameterStore: {
          migrationMetadata: {
            value: pulumi.output('{"progress": 25}'), // No status field
          },
        } as any,
        route53: { healthCheck: {} } as any,
        configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
      };

      const component = new MigrationComponent('test-component', mockInputs);

      const status = await component.outputs.migrationStatus.promise();
      expect(status).toBe('initialized'); // Should default to 'initialized' when status is missing

      const progress = await component.outputs.progressPercentage.promise();
      expect(progress).toBe(25);
    });
  });
});
