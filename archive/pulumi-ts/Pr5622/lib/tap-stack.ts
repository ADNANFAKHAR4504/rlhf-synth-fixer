/**
 * tap-stack.ts
 *
 * Main Pulumi stack for EC2 cost optimization with scheduled start/stop functionality.
 * This stack imports existing EC2 instances and creates automation to reduce costs
 * by stopping non-production instances during off-hours.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { Ec2SchedulerStack } from './ec2-scheduler-stack';
import { CostCalculationStack } from './cost-calculation-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * Optional AWS region. If not provided, uses aws.config.region or defaults to 'ap-southeast-1'.
   */
  region?: string;
}

/**
 * Main Pulumi component resource for EC2 cost optimization.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly schedulerOutputs: pulumi.Output<{
    stopFunctionArn: string;
    startFunctionArn: string;
    stopRuleArn: string;
    startRuleArn: string;
    managedInstanceIds: string[];
  }>;
  public readonly costOutputs: pulumi.Output<{
    estimatedMonthlySavings: number;
    instanceCount: number;
  }>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get the current AWS region
    const region = args.region || aws.config.region || 'ap-southeast-1';

    // Instantiate EC2 Scheduler Stack
    const schedulerStack = new Ec2SchedulerStack(
      `ec2-scheduler-${environmentSuffix}`,
      {
        environmentSuffix,
        region,
        tags,
      },
      { parent: this }
    );

    // Instantiate Cost Calculation Stack
    const costStack = new CostCalculationStack(
      `cost-calculation-${environmentSuffix}`,
      {
        environmentSuffix,
        instanceIds: schedulerStack.managedInstanceIds,
        tags,
      },
      { parent: this }
    );

    this.schedulerOutputs = schedulerStack.outputs;
    this.costOutputs = costStack.outputs;

    // Register the outputs of this component
    this.registerOutputs({
      stopLambdaArn: schedulerStack.stopFunctionArn,
      startLambdaArn: schedulerStack.startFunctionArn,
      stopRuleArn: schedulerStack.stopRuleArn,
      startRuleArn: schedulerStack.startRuleArn,
      managedInstanceIds: schedulerStack.managedInstanceIds,
      estimatedMonthlySavings: costStack.estimatedMonthlySavings,
    });
  }
}
