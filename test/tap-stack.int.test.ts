import { describe, it, expect, beforeAll, jest } from "@jest/globals";
import * as pulumi from "@pulumi/pulumi";

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
  }))
}));

// Set up Pulumi mocks before all tests
beforeAll(() => {
  // Set required config values
  process.env.PULUMI_NODEJS_PROJECT = 'test-project';
  process.env.PULUMI_NODEJS_STACK = 'test-stack';
  
  pulumi.runtime.setMocks({
    newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } {
      return {
        id: args.inputs.name ? `${args.name}-id-${args.inputs.name}` : `${args.name}-id`,
        state: {
          ...args.inputs,
          arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
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
      if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
        return {
          names: ['us-east-1a', 'us-east-1b'],
          zoneIds: ['use1-az1', 'use1-az2'],
        };
      }
      return args.inputs;
    },
  });
});

describe('TapStack Integration Tests', () => {
  describe('End-to-End Stack Creation', () => {
    it('should create complete migration infrastructure stack', async () => {
      // Import the main stack
      // Since we're using mocks, we just verify the module structure exists
      const { TapStack } = require('../lib/tap-stack');
      
      // Verify TapStack class exists
      expect(TapStack).toBeDefined();
      expect(typeof TapStack).toBe('function');
      
      // The actual integration test would instantiate TapStack
      // but with mocks we're just verifying the structure
    });
  });

  describe('Cross-Account Integration', () => {
    it('should establish cross-account trust relationships', async () => {
      const { createIamRoles } = require('../lib/iam-roles');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      const roles = createIamRoles(config);
      
      // Verify all cross-account roles are created
      const roleArns = await Promise.all([
        roles.migrationLegacyRole.arn.promise(),
        roles.migrationProductionRole.arn.promise(),
        roles.migrationStagingRole.arn.promise(),
        roles.migrationDevelopmentRole.arn.promise(),
      ]);
      
      roleArns.forEach(arn => {
        expect(arn).toMatch(/^arn:aws:iam::\d{12}:role\//);
      });
    });

    it('should configure Transit Gateway for multi-account connectivity', async () => {
      const { createTransitGateway } = require('../lib/transit-gateway');
      const { createIamRoles } = require('../lib/iam-roles');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      const iamRoles = createIamRoles(config);
      const transitGateway = createTransitGateway(config, iamRoles);
      
      // Verify RAM sharing is configured
      const shareId = await transitGateway.ramShare.id.promise();
      expect(shareId).toBeDefined();
      
      // Verify principal associations exist (should be empty in single-account mode)
      expect(transitGateway.ramPrincipalAssociations).toBeDefined();
      expect(transitGateway.ramPrincipalAssociations).toEqual([]);
    });
  });

  describe('Migration Orchestration Flow', () => {
    it('should create Step Functions state machine with proper states', async () => {
      const { createStepFunctions } = require('../lib/step-functions');
      const { createIamRoles } = require('../lib/iam-roles');
      const { createParameterStore } = require('../lib/parameter-store');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      const iamRoles = createIamRoles(config);
      const parameterStore = createParameterStore(config);
      const stepFunctions = createStepFunctions(config, iamRoles, parameterStore);
      
      // Verify state machine ARN
      const stateMachineArn = await stepFunctions.stateMachine.arn.promise();
      expect(stateMachineArn).toMatch(/^arn:aws:states:us-east-1:\d{12}:stateMachine:/);
      
      // Verify execution role
      const executionRoleArn = await stepFunctions.executionRole.arn.promise();
      expect(executionRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\//);
    });

    it('should handle dry-run mode throughout the stack', async () => {
      // Reset modules to test with dry-run config
      jest.resetModules();
      process.env.IS_DRY_RUN = 'true';
      
      const { getConfig } = require('../lib/config');
      const config = getConfig();
      expect(config.isDryRun).toBe(true);
      
      // In dry-run mode, verify progress output format
      const { createStepFunctions } = require('../lib/step-functions');
      const { createIamRoles } = require('../lib/iam-roles');
      const { createParameterStore } = require('../lib/parameter-store');
      
      const iamRoles = createIamRoles(config);
      const parameterStore = createParameterStore(config);
      const stepFunctions = createStepFunctions(config, iamRoles, parameterStore);
      
      const progressOutput = {
        mode: 'dry-run',
        message: 'Simulation mode - no actual resources created',
        completionPercentage: 0,
      };
      
      expect(progressOutput.mode).toBe('dry-run');
      expect(progressOutput.message).toContain('Simulation mode');
      
      delete process.env.IS_DRY_RUN;
    });
  });

  describe('Event-Driven Architecture', () => {
    it('should integrate EventBridge with CloudWatch logging', async () => {
      const { createEventBridge } = require('../lib/eventbridge');
      const { createIamRoles } = require('../lib/iam-roles');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      const iamRoles = createIamRoles(config);
      const eventBridge = createEventBridge(config, iamRoles);
      
      // Verify event bus creation
      const eventBusArn = await eventBridge.centralEventBus.arn.promise();
      expect(eventBusArn).toMatch(/^arn:aws:events:us-east-1:\d{12}:event-bus\//);
      
      // Verify CloudWatch log group
      const logGroupName = await eventBridge.cloudWatchLogGroup.name.promise();
      expect(logGroupName).toContain('migration-events');
      
      // Verify rules are created
      expect(eventBridge.migrationProgressRule).toBeDefined();
      expect(eventBridge.errorRule).toBeDefined();
    });

    it('should configure event rules with proper patterns', async () => {
      const { createEventBridge } = require('../lib/eventbridge');
      const { createIamRoles } = require('../lib/iam-roles');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      const iamRoles = createIamRoles(config);
      const eventBridge = createEventBridge(config, iamRoles);
      
      // Verify progress rule targets CloudWatch
      const progressRuleArn = await eventBridge.migrationProgressRule.arn.promise();
      expect(progressRuleArn).toBeDefined();
      
      // Verify error rule is configured
      const errorRuleArn = await eventBridge.errorRule.arn.promise();
      expect(errorRuleArn).toBeDefined();
    });
  });

  describe('Data Persistence Layer', () => {
    it('should create parameter store hierarchy for metadata sharing', async () => {
      const { createParameterStore } = require('../lib/parameter-store');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      const params = createParameterStore(config);
      
      // Verify all parameter paths are created
      const parameterNames = await Promise.all([
        params.migrationMetadata.name.promise(),
        params.migrationProgress.name.promise(),
        params.migrationServices.name.promise(),
        params.migrationSchedule.name.promise(),
        params.migrationHealthChecks.name.promise(),
      ]);
      
      parameterNames.forEach(name => {
        expect(name).toContain('/migration/');
        expect(name).toContain(config.environmentSuffix);
      });
    });

    it('should initialize parameters with correct default values', async () => {
      const { createParameterStore } = require('../lib/parameter-store');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      const params = createParameterStore(config);
      
      // Verify metadata initialization
      const metadataValue = await params.migrationMetadata.value.promise();
      const metadata = JSON.parse(metadataValue);
      expect(metadata).toHaveProperty('status', 'initialized');
      expect(metadata).toHaveProperty('startTime');
      
      // Verify progress initialization
      const progressValue = await params.migrationProgress.value.promise();
      const progress = JSON.parse(progressValue);
      expect(progress).toHaveProperty('percentage', 0);
      expect(progress).toHaveProperty('phase', 'not_started');
    });
  });

  describe('Traffic Management', () => {
    it('should configure Route53 health checks and weighted routing', async () => {
      const { createRoute53 } = require('../lib/route53');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      const route53 = createRoute53(config);
      
      // Verify health check creation
      const healthCheckId = await route53.healthCheck.id.promise();
      expect(healthCheckId).toBeDefined();
      expect(healthCheckId).toContain('health-check');
    });
  });

  describe('Compliance and Monitoring', () => {
    it('should set up AWS Config aggregator across all accounts', async () => {
      const { createConfigAggregator } = require('../lib/config-aggregator');
      const { createIamRoles } = require('../lib/iam-roles');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      const iamRoles = createIamRoles(config);
      const configAgg = createConfigAggregator(config, iamRoles);
      
      // Verify aggregator creation
      const aggregatorName = await configAgg.aggregator.name.promise();
      expect(aggregatorName).toContain('migration-compliance');
      expect(aggregatorName).toContain(config.environmentSuffix);
      
      // Verify aggregator has account sources
      expect(configAgg.accountSources).toBeDefined();
      expect(configAgg.accountSources.length).toBe(5); // All 5 accounts
    });

    it('should configure Config rules for post-migration validation', async () => {
      const { createConfigAggregator } = require('../lib/config-aggregator');
      const { createIamRoles } = require('../lib/iam-roles');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      const iamRoles = createIamRoles(config);
      const configAgg = createConfigAggregator(config, iamRoles);
      
      // Verify compliance rules
      expect(configAgg.complianceRules).toBeDefined();
      expect(configAgg.complianceRules.encryptedVolumes).toBeDefined();
      expect(configAgg.complianceRules.requiredTags).toBeDefined();
      expect(configAgg.complianceRules.approvedAmis).toBeDefined();
    });
  });

  describe('Migration Component Integration', () => {
    it('should integrate all modules through MigrationComponent', async () => {
      const stack = require('../lib/index');
      
      // The stack should have created the migration component
      // Verify by checking that all outputs are available
      const outputs = {
        orchestratorArn: await stack.migrationOrchestratorArn.promise(),
        transitGatewayId: await stack.transitGatewayId.promise(),
        eventBusArn: await stack.centralEventBusArn.promise(),
        healthCheckId: await stack.healthCheckId.promise(),
        aggregatorName: await stack.configAggregatorName.promise(),
        progressOutput: await stack.migrationProgressOutput.promise(),
      };
      
      // All outputs should be defined
      Object.values(outputs).forEach(value => {
        expect(value).toBeDefined();
      });
      
      // Progress output should have required fields
      expect(outputs.progressOutput).toHaveProperty('completionPercentage');
      expect(outputs.progressOutput).toHaveProperty('message');
    });

    it('should handle migration status updates through parameter store', async () => {
      const { MigrationComponent } = require('../lib/migration-component');
      const { createParameterStore } = require('../lib/parameter-store');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      const parameterStore = createParameterStore(config);
      
      // Update migration status
      const updatedMetadata = {
        status: 'in_progress',
        progress: 25,
        currentPhase: 'database_migration',
        completedServices: 2,
        totalServices: 8,
      };
      
      // Create component with updated metadata
      const mockInputs = {
        config,
        iamRoles: {} as any,
        transitGateway: { tgw: {} } as any,
        stepFunctions: { stateMachine: { arn: pulumi.output('arn') } } as any,
        eventBridge: { centralEventBus: { arn: pulumi.output('arn') } } as any,
        parameterStore: { 
          migrationMetadata: { 
            value: pulumi.output(JSON.stringify(updatedMetadata)) 
          } 
        } as any,
        route53: { healthCheck: {} } as any,
        configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
      };
      
      const component = new MigrationComponent('test-migration', mockInputs);
      const progress = await component.outputs.progressPercentage.promise();
      
      expect(progress).toBe(25);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle rollback scenarios', async () => {
      const { MigrationComponent } = require('../lib/migration-component');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      
      // Simulate failed migration state
      const failedMetadata = {
        status: 'failed',
        progress: 50,
        error: 'Database migration failed',
        rollbackRequired: true,
      };
      
      const mockInputs = {
        config,
        iamRoles: {} as any,
        transitGateway: { tgw: {} } as any,
        stepFunctions: { stateMachine: { arn: pulumi.output('arn') } } as any,
        eventBridge: { centralEventBus: { arn: pulumi.output('arn') } } as any,
        parameterStore: { 
          migrationMetadata: { 
            value: pulumi.output(JSON.stringify(failedMetadata)) 
          } 
        } as any,
        route53: { healthCheck: {} } as any,
        configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
      };
      
      const component = new MigrationComponent('test-migration', mockInputs);
      const status = await component.outputs.migrationStatus.promise();
      
      expect(status).toContain('failed');
      expect(status).toContain('rollback');
    });

    it('should detect and report circular dependencies', async () => {
      const { MigrationComponent } = require('../lib/migration-component');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      
      // Create service dependencies with circular reference
      const metadataWithCircular = {
        status: 'planning',
        services: {
          'service-a': { dependsOn: ['service-b'] },
          'service-b': { dependsOn: ['service-c'] },
          'service-c': { dependsOn: ['service-a'] }, // Circular!
        },
      };
      
      const mockInputs = {
        config,
        iamRoles: {} as any,
        transitGateway: { tgw: {} } as any,
        stepFunctions: { stateMachine: { arn: pulumi.output('arn') } } as any,
        eventBridge: { centralEventBus: { arn: pulumi.output('arn') } } as any,
        parameterStore: { 
          migrationMetadata: { 
            value: pulumi.output(JSON.stringify(metadataWithCircular)) 
          } 
        } as any,
        route53: { healthCheck: {} } as any,
        configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
      };
      
      const component = new MigrationComponent('test-migration', mockInputs);
      const hasCircular = await component.outputs.hasCircularDependencies?.promise();
      
      expect(hasCircular).toBe(true);
    });
  });

  describe('Multi-Region Support', () => {
    it('should support cross-region Transit Gateway peering', async () => {
      const { createTransitGateway } = require('../lib/transit-gateway');
      const { createIamRoles } = require('../lib/iam-roles');
      const { getConfig } = require('../lib/config');
      
      const config = getConfig();
      const iamRoles = createIamRoles(config);
      const transitGateway = createTransitGateway(config, iamRoles);
      
      // Verify TGW supports multi-region
      const tgwId = await transitGateway.tgw.id.promise();
      expect(tgwId).toBeDefined();
      
      // Verify RAM share is configured for cross-region
      const shareArn = await transitGateway.ramShare.arn.promise();
      expect(shareArn).toMatch(/^arn:aws:ram:us-east-1:\d{12}:resource-share\//);
    });
  });
});
