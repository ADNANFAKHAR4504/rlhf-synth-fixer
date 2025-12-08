import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { SfnStateMachine } from '@cdktf/provider-aws/lib/sfn-state-machine';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';

// Generate unique suffix to avoid resource naming conflicts
const uniqueSuffix = 'q8t3';

export interface FailoverOrchestrationProps {
  provider: AwsProvider;
  environmentSuffix: string;
  primaryClusterIdentifier: string;
  secondaryClusterIdentifier: string;
  hostedZoneId: string;
  primaryHealthCheckId: string;
  secondaryHealthCheckId: string;
  failoverValidatorArn: string;
}

export class FailoverOrchestration extends Construct {
  public readonly stateMachine: SfnStateMachine;

  constructor(scope: Construct, id: string, props: FailoverOrchestrationProps) {
    super(scope, id);

    const {
      provider,
      environmentSuffix,
      primaryClusterIdentifier,
      secondaryClusterIdentifier,
      hostedZoneId,
      primaryHealthCheckId,
      failoverValidatorArn,
    } = props;

    // Step Functions Execution Role
    const stepFunctionsRole = new IamRole(this, 'step-functions-role', {
      provider,
      name: `step-functions-failover-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'states.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `step-functions-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicy(this, 'step-functions-policy', {
      provider,
      role: stepFunctionsRole.id,
      name: 'StepFunctionsFailoverPolicy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'rds:FailoverGlobalCluster',
              'rds:DescribeGlobalClusters',
              'rds:DescribeDBClusters',
              'rds:ModifyDBCluster',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'route53:ChangeResourceRecordSets',
              'route53:GetHealthCheckStatus',
              'route53:UpdateHealthCheck',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['lambda:InvokeFunction'],
            Resource: failoverValidatorArn,
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // State Machine Definition
    const stateMachineDefinition = {
      Comment: 'Failover orchestration for multi-region disaster recovery',
      StartAt: 'CheckPrimaryHealth',
      States: {
        CheckPrimaryHealth: {
          Type: 'Task',
          Resource: 'arn:aws:states:::aws-sdk:route53:getHealthCheckStatus',
          Parameters: {
            HealthCheckId: primaryHealthCheckId,
          },
          ResultPath: '$.primaryHealth',
          Next: 'IsPrimaryHealthy',
          Catch: [
            {
              ErrorEquals: ['States.ALL'],
              Next: 'InitiateFailover',
              ResultPath: '$.error',
            },
          ],
        },
        IsPrimaryHealthy: {
          Type: 'Choice',
          Choices: [
            {
              Variable:
                '$.primaryHealth.HealthCheckObservations[0].StatusReport.Status',
              StringEquals: 'Success',
              Next: 'PrimaryIsHealthy',
            },
          ],
          Default: 'InitiateFailover',
        },
        PrimaryIsHealthy: {
          Type: 'Succeed',
        },
        InitiateFailover: {
          Type: 'Parallel',
          Branches: [
            {
              StartAt: 'PromoteSecondaryCluster',
              States: {
                PromoteSecondaryCluster: {
                  Type: 'Task',
                  Resource:
                    'arn:aws:states:::aws-sdk:rds:failoverGlobalCluster',
                  Parameters: {
                    GlobalClusterIdentifier: `${primaryClusterIdentifier}`,
                    TargetDbClusterIdentifier: secondaryClusterIdentifier,
                  },
                  ResultPath: '$.rdsPromotion',
                  End: true,
                  Retry: [
                    {
                      ErrorEquals: ['States.ALL'],
                      IntervalSeconds: 10,
                      MaxAttempts: 3,
                      BackoffRate: 2,
                    },
                  ],
                },
              },
            },
            {
              StartAt: 'NotifyFailoverStart',
              States: {
                NotifyFailoverStart: {
                  Type: 'Task',
                  Resource: 'arn:aws:states:::sns:publish',
                  Parameters: {
                    TopicArn: `arn:aws:sns:us-east-1:*:trading-alarms-primary-${environmentSuffix}`,
                    Message: 'Failover initiated - promoting secondary cluster',
                    Subject: 'DR Failover Started',
                  },
                  End: true,
                },
              },
            },
          ],
          Next: 'WaitForPromotion',
          ResultPath: '$.parallelResults',
        },
        WaitForPromotion: {
          Type: 'Wait',
          Seconds: 30,
          Next: 'VerifySecondaryPromotion',
        },
        VerifySecondaryPromotion: {
          Type: 'Task',
          Resource: 'arn:aws:states:::aws-sdk:rds:describeDBClusters',
          Parameters: {
            DbClusterIdentifier: secondaryClusterIdentifier,
          },
          ResultPath: '$.secondaryClusterStatus',
          Next: 'IsSecondaryWritable',
          Retry: [
            {
              ErrorEquals: ['States.ALL'],
              IntervalSeconds: 5,
              MaxAttempts: 5,
              BackoffRate: 1.5,
            },
          ],
        },
        IsSecondaryWritable: {
          Type: 'Choice',
          Choices: [
            {
              Variable: '$.secondaryClusterStatus.DbClusters[0].Status',
              StringEquals: 'available',
              Next: 'UpdateRoute53',
            },
          ],
          Default: 'WaitForPromotion',
        },
        UpdateRoute53: {
          Type: 'Task',
          Resource: 'arn:aws:states:::aws-sdk:route53:changeResourceRecordSets',
          Parameters: {
            HostedZoneId: hostedZoneId,
            ChangeBatch: {
              Changes: [
                {
                  Action: 'UPSERT',
                  ResourceRecordSet: {
                    Name: 'api.trading-platform.example.com',
                    Type: 'CNAME',
                    SetIdentifier: 'secondary',
                    Failover: 'PRIMARY',
                    Ttl: 60,
                    ResourceRecords: [
                      {
                        Value: 'secondary-api-endpoint',
                      },
                    ],
                  },
                },
              ],
            },
          },
          ResultPath: '$.route53Update',
          Next: 'ValidateFailover',
        },
        ValidateFailover: {
          Type: 'Task',
          Resource: failoverValidatorArn,
          Parameters: {
            region: 'us-east-2',
            validateConnectivity: true,
          },
          ResultPath: '$.validationResult',
          Next: 'NotifyFailoverComplete',
        },
        NotifyFailoverComplete: {
          Type: 'Task',
          Resource: 'arn:aws:states:::sns:publish',
          Parameters: {
            TopicArn: `arn:aws:sns:us-east-1:*:trading-alarms-primary-${environmentSuffix}`,
            Message:
              'Failover completed successfully - secondary region is now primary',
            Subject: 'DR Failover Completed',
          },
          End: true,
        },
      },
    };

    // State Machine
    this.stateMachine = new SfnStateMachine(this, 'failover-state-machine', {
      provider,
      name: `failover-orchestration-${environmentSuffix}`,
      roleArn: stepFunctionsRole.arn,
      definition: JSON.stringify(stateMachineDefinition),
      tags: {
        Name: `failover-orchestration-${environmentSuffix}`,
        Environment: environmentSuffix,
        ManagedBy: 'CDKTF',
      },
    });

    // EventBridge Rule to trigger failover on alarm
    const failoverTriggerRule = new CloudwatchEventRule(
      this,
      'failover-trigger-rule',
      {
        provider,
        name: `failover-trigger-${environmentSuffix}-${uniqueSuffix}`,
        description: 'Trigger failover on primary region failure',
        eventPattern: JSON.stringify({
          source: ['aws.cloudwatch'],
          'detail-type': ['CloudWatch Alarm State Change'],
          detail: {
            alarmName: [
              { prefix: `rds-replication-lag-primary-${environmentSuffix}` },
              { prefix: `lambda-errors-primary-${environmentSuffix}` },
              { prefix: `api-latency-primary-${environmentSuffix}` },
            ],
            state: {
              value: ['ALARM'],
            },
          },
        }),
        tags: {
          Name: `failover-trigger-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      }
    );

    new CloudwatchEventTarget(this, 'failover-trigger-target', {
      provider,
      rule: failoverTriggerRule.name,
      targetId: `failover-trigger-${uniqueSuffix}`,
      arn: this.stateMachine.arn,
      roleArn: stepFunctionsRole.arn,
    });
  }
}
