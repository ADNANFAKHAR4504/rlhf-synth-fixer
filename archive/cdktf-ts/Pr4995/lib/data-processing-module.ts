import { Construct } from 'constructs';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { TerraformOutput } from 'cdktf';

interface DataProcessingModuleProps {
  environmentSuffix: string;
  vpcId: string;
  privateSubnetIds: string[];
  ecsSecurityGroupId: string;
  kinesisStreamArn: string;
  efsFileSystemId: string;
  dbSecretArn: string;
  apiSecretArn: string;
}

export class DataProcessingModule extends Construct {
  public readonly ecsClusterName: string;
  public readonly ecsServiceArn: string;

  constructor(scope: Construct, id: string, props: DataProcessingModuleProps) {
    super(scope, id);

    const {
      environmentSuffix,
      privateSubnetIds,
      ecsSecurityGroupId,
      kinesisStreamArn,
      efsFileSystemId,
      dbSecretArn,
      apiSecretArn,
    } = props;

    // Create ECS Cluster
    const ecsCluster = new EcsCluster(this, 'ecs-cluster', {
      name: `manufacturing-cluster-${environmentSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `manufacturing-ecs-cluster-${environmentSuffix}`,
      },
    });

    // Create CloudWatch Log Group
    const logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: `/ecs/manufacturing-processor-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Name: `manufacturing-logs-${environmentSuffix}`,
      },
    });

    // Create IAM Role for ECS Task Execution
    const taskExecutionRole = new IamRole(this, 'task-execution-role', {
      name: `manufacturing-ecs-task-execution-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `manufacturing-task-execution-role-${environmentSuffix}`,
      },
    });

    new IamRolePolicyAttachment(this, 'task-execution-policy', {
      role: taskExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Create IAM Policy for Secrets Manager access
    const secretsPolicy = new IamPolicy(this, 'secrets-policy', {
      name: `manufacturing-secrets-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: [dbSecretArn, apiSecretArn],
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'secrets-policy-attachment', {
      role: taskExecutionRole.name,
      policyArn: secretsPolicy.arn,
    });

    // Create IAM Role for ECS Task
    const taskRole = new IamRole(this, 'task-role', {
      name: `manufacturing-ecs-task-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `manufacturing-task-role-${environmentSuffix}`,
      },
    });

    // Create IAM Policy for Kinesis access
    const kinesisPolicy = new IamPolicy(this, 'kinesis-policy', {
      name: `manufacturing-kinesis-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'kinesis:GetRecords',
              'kinesis:GetShardIterator',
              'kinesis:DescribeStream',
              'kinesis:ListStreams',
              'kinesis:ListShards',
            ],
            Resource: kinesisStreamArn,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'kinesis-policy-attachment', {
      role: taskRole.name,
      policyArn: kinesisPolicy.arn,
    });

    // Create ECS Task Definition
    const taskDefinition = new EcsTaskDefinition(this, 'task-definition', {
      family: `manufacturing-processor-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '2048',
      memory: '4096',
      executionRoleArn: taskExecutionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'processor',
          image: 'nginx:latest', // Replace with actual processing application image
          essential: true,
          portMappings: [
            {
              containerPort: 8080,
              protocol: 'tcp',
            },
          ],
          environment: [
            {
              name: 'KINESIS_STREAM_ARN',
              value: kinesisStreamArn,
            },
            {
              name: 'EFS_MOUNT_PATH',
              value: '/mnt/efs',
            },
          ],
          secrets: [
            {
              name: 'DB_SECRET',
              valueFrom: dbSecretArn,
            },
            {
              name: 'API_SECRET',
              valueFrom: apiSecretArn,
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup.name,
              'awslogs-region': 'eu-west-2',
              'awslogs-stream-prefix': 'ecs',
            },
          },
          mountPoints: [
            {
              sourceVolume: 'efs-storage',
              containerPath: '/mnt/efs',
              readOnly: false,
            },
          ],
        },
      ]),
      volume: [
        {
          name: 'efs-storage',
          efsVolumeConfiguration: {
            fileSystemId: efsFileSystemId,
            transitEncryption: 'ENABLED',
          },
        },
      ],
      tags: {
        Name: `manufacturing-task-def-${environmentSuffix}`,
      },
    });

    // Create ECS Service with blue-green deployment configuration
    const ecsService = new EcsService(this, 'ecs-service', {
      name: `manufacturing-processor-${environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      platformVersion: 'LATEST',
      deploymentController: {
        type: 'ECS', // Changed from CODE_DEPLOY to ECS for simplicity
      },
      networkConfiguration: {
        subnets: privateSubnetIds,
        securityGroups: [ecsSecurityGroupId],
        assignPublicIp: false,
      },
      deploymentMaximumPercent: 200,
      deploymentMinimumHealthyPercent: 100,
      enableExecuteCommand: true,
      tags: {
        Name: `manufacturing-ecs-service-${environmentSuffix}`,
      },
    });

    this.ecsClusterName = ecsCluster.name;
    this.ecsServiceArn = ecsService.id;

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecsCluster.name,
      description: 'Name of the ECS cluster',
    });

    new TerraformOutput(this, 'ecs-service-name', {
      value: ecsService.name,
      description: 'Name of the ECS service',
    });
  }
}
