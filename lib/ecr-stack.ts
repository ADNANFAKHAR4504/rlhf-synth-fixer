/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */


/**
 * ecr-stack.ts
 *
 * Creates ECR repositories for microservices with lifecycle policies.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EcrStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EcrStack extends pulumi.ComponentResource {
  public readonly apiRepositoryUrl: pulumi.Output<string>;
  public readonly workerRepositoryUrl: pulumi.Output<string>;
  public readonly schedulerRepositoryUrl: pulumi.Output<string>;

  constructor(
    name: string,
    args: EcrStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:ecr:EcrStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Lifecycle policy to keep only last 10 images
    const lifecyclePolicy = {
      rules: [
        {
          rulePriority: 1,
          description: 'Keep only last 10 images',
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
    };

    // Create ECR repository for API service
    const apiRepo = new aws.ecr.Repository(
      `api-service-repo-${environmentSuffix}`,
      {
        name: `api-service-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        tags: {
          Name: `api-service-repo-${environmentSuffix}`,
          Service: 'api',
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.ecr.LifecyclePolicy(
      `api-service-lifecycle-${environmentSuffix}`,
      {
        repository: apiRepo.name,
        policy: JSON.stringify(lifecyclePolicy),
      },
      { parent: this }
    );

    // Create ECR repository for Worker service
    const workerRepo = new aws.ecr.Repository(
      `worker-service-repo-${environmentSuffix}`,
      {
        name: `worker-service-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        tags: {
          Name: `worker-service-repo-${environmentSuffix}`,
          Service: 'worker',
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.ecr.LifecyclePolicy(
      `worker-service-lifecycle-${environmentSuffix}`,
      {
        repository: workerRepo.name,
        policy: JSON.stringify(lifecyclePolicy),
      },
      { parent: this }
    );

    // Create ECR repository for Scheduler service
    const schedulerRepo = new aws.ecr.Repository(
      `scheduler-service-repo-${environmentSuffix}`,
      {
        name: `scheduler-service-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        tags: {
          Name: `scheduler-service-repo-${environmentSuffix}`,
          Service: 'scheduler',
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.ecr.LifecyclePolicy(
      `scheduler-service-lifecycle-${environmentSuffix}`,
      {
        repository: schedulerRepo.name,
        policy: JSON.stringify(lifecyclePolicy),
      },
      { parent: this }
    );

    // Expose outputs
    this.apiRepositoryUrl = apiRepo.repositoryUrl;
    this.workerRepositoryUrl = workerRepo.repositoryUrl;
    this.schedulerRepositoryUrl = schedulerRepo.repositoryUrl;

    this.registerOutputs({
      apiRepositoryUrl: this.apiRepositoryUrl,
      workerRepositoryUrl: this.workerRepositoryUrl,
      schedulerRepositoryUrl: this.schedulerRepositoryUrl,
    });
  }
}
