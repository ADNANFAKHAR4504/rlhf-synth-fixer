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
import { AlbStack } from './alb-stack';
import { Ec2Stack } from './ec2-stack';
import { S3Stack } from './s3-stack';
import { CloudWatchStack } from './cloudwatch-stack';

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
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDns: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;

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

    // Create VPC and networking resources
    const vpcStack = new VpcStack(
      'tap-vpc',
      {
        environmentSuffix: environmentSuffix,
        vpcCidr: '10.5.0.0/16',
        tags: tags,
      },
      { parent: this }
    );

    // Create S3 bucket for static assets
    const s3Stack = new S3Stack(
      'tap-s3',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create EC2 Auto Scaling resources
    const ec2Stack = new Ec2Stack(
      'tap-ec2',
      {
        environmentSuffix: environmentSuffix,
        vpcId: vpcStack.vpcId,
        privateSubnetIds: vpcStack.privateSubnetIds,
        tags: tags,
      },
      { parent: this }
    );

    // Create Application Load Balancer
    const albStack = new AlbStack(
      'tap-alb',
      {
        environmentSuffix: environmentSuffix,
        vpcId: vpcStack.vpcId,
        publicSubnetIds: vpcStack.publicSubnetIds,
        targetGroupArn: ec2Stack.targetGroupArn,
        tags: tags,
      },
      { parent: this }
    );

    // Create CloudWatch monitoring
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _cloudWatchStack = new CloudWatchStack(
      'tap-monitoring',
      {
        environmentSuffix: environmentSuffix,
        autoScalingGroupName: ec2Stack.autoScalingGroupName,
        targetGroupArn: ec2Stack.targetGroupArn,
        albArn: albStack.albArn,
        tags: tags,
      },
      { parent: this }
    );

    // Expose outputs
    this.vpcId = vpcStack.vpcId;
    this.albDns = albStack.albDns;
    this.bucketName = s3Stack.bucketName;

    // Register the outputs of this component
    this.registerOutputs({
      vpcId: this.vpcId,
      albDns: this.albDns,
      bucketName: this.bucketName,
    });
  }
}
