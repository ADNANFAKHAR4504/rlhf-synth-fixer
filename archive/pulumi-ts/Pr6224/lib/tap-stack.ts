/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */


/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for ECS Fargate microservices architecture.
 * Orchestrates VPC, ECS cluster, ALB, ECR, and all supporting infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
import { EcrStack } from './ecr-stack';
import { SecretsStack } from './secrets-stack';
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
   * AWS region for deployment
   */
  region?: string;
}

/**
 * Represents the main Pulumi component resource for the ECS Fargate microservices architecture.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly apiEcrUrl: pulumi.Output<string>;
  public readonly workerEcrUrl: pulumi.Output<string>;
  public readonly schedulerEcrUrl: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;

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

    // Create VPC and networking infrastructure
    const networkStack = new NetworkStack(
      `tap-network-${environmentSuffix}`,
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create ECR repositories for container images
    const ecrStack = new EcrStack(
      `tap-ecr-${environmentSuffix}`,
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create Secrets Manager secrets for credentials
    const secretsStack = new SecretsStack(
      `tap-secrets-${environmentSuffix}`,
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create ECS cluster, services, ALB, and auto-scaling
    const ecsStack = new EcsStack(
      `tap-ecs-${environmentSuffix}`,
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        vpcId: networkStack.vpcId,
        publicSubnetIds: networkStack.publicSubnetIds,
        privateSubnetIds: networkStack.privateSubnetIds,
        apiEcrUrl: ecrStack.apiRepositoryUrl,
        workerEcrUrl: ecrStack.workerRepositoryUrl,
        schedulerEcrUrl: ecrStack.schedulerRepositoryUrl,
        dbSecretArn: secretsStack.dbSecretArn,
        apiKeySecretArn: secretsStack.apiKeySecretArn,
      },
      { parent: this }
    );

    // Expose outputs
    this.albDnsName = ecsStack.albDnsName;
    this.apiEcrUrl = ecrStack.apiRepositoryUrl;
    this.workerEcrUrl = ecrStack.workerRepositoryUrl;
    this.schedulerEcrUrl = ecrStack.schedulerRepositoryUrl;
    this.clusterName = ecsStack.clusterName;

    // Register the outputs of this component
    this.registerOutputs({
      albDnsName: this.albDnsName,
      apiEcrUrl: this.apiEcrUrl,
      workerEcrUrl: this.workerEcrUrl,
      schedulerEcrUrl: this.schedulerEcrUrl,
      clusterName: this.clusterName,
    });
  }
}
