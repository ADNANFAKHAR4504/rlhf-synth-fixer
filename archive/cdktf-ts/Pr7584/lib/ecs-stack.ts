import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { ElasticacheReplicationGroup } from '@cdktf/provider-aws/lib/elasticache-replication-group';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { Construct } from 'constructs';

export interface EcsStackProps {
  environmentSuffix: string;
  region: string;
  publicSubnet1: Subnet;
  publicSubnet2: Subnet;
  securityGroup: SecurityGroup;
  taskRole: IamRole;
  executionRole: IamRole;
  ecsLogGroup: CloudwatchLogGroup;
  rdsCluster: RdsCluster;
  redisCluster: ElasticacheReplicationGroup;
  dbSecret: SecretsmanagerSecret;
}

export class EcsStack extends Construct {
  public readonly cluster: EcsCluster;
  public readonly taskDefinition: EcsTaskDefinition;
  public readonly service: EcsService;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      region,
      publicSubnet1,
      publicSubnet2,
      securityGroup,
      taskRole,
      executionRole,
      ecsLogGroup,
      rdsCluster,
      redisCluster,
      dbSecret,
    } = props;

    // Create ECS Cluster
    this.cluster = new EcsCluster(this, 'ecs-cluster', {
      name: `assessment-cluster-${environmentSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `assessment-ecs-cluster-${environmentSuffix}`,
      },
    });

    // Create ECS Task Definition
    this.taskDefinition = new EcsTaskDefinition(this, 'task-definition', {
      family: `assessment-task-${environmentSuffix}`,
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      cpu: '256',
      memory: '512',
      taskRoleArn: taskRole.arn,
      executionRoleArn: executionRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: `assessment-processor-${environmentSuffix}`,
          image: 'nginx:latest', // Replace with actual assessment processing image
          essential: true,
          portMappings: [
            {
              containerPort: 80,
              protocol: 'tcp',
            },
          ],
          environment: [
            {
              name: 'AWS_REGION',
              value: region,
            },
            {
              name: 'ENVIRONMENT',
              value: environmentSuffix,
            },
            {
              name: 'DB_HOST',
              value: rdsCluster.endpoint,
            },
            {
              name: 'REDIS_HOST',
              value: redisCluster.configurationEndpointAddress,
            },
          ],
          secrets: [
            {
              name: 'DB_SECRET_ARN',
              valueFrom: dbSecret.arn,
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': ecsLogGroup.name,
              'awslogs-region': region,
              'awslogs-stream-prefix': 'ecs',
            },
          },
        },
      ]),
      tags: {
        Name: `assessment-task-def-${environmentSuffix}`,
      },
    });

    // Create ECS Service
    this.service = new EcsService(this, 'ecs-service', {
      name: `assessment-service-${environmentSuffix}`,
      cluster: this.cluster.id,
      taskDefinition: this.taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: [publicSubnet1.id, publicSubnet2.id],
        securityGroups: [securityGroup.id],
        assignPublicIp: true,
      },
      tags: {
        Name: `assessment-ecs-service-${environmentSuffix}`,
      },
    });
  }
}
