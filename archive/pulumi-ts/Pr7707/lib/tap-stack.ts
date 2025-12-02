/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { RdsStack } from './rds-stack';

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
  tags?: { [key: string]: pulumi.Input<string> };
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcStack: VpcStack;
  public readonly rdsStack: RdsStack;
  public readonly dbEndpoint: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create VPC infrastructure for RDS
    this.vpcStack = new VpcStack(
      'vpc-stack',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Instantiate RDS Stack for optimized PostgreSQL database
    this.rdsStack = new RdsStack(
      'rds-stack',
      {
        environmentSuffix: environmentSuffix,
        vpcId: this.vpcStack.vpc.id,
        privateSubnetIds: pulumi.all([
          this.vpcStack.privateSubnet1.id,
          this.vpcStack.privateSubnet2.id,
        ]),
        applicationSecurityGroupId: this.vpcStack.applicationSecurityGroup.id,
        tags: tags,
      },
      { parent: this }
    );

    // Expose outputs from RDS stack
    this.dbEndpoint = this.rdsStack.dbEndpoint;
    this.snsTopicArn = this.rdsStack.snsTopic.arn;

    // Register the outputs of this component
    this.registerOutputs({
      vpcId: this.vpcStack.vpc.id,
      dbEndpoint: this.dbEndpoint,
      dbSecurityGroupId: this.rdsStack.dbSecurityGroup.id,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
