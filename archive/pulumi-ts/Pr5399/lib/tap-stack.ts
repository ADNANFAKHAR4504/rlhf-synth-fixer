/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the Payment API ECS deployment.
 * Orchestrates VPC, ALB, and ECS components to create a complete containerized
 * web application infrastructure with auto-scaling and load balancing.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { AlbStack } from './alb-stack';
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

  /**
   * Container image to deploy (ECR image URI).
   * Defaults to nginx for demo purposes.
   */
  containerImage?: string;
}

/**
 * Represents the main Pulumi component resource for the Payment API ECS deployment.
 *
 * This component orchestrates VPC networking, Application Load Balancer,
 * and ECS Fargate service with auto-scaling capabilities.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDns: pulumi.Output<string>;
  public readonly clusterArn: pulumi.Output<string>;
  public readonly serviceArn: pulumi.Output<string>;

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
    const containerImage =
      args.containerImage || 'public.ecr.aws/nginx/nginx:latest'; // Default to public nginx for demo

    // Create VPC with public and private subnets, NAT gateways
    const vpcStack = new VpcStack(
      'vpc',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create Application Load Balancer with security groups and target group
    const albStack = new AlbStack(
      'alb',
      {
        environmentSuffix: environmentSuffix,
        vpcId: vpcStack.vpcId,
        publicSubnetIds: vpcStack.publicSubnetIds,
        tags: tags,
      },
      { parent: this }
    );

    // Create ECS Cluster, Task Definition, and Service with auto-scaling
    const ecsStack = new EcsStack(
      'ecs',
      {
        environmentSuffix: environmentSuffix,
        vpcId: vpcStack.vpcId,
        privateSubnetIds: vpcStack.privateSubnetIds,
        targetGroupArn: albStack.targetGroupArn,
        ecsTaskSecurityGroupId: albStack.ecsTaskSecurityGroupId,
        containerImage: containerImage,
        tags: tags,
        albListener: albStack.httpListener,
      },
      { parent: this }
    );

    // Expose key outputs
    this.vpcId = vpcStack.vpcId;
    this.albDns = albStack.albDns;
    this.clusterArn = ecsStack.clusterArn;
    this.serviceArn = ecsStack.serviceArn;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      albDns: this.albDns,
      clusterArn: this.clusterArn,
      serviceArn: this.serviceArn,
    });
  }
}
