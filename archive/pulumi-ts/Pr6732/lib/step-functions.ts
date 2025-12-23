import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { MigrationConfig } from './config';
import { IamRoles } from './iam-roles';
import { ParameterStoreResources } from './parameter-store';

export interface StepFunctionsResources {
  stateMachine: aws.sfn.StateMachine;
  logGroup: aws.cloudwatch.LogGroup;
}

export function createStepFunctions(
  config: MigrationConfig,
  iamRoles: IamRoles,
  parameterStore: ParameterStoreResources
): StepFunctionsResources {
  // CloudWatch Log Group for Step Functions - must be created first
  const logGroup = new aws.cloudwatch.LogGroup(
    `migration-orchestrator-logs-${config.environmentSuffix}`,
    {
      name: `/aws/stepfunctions/migration-orchestrator-${config.environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `migration-orchestrator-logs-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'step-functions',
      },
    }
  );

  // Add an inline policy to the role specifically for CloudWatch Logs
  const stepFunctionsLoggingPolicy = new aws.iam.RolePolicy(
    `migration-orchestrator-logging-policy-${config.environmentSuffix}`,
    {
      role: iamRoles.migrationOrchestratorRole.id,
      policy: pulumi.all([logGroup.arn]).apply(([logGroupArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:CreateLogDelivery',
                'logs:GetLogDelivery',
                'logs:UpdateLogDelivery',
                'logs:DeleteLogDelivery',
                'logs:ListLogDeliveries',
                'logs:PutResourcePolicy',
                'logs:DescribeResourcePolicies',
                'logs:DescribeLogGroups',
              ],
              Resource: [logGroupArn, `${logGroupArn}:*`, 'arn:aws:logs:*:*:*'],
            },
          ],
        })
      ),
    },
    {
      dependsOn: [logGroup],
    }
  );

  // Step Functions State Machine Definition
  const stateMachineDefinition = pulumi
    .all([
      iamRoles.legacyAccountRole.arn,
      iamRoles.productionAccountRole.arn,
      iamRoles.stagingAccountRole.arn,
      iamRoles.developmentAccountRole.arn,
      parameterStore.migrationMetadata.name,
      config.isDryRun,
    ])
    .apply(
      ([
        _legacyRoleArn,
        _productionRoleArn,
        _stagingRoleArn,
        _developmentRoleArn,
        parameterName,
        _isDryRun,
      ]) =>
        JSON.stringify({
          Comment: 'Migration Orchestrator State Machine',
          StartAt: 'CheckDryRunMode',
          States: {
            CheckDryRunMode: {
              Type: 'Choice',
              Choices: [
                {
                  Variable: '$.dryRun',
                  BooleanEquals: true,
                  Next: 'DryRunSimulation',
                },
              ],
              Default: 'InitializeMigration',
            },
            DryRunSimulation: {
              Type: 'Pass',
              Result: {
                status: 'dry-run',
                message: 'Simulation completed successfully',
              },
              End: true,
            },
            InitializeMigration: {
              Type: 'Task',
              Resource: 'arn:aws:states:::aws-sdk:ssm:putParameter',
              Parameters: {
                Name: parameterName,
                Value: JSON.stringify({
                  status: 'initializing',
                  startTime: Date.now(),
                  progress: 0,
                }),
                Type: 'String',
                Overwrite: true,
              },
              ResultPath: '$.initResult',
              Next: 'ValidateLegacyEnvironment',
              Catch: [
                {
                  ErrorEquals: ['States.ALL'],
                  Next: 'MigrationFailed',
                  ResultPath: '$.error',
                },
              ],
            },
            ValidateLegacyEnvironment: {
              Type: 'Task',
              Resource: 'arn:aws:states:::aws-sdk:ssm:putParameter',
              Parameters: {
                Name: parameterName,
                Value: JSON.stringify({
                  status: 'validating-legacy',
                  progress: 10,
                }),
                Type: 'String',
                Overwrite: true,
              },
              ResultPath: '$.validateResult',
              Next: 'CheckCircularDependencies',
              Retry: [
                {
                  ErrorEquals: ['States.TaskFailed'],
                  IntervalSeconds: 2,
                  MaxAttempts: 3,
                  BackoffRate: 2,
                },
              ],
              Catch: [
                {
                  ErrorEquals: ['States.ALL'],
                  Next: 'MigrationFailed',
                  ResultPath: '$.error',
                },
              ],
            },
            CheckCircularDependencies: {
              Type: 'Task',
              Resource: 'arn:aws:states:::aws-sdk:ssm:putParameter',
              Parameters: {
                Name: parameterName,
                Value: JSON.stringify({
                  status: 'checking-dependencies',
                  progress: 20,
                }),
                Type: 'String',
                Overwrite: true,
              },
              ResultPath: '$.dependencyCheckResult',
              Next: 'MigrateDevelopmentTier',
              Catch: [
                {
                  ErrorEquals: ['States.ALL'],
                  Next: 'MigrationFailed',
                  ResultPath: '$.error',
                },
              ],
            },
            MigrateDevelopmentTier: {
              Type: 'Task',
              Resource: 'arn:aws:states:::aws-sdk:ssm:putParameter',
              Parameters: {
                Name: parameterName,
                Value: JSON.stringify({
                  status: 'migrating-development',
                  progress: 30,
                  tier: 'development',
                }),
                Type: 'String',
                Overwrite: true,
              },
              ResultPath: '$.developmentResult',
              Next: 'WaitForDevelopmentValidation',
              Retry: [
                {
                  ErrorEquals: ['States.TaskFailed'],
                  IntervalSeconds: 5,
                  MaxAttempts: 3,
                  BackoffRate: 2,
                },
              ],
              Catch: [
                {
                  ErrorEquals: ['States.ALL'],
                  Next: 'TriggerRollback',
                  ResultPath: '$.error',
                },
              ],
            },
            WaitForDevelopmentValidation: {
              Type: 'Wait',
              Seconds: 30,
              Next: 'MigrateStagingTier',
            },
            MigrateStagingTier: {
              Type: 'Task',
              Resource: 'arn:aws:states:::aws-sdk:ssm:putParameter',
              Parameters: {
                Name: parameterName,
                Value: JSON.stringify({
                  status: 'migrating-staging',
                  progress: 50,
                  tier: 'staging',
                }),
                Type: 'String',
                Overwrite: true,
              },
              ResultPath: '$.stagingResult',
              Next: 'WaitForStagingValidation',
              Retry: [
                {
                  ErrorEquals: ['States.TaskFailed'],
                  IntervalSeconds: 5,
                  MaxAttempts: 3,
                  BackoffRate: 2,
                },
              ],
              Catch: [
                {
                  ErrorEquals: ['States.ALL'],
                  Next: 'TriggerRollback',
                  ResultPath: '$.error',
                },
              ],
            },
            WaitForStagingValidation: {
              Type: 'Wait',
              Seconds: 60,
              Next: 'MigrateProductionTier',
            },
            MigrateProductionTier: {
              Type: 'Task',
              Resource: 'arn:aws:states:::aws-sdk:ssm:putParameter',
              Parameters: {
                Name: parameterName,
                Value: JSON.stringify({
                  status: 'migrating-production',
                  progress: 70,
                  tier: 'production',
                }),
                Type: 'String',
                Overwrite: true,
              },
              ResultPath: '$.productionResult',
              Next: 'InitiateTrafficShift',
              Retry: [
                {
                  ErrorEquals: ['States.TaskFailed'],
                  IntervalSeconds: 10,
                  MaxAttempts: 2,
                  BackoffRate: 2,
                },
              ],
              Catch: [
                {
                  ErrorEquals: ['States.ALL'],
                  Next: 'TriggerRollback',
                  ResultPath: '$.error',
                },
              ],
            },
            InitiateTrafficShift: {
              Type: 'Task',
              Resource: 'arn:aws:states:::aws-sdk:ssm:putParameter',
              Parameters: {
                Name: parameterName,
                Value: JSON.stringify({
                  status: 'shifting-traffic',
                  progress: 85,
                  trafficWeight: 10,
                }),
                Type: 'String',
                Overwrite: true,
              },
              ResultPath: '$.trafficShiftResult',
              Next: 'MonitorHealthChecks',
              Catch: [
                {
                  ErrorEquals: ['States.ALL'],
                  Next: 'TriggerRollback',
                  ResultPath: '$.error',
                },
              ],
            },
            MonitorHealthChecks: {
              Type: 'Task',
              Resource: 'arn:aws:states:::aws-sdk:ssm:getParameter',
              Parameters: {
                Name: parameterName,
              },
              ResultPath: '$.healthCheckResult',
              Next: 'EvaluateHealthStatus',
              Retry: [
                {
                  ErrorEquals: ['States.TaskFailed'],
                  IntervalSeconds: 3,
                  MaxAttempts: 5,
                  BackoffRate: 1.5,
                },
              ],
              Catch: [
                {
                  ErrorEquals: ['States.ALL'],
                  Next: 'TriggerRollback',
                  ResultPath: '$.error',
                },
              ],
            },
            EvaluateHealthStatus: {
              Type: 'Choice',
              Choices: [
                {
                  Variable: '$.healthCheckResult.Parameter.Value',
                  StringMatches: '*healthy*',
                  Next: 'CompleteMigration',
                },
              ],
              Default: 'TriggerRollback',
            },
            CompleteMigration: {
              Type: 'Task',
              Resource: 'arn:aws:states:::aws-sdk:ssm:putParameter',
              Parameters: {
                Name: parameterName,
                Value: JSON.stringify({
                  status: 'completed',
                  progress: 100,
                  completionTime: Date.now(),
                }),
                Type: 'String',
                Overwrite: true,
              },
              ResultPath: '$.completionResult',
              Next: 'MigrationSuccess',
            },
            MigrationSuccess: {
              Type: 'Succeed',
            },
            TriggerRollback: {
              Type: 'Task',
              Resource: 'arn:aws:states:::aws-sdk:ssm:putParameter',
              Parameters: {
                Name: parameterName,
                Value: JSON.stringify({
                  status: 'rolling-back',
                  progress: 0,
                }),
                Type: 'String',
                Overwrite: true,
              },
              ResultPath: '$.rollbackResult',
              Next: 'MigrationFailed',
            },
            MigrationFailed: {
              Type: 'Fail',
              Error: 'MigrationFailed',
              Cause: 'Migration failed and rollback initiated',
            },
          },
        })
    );

  // Add a resource policy to the log group to allow Step Functions to write logs
  const logResourcePolicy = new aws.cloudwatch.LogResourcePolicy(
    `migration-orchestrator-log-policy-${config.environmentSuffix}`,
    {
      policyName: `migration-orchestrator-log-policy-${config.environmentSuffix}`,
      policyDocument: pulumi.all([logGroup.arn]).apply(
        ([logGroupArn]) => `{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "AllowStepFunctionsToWriteLogs",
            "Effect": "Allow",
            "Principal": {
              "Service": "states.amazonaws.com"
            },
            "Action": [
              "logs:CreateLogDelivery",
              "logs:GetLogDelivery",
              "logs:UpdateLogDelivery",
              "logs:DeleteLogDelivery",
              "logs:ListLogDeliveries",
              "logs:PutResourcePolicy",
              "logs:DescribeResourcePolicies",
              "logs:DescribeLogGroups",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            "Resource": ["${logGroupArn}", "${logGroupArn}:*"]
          }
        ]
      }`
      ),
    },
    {
      dependsOn: [logGroup],
    }
  );

  // Step Functions State Machine
  const stateMachine = new aws.sfn.StateMachine(
    `migration-orchestrator-${config.environmentSuffix}`,
    {
      name: `migration-orchestrator-${config.environmentSuffix}`,
      roleArn: iamRoles.migrationOrchestratorRole.arn,
      definition: stateMachineDefinition,
      loggingConfiguration: {
        logDestination: pulumi.interpolate`${logGroup.arn}:*`,
        includeExecutionData: true,
        level: 'ALL',
      },
      tags: {
        Name: `migration-orchestrator-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'step-functions',
      },
    },
    {
      dependsOn: [logGroup, logResourcePolicy, stepFunctionsLoggingPolicy],
    }
  );

  return {
    stateMachine,
    logGroup,
  };
}

export function getMigrationProgress(
  _stateMachineArn: pulumi.Output<string>,
  _parameterName: pulumi.Output<string>
): pulumi.Output<number> {
  // This would be implemented with a Lambda function in production
  // For now, return a computed value
  return pulumi.output(0);
}
