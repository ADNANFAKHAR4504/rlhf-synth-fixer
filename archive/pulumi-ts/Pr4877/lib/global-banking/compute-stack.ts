/**
 * compute-stack.ts - FIXED VERSION
 *
 * ECS Fargate cluster with App Mesh service mesh
 * Handles microservices deployment with auto-scaling
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ComputeStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  kmsKeyId: pulumi.Input<string>;
  kmsKeyArn: pulumi.Input<string>;
  regions: {
    primary: string;
    replicas: string[];
  };
  enableAppMesh: boolean;
  enableAutoScaling: boolean;
  secretsManagerArns: pulumi.Output<{ database: string; api: string }>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly ecsClusterArn: pulumi.Output<string>;
  public readonly ecsClusterName: pulumi.Output<string>;
  public readonly appMeshName: pulumi.Output<string>;
  public readonly ecsSecurityGroupId: pulumi.Output<string>;
  public readonly taskExecutionRoleArn: pulumi.Output<string>;
  public readonly taskRoleArn: pulumi.Output<string>;

  // Store virtual services to reference later
  private virtualServices: Map<string, aws.appmesh.VirtualService> = new Map();

  constructor(
    name: string,
    args: ComputeStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:compute:ComputeStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      vpcId,
      privateSubnetIds,
      kmsKeyArn,
      enableAppMesh,
      enableAutoScaling,
      secretsManagerArns,
    } = args;

    // Security Group for ECS Tasks
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-ecs-sg`,
      {
        vpcId: vpcId,
        description: 'Security group for ECS Fargate tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            cidrBlocks: ['10.29.0.0/16'],
            description: 'Allow traffic from VPC',
          },
          {
            protocol: 'tcp',
            fromPort: 9901,
            toPort: 9901,
            cidrBlocks: ['10.29.0.0/16'],
            description: 'Envoy admin interface',
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
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `ecs-tasks-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // CloudWatch Log Group for ECS (create BEFORE cluster)
    const ecsLogGroup = new aws.cloudwatch.LogGroup(
      `${name}-log-group`,
      {
        name: `/ecs/banking-${environmentSuffix}`,
        retentionInDays: 90,
        kmsKeyId: kmsKeyArn,
        tags: tags,
      },
      { parent: this }
    );

    // Debug log group name to verify correctness
    pulumi.output(ecsLogGroup.name).apply(name => {
      console.log(`ECS Log Group Name: ${name}`);
      return name;
    });

    // ECS Cluster
    const ecsCluster = new aws.ecs.Cluster(
      `${name}-cluster`,
      {
        name: `banking-cluster-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        configuration: {
          executeCommandConfiguration: {
            kmsKeyId: kmsKeyArn,
            logging: 'OVERRIDE',
            logConfiguration: {
              cloudWatchLogGroupName: ecsLogGroup.name,
            },
          },
        },
        tags: tags,
      },
      { parent: this, dependsOn: [ecsLogGroup] }
    );

    // IAM Role for ECS Task Execution
    const taskExecutionRole = new aws.iam.Role(
      `${name}-task-execution-role`,
      {
        name: `ecs-task-execution-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
        ],
        tags: tags,
      },
      { parent: this }
    );

    // Grant access to Secrets Manager and KMS
    new aws.iam.RolePolicy(
      `${name}-secrets-policy`,
      {
        role: taskExecutionRole.id,
        policy: pulumi
          .all([secretsManagerArns, kmsKeyArn])
          .apply(([arns, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                  ],
                  Resource: Object.values(arns),
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:DescribeKey'],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // IAM Role for ECS Tasks
    const taskRole = new aws.iam.Role(
      `${name}-task-role`,
      {
        name: `ecs-task-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Grant task permissions
    new aws.iam.RolePolicy(
      `${name}-task-policy`,
      {
        role: taskRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'sqs:SendMessage',
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['kinesis:PutRecord', 'kinesis:PutRecords'],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // App Mesh (if enabled)
    let appMesh: aws.appmesh.Mesh | undefined;
    let virtualGateway: aws.appmesh.VirtualGateway | undefined;
    let appMeshName: pulumi.Output<string>;

    if (enableAppMesh) {
      appMesh = new aws.appmesh.Mesh(
        `${name}-mesh`,
        {
          name: `banking-mesh-${environmentSuffix}`,
          spec: {
            egressFilter: {
              type: 'ALLOW_ALL',
            },
          },
          tags: tags,
        },
        { parent: this }
      );
      appMeshName = appMesh.name;

      // Create virtual gateway for ingress
      virtualGateway = new aws.appmesh.VirtualGateway(
        `${name}-virtual-gateway`,
        {
          name: `banking-gateway-${environmentSuffix}`,
          meshName: appMesh.name,
          spec: {
            listeners: [
              {
                portMapping: {
                  port: 8080,
                  protocol: 'http',
                },
              },
            ],
          },
          tags: tags,
        },
        { parent: this }
      );

      //  Gateway Route will be created AFTER microservices
    } else {
      appMeshName = pulumi.output(`no-mesh-${environmentSuffix}`);
    }

    // Microservice: Transaction Service
    this.createMicroservice('transaction-service', {
      environmentSuffix,
      ecsCluster,
      taskExecutionRole,
      taskRole,
      ecsSecurityGroup,
      privateSubnetIds,
      ecsLogGroup,
      appMesh,
      tags,
      containerPort: 8080,
      cpu: 1024,
      memory: 2048,
      desiredCount: 3,
      enableAutoScaling,
    });

    // Microservice: Account Service
    this.createMicroservice('account-service', {
      environmentSuffix,
      ecsCluster,
      taskExecutionRole,
      taskRole,
      ecsSecurityGroup,
      privateSubnetIds,
      ecsLogGroup,
      appMesh,
      tags,
      containerPort: 8080,
      cpu: 512,
      memory: 1024,
      desiredCount: 2,
      enableAutoScaling,
    });

    // Microservice: Fraud Detection Service
    this.createMicroservice('fraud-detection-service', {
      environmentSuffix,
      ecsCluster,
      taskExecutionRole,
      taskRole,
      ecsSecurityGroup,
      privateSubnetIds,
      ecsLogGroup,
      appMesh,
      tags,
      containerPort: 8080,
      cpu: 2048,
      memory: 4096,
      desiredCount: 2,
      enableAutoScaling,
    });

    //  create Gateway Route AFTER all microservices (and their virtual services) exist
    if (enableAppMesh && appMesh && virtualGateway) {
      const transactionServiceVirtualService = this.virtualServices.get(
        'transaction-service'
      );

      new aws.appmesh.GatewayRoute(
        `${name}-gateway-route`,
        {
          name: `banking-route-${environmentSuffix}`,
          meshName: appMesh.name,
          virtualGatewayName: virtualGateway.name,
          spec: {
            httpRoute: {
              match: {
                prefix: '/',
              },
              action: {
                target: {
                  virtualService: {
                    virtualServiceName: pulumi.interpolate`transaction-service.${appMesh.name}`,
                  },
                },
              },
            },
          },
          tags: tags,
        },
        {
          parent: this,
          dependsOn: transactionServiceVirtualService
            ? [transactionServiceVirtualService]
            : [],
        }
      );
    }

    //  Outputs
    this.ecsClusterArn = ecsCluster.arn;
    this.ecsClusterName = ecsCluster.name;
    this.appMeshName = appMeshName;
    this.ecsSecurityGroupId = ecsSecurityGroup.id;
    this.taskExecutionRoleArn = taskExecutionRole.arn;
    this.taskRoleArn = taskRole.arn;

    this.registerOutputs({
      ecsClusterArn: this.ecsClusterArn,
      ecsClusterName: this.ecsClusterName,
      appMeshName: this.appMeshName,
      ecsSecurityGroupId: this.ecsSecurityGroupId,
      taskExecutionRoleArn: this.taskExecutionRoleArn,
      taskRoleArn: this.taskRoleArn,
    });
  }

  private createMicroservice(
    serviceName: string,
    config: {
      environmentSuffix: string;
      ecsCluster: aws.ecs.Cluster;
      taskExecutionRole: aws.iam.Role;
      taskRole: aws.iam.Role;
      ecsSecurityGroup: aws.ec2.SecurityGroup;
      privateSubnetIds: pulumi.Input<string[]>;
      ecsLogGroup: aws.cloudwatch.LogGroup;
      appMesh?: aws.appmesh.Mesh;
      tags: pulumi.Input<{ [key: string]: string }>;
      containerPort: number;
      cpu: number;
      memory: number;
      desiredCount: number;
      enableAutoScaling: boolean;
    }
  ) {
    const {
      environmentSuffix,
      ecsCluster,
      taskExecutionRole,
      taskRole,
      ecsSecurityGroup,
      privateSubnetIds,
      ecsLogGroup,
      appMesh,
      tags,
      containerPort,
      cpu,
      memory,
      desiredCount,
      enableAutoScaling,
    } = config;

    //  Resolve all outputs first before creating container definitions JSON
    const containerDefinitionsJson = pulumi
      .all([
        ecsLogGroup.name,
        aws.getRegionOutput().name,
        appMesh ? appMesh.name : pulumi.output(''),
        aws.getCallerIdentityOutput().accountId,
      ])
      .apply(([logGroupName, region, meshName, accountId]) => {
        const containerDefinitions: Record<string, unknown>[] = [
          {
            name: serviceName,
            image: 'public.ecr.aws/nginx/nginx:latest',
            cpu,
            memory,
            essential: true,
            portMappings: [
              {
                containerPort,
                protocol: 'tcp',
              },
            ],
            environment: [
              {
                name: 'SERVICE_NAME',
                value: serviceName,
              },
              {
                name: 'ENVIRONMENT',
                value: environmentSuffix,
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroupName,
                'awslogs-region': region,
                'awslogs-stream-prefix': serviceName,
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
        ];

        // Add Envoy sidecar if App Mesh is enabled
        if (appMesh && meshName) {
          containerDefinitions.push({
            name: 'envoy',
            image: 'public.ecr.aws/appmesh/aws-appmesh-envoy:v1.27.0.0-prod',
            essential: true,
            user: '1337',
            environment: [
              {
                name: 'APPMESH_RESOURCE_ARN',
                value: `arn:aws:appmesh:${region}:${accountId}:mesh/${meshName}/virtualNode/${serviceName}-vnode`,
              },
            ],
            healthCheck: {
              command: [
                'CMD-SHELL',
                'curl -s http://localhost:9901/server_info | grep state | grep -q LIVE',
              ],
              interval: 5,
              timeout: 2,
              retries: 3,
              startPeriod: 10,
            },
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroupName,
                'awslogs-region': region,
                'awslogs-stream-prefix': `${serviceName}-envoy`,
              },
            },
          });
        }

        return JSON.stringify(containerDefinitions);
      });

    // Create Virtual Node and Service if App Mesh is enabled
    if (appMesh) {
      const virtualNode = new aws.appmesh.VirtualNode(
        `${serviceName}-vnode`,
        {
          name: `${serviceName}-vnode`,
          meshName: appMesh.name,
          spec: {
            listeners: [
              {
                portMapping: {
                  port: containerPort,
                  protocol: 'http',
                },
                healthCheck: {
                  protocol: 'http',
                  path: '/health',
                  healthyThreshold: 2,
                  unhealthyThreshold: 2,
                  timeoutMillis: 2000,
                  intervalMillis: 5000,
                },
              },
            ],
            serviceDiscovery: {
              awsCloudMap: {
                namespaceName: `banking-${environmentSuffix}.local`,
                serviceName: serviceName,
              },
            },
          },
          tags: tags,
        },
        { parent: this }
      );

      // Create Virtual Service and STORE it for later reference
      const virtualService = new aws.appmesh.VirtualService(
        `${serviceName}-vsvc`,
        {
          name: pulumi.interpolate`${serviceName}.${appMesh.name}`,
          meshName: appMesh.name,
          spec: {
            provider: {
              virtualNode: {
                virtualNodeName: virtualNode.name,
              },
            },
          },
          tags: tags,
        },
        { parent: this }
      );

      //  Store the virtual service so Gateway Route can depend on it
      this.virtualServices.set(serviceName, virtualService);
    }

    const taskDefinition = new aws.ecs.TaskDefinition(
      `${serviceName}-task`,
      {
        family: `${serviceName}-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: cpu.toString(),
        memory: memory.toString(),
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: containerDefinitionsJson,
        proxyConfiguration: appMesh
          ? {
              type: 'APPMESH',
              containerName: 'envoy',
              properties: {
                AppPorts: containerPort.toString(),
                EgressIgnoredIPs: '169.254.170.2,169.254.169.254',
                IgnoredUID: '1337',
                ProxyEgressPort: '15001',
                ProxyIngressPort: '15000',
              },
            }
          : undefined,
        tags: tags,
      },
      { parent: this, dependsOn: [ecsLogGroup] }
    );

    // ECS Service
    const service = new aws.ecs.Service(
      `${serviceName}-svc`,
      {
        name: `${serviceName}-${environmentSuffix}`,
        cluster: ecsCluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: privateSubnetIds,
          securityGroups: [ecsSecurityGroup.id],
          assignPublicIp: false,
        },
        enableExecuteCommand: true,
        healthCheckGracePeriodSeconds: 60,
        tags: tags,
      },
      { parent: this }
    );

    // Auto Scaling
    if (enableAutoScaling) {
      const scalingTarget = new aws.appautoscaling.Target(
        `${serviceName}-scaling-target`,
        {
          serviceNamespace: 'ecs',
          resourceId: pulumi.interpolate`service/${ecsCluster.name}/${service.name}`,
          scalableDimension: 'ecs:service:DesiredCount',
          minCapacity: desiredCount,
          maxCapacity: desiredCount * 3,
        },
        { parent: this }
      );

      // CPU-based scaling
      new aws.appautoscaling.Policy(
        `${serviceName}-cpu-scaling`,
        {
          name: `${serviceName}-cpu-${environmentSuffix}`,
          serviceNamespace: scalingTarget.serviceNamespace,
          resourceId: scalingTarget.resourceId,
          scalableDimension: scalingTarget.scalableDimension,
          policyType: 'TargetTrackingScaling',
          targetTrackingScalingPolicyConfiguration: {
            targetValue: 70,
            predefinedMetricSpecification: {
              predefinedMetricType: 'ECSServiceAverageCPUUtilization',
            },
            scaleInCooldown: 300,
            scaleOutCooldown: 60,
          },
        },
        { parent: this }
      );

      // Memory-based scaling
      new aws.appautoscaling.Policy(
        `${serviceName}-memory-scaling`,
        {
          name: `${serviceName}-memory-${environmentSuffix}`,
          serviceNamespace: scalingTarget.serviceNamespace,
          resourceId: scalingTarget.resourceId,
          scalableDimension: scalingTarget.scalableDimension,
          policyType: 'TargetTrackingScaling',
          targetTrackingScalingPolicyConfiguration: {
            targetValue: 80,
            predefinedMetricSpecification: {
              predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
            },
            scaleInCooldown: 300,
            scaleOutCooldown: 60,
          },
        },
        { parent: this }
      );
    }

    return { taskDefinition, service };
  }
}
