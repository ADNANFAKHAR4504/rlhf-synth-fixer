/**
 * container-stack.ts
 *
 * Creates ECR repositories with vulnerability scanning enabled.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ContainerStackArgs {
  environmentSuffix: string;
  logGroupName: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class ContainerStack extends pulumi.ComponentResource {
  public readonly repositoryUrl: pulumi.Output<string>;
  public readonly repositoryArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: ContainerStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:container:ContainerStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Create ECR repository for application containers
    const repository = new aws.ecr.Repository(
      `financial-app-repo-${environmentSuffix}`,
      {
        name: `financial-app-repo-${environmentSuffix}`,
        imageTagMutability: 'MUTABLE',
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        encryptionConfigurations: [
          {
            encryptionType: 'AES256',
          },
        ],
        tags: {
          ...tags,
          Name: `financial-app-repo-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create lifecycle policy to manage image retention
    new aws.ecr.LifecyclePolicy(
      `financial-app-repo-lifecycle-${environmentSuffix}`,
      {
        repository: repository.name,
        policy: JSON.stringify({
          rules: [
            {
              rulePriority: 1,
              description: 'Keep last 10 images',
              selection: {
                tagStatus: 'any',
                countType: 'imageCountMoreThan',
                countNumber: 10,
              },
              action: {
                type: 'expire',
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // Set outputs
    this.repositoryUrl = repository.repositoryUrl;
    this.repositoryArn = repository.arn;

    this.registerOutputs({
      repositoryUrl: this.repositoryUrl,
      repositoryArn: this.repositoryArn,
    });
  }
}
