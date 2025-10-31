import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface EcsClusterStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EcsClusterStack extends pulumi.ComponentResource {
  public readonly cluster: aws.ecs.Cluster;
  public readonly executionRole: aws.iam.Role;
  public readonly taskRole: aws.iam.Role;
  public readonly ecrRepositoryFrontend: aws.ecr.Repository;
  public readonly ecrRepositoryBackend: aws.ecr.Repository;

  constructor(
    name: string,
    args: EcsClusterStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:ecs:ClusterStack', name, args, opts);

    // Create ECS Cluster
    this.cluster = new aws.ecs.Cluster(
      `${name}-cluster-${args.environmentSuffix}`,
      {
        name: `${name}-cluster-${args.environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          ...args.tags,
          Name: `${name}-cluster-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create ECS Task Execution Role
    this.executionRole = new aws.iam.Role(
      `${name}-execution-role-${args.environmentSuffix}`,
      {
        name: `${name}-execution-role-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...args.tags,
          Name: `${name}-execution-role-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach minimal policies for ECS task execution
    new aws.iam.RolePolicyAttachment(
      `${name}-execution-policy-${args.environmentSuffix}`,
      {
        role: this.executionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Create inline policy for ECR access
    new aws.iam.RolePolicy(
      `${name}-ecr-policy-${args.environmentSuffix}`,
      {
        role: this.executionRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create Task Role (for container permissions)
    this.taskRole = new aws.iam.Role(
      `${name}-task-role-${args.environmentSuffix}`,
      {
        name: `${name}-task-role-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...args.tags,
          Name: `${name}-task-role-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create ECR repositories
    // Note: ECR repository names must be lowercase
    const frontendRepoName =
      `${name}-frontend-${args.environmentSuffix}`.toLowerCase();
    this.ecrRepositoryFrontend = new aws.ecr.Repository(
      `${name}-frontend-repo-${args.environmentSuffix}`,
      {
        name: frontendRepoName,
        imageTagMutability: 'MUTABLE',
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        tags: {
          ...args.tags,
          Name: `${name}-frontend-repo-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const backendRepoName =
      `${name}-backend-${args.environmentSuffix}`.toLowerCase();
    this.ecrRepositoryBackend = new aws.ecr.Repository(
      `${name}-backend-repo-${args.environmentSuffix}`,
      {
        name: backendRepoName,
        imageTagMutability: 'MUTABLE',
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        tags: {
          ...args.tags,
          Name: `${name}-backend-repo-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      clusterArn: this.cluster.arn,
      executionRoleArn: this.executionRole.arn,
      taskRoleArn: this.taskRole.arn,
    });
  }
}
