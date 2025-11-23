/**
 * tap-stack.ts
 *
 * Main Pulumi stack for deploying a containerized web application on AWS ECS Fargate.
 * This stack creates a complete infrastructure including VPC, ALB, ECS cluster, and auto-scaling.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
import { EcsStack } from './ecs-stack';

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
}

/**
 * Main stack component that orchestrates the ECS Fargate deployment.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly ecsClusterName: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const inputTags = args.tags ? (args.tags as Record<string, string>) : {};
    const defaultTags = {
      Environment: 'production',
      ManagedBy: 'pulumi',
      ...inputTags,
    };

    // Create network infrastructure
    const networkStack = new NetworkStack(
      'network',
      {
        environmentSuffix,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Create ECS infrastructure
    const ecsStack = new EcsStack(
      'ecs',
      {
        environmentSuffix,
        vpcId: networkStack.vpcId,
        publicSubnetIds: networkStack.publicSubnetIds,
        privateSubnetIds: networkStack.privateSubnetIds,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Expose outputs
    this.albDnsName = ecsStack.albDnsName;
    this.ecsClusterName = ecsStack.clusterName;
    this.vpcId = networkStack.vpcId;

    // Register outputs
    this.registerOutputs({
      albDnsName: this.albDnsName,
      ecsClusterName: this.ecsClusterName,
      vpcId: this.vpcId,
    });
  }
}
