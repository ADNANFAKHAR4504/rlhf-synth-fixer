import * as pulumi from '@pulumi/pulumi';
import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi';
import { createIamRoles } from './iam-roles';
import { createTransitGateway } from './transit-gateway';
import { createStepFunctions } from './step-functions';
import { createEventBridge } from './eventbridge';
import { createParameterStore } from './parameter-store';
import { createRoute53 } from './route53';
import { createConfigAggregator } from './config-aggregator';
import { MigrationComponent } from './migration-component';

interface TapStackProps {
  tags?: Record<string, string>;
}

export interface MigrationProgressOutput {
  mode?: string;
  message: string;
  completionPercentage: number;
  stateMachineArn?: string;
}

export class TapStack extends ComponentResource {
  public readonly migrationOrchestratorArn: pulumi.Output<string>;
  public readonly transitGatewayId: pulumi.Output<string>;
  public readonly centralEventBusArn: pulumi.Output<string>;
  public readonly healthCheckId: pulumi.Output<string>;
  public readonly configAggregatorName: pulumi.Output<string>;
  public readonly migrationProgressOutput: pulumi.Output<MigrationProgressOutput>;

  constructor(
    name: string,
    props: TapStackProps,
    opts?: ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    // Use environment variables for configuration
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

    // Get account ID - use environment variable or placeholder for local testing
    const accountId = process.env.CURRENT_ACCOUNT_ID || '123456789012';

    // Migration configuration
    const config = {
      environmentSuffix,
      region: process.env.AWS_REGION || 'us-east-1',
      secondaryRegion: 'us-east-2',
      legacyAccountId: accountId,
      productionAccountId: accountId,
      stagingAccountId: accountId,
      developmentAccountId: accountId,
      centralAccountId: accountId,
      maxSessionDuration: 3600,
      isDryRun: false,
      legacyVpcCidr: '10.0.0.0/16',
      productionVpcCidr: '10.1.0.0/16',
      stagingVpcCidr: '10.2.0.0/16',
      developmentVpcCidr: '10.3.0.0/16',
    };

    // Create resources
    const iamRoles = createIamRoles(config);
    const transitGateway = createTransitGateway(config, iamRoles);
    const parameterStore = createParameterStore(config);
    const stepFunctions = createStepFunctions(config, iamRoles, parameterStore);
    const eventBridge = createEventBridge(config, iamRoles);
    const route53 = createRoute53(config);
    const configAggregator = createConfigAggregator(config, iamRoles);

    // Create custom migration component
    new MigrationComponent(
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
        parent: this,
        dependsOn: [
          ...Object.values(iamRoles),
          // transitGateway.tgw, // Disabled - placeholder not a real resource
          stepFunctions.stateMachine,
          eventBridge.centralEventBus,
          parameterStore.migrationMetadata,
          route53.healthCheck,
          configAggregator.aggregator,
        ],
      }
    );

    // Export outputs
    this.migrationOrchestratorArn = stepFunctions.stateMachine.arn;
    this.transitGatewayId = transitGateway.tgw.id;
    this.centralEventBusArn = eventBridge.centralEventBus.arn;
    this.healthCheckId = route53.healthCheck.id;
    this.configAggregatorName = configAggregator.aggregator.name;
    this.migrationProgressOutput = pulumi
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

    this.registerOutputs({
      migrationOrchestratorArn: this.migrationOrchestratorArn,
      transitGatewayId: this.transitGatewayId,
      centralEventBusArn: this.centralEventBusArn,
      healthCheckId: this.healthCheckId,
      configAggregatorName: this.configAggregatorName,
      migrationProgressOutput: this.migrationProgressOutput,
    });
  }
}
