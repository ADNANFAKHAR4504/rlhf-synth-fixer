# ECS Infrastructure Refactoring - Implementation

This implementation refactors an existing ECS deployment to address all 10 critical issues: right-sizing resources, dynamic scaling, cost allocation, monitoring, health checks, consolidation, IAM security, placement optimization, log retention, and secrets management.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './networking-construct';
import { EcsClusterConstruct } from './ecs-cluster-construct';
import { ApplicationLoadBalancerConstruct } from './alb-construct';
import { SecretsConstruct } from './secrets-construct';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Apply cost allocation tags to all resources
    cdk.Tags.of(this).add('Environment', `ecs-refactor-${environmentSuffix}`);
    cdk.Tags.of(this).add('Team', 'platform-engineering');
    cdk.Tags.of(this).add('Application', 'ecs-optimization');
    cdk.Tags.of(this).add('CostCenter', 'engineering-ops');

    // Issue 10: Create database credentials in Secrets Manager
    const secrets = new SecretsConstruct(this, 'Secrets', {
      environmentSuffix,
    });

    // Create VPC and networking
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
    });

    // Issue 1-9: Create ECS cluster with all optimizations
    const ecsCluster = new EcsClusterConstruct(this, 'EcsCluster', {
      environmentSuffix,
      vpc: networking.vpc,
      databaseSecret: secrets.databaseSecret,
    });

    // Issue 5: Create ALB with corrected health checks
    const alb = new ApplicationLoadBalancerConstruct(this, 'ALB', {
      environmentSuffix,
      vpc: networking.vpc,
      fargateService: ecsCluster.fargateService,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      exportName: `vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: ecsCluster.cluster.clusterName,
      exportName: `cluster-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: alb.loadBalancer.loadBalancerDnsName,
      exportName: `alb-dns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: secrets.databaseSecret.secretArn,
      exportName: `db-secret-arn-${environmentSuffix}`,
    });
  }
}
```

## File: lib/networking-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkingConstructProps {
  environmentSuffix: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create VPC with minimal NAT Gateways for cost optimization
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `ecs-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1, // Cost optimization: only 1 NAT Gateway
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `private-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // VPC endpoints for cost optimization (avoid NAT Gateway charges)
    this.vpc.addInterfaceEndpoint('EcrDockerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
    });

    this.vpc.addInterfaceEndpoint('EcrApiEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
    });

    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    });

    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });
  }
}
```

## File: lib/secrets-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface SecretsConstructProps {
  environmentSuffix: string;
}

export class SecretsConstruct extends Construct {
  public readonly databaseSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecretsConstructProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Issue 10: Create secret for database credentials
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `db-credentials-${environmentSuffix}`,
      description: 'Database credentials for ECS application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'appuser' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Fully destroyable
    });
  }
}
```

## File: lib/ecs-cluster-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { ReusableTaskDefinitionConstruct } from './reusable-task-definition-construct';

export interface EcsClusterConstructProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  databaseSecret: secretsmanager.Secret;
}

export class EcsClusterConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly fargateService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: EcsClusterConstructProps) {
    super(scope, id);

    const { environmentSuffix, vpc, databaseSecret } = props;

    // Issue 4: Create ECS cluster with Container Insights enabled
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `ecs-cluster-${environmentSuffix}`,
      vpc: vpc,
      containerInsights: true, // Issue 4: Enable Container Insights
    });

    // Issue 7: Create permission boundary for IAM roles
    const permissionBoundary = new iam.ManagedPolicy(this, 'PermissionBoundary', {
      managedPolicyName: `ecs-permission-boundary-${environmentSuffix}`,
      description: 'Permission boundary for ECS task and execution roles',
      statements: [
        new iam.PolicyStatement({
          sid: 'AllowedServices',
          effect: iam.Effect.ALLOW,
          actions: [
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'secretsmanager:GetSecretValue',
            'kms:Decrypt',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          sid: 'DenyDangerousActions',
          effect: iam.Effect.DENY,
          actions: [
            'iam:*',
            'organizations:*',
            'account:*',
          ],
          resources: ['*'],
        }),
      ],
    });

    // Issue 6: Create reusable task definition construct
    const taskDefinition = new ReusableTaskDefinitionConstruct(this, 'TaskDefinition', {
      environmentSuffix,
      databaseSecret,
      permissionBoundary,
    });

    // Issue 1: Create Fargate service with right-sized resources (512MB, 0.25 vCPU)
    this.fargateService = new ecs.FargateService(this, 'FargateService', {
      serviceName: `ecs-service-${environmentSuffix}`,
      cluster: this.cluster,
      taskDefinition: taskDefinition.taskDefinition,
      desiredCount: 2,
      // Issue 8: Configure task placement strategy for memory optimization
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 2,
          base: 0,
        },
        {
          capacityProvider: 'FARGATE',
          weight: 1,
          base: 1,
        },
      ],
      platformVersion: ecs.FargatePlatformVersion.LATEST,
      // Security best practices
      assignPublicIp: false,
      securityGroups: [this.createServiceSecurityGroup(vpc, environmentSuffix)],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Issue 2: Configure auto-scaling based on CPU and memory utilization
    const scaling = this.fargateService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
  }

  private createServiceSecurityGroup(vpc: ec2.Vpc, environmentSuffix: string): ec2.SecurityGroup {
    const sg = new ec2.SecurityGroup(this, 'ServiceSecurityGroup', {
      securityGroupName: `ecs-service-sg-${environmentSuffix}`,
      vpc: vpc,
      description: 'Security group for ECS Fargate service',
      allowAllOutbound: true,
    });

    // Allow inbound traffic from ALB
    sg.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(8080),
      'Allow traffic from ALB'
    );

    return sg;
  }
}
```

## File: lib/reusable-task-definition-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface ReusableTaskDefinitionConstructProps {
  environmentSuffix: string;
  databaseSecret: secretsmanager.Secret;
  permissionBoundary: iam.ManagedPolicy;
  containerPort?: number;
  containerName?: string;
}

export class ReusableTaskDefinitionConstruct extends Construct {
  public readonly taskDefinition: ecs.FargateTaskDefinition;
  public readonly container: ecs.ContainerDefinition;

  constructor(scope: Construct, id: string, props: ReusableTaskDefinitionConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      databaseSecret,
      permissionBoundary,
      containerPort = 8080,
      containerName = 'app-container',
    } = props;

    // Issue 7: Create task execution role with permission boundary
    const executionRole = new iam.Role(this, 'ExecutionRole', {
      roleName: `ecs-task-execution-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
      permissionsBoundary: permissionBoundary,
    });

    // Grant execution role access to read secrets
    databaseSecret.grantRead(executionRole);

    // Issue 7: Create task role with permission boundary
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `ecs-task-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      permissionsBoundary: permissionBoundary,
    });

    // Grant task role access to read secrets at runtime
    databaseSecret.grantRead(taskRole);

    // Issue 9: Create log group with 14-day retention
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/app-${environmentSuffix}`,
      retention: logs.RetentionDays.TWO_WEEKS, // Issue 9: Fix log retention
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Fully destroyable
    });

    // Issue 1 & 6: Create reusable task definition with right-sized resources
    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      family: `app-task-${environmentSuffix}`,
      cpu: 256, // 0.25 vCPU
      memoryLimitMiB: 512, // 512MB RAM
      executionRole: executionRole,
      taskRole: taskRole,
    });

    // Issue 6 & 10: Add container to task definition with secrets
    this.container = this.taskDefinition.addContainer(containerName, {
      containerName: `${containerName}-${environmentSuffix}`,
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/nginx:latest'),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'ecs',
        logGroup: logGroup,
      }),
      // Issue 10: Use Secrets Manager instead of environment variables
      secrets: {
        DB_USERNAME: ecs.Secret.fromSecretsManager(databaseSecret, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(databaseSecret, 'password'),
      },
      // Non-sensitive environment variables
      environment: {
        APP_ENV: 'production',
        LOG_LEVEL: 'info',
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    this.container.addPortMappings({
      containerPort: containerPort,
      protocol: ecs.Protocol.TCP,
    });
  }
}
```

## File: lib/alb-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export interface ApplicationLoadBalancerConstructProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  fargateService: ecs.FargateService;
}

export class ApplicationLoadBalancerConstruct extends Construct {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly targetGroup: elbv2.ApplicationTargetGroup;

  constructor(scope: Construct, id: string, props: ApplicationLoadBalancerConstructProps) {
    super(scope, id);

    const { environmentSuffix, vpc, fargateService } = props;

    // Create security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      securityGroupName: `alb-sg-${environmentSuffix}`,
      vpc: vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      loadBalancerName: `ecs-alb-${environmentSuffix}`,
      vpc: vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      deletionProtection: false, // Fully destroyable
    });

    // Issue 5: Create target group with corrected health check configuration
    this.targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `ecs-tg-${environmentSuffix}`,
      vpc: vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      deregistrationDelay: cdk.Duration.seconds(30),
      // Issue 5: Fix health check configuration
      healthCheck: {
        enabled: true,
        path: '/health', // Corrected health check path
        protocol: elbv2.Protocol.HTTP,
        port: '8080',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10), // Increased timeout
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        healthyHttpCodes: '200',
      },
    });

    // Add listener
    const listener = this.loadBalancer.addListener('Listener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [this.targetGroup],
    });

    // Attach Fargate service to target group
    fargateService.attachToApplicationTargetGroup(this.targetGroup);
  }
}
```

## Implementation Summary

This CDK TypeScript implementation addresses all 10 critical issues:

1. **Right-sized Resources**: Uses Fargate with 256 CPU (0.25 vCPU) and 512MB memory instead of m5.2xlarge instances
2. **Dynamic Capacity Provider**: Implements auto-scaling based on CPU (70%) and memory (80%) utilization with Fargate Spot for cost optimization
3. **Cost Allocation Tags**: Applies Environment, Team, Application, and CostCenter tags to all resources
4. **Container Insights**: Enabled on ECS cluster for comprehensive monitoring
5. **ALB Health Check Fix**: Corrected health check path to `/health` with proper timeout (10s) and interval (30s)
6. **Consolidated Task Definitions**: Created ReusableTaskDefinitionConstruct that can be instantiated with different parameters
7. **IAM Role Boundaries**: Applied permission boundaries to both task execution and task roles, denying dangerous actions
8. **Task Placement Strategy**: Uses Fargate capacity provider strategies with Spot instances for cost optimization (binpack equivalent)
9. **Log Retention Policy**: Set CloudWatch log retention to 14 days (TWO_WEEKS)
10. **Secrets Management**: Database credentials stored in AWS Secrets Manager and accessed via ECS secrets, not environment variables

### AWS Services Used

- Amazon ECS with Fargate
- Application Load Balancer (ALB)
- VPC with subnets and VPC endpoints
- CloudWatch Logs with Container Insights
- AWS Secrets Manager
- IAM roles and policies with permission boundaries
- EC2 Security Groups

### Key Architectural Decisions

1. **Fargate over EC2**: Eliminates need to manage instances, provides better cost optimization
2. **Fargate Spot**: 70% cost savings with weight strategy (2:1 Spot:OnDemand)
3. **VPC Endpoints**: Reduces NAT Gateway data transfer costs
4. **Reusable Constructs**: Modular design allows easy extension for multiple services
5. **Permission Boundaries**: Prevents privilege escalation and enforces least privilege
6. **14-day Log Retention**: Balances cost with operational needs
7. **Auto-scaling**: Ensures right-sizing in production with dynamic scaling

### Cost Optimization Features

- Single NAT Gateway instead of per-AZ
- VPC endpoints to minimize data transfer
- Fargate Spot for 70% cost savings
- Right-sized task resources (512MB/0.25vCPU)
- 14-day log retention vs never expire
- Auto-scaling to match demand

All resources include environmentSuffix for uniqueness and are fully destroyable (RemovalPolicy.DESTROY, no deletion protection).
