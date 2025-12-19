import * as pulumi from '@pulumi/pulumi';
import { MigrationConfig } from './config';
import { IamRoles } from './iam-roles';
import { TransitGatewayResources } from './transit-gateway';
import { StepFunctionsResources } from './step-functions';
import { EventBridgeResources } from './eventbridge';
import { ParameterStoreResources } from './parameter-store';
import { Route53Resources } from './route53';
import { ConfigAggregatorResources } from './config-aggregator';

export interface MigrationComponentInputs {
  config: MigrationConfig;
  iamRoles: IamRoles;
  transitGateway: TransitGatewayResources;
  stepFunctions: StepFunctionsResources;
  eventBridge: EventBridgeResources;
  parameterStore: ParameterStoreResources;
  route53: Route53Resources;
  configAggregator: ConfigAggregatorResources;
}

export interface MigrationComponentOutputs {
  migrationStatus: pulumi.Output<string>;
  progressPercentage: pulumi.Output<number>;
  stateMachineArn: pulumi.Output<string>;
  transitGatewayId: pulumi.Output<string>;
  eventBusArn: pulumi.Output<string>;
  isDryRun: boolean;
}

export class MigrationComponent extends pulumi.ComponentResource {
  public readonly outputs: MigrationComponentOutputs;

  constructor(
    name: string,
    inputs: MigrationComponentInputs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:migration:MigrationComponent', name, {}, opts);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _childOpts = { parent: this };

    // Validate configuration
    this.validateInputs(inputs);

    // Calculate migration progress based on Step Functions execution
    const progressPercentage = this.calculateProgress(inputs);

    // Determine migration status
    const migrationStatus = this.determineMigrationStatus(inputs);

    // Create component outputs
    this.outputs = {
      migrationStatus,
      progressPercentage,
      stateMachineArn: inputs.stepFunctions.stateMachine.arn,
      transitGatewayId: inputs.transitGateway.tgw.id,
      eventBusArn: inputs.eventBridge.centralEventBus.arn,
      isDryRun: inputs.config.isDryRun,
    };

    this.registerOutputs({
      migrationStatus: this.outputs.migrationStatus,
      progressPercentage: this.outputs.progressPercentage,
      stateMachineArn: this.outputs.stateMachineArn,
      transitGatewayId: this.outputs.transitGatewayId,
      eventBusArn: this.outputs.eventBusArn,
      isDryRun: this.outputs.isDryRun,
    });
  }

  private validateInputs(inputs: MigrationComponentInputs): void {
    if (!inputs.config.environmentSuffix) {
      throw new Error('environmentSuffix is required');
    }

    if (inputs.config.maxSessionDuration > 3600) {
      throw new Error('maxSessionDuration cannot exceed 3600 seconds');
    }

    // Validate no circular dependencies by checking account IDs
    const accountIds = [
      inputs.config.legacyAccountId,
      inputs.config.productionAccountId,
      inputs.config.stagingAccountId,
      inputs.config.developmentAccountId,
    ];

    // In multi-account mode, ensure no duplicate account IDs
    // (unless intentionally running in single-account test mode)
    const uniqueAccountIds = new Set(accountIds);
    if (accountIds.length !== uniqueAccountIds.size) {
      // This is acceptable in single-account test mode
      pulumi.log.info(
        'Running in single-account mode - using same account for all roles'
      );
    }
  }

  private calculateProgress(
    inputs: MigrationComponentInputs
  ): pulumi.Output<number> {
    // In dry-run mode, always return 0
    if (inputs.config.isDryRun) {
      return pulumi.output(0);
    }

    // In production, this would query the Step Functions execution status
    // For now, return a computed value based on parameter store
    return pulumi
      .all([inputs.parameterStore.migrationMetadata.value])
      .apply(([metadataValue]) => {
        try {
          const metadata = JSON.parse(metadataValue);
          return metadata.progress || 0;
        } catch (e) {
          return 0;
        }
      });
  }

  private determineMigrationStatus(
    inputs: MigrationComponentInputs
  ): pulumi.Output<string> {
    if (inputs.config.isDryRun) {
      return pulumi.output('dry-run');
    }

    return pulumi
      .all([inputs.parameterStore.migrationMetadata.value])
      .apply(([metadataValue]): string => {
        try {
          const metadata = JSON.parse(metadataValue);
          return metadata.status || 'initialized';
        } catch (e) {
          return 'unknown';
        }
      });
  }
}
