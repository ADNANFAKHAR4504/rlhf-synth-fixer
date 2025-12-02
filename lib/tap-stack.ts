import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { CodeBuildStack } from './codebuild-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {
      Environment: 'ci',
      ManagedBy: 'pulumi',
    };

    // Create CodeBuild stack
    const codeBuildStack = new CodeBuildStack(
      'codebuild',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    this.codeBuildProjectName = codeBuildStack.codeBuildProjectName;
    this.artifactBucketName = codeBuildStack.artifactBucketName;

    this.registerOutputs({
      codeBuildProjectName: this.codeBuildProjectName,
      artifactBucketName: this.artifactBucketName,
    });
  }
}
