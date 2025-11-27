/**
 * codecommit-stack.ts
 *
 * Defines AWS CodeCommit repository for source control.
 *
 * Features:
 * - Repository with main, develop, and feature branch structure
 * - Default branch: main
 * - Repository description and tags
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CodeCommitStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CodeCommitStack extends pulumi.ComponentResource {
  public readonly repository: aws.codecommit.Repository;
  public readonly repositoryArn: pulumi.Output<string>;
  public readonly repositoryCloneUrlHttp: pulumi.Output<string>;

  constructor(
    name: string,
    args: CodeCommitStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:codecommit:CodeCommitStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Create CodeCommit repository
    this.repository = new aws.codecommit.Repository(
      `cicd-repo-${environmentSuffix}`,
      {
        repositoryName: `cicd-pipeline-${environmentSuffix}`,
        description: `CI/CD pipeline source repository for ${environmentSuffix} environment`,
        defaultBranch: 'main',
        tags: {
          ...tags,
          Name: `cicd-repo-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.repositoryArn = this.repository.arn;
    this.repositoryCloneUrlHttp = this.repository.cloneUrlHttp;

    this.registerOutputs({
      repositoryId: this.repository.repositoryId,
      repositoryName: this.repository.repositoryName,
      repositoryArn: this.repository.arn,
      repositoryCloneUrlHttp: this.repository.cloneUrlHttp,
    });
  }
}
