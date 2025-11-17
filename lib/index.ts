import * as pulumi from '@pulumi/pulumi';
import { getConfig } from './config';
import { createIamRoles } from './iam-roles';
import { createTransitGateway } from './transit-gateway';
import { createStepFunctions } from './step-functions';
import { createEventBridge } from './eventbridge';
import { createParameterStore } from './parameter-store';
import { createRoute53 } from './route53';
import { createConfigAggregator } from './config-aggregator';
import { MigrationComponent } from './migration-component';

// Get configuration
const config = getConfig();

// Create IAM roles for cross-account access
const iamRoles = createIamRoles(config);

// Create Transit Gateway infrastructure
const transitGateway = createTransitGateway(config, iamRoles);

// Create Parameter Store for metadata sharing
const parameterStore = createParameterStore(config);

// Create Step Functions migration orchestrator
const stepFunctions = createStepFunctions(config, iamRoles, parameterStore);

// Create EventBridge monitoring
const eventBridge = createEventBridge(config, iamRoles);

// Create Route 53 traffic shifting
const route53 = createRoute53(config);

// Create AWS Config aggregator
const configAggregator = createConfigAggregator(config, iamRoles);

// Create custom migration component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _migrationComponent = new MigrationComponent(
  `migration-component-${config.environmentSuffix}`,
  {
    config,
    iamRoles,
    transitGateway,
    stepFunctions,
    eventBridge,
    parameterStore,
    route53,
    configAggregator,
  },
  {
    dependsOn: [
      ...Object.values(iamRoles),
      transitGateway.tgw,
      stepFunctions.stateMachine,
      eventBridge.centralEventBus,
      parameterStore.migrationMetadata,
      route53.healthCheck,
      configAggregator.aggregator,
    ],
  }
);

// Export stack outputs
export const migrationOrchestratorArn = stepFunctions.stateMachine.arn;
export const transitGatewayId = transitGateway.tgw.id;
export const centralEventBusArn = eventBridge.centralEventBus.arn;
export const healthCheckId = route53.healthCheck.id;
export const configAggregatorName = configAggregator.aggregator.name;
export const migrationProgressOutput = pulumi
  .all([stepFunctions.stateMachine.arn, config.isDryRun])
  .apply(([arn, isDryRun]) => {
    if (isDryRun) {
      return {
        mode: 'dry-run',
        message: 'Simulation mode - no actual resources created',
        completionPercentage: 0,
      };
    }
    return {
      stateMachineArn: arn,
      message: 'Query Step Functions execution for real-time progress',
      completionPercentage: 0,
    };
  });
