import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi';

interface TapStackProps {
  tags?: Record<string, string>;
}

export class TapStack extends ComponentResource {
  public readonly migrationOrchestratorArn: pulumi.Output<string>;
  public readonly transitGatewayId: pulumi.Output<string>;
  public readonly centralEventBusArn: pulumi.Output<string>;
  public readonly healthCheckId: pulumi.Output<string>;
  public readonly configAggregatorName: pulumi.Output<string>;
  public readonly migrationProgressOutput: pulumi.Output<any>;

  constructor(
    name: string,
    props: TapStackProps,
    opts?: ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    // Use environment variables for configuration
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    const currentAccountId = process.env.CURRENT_ACCOUNT_ID || aws.getCallerIdentity().then(identity => identity.accountId);
    
    // Migration configuration
    const config = {
      environmentSuffix,
      region: process.env.AWS_REGION || 'us-east-1',
      secondaryRegion: 'us-east-2',
      legacyAccountId: currentAccountId,
      productionAccountId: currentAccountId,
      stagingAccountId: currentAccountId,
      developmentAccountId: currentAccountId,
      centralAccountId: currentAccountId,
      maxSessionDuration: 3600,
      isDryRun: false,
      legacyVpcCidr: '10.0.0.0/16',
      productionVpcCidr: '10.1.0.0/16',
      stagingVpcCidr: '10.2.0.0/16',
      developmentVpcCidr: '10.3.0.0/16',
    };

    // Import all the modules (using the existing implementations)
    const { createIamRoles } = require('./iam-roles');
    const { createTransitGateway } = require('./transit-gateway');
    const { createStepFunctions } = require('./step-functions');
    const { createEventBridge } = require('./eventbridge');
    const { createParameterStore } = require('./parameter-store');
    const { createRoute53 } = require('./route53');
    const { createConfigAggregator } = require('./config-aggregator');
    const { MigrationComponent } = require('./migration-component');

    // Create resources
    const iamRoles = createIamRoles(config);
    const transitGateway = createTransitGateway(config, iamRoles);
    const parameterStore = createParameterStore(config);
    const stepFunctions = createStepFunctions(config, iamRoles, parameterStore);
    const eventBridge = createEventBridge(config, iamRoles);
    const route53 = createRoute53(config);
    const configAggregator = createConfigAggregator(config, iamRoles);

    // Create custom migration component
    const migrationComponent = new MigrationComponent(
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
          transitGateway.tgw,
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
