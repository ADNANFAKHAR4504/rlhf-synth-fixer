import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
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
    const permissionBoundary = new iam.ManagedPolicy(
      this,
      'PermissionBoundary',
      {
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
            actions: ['iam:*', 'organizations:*', 'account:*'],
            resources: ['*'],
          }),
        ],
      }
    );

    // Issue 6: Create reusable task definition construct
    const taskDefinition = new ReusableTaskDefinitionConstruct(
      this,
      'TaskDefinition',
      {
        environmentSuffix,
        databaseSecret,
        permissionBoundary,
      }
    );

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

  private createServiceSecurityGroup(
    vpc: ec2.Vpc,
    environmentSuffix: string
  ): ec2.SecurityGroup {
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
