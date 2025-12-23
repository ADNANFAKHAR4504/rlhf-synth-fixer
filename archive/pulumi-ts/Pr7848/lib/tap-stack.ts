/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the CI/CD Pipeline Infrastructure.
 * Orchestrates the instantiation of the CI/CD pipeline components.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { CicdPipelineStack } from './cicd-pipeline-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack component.
 */
export interface TapStackArgs {
  /**
   * Environment suffix for resource naming (required for uniqueness).
   */
  environmentSuffix: string;

  /**
   * Optional tags to apply to all resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main TapStack component that orchestrates the CI/CD pipeline infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const { environmentSuffix, tags = {} } = args;

    // Instantiate the CI/CD Pipeline Stack
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
    this.ecrRepositoryUri = cicdStack.ecrRepositoryUri;
    this.s3BucketName = cicdStack.s3BucketName;
    this.lambdaFunctionArn = cicdStack.lambdaFunctionArn;
    this.codeBuildProjectName = cicdStack.codeBuildProjectName;

    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecrRepositoryUri: this.ecrRepositoryUri,
      s3BucketName: this.s3BucketName,
      lambdaFunctionArn: this.lambdaFunctionArn,
      codeBuildProjectName: this.codeBuildProjectName,
    });
  }
}
