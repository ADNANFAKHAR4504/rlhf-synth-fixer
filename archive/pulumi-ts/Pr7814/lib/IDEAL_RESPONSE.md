# ECS Fargate Deployment Optimization - Ideal Implementation

This is the corrected, production-ready implementation that addresses all configuration issues and follows AWS best practices.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Production-ready ECS Fargate deployment with Application Load Balancer.
 * This implementation follows AWS best practices with optimized configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for ECS Fargate deployment.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly serviceName: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // FIX #2: Use SHA256 digest instead of 'latest' tag for production-ready deployment
    // Default to nginx with SHA256 digest, but allow override via environment variable
    const imageUri = process.env.IMAGE_URI ||
      "nginx@sha256:447a8665cc1dab95b1ca778e162215839ccbb9189104c79d7ec3a81e14577add";

    // Define comprehensive tags for cost allocation and resource management
    const resourceTags = pulumi.all([args.tags]).apply(([tags]) => ({
      Environment: environmentSuffix,
      Owner: tags?.Owner || 'cloud-team',
      Project: tags?.Project || 'ecs-fargate-optimization',
      CostCenter: tags?.CostCenter || 'engineering',
      ManagedBy: 'pulumi',
      ...tags,
    }));

    // Get default VPC and subnets
    const defaultVpc = aws.ec2.getVpc({ default: true }, { parent: this });
    const defaultVpcId = defaultVpc.then(vpc => vpc.id);

    const publicSubnets = aws.ec2.getSubnets({
      filters: [
        {
          name: "vpc-id",
          values: [defaultVpcId],
        },
      ],
    }, { parent: this });

    // Security Group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${environmentSuffix}`, {
      vpcId: defaultVpcId,
      description: "Security group for Application Load Balancer",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow HTTP traffic from internet",
        },
        {
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow HTTPS traffic from internet",
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic",
        },
      ],
      tags: resourceTags,
    }, { parent: this });

    // Security Group for ECS Tasks
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(`ecs-sg-${environmentSuffix}`, {
      vpcId: defaultVpcId,
      description: "Security group for ECS tasks",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          securityGroups: [albSecurityGroup.id],
          description: "Allow traffic from ALB only",
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic",
        },
      ],
      tags: resourceTags,
    }, { parent: this });

    // FIX #5: CloudWatch Log Group with 7-day retention policy
    const logGroup = new aws.cloudwatch.LogGroup(`ecs-logs-${environmentSuffix}`, {
      name: `/ecs/api-${environmentSuffix}`,
      retentionInDays: 7, // Cost optimization: 7-day retention
      tags: resourceTags,
    }, { parent: this });

    // IAM Role for ECS Task Execution
    const executionRole = new aws.iam.Role(`ecs-execution-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ecs-tasks.amazonaws.com",
          },
        }],
      }),
      tags: resourceTags,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`ecs-execution-policy-${environmentSuffix}`, {
      role: executionRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    }, { parent: this });

    // IAM Role for ECS Task
    const taskRole = new aws.iam.Role(`ecs-task-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ecs-tasks.amazonaws.com",
          },
        }],
      }),
      tags: resourceTags,
    }, { parent: this });

    // FIX #4: Implement least-privilege IAM permissions
    // Replace overly broad s3:*, dynamodb:*, sqs:* with specific permissions
    const taskPolicy = new aws.iam.RolePolicy(`ecs-task-policy-${environmentSuffix}`, {
      role: taskRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:ListBucket",
            ],
            Resource: [
              `arn:aws:s3:::app-data-${environmentSuffix}`,
              `arn:aws:s3:::app-data-${environmentSuffix}/*`,
            ],
          },
          {
            Effect: "Allow",
            Action: [
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:Query",
              "dynamodb:Scan",
            ],
            Resource: `arn:aws:dynamodb:*:*:table/app-table-${environmentSuffix}`,
          },
          {
            Effect: "Allow",
            Action: [
              "sqs:SendMessage",
              "sqs:ReceiveMessage",
              "sqs:DeleteMessage",
              "sqs:GetQueueAttributes",
            ],
            Resource: `arn:aws:sqs:*:*:app-queue-${environmentSuffix}`,
          },
        ],
      }),
    }, { parent: this });

    // ECS Cluster with proper tagging
    const cluster = new aws.ecs.Cluster(`api-cluster-${environmentSuffix}`, {
      name: `api-cluster-${environmentSuffix}`,
      tags: resourceTags,
      settings: [{
        name: "containerInsights",
        value: "enabled",
      }],
    }, { parent: this });

    // FIX #1: Use correct CPU/memory combination (512 CPU / 1024 MiB memory)
    const taskDefinition = new aws.ecs.TaskDefinition(`api-task-${environmentSuffix}`, {
      family: `api-task-${environmentSuffix}`,
      cpu: "512",  // Changed from 256 to 512
      memory: "1024",  // Valid combination with 512 CPU
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      executionRoleArn: executionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: pulumi.all([logGroup.name]).apply(([logGroupName]) =>
        JSON.stringify([
          {
            name: "api-container",
            image: imageUri,  // Using SHA256 digest
            essential: true,
            portMappings: [
              {
                containerPort: 80,
                protocol: "tcp",
              },
            ],
            logConfiguration: {
              logDriver: "awslogs",
              options: {
                "awslogs-group": logGroupName,
                "awslogs-region": aws.getRegionOutput().name,
                "awslogs-stream-prefix": "ecs",
              },
            },
            // FIX #8: Add proper error handling and health monitoring
            healthCheck: {
              command: ["CMD-SHELL", "curl -f http://localhost/health || exit 1"],
              interval: 30,
              timeout: 5,
              retries: 3,
              startPeriod: 60,
            },
            environment: [
              {
                name: "ENVIRONMENT",
                value: environmentSuffix,
              },
            ],
          },
        ])
      ),
      tags: resourceTags,
    }, { parent: this });

    // Application Load Balancer with proper tagging
    const alb = new aws.lb.LoadBalancer(`api-alb-${environmentSuffix}`, {
      name: `api-alb-${environmentSuffix}`,
      internal: false,
      loadBalancerType: "application",
      securityGroups: [albSecurityGroup.id],
      subnets: publicSubnets.then(subnets => subnets.ids),
      tags: resourceTags,
      enableDeletionProtection: false, // Allow deletion for non-production
      enableHttp2: true,
      idleTimeout: 60,
    }, { parent: this });

    // FIX #3: Increase health check timeout from 3 to 5 seconds
    const targetGroup = new aws.lb.TargetGroup(`api-tg-${environmentSuffix}`, {
      name: `api-tg-${environmentSuffix}`,
      port: 80,
      protocol: "HTTP",
      vpcId: defaultVpcId,
      targetType: "ip",
      healthCheck: {
        enabled: true,
        path: "/health",
        interval: 30,
        timeout: 5,  // Increased from 3 to 5 seconds
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        matcher: "200",
        protocol: "HTTP",
      },
      tags: resourceTags,
      deregistrationDelay: 30,
    }, { parent: this });

    // FIX #7: Remove unnecessary listener rule - use only the default action
    const listener = new aws.lb.Listener(`api-listener-${environmentSuffix}`, {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: "HTTP",
      defaultActions: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn,
        },
      ],
      tags: resourceTags,
    }, { parent: this });

    // ECS Service with proper configuration and error handling
    const service = new aws.ecs.Service(`api-service-${environmentSuffix}`, {
      name: `api-service-${environmentSuffix}`,
      cluster: cluster.arn,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: "FARGATE",
      networkConfiguration: {
        subnets: publicSubnets.then(subnets => subnets.ids),
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: true,
      },
      loadBalancers: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: "api-container",
          containerPort: 80,
        },
      ],
      // FIX #8: Proper deployment configuration and health checks
      deploymentConfiguration: {
        maximumPercent: 200,
        minimumHealthyPercent: 100,
        deploymentCircuitBreaker: {
          enable: true,
          rollback: true,
        },
      },
      healthCheckGracePeriodSeconds: 60,
      tags: resourceTags,
      enableExecuteCommand: true, // Enable ECS Exec for debugging
      propagateTags: "SERVICE",
    }, { parent: this, dependsOn: [listener] });

    // Expose outputs for integration testing
    this.albDnsName = alb.dnsName;
    this.clusterName = cluster.name;
    this.serviceName = service.name;
    this.vpcId = pulumi.output(defaultVpcId);
    this.targetGroupArn = targetGroup.arn;

    // Register the outputs of this component
    this.registerOutputs({
      albDnsName: this.albDnsName,
      clusterName: this.clusterName,
      serviceName: this.serviceName,
      vpcId: this.vpcId,
      targetGroupArn: this.targetGroupArn,
    });
  }
}
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// FIX #6: Define comprehensive tags for cost allocation
const defaultTags = {
  Environment: environmentSuffix,
  Owner: 'cloud-team',
  Project: 'ecs-fargate-optimization',
  CostCenter: 'engineering',
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  ManagedBy: 'pulumi',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs for use by other stacks or integration tests
export const albDnsName = stack.albDnsName;
export const clusterName = stack.clusterName;
export const serviceName = stack.serviceName;
export const vpcId = stack.vpcId;
export const targetGroupArn = stack.targetGroupArn;
```

## File: Pulumi.yaml

```yaml
name: TapStack
runtime:
  name: nodejs
description: Production-ready Pulumi infrastructure for ECS Fargate deployment
main: bin/tap.ts
```

## Summary of Optimizations

This implementation addresses all identified issues:

1. **Task Definition (FIX #1)**: Changed CPU from 256 to 512 to match the valid 512/1024 combination
2. **Image Tag (FIX #2)**: Replaced `nginx:latest` with SHA256 digest for production stability
3. **Health Check (FIX #3)**: Increased timeout from 3 to 5 seconds to prevent false negatives
4. **IAM Permissions (FIX #4)**: Implemented least-privilege with specific S3, DynamoDB, and SQS permissions
5. **CloudWatch Logs (FIX #5)**: Added 7-day retention policy to control costs
6. **Tagging (FIX #6)**: Added comprehensive cost allocation tags (Environment, Owner, Project, CostCenter)
7. **ALB Listener (FIX #7)**: Removed redundant listener rule, simplified configuration
8. **Error Handling (FIX #8)**: Added deployment circuit breaker, health checks, and proper dependencies

## Best Practices Implemented

- Resource naming includes environmentSuffix for multi-environment support
- All resources are properly tagged for cost allocation and management
- Security groups follow least-privilege network access
- High availability with 2 tasks and proper deployment configuration
- Container insights enabled for enhanced monitoring
- ECS Exec enabled for troubleshooting
- Deployment circuit breaker for automated rollback
- Proper resource dependencies to ensure correct deployment order
