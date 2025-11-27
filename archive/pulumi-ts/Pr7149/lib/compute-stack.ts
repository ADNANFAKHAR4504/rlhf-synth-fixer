import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface ComputeStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string>[];
  privateSubnetIds: pulumi.Input<string>[];
  ecsTaskRole: aws.iam.Role;
  ecsExecutionRole: aws.iam.Role;
  logGroupName: pulumi.Input<string>;
  databaseEndpoint: pulumi.Input<string>;
  staticBucketName: pulumi.Input<string>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;

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
      publicSubnetIds,
      privateSubnetIds,
      ecsTaskRole,
      ecsExecutionRole,
      logGroupName,
      databaseEndpoint,
      staticBucketName,
    } = args;

    // Security group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-alb-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from Internet',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from Internet',
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
          Name: `payment-alb-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Security group for ECS tasks
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-ecs-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3000,
            toPort: 3000,
            securityGroups: [albSecurityGroup.id],
            description: 'HTTP from ALB',
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
          Name: `payment-ecs-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `payment-alb-${environmentSuffix}`,
      {
        name: `payment-alb-${environmentSuffix}`,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnetIds,
        enableDeletionProtection: false,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-alb-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Target group
    const targetGroup = new aws.lb.TargetGroup(
      `payment-tg-${environmentSuffix}`,
      {
        name: `payment-tg-${environmentSuffix}`,
        port: 3000,
        protocol: 'HTTP',
        vpcId: vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        deregistrationDelay: 30,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-tg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ALB listener
    const listener = new aws.lb.Listener(
      `payment-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // WAF Web ACL
    const wafWebAcl = new aws.wafv2.WebAcl(
      `payment-waf-${environmentSuffix}`,
      {
        name: `payment-waf-${environmentSuffix}`,
        scope: 'REGIONAL',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'BlockSQLInjection',
            priority: 1,
            statement: {
              sqliMatchStatement: {
                fieldToMatch: {
                  body: {
                    oversizeHandling: 'CONTINUE',
                  },
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                  {
                    priority: 1,
                    type: 'HTML_ENTITY_DECODE',
                  },
                ],
              },
            },
            action: {
              block: {},
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'BlockSQLInjection',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'BlockXSS',
            priority: 2,
            statement: {
              xssMatchStatement: {
                fieldToMatch: {
                  body: {
                    oversizeHandling: 'CONTINUE',
                  },
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                  {
                    priority: 1,
                    type: 'HTML_ENTITY_DECODE',
                  },
                ],
              },
            },
            action: {
              block: {},
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'BlockXSS',
              sampledRequestsEnabled: true,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `payment-waf-${environmentSuffix}`,
          sampledRequestsEnabled: true,
        },
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-waf-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Associate WAF with ALB
    new aws.wafv2.WebAclAssociation(
      `payment-waf-assoc-${environmentSuffix}`,
      {
        resourceArn: alb.arn,
        webAclArn: wafWebAcl.arn,
      },
      { parent: this }
    );

    // ECS Cluster
    const cluster = new aws.ecs.Cluster(
      `payment-cluster-${environmentSuffix}`,
      {
        name: `payment-cluster-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-cluster-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ECS Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `payment-task-${environmentSuffix}`,
      {
        family: `payment-app-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '1024',
        memory: '2048',
        executionRoleArn: ecsExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: pulumi
          .all([logGroupName, databaseEndpoint, staticBucketName])
          .apply(([logGroup, dbEndpoint, bucket]) =>
            JSON.stringify([
              {
                name: 'payment-app',
                // NOTE: This is a placeholder image for infrastructure provisioning.
                // Replace with actual payment application image from ECR in production:
                // image: '${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/payment-app:latest'
                image: 'nginx:latest',
                essential: true,
                readonlyRootFilesystem: true,
                portMappings: [
                  {
                    containerPort: 3000,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  {
                    name: 'DB_ENDPOINT',
                    value: dbEndpoint,
                  },
                  {
                    name: 'STATIC_BUCKET',
                    value: bucket,
                  },
                  {
                    name: 'NODE_ENV',
                    value: 'production',
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroup,
                    'awslogs-region': 'us-east-1',
                    'awslogs-stream-prefix': 'ecs',
                  },
                },
                mountPoints: [
                  {
                    sourceVolume: 'tmp',
                    containerPath: '/tmp',
                    readOnly: false,
                  },
                ],
              },
            ])
          ),
        volumes: [
          {
            name: 'tmp',
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-task-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ECS Service
    const service = new aws.ecs.Service(
      `payment-service-${environmentSuffix}`,
      {
        name: `payment-service-${environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          assignPublicIp: false,
          subnets: privateSubnetIds,
          securityGroups: [ecsSecurityGroup.id],
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: 'payment-app',
            containerPort: 3000,
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-service-${environmentSuffix}`,
        })),
      },
      { parent: this, dependsOn: [listener] }
    );

    this.albDnsName = alb.dnsName;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      albArn: alb.arn,
      clusterName: cluster.name,
      serviceName: service.name,
    });
  }
}
