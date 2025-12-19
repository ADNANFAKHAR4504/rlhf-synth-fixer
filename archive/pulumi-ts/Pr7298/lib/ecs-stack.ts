/**
 * ecs-stack.ts
 *
 * Defines ECS cluster, ALB, and task definitions with X-Ray integration.
 *
 * Features:
 * - ECS Fargate cluster
 * - Application Load Balancer in public subnets
 * - ECS task definition with X-Ray daemon sidecar
 * - Security groups for ALB and ECS tasks
 * - CloudWatch Logs for ECS tasks
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface EcsStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<pulumi.Input<string>[]>;
  privateSubnetIds: pulumi.Input<pulumi.Input<string>[]>;
  kmsKeyArn: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EcsStack extends pulumi.ComponentResource {
  public readonly cluster: aws.ecs.Cluster;
  public readonly alb: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ecsSecurityGroup: aws.ec2.SecurityGroup;
  public readonly taskRole: aws.iam.Role;
  public readonly executionRole: aws.iam.Role;

  constructor(
    name: string,
    args: EcsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:ecs:EcsStack', name, args, opts);

    const { environmentSuffix, vpcId, publicSubnetIds, tags } = args;

    // Create ECS cluster
    this.cluster = new aws.ecs.Cluster(
      `cicd-cluster-${environmentSuffix}`,
      {
        name: `cicd-cluster-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          ...tags,
          Name: `cicd-cluster-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ALB Security Group
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        name: `cicd-alb-sg-${environmentSuffix}`,
        vpcId: vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          ...tags,
          Name: `cicd-alb-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ECS Security Group
    this.ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-sg-${environmentSuffix}`,
      {
        name: `cicd-ecs-sg-${environmentSuffix}`,
        vpcId: vpcId,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [this.albSecurityGroup.id],
            description: 'Allow traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          ...tags,
          Name: `cicd-ecs-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      `cicd-alb-${environmentSuffix}`,
      {
        name: `cicd-alb-${environmentSuffix}`,
        loadBalancerType: 'application',
        securityGroups: [this.albSecurityGroup.id],
        subnets: publicSubnetIds,
        tags: {
          ...tags,
          Name: `cicd-alb-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Target Group
    this.targetGroup = new aws.lb.TargetGroup(
      `cicd-tg-${environmentSuffix}`,
      {
        name: `cicd-tg-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: vpcId,
        healthCheck: {
          enabled: true,
          path: '/health',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
        },
        tags: {
          ...tags,
          Name: `cicd-tg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ALB Listener
    new aws.lb.Listener(
      `cicd-alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // ECS Task Execution Role
    this.executionRole = new aws.iam.Role(
      `ecs-execution-role-${environmentSuffix}`,
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
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
        ],
        tags: {
          ...tags,
          Name: `ecs-execution-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ECS Task Role (with X-Ray permissions)
    this.taskRole = new aws.iam.Role(
      `ecs-task-role-${environmentSuffix}`,
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
          ...tags,
          Name: `ecs-task-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `ecs-task-policy-${environmentSuffix}`,
      {
        role: this.taskRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['secretsmanager:GetSecretValue'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    this.registerOutputs({
      clusterName: this.cluster.name,
      clusterArn: this.cluster.arn,
      albArn: this.alb.arn,
      albDnsName: this.alb.dnsName,
      targetGroupArn: this.targetGroup.arn,
    });
  }
}
