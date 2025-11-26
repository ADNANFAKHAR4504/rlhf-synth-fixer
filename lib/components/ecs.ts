import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EcsComponentArgs {
  environment: string;
  clusterArn: pulumi.Output<string>;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string>[];
  targetGroupArn: pulumi.Output<string>;
  ecrRepositoryUrl: pulumi.Output<string>;
  dbSecretArn: pulumi.Output<string>;
  scalingCpuThreshold: number;
  albSecurityGroupId: pulumi.Output<string>;
  tags: { [key: string]: string };
}

export class EcsComponent extends pulumi.ComponentResource {
  public readonly taskDefinition: aws.ecs.TaskDefinition;
  public readonly service: aws.ecs.Service;
  public readonly taskRole: aws.iam.Role;
  public readonly executionRole: aws.iam.Role;
  public readonly taskExecutionRole: aws.iam.Role; // Alias for executionRole for test compatibility
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly scalingTarget: aws.appautoscaling.Target;
  public readonly scalingPolicy: aws.appautoscaling.Policy;
  private readonly securityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: EcsComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:payment:EcsComponent', name, {}, opts);

    const resourceOpts = { parent: this };

    // Create security group for ECS tasks
    this.securityGroup = new aws.ec2.SecurityGroup(
      `${args.environment}-payment-ecs-sg`,
      {
        name: `${args.environment}-payment-ecs-sg`,
        description: 'Security group for ECS tasks',
        vpcId: args.vpcId,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [args.albSecurityGroupId],
            description: 'Allow traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...args.tags,
          Name: `${args.environment}-payment-ecs-sg`,
        },
      },
      resourceOpts
    );

    // Create ECS task execution role
    this.executionRole = new aws.iam.Role(
      `${args.environment}-payment-ecs-execution-role`,
      {
        name: `${args.environment}-payment-ecs-execution-role`,
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
        tags: args.tags,
      },
      resourceOpts
    );

    // Attach execution role policies
    new aws.iam.RolePolicyAttachment(
      `${args.environment}-payment-ecs-execution-policy`,
      {
        role: this.executionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      resourceOpts
    );

    // Additional policy for Secrets Manager access
    const secretsPolicy = new aws.iam.Policy(
      `${args.environment}-payment-secrets-policy`,
      {
        name: `${args.environment}-payment-secrets-policy`,
        policy: args.dbSecretArn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'secretsmanager:GetSecretValue',
                  'secretsmanager:DescribeSecret',
                ],
                Resource: arn,
              },
            ],
          })
        ),
        tags: args.tags,
      },
      resourceOpts
    );

    new aws.iam.RolePolicyAttachment(
      `${args.environment}-payment-secrets-attachment`,
      {
        role: this.executionRole.name,
        policyArn: secretsPolicy.arn,
      },
      resourceOpts
    );

    // Create ECS task role
    this.taskRole = new aws.iam.Role(
      `${args.environment}-payment-ecs-task-role`,
      {
        name: `${args.environment}-payment-ecs-task-role`,
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
        tags: args.tags,
      },
      resourceOpts
    );

    // Create CloudWatch log group (name must follow AWS naming conventions)
    const logGroupName =
      `/ecs/${args.environment}-payment-processor`.toLowerCase();
    this.logGroup = new aws.cloudwatch.LogGroup(
      `${args.environment}-payment-logs`,
      {
        name: logGroupName,
        retentionInDays: 7,
        tags: args.tags,
      },
      resourceOpts
    );

    // Create ECS task definition (family name must be lowercase)
    const taskFamily = `${args.environment}-payment-processor`.toLowerCase();
    this.taskDefinition = new aws.ecs.TaskDefinition(
      `${args.environment}-payment-task`,
      {
        family: taskFamily,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '256',
        memory: '512',
        executionRoleArn: this.executionRole.arn,
        taskRoleArn: this.taskRole.arn,
        containerDefinitions: pulumi
          .all([args.ecrRepositoryUrl, args.dbSecretArn])
          .apply(([repoUrl, secretArn]) =>
            JSON.stringify([
              {
                name: 'payment-processor',
                image: `${repoUrl}:latest`,
                essential: true,
                portMappings: [
                  {
                    containerPort: 8080,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  { name: 'ENVIRONMENT', value: args.environment },
                  { name: 'PORT', value: '8080' },
                ],
                secrets: [
                  {
                    name: 'DATABASE_CREDENTIALS',
                    valueFrom: secretArn,
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': aws.getRegionOutput().name,
                    'awslogs-stream-prefix': 'ecs',
                  },
                },
                healthCheck: {
                  command: [
                    'CMD-SHELL',
                    'curl -f http://localhost:8080/health || exit 1',
                  ],
                  interval: 30,
                  timeout: 5,
                  retries: 3,
                  startPeriod: 60,
                },
              },
            ])
          ),
        tags: args.tags,
      },
      resourceOpts
    );

    // Create ECS service
    this.service = new aws.ecs.Service(
      `${args.environment}-payment-service`,
      {
        name: `${args.environment}-payment-service`,
        cluster: args.clusterArn,
        taskDefinition: this.taskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        platformVersion: 'LATEST',
        networkConfiguration: {
          assignPublicIp: false,
          subnets: args.privateSubnetIds,
          securityGroups: [this.securityGroup.id],
        },
        loadBalancers: [
          {
            targetGroupArn: args.targetGroupArn,
            containerName: 'payment-processor',
            containerPort: 8080,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        enableExecuteCommand: true,
        tags: args.tags,
      },
      resourceOpts
    );

    // Create auto-scaling target
    this.scalingTarget = new aws.appautoscaling.Target(
      `${args.environment}-payment-scaling-target`,
      {
        maxCapacity: 10,
        minCapacity: 2,
        resourceId: pulumi.interpolate`service/${args.clusterArn.apply(arn => arn.split('/')[1])}/${this.service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      resourceOpts
    );

    // Create auto-scaling policy
    this.scalingPolicy = new aws.appautoscaling.Policy(
      `${args.environment}-payment-scaling-policy`,
      {
        name: `${args.environment}-payment-cpu-scaling`,
        policyType: 'TargetTrackingScaling',
        resourceId: this.scalingTarget.resourceId,
        scalableDimension: this.scalingTarget.scalableDimension,
        serviceNamespace: this.scalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: args.scalingCpuThreshold,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      resourceOpts
    );

    // Alias for test compatibility
    this.taskExecutionRole = this.executionRole;

    this.registerOutputs({
      taskDefinitionArn: this.taskDefinition.arn,
      serviceArn: this.service.id,
    });
  }

  // Helper method to get security group ID
  public getSecurityGroupId(): pulumi.Output<string> {
    return this.securityGroup.id;
  }
}
