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

  constructor(
    scope: Construct,
    id: string,
    props: ReusableTaskDefinitionConstructProps
  ) {
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
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
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
    this.taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TaskDefinition',
      {
        family: `app-task-${environmentSuffix}`,
        cpu: 256, // 0.25 vCPU
        memoryLimitMiB: 512, // 512MB RAM
        executionRole: executionRole,
        taskRole: taskRole,
      }
    );

    // Issue 6 & 10: Add container to task definition with secrets
    this.container = this.taskDefinition.addContainer(containerName, {
      containerName: `${containerName}-${environmentSuffix}`,
      image: ecs.ContainerImage.fromRegistry(
        'public.ecr.aws/docker/library/nginx:latest'
      ),
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
        command: [
          'CMD-SHELL',
          'curl -f http://localhost:8080/health || exit 1',
        ],
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
