/**
 * simple-tap-stack.mjs - Simplified Pulumi ComponentResource for CI/CD Pipeline with AWS Fargate
 * 
 * This module orchestrates a simplified infrastructure for testing purposes.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class TapStack extends pulumi.ComponentResource {
  constructor(name, args = {}, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Base tags for all resources
    const baseTags = {
      Environment: environmentSuffix,
      Project: 'ci-cd-pipeline',
      ManagedBy: 'Pulumi',
      ...tags
    };

    // Get default VPC to simplify deployment
    const defaultVpc = aws.ec2.getVpc({ default: true });
    const subnets = aws.ec2.getSubnets({
      filters: [{
        name: "vpc-id",
        values: [defaultVpc.then(vpc => vpc.id)]
      }]
    });

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${environmentSuffix}`, {
      vpcId: defaultVpc.then(vpc => vpc.id),
      description: "Security group for Application Load Balancer",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-alb-sg-${environmentSuffix}`
      }
    }, { parent: this });

    const ecsSecurityGroup = new aws.ec2.SecurityGroup(`ecs-sg-${environmentSuffix}`, {
      vpcId: defaultVpc.then(vpc => vpc.id),
      description: "Security group for ECS Fargate tasks",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          securityGroups: [albSecurityGroup.id]
        }
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-ecs-sg-${environmentSuffix}`
      }
    }, { parent: this });

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(`alb-${environmentSuffix}`, {
      internal: false,
      loadBalancerType: "application",
      securityGroups: [albSecurityGroup.id],
      subnets: subnets.then(s => s.ids.slice(0, 2)), // Use first 2 subnets
      enableDeletionProtection: false,
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-alb-${environmentSuffix}`
      }
    }, { parent: this });

    const targetGroup = new aws.lb.TargetGroup(`tg-${environmentSuffix}`, {
      port: 80,
      protocol: "HTTP",
      vpcId: defaultVpc.then(vpc => vpc.id),
      targetType: "ip",
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: "200",
        path: "/",
        port: "traffic-port",
        protocol: "HTTP",
        timeout: 5,
        unhealthyThreshold: 2
      },
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-tg-${environmentSuffix}`
      }
    }, { parent: this });

    const albListener = new aws.lb.Listener(`listener-${environmentSuffix}`, {
      loadBalancerArn: alb.arn,
      port: "80",
      protocol: "HTTP",
      defaultActions: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn
        }
      ]
    }, { parent: this });

    // ECR Repository
    const ecrRepository = new aws.ecr.Repository(`ecr-${environmentSuffix}`, {
      name: `ci-cd-pipeline-app-${environmentSuffix}`,
      imageTagMutability: "MUTABLE",
      forceDelete: true,
      imageScanningConfiguration: {
        scanOnPush: true
      },
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-ecr-${environmentSuffix}`
      }
    }, { parent: this, ignoreChanges: ["name"] });

    // ECS Cluster
    const ecsCluster = new aws.ecs.Cluster(`cluster-${environmentSuffix}`, {
      name: `ci-cd-pipeline-cluster-${environmentSuffix}`,
      settings: [
        {
          name: "containerInsights",
          value: "enabled"
        }
      ],
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-cluster-${environmentSuffix}`
      }
    }, { parent: this });

    // Secrets Manager
    const appSecrets = new aws.secretsmanager.Secret(`secrets-${environmentSuffix}`, {
      name: `ci-cd-pipeline/app/${environmentSuffix}`,
      description: "Application secrets for CI/CD pipeline",
      forceOverwriteReplicaSecret: true,
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-secrets-${environmentSuffix}`
      }
    }, { parent: this });

    const secretVersion = new aws.secretsmanager.SecretVersion(`secret-ver-${environmentSuffix}`, {
      secretId: appSecrets.id,
      secretString: JSON.stringify({
        DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
        API_KEY: "your-api-key-here",
        JWT_SECRET: "your-jwt-secret-here"
      })
    }, { parent: this });

    // IAM Roles
    const taskExecutionRole = new aws.iam.Role(`task-exec-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ecs-tasks.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-task-execution-role-${environmentSuffix}`
      }
    }, { parent: this });

    const taskExecutionRolePolicyAttachment = new aws.iam.RolePolicyAttachment(`task-exec-policy-${environmentSuffix}`, {
      role: taskExecutionRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    }, { parent: this });

    const taskRole = new aws.iam.Role(`task-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ecs-tasks.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-task-role-${environmentSuffix}`
      }
    }, { parent: this });

    // CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(`logs-${environmentSuffix}`, {
      name: `/ecs/ci-cd-pipeline-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-logs-${environmentSuffix}`
      }
    }, { parent: this });

    // ECS Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(`task-${environmentSuffix}`, {
      family: `ci-cd-pipeline-task-${environmentSuffix}`,
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      cpu: "256",
      memory: "512",
      executionRoleArn: taskExecutionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: pulumi.jsonStringify([
        {
          name: "app",
          image: "nginxdemos/hello:latest",
          essential: true,
          portMappings: [
            {
              containerPort: 80,
              protocol: "tcp"
            }
          ],
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": pulumi.interpolate`/ecs/ci-cd-pipeline-${environmentSuffix}`,
              "awslogs-region": "us-west-2",
              "awslogs-stream-prefix": "ecs"
            }
          },
          environment: [
            {
              name: "NODE_ENV",
              value: environmentSuffix
            },
            {
              name: "PORT",
              value: "80"
            }
          ]
        }
      ]),
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-task-${environmentSuffix}`
      }
    }, { parent: this });

    // ECS Service
    const ecsService = new aws.ecs.Service(`service-${environmentSuffix}`, {
      name: `ci-cd-pipeline-service-${environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      launchType: "FARGATE",
      desiredCount: 1,
      networkConfiguration: {
        subnets: subnets.then(s => s.ids.slice(0, 2)),
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: true
      },
      loadBalancers: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: "app",
          containerPort: 80
        }
      ],
      deploymentMaximumPercent: 200,
      deploymentMinimumHealthyPercent: 50,
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-service-${environmentSuffix}`
      }
    }, { 
      parent: this,
      dependsOn: [albListener]
    });

    // Auto Scaling
    const scalingTarget = new aws.appautoscaling.Target(`scaling-target-${environmentSuffix}`, {
      maxCapacity: 5,
      minCapacity: 1,
      resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.name}`,
      scalableDimension: "ecs:service:DesiredCount",
      serviceNamespace: "ecs"
    }, { parent: this });

    const cpuScalingPolicy = new aws.appautoscaling.Policy(`cpu-scaling-${environmentSuffix}`, {
      name: `ci-cd-pipeline-cpu-scaling-${environmentSuffix}`,
      policyType: "TargetTrackingScaling",
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: "ECSServiceAverageCPUUtilization"
        },
        targetValue: 70.0,
        scaleInCooldown: 300,
        scaleOutCooldown: 300
      }
    }, { parent: this });

    // Expose outputs
    this.vpcId = defaultVpc.then(vpc => vpc.id);
    this.albDnsName = alb.dnsName;
    this.albArn = alb.arn;
    this.ecrRepositoryUrl = ecrRepository.repositoryUrl;
    this.ecsClusterName = ecsCluster.name;
    this.ecsServiceName = ecsService.name;
    this.secretsManagerSecretArn = appSecrets.arn;

    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      albArn: this.albArn,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
      ecsClusterName: this.ecsClusterName,
      ecsServiceName: this.ecsServiceName,
      secretsManagerSecretArn: this.secretsManagerSecretArn
    });
  }
}