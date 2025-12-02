# ECS Fargate Optimization Implementation

This implementation provides an optimized ECS Fargate deployment using Pulumi with TypeScript.

## File: lib/tap-stack.ts

```typescript
/**
 * Main Pulumi ComponentResource for ECS Fargate optimization.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly clusterName: pulumi.Output<string>;
  public readonly serviceName: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly serviceEndpoint: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'ecs-fargate-optimization',
      ManagedBy: 'Pulumi',
    }));

    const defaultVpc = aws.ec2.getVpc({ default: true });
    const defaultSubnets = defaultVpc.then(vpc =>
      aws.ec2.getSubnets({
        filters: [{ name: 'vpc-id', values: [vpc.id] }],
      })
    );

    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-alb-sg-${environmentSuffix}`,
      {
        vpcId: defaultVpc.then(vpc => vpc.id),
        description: 'Security group for ALB',
        ingress: [
          { protocol: 'tcp', fromPort: 80, toPort: 80, cidrBlocks: ['0.0.0.0/0'] },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: tags.apply(t => ({ ...t, Name: `ecs-alb-sg-${environmentSuffix}` })),
      },
      { parent: this }
    );

    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-task-sg-${environmentSuffix}`,
      {
        vpcId: defaultVpc.then(vpc => vpc.id),
        description: 'Security group for ECS tasks',
        ingress: [
          { protocol: 'tcp', fromPort: 80, toPort: 80, securityGroups: [albSecurityGroup.id] },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: tags.apply(t => ({ ...t, Name: `ecs-task-sg-${environmentSuffix}` })),
      },
      { parent: this }
    );

    const ecrRepository = new aws.ecr.Repository(
      `ecs-app-repo-${environmentSuffix}`,
      {
        name: `ecs-app-${environmentSuffix}`,
        imageScanningConfiguration: { scanOnPush: true },
        imageTagMutability: 'MUTABLE',
        tags: tags,
      },
      { parent: this }
    );

    const cluster = new aws.ecs.Cluster(
      `ecs-cluster-${environmentSuffix}`,
      {
        name: `ecs-cluster-${environmentSuffix}`,
        settings: [{ name: 'containerInsights', value: 'enabled' }],
        tags: tags,
      },
      { parent: this }
    );

    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-logs-${environmentSuffix}`,
      {
        name: `/ecs/ecs-app-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    const taskExecutionRole = new aws.iam.Role(
      `ecs-task-execution-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            { Effect: 'Allow', Principal: { Service: 'ecs-tasks.amazonaws.com' }, Action: 'sts:AssumeRole' },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `ecs-task-exec-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    const taskRole = new aws.iam.Role(
      `ecs-task-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            { Effect: 'Allow', Principal: { Service: 'ecs-tasks.amazonaws.com' }, Action: 'sts:AssumeRole' },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    const taskDefinition = new aws.ecs.TaskDefinition(
      `ecs-task-def-${environmentSuffix}`,
      {
        family: `ecs-app-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '1024',
        memory: '2048',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi.interpolate`[{
          "name": "app",
          "image": "${ecrRepository.repositoryUrl}:latest",
          "essential": true,
          "portMappings": [{ "containerPort": 80, "protocol": "tcp" }],
          "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
              "awslogs-group": "${logGroup.name}",
              "awslogs-region": "us-east-1",
              "awslogs-stream-prefix": "ecs"
            }
          }
        }]`,
        tags: tags,
      },
      { parent: this }
    );

    const alb = new aws.lb.LoadBalancer(
      `ecs-alb-${environmentSuffix}`,
      {
        name: `ecs-alb-${environmentSuffix}`,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: defaultSubnets.then(s => s.ids),
        tags: tags,
      },
      { parent: this }
    );

    const targetGroup = new aws.lb.TargetGroup(
      `ecs-tg-${environmentSuffix}`,
      {
        name: `ecs-tg-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: defaultVpc.then(vpc => vpc.id),
        targetType: 'ip',
        deregistrationDelay: 30,
        healthCheck: {
          enabled: true,
          path: '/',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        tags: tags,
      },
      { parent: this }
    );

    const listener = new aws.lb.Listener(
      `ecs-alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [{ type: 'forward', targetGroupArn: targetGroup.arn }],
      },
      { parent: this }
    );

    const service = new aws.ecs.Service(
      `ecs-service-${environmentSuffix}`,
      {
        name: `ecs-service-${environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 3,
        launchType: 'FARGATE',
        networkConfiguration: {
          assignPublicIp: true,
          securityGroups: [ecsSecurityGroup.id],
          subnets: defaultSubnets.then(s => s.ids),
        },
        loadBalancers: [{
          targetGroupArn: targetGroup.arn,
          containerName: 'app',
          containerPort: 80,
        }],
        deploymentCircuitBreaker: { enable: true, rollback: true },
        tags: tags,
      },
      { parent: this, dependsOn: [listener] }
    );

    const scalingTarget = new aws.appautoscaling.Target(
      `ecs-scaling-target-${environmentSuffix}`,
      {
        maxCapacity: 6,
        minCapacity: 2,
        resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    new aws.appautoscaling.Policy(
      `ecs-scaling-policy-${environmentSuffix}`,
      {
        policyType: 'TargetTrackingScaling',
        resourceId: scalingTarget.resourceId,
        scalableDimension: scalingTarget.scalableDimension,
        serviceNamespace: scalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ALBRequestCountPerTarget',
            resourceLabel: pulumi.interpolate`${alb.arnSuffix}/${targetGroup.arnSuffix}`,
          },
          targetValue: 1000,
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    this.clusterName = cluster.name;
    this.serviceName = service.name;
    this.albDnsName = alb.dnsName;
    this.serviceEndpoint = pulumi.interpolate`http://${alb.dnsName}`;

    this.registerOutputs({
      clusterName: this.clusterName,
      serviceName: this.serviceName,
      albDnsName: this.albDnsName,
      serviceEndpoint: this.serviceEndpoint,
      ecrRepositoryUrl: ecrRepository.repositoryUrl,
    });
  }
}
```

## File: index.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

const stack = new TapStack('ecs-fargate-optimization', {
  environmentSuffix: environmentSuffix,
  tags: { Owner: 'DevOps', CostCenter: 'Engineering' },
});

export const clusterName = stack.clusterName;
export const serviceName = stack.serviceName;
export const serviceEndpoint = stack.serviceEndpoint;
```
