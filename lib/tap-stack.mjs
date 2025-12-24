/**
 * tap-stack.mjs - Main Pulumi ComponentResource for CI/CD Pipeline with AWS Fargate
 * 
 * This module orchestrates the complete infrastructure including VPC, ECS Fargate,
 * load balancing, auto scaling, monitoring, and CI/CD integration.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

/**
 * @typedef {Object} TapStackArgs
 * @property {string} [environmentSuffix] - Environment suffix (e.g., 'dev', 'prod')
 * @property {Object<string, string>} [tags] - Default tags for resources
 */

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

    // VPC Configuration - simplified with NAT instances to avoid NAT gateway issues
    const vpc = new awsx.ec2.Vpc(`vpc-${environmentSuffix}`, {
      numberOfAvailabilityZones: 2,
      natGateways: {
        strategy: "Single"  // Use single NAT gateway to avoid IP association issues
      },
      subnets: [
        { type: "public", name: "public" },
        { type: "private", name: "private" }
      ],
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-vpc-${environmentSuffix}`
      }
    }, { parent: this });

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${environmentSuffix}`, {
      vpcId: vpc.vpcId,
      description: "Security group for Application Load Balancer",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ["0.0.0.0/0"]
        },
        {
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
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
      vpcId: vpc.vpcId,
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
      subnets: vpc.publicSubnetIds,
      enableDeletionProtection: false,
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-alb-${environmentSuffix}`
      }
    }, { parent: this });

    const targetGroup = new aws.lb.TargetGroup(`tg-${environmentSuffix}`, {
      port: 80,
      protocol: "HTTP",
      vpcId: vpc.vpcId,
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

    // ECR Repository - get existing or create new
    const ecrRepository = new aws.ecr.Repository(`ecr-${environmentSuffix}`, {
      name: `ci-cd-pipeline-app-${environmentSuffix}`,
      imageTagMutability: "MUTABLE",
      forceDelete: true,  // Allow deletion even with images
      imageScanningConfiguration: {
        scanOnPush: true
      },
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-ecr-${environmentSuffix}`
      }
    }, { parent: this, ignoreChanges: ["name"] });

    // Service Discovery Namespace for ECS Service Connect
    const serviceDiscoveryNamespace = new aws.servicediscovery.HttpNamespace(`namespace-${environmentSuffix}`, {
      name: `ci-cd-pipeline-namespace-${environmentSuffix}`,
      description: "Service discovery namespace for CI/CD pipeline",
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-namespace-${environmentSuffix}`
      }
    }, { parent: this });

    // ECS Cluster with Container Insights Enhanced Observability
    const ecsCluster = new aws.ecs.Cluster(`cluster-${environmentSuffix}`, {
      name: `ci-cd-pipeline-cluster-${environmentSuffix}`,
      settings: [
        {
          name: "containerInsights",
          value: "enhanced"  // Latest feature: Enhanced Observability
        }
      ],
      serviceConnectDefaults: {
        namespace: serviceDiscoveryNamespace.arn
      },
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-cluster-${environmentSuffix}`
      }
    }, { parent: this });

    // Secrets Manager for environment variables
    const appSecrets = new aws.secretsmanager.Secret(`secrets-${environmentSuffix}`, {
      name: `ci-cd-pipeline/app/${environmentSuffix}`,
      description: "Application secrets for CI/CD pipeline",
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

    // IAM Role for ECS Task Execution
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

    // Attach execution role policies
    const taskExecutionRolePolicyAttachment = new aws.iam.RolePolicyAttachment(`task-exec-policy-${environmentSuffix}`, {
      role: taskExecutionRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    }, { parent: this });

    // Additional policy for Secrets Manager access
    const secretsManagerPolicy = new aws.iam.Policy(`secrets-policy-${environmentSuffix}`, {
      policy: pulumi.jsonStringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "secretsmanager:GetSecretValue"
            ],
            Resource: appSecrets.arn
          }
        ]
      }),
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-secrets-policy-${environmentSuffix}`
      }
    }, { parent: this });

    const secretsPolicyAttachment = new aws.iam.RolePolicyAttachment(`secrets-policy-attach-${environmentSuffix}`, {
      role: taskExecutionRole.name,
      policyArn: secretsManagerPolicy.arn
    }, { parent: this });

    // IAM Role for ECS Task
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
          image: "nginxdemos/hello:latest",  // Using public image temporarily
          essential: true,
          portMappings: [
            {
              containerPort: 80,
              protocol: "tcp",
              name: "app-port"
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
          secrets: [
            {
              name: "DATABASE_URL",
              valueFrom: pulumi.interpolate`${appSecrets.arn}:DATABASE_URL::`
            },
            {
              name: "API_KEY",
              valueFrom: pulumi.interpolate`${appSecrets.arn}:API_KEY::`
            },
            {
              name: "JWT_SECRET",
              valueFrom: pulumi.interpolate`${appSecrets.arn}:JWT_SECRET::`
            }
          ],
          environment: [
            {
              name: "NODE_ENV",
              value: environmentSuffix
            },
            {
              name: "PORT",
              value: "80"
            }
          ],
          healthCheck: {
            command: ["CMD-SHELL", "curl -f http://localhost/ || exit 1"],
            interval: 30,
            timeout: 5,
            retries: 3,
            startPeriod: 60
          }
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
      desiredCount: 2,
      enableExecuteCommand: true,
      networkConfiguration: {
        subnets: vpc.privateSubnetIds,
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false
      },
      loadBalancers: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: "app",
          containerPort: 80
        }
      ],
      serviceConnectConfiguration: {
        enabled: true,
        namespace: serviceDiscoveryNamespace.arn,
        services: [
          {
            portName: "app-port",
            discoveryName: "app",
            clientAlias: {
              port: 80,
              dnsName: "app"
            }
          }
        ]
      },
      deploymentCircuitBreaker: {
        enable: true,
        rollback: true
      },
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

    // Auto Scaling Target
    const scalingTarget = new aws.appautoscaling.Target(`scaling-target-${environmentSuffix}`, {
      maxCapacity: 10,
      minCapacity: 1,
      resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.name}`,
      scalableDimension: "ecs:service:DesiredCount",
      serviceNamespace: "ecs"
    }, { parent: this });

    // CPU-based Auto Scaling Policy
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

    // Memory-based Auto Scaling Policy
    const memoryScalingPolicy = new aws.appautoscaling.Policy(`mem-scaling-${environmentSuffix}`, {
      name: `ci-cd-pipeline-memory-scaling-${environmentSuffix}`,
      policyType: "TargetTrackingScaling",
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: "ECSServiceAverageMemoryUtilization"
        },
        targetValue: 80.0,
        scaleInCooldown: 300,
        scaleOutCooldown: 300
      }
    }, { parent: this });

    // CloudWatch Alarms for monitoring
    const highCpuAlarm = new aws.cloudwatch.MetricAlarm(`cpu-alarm-${environmentSuffix}`, {
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/ECS",
      period: 300,
      statistic: "Average",
      threshold: 85,
      alarmDescription: "This metric monitors ECS CPU utilization",
      dimensions: {
        ServiceName: ecsService.name,
        ClusterName: ecsCluster.name
      },
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-high-cpu-alarm-${environmentSuffix}`
      }
    }, { parent: this });

    // Expose outputs
    this.vpcId = vpc.vpcId;
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

