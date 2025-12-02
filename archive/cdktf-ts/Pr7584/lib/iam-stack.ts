import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { Construct } from 'constructs';

export interface IamStackProps {
  environmentSuffix: string;
  dbSecret: SecretsmanagerSecret;
  ecsLogGroup: CloudwatchLogGroup;
  auditLogGroup: CloudwatchLogGroup;
}

export class IamStack extends Construct {
  public readonly taskRole: IamRole;
  public readonly executionRole: IamRole;

  constructor(scope: Construct, id: string, props: IamStackProps) {
    super(scope, id);

    const { environmentSuffix, dbSecret, ecsLogGroup, auditLogGroup } = props;

    // ECS Task Execution Role (for pulling images and writing logs)
    this.executionRole = new IamRole(this, 'ecs-execution-role', {
      name: `assessment-ecs-execution-${environmentSuffix}`,
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
      tags: {
        Name: `assessment-ecs-execution-role-${environmentSuffix}`,
      },
    });

    // Attach AWS managed policy for ECS task execution
    new IamRolePolicyAttachment(this, 'ecs-execution-policy', {
      role: this.executionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // ECS Task Role (for application permissions)
    this.taskRole = new IamRole(this, 'ecs-task-role', {
      name: `assessment-ecs-task-${environmentSuffix}`,
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
      tags: {
        Name: `assessment-ecs-task-role-${environmentSuffix}`,
      },
    });

    // Create policy for accessing Secrets Manager and CloudWatch
    const taskPolicy = new IamPolicy(this, 'ecs-task-policy', {
      name: `assessment-ecs-task-policy-${environmentSuffix}`,
      description:
        'Policy for ECS tasks to access Secrets Manager and CloudWatch',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: dbSecret.arn,
          },
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: [ecsLogGroup.arn, auditLogGroup.arn],
          },
        ],
      }),
      tags: {
        Name: `assessment-ecs-task-policy-${environmentSuffix}`,
      },
    });

    // Attach custom policy to task role
    new IamRolePolicyAttachment(this, 'task-policy-attachment', {
      role: this.taskRole.name,
      policyArn: taskPolicy.arn,
    });
  }
}
