import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EcrComponentArgs {
  environment: string;
  repositoryName: string;
  tags: { [key: string]: string };
}

export class EcrComponent extends pulumi.ComponentResource {
  public readonly repository: aws.ecr.Repository;
  public readonly repositoryUrl: pulumi.Output<string>;
  public readonly lifecyclePolicy: aws.ecr.LifecyclePolicy;

  constructor(
    name: string,
    args: EcrComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:payment:EcrComponent', name, {}, opts);

    const resourceOpts = { parent: this };

    // Create ECR repository
    // For simplicity, create a shared repository (can be referenced by other environments)
    this.repository = new aws.ecr.Repository(
      `${args.environment}-${args.repositoryName}`,
      {
        name: args.repositoryName,
        imageTagMutability: 'MUTABLE',
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        encryptionConfigurations: [
          {
            encryptionType: 'AES256',
          },
        ],
        forceDelete: true,
        tags: {
          ...args.tags,
          Shared: 'true',
          Name: `${args.environment}-${args.repositoryName}`,
        },
      },
      resourceOpts
    );

    this.repositoryUrl = this.repository.repositoryUrl;

    // Create lifecycle policy
    this.lifecyclePolicy = new aws.ecr.LifecyclePolicy(
      `${args.environment}-${args.repositoryName}-lifecycle`,
      {
        repository: this.repository.name,
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
      resourceOpts
    );

    // Create repository policy for cross-account access
    new aws.ecr.RepositoryPolicy(
      `${args.environment}-${args.repositoryName}-policy`,
      {
        repository: this.repository.name,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowPull',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: [
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
                'ecr:BatchCheckLayerAvailability',
              ],
            },
          ],
        }),
      },
      resourceOpts
    );

    this.registerOutputs({
      repositoryUrl: this.repositoryUrl,
    });
  }
}
