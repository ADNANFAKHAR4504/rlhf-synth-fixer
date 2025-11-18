/**
 * iam.ts
 *
 * IAM roles and policies for ECS, Lambda, and DMS
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface IamRolesStackArgs {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class IamRolesStack extends pulumi.ComponentResource {
  public readonly ecsTaskExecutionRoleArn: pulumi.Output<string>;
  public readonly ecsTaskRoleArn: pulumi.Output<string>;
  public readonly lambdaExecutionRoleArn: pulumi.Output<string>;
  public readonly dmsReplicationRoleArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: IamRolesStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:iam:IamRolesStack', name, args, opts);

    // ECS Task Execution Role
    const ecsTaskExecutionRole = new aws.iam.Role(
      `ecs-task-exec-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `payment-ecs-exec-role-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `ecs-task-exec-policy-${args.environmentSuffix}`,
      {
        role: ecsTaskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    this.ecsTaskExecutionRoleArn = ecsTaskExecutionRole.arn;

    // ECS Task Role
    const ecsTaskRole = new aws.iam.Role(
      `ecs-task-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `payment-ecs-task-role-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // ECS Task Policy for RDS access
    const ecsTaskPolicy = new aws.iam.Policy(
      `ecs-task-policy-${args.environmentSuffix}`,
      {
        description: 'Policy for ECS tasks to access RDS and CloudWatch',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['rds:DescribeDBClusters', 'rds:DescribeDBInstances'],
              Resource: '*',
            },
          ],
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `ecs-task-policy-attach-${args.environmentSuffix}`,
      {
        role: ecsTaskRole.name,
        policyArn: ecsTaskPolicy.arn,
      },
      { parent: this }
    );

    this.ecsTaskRoleArn = ecsTaskRole.arn;

    // Lambda Execution Role
    const lambdaExecutionRole = new aws.iam.Role(
      `lambda-exec-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `payment-lambda-role-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `lambda-vpc-exec-policy-${args.environmentSuffix}`,
      {
        role: lambdaExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Lambda policy for database access
    const lambdaDbPolicy = new aws.iam.Policy(
      `lambda-db-policy-${args.environmentSuffix}`,
      {
        description: 'Policy for Lambda to access RDS databases',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['rds:DescribeDBClusters', 'rds:DescribeDBInstances'],
              Resource: '*',
            },
          ],
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `lambda-db-policy-attach-${args.environmentSuffix}`,
      {
        role: lambdaExecutionRole.name,
        policyArn: lambdaDbPolicy.arn,
      },
      { parent: this }
    );

    this.lambdaExecutionRoleArn = lambdaExecutionRole.arn;

    // DMS Replication Role
    const dmsReplicationRole = new aws.iam.Role(
      `dms-replication-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'dms.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `payment-dms-role-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `dms-vpc-policy-${args.environmentSuffix}`,
      {
        role: dmsReplicationRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `dms-cloudwatch-policy-${args.environmentSuffix}`,
      {
        role: dmsReplicationRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonDMSCloudWatchLogsRole',
      },
      { parent: this }
    );

    this.dmsReplicationRoleArn = dmsReplicationRole.arn;

    this.registerOutputs({
      ecsTaskExecutionRoleArn: this.ecsTaskExecutionRoleArn,
      ecsTaskRoleArn: this.ecsTaskRoleArn,
      lambdaExecutionRoleArn: this.lambdaExecutionRoleArn,
      dmsReplicationRoleArn: this.dmsReplicationRoleArn,
    });
  }
}
