/**
 * tap-stack.ts
 *
 * Main Pulumi stack for CI/CD Pipeline Integration with ECS Fargate
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { CicdPipelineStack } from './cicd-pipeline-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecsServiceName: pulumi.Output<string>;
  public readonly loadBalancerDns: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const tags = args.tags || {};

    // Instantiate CI/CD Pipeline Stack
    const cicdStack = new CicdPipelineStack(
      'cicd-pipeline',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Expose outputs
    this.pipelineUrl = cicdStack.pipelineUrl;
    this.ecsServiceName = cicdStack.ecsServiceName;
    this.loadBalancerDns = cicdStack.loadBalancerDns;
    this.ecrRepositoryUri = cicdStack.ecrRepositoryUri;

    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecsServiceName: this.ecsServiceName,
      loadBalancerDns: this.loadBalancerDns,
      ecrRepositoryUri: this.ecrRepositoryUri,
    });
  }
}
