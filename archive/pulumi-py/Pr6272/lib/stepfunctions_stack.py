"""
stepfunctions_stack.py

Step Functions infrastructure module.
Creates state machines for migration orchestration and rollback.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class StepFunctionsStackArgs:
    """Arguments for StepFunctionsStack component."""

    def __init__(
        self,
        environment_suffix: str,
        validation_lambda_arn: Output[str],
        dms_replication_task_arn: Output[str],
        sns_topic_arn: Output[str],
        checkpoints_bucket_name: Output[str],
        rollback_bucket_name: Output[str],
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.validation_lambda_arn = validation_lambda_arn
        self.dms_replication_task_arn = dms_replication_task_arn
        self.sns_topic_arn = sns_topic_arn
        self.checkpoints_bucket_name = checkpoints_bucket_name
        self.rollback_bucket_name = rollback_bucket_name
        self.tags = tags or {}


class StepFunctionsStack(pulumi.ComponentResource):
    """
    Step Functions infrastructure for migration orchestration.

    Creates:
    - Migration workflow state machine
    - Rollback workflow state machine
    - IAM roles for state machine execution
    - CloudWatch log groups for state machine logs
    """

    def __init__(
        self,
        name: str,
        args: StepFunctionsStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stepfunctions:StepFunctionsStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'EnvironmentSuffix': self.environment_suffix,
            'Component': 'StepFunctions'
        }

        # Create IAM role for state machine execution
        self.state_machine_role = self._create_state_machine_role(args)

        # Migration Workflow State Machine
        self.migration_state_machine = aws.sfn.StateMachine(
            f"migration-workflow-{self.environment_suffix}",
            name=f"migration-workflow-{self.environment_suffix}",
            role_arn=self.state_machine_role.arn,
            definition=self._create_migration_definition(args),
            logging_configuration=aws.sfn.StateMachineLoggingConfigurationArgs(
                level="ALL",
                include_execution_data=True,
                log_destination=self._create_log_group("migration-workflow").arn.apply(lambda arn: f"{arn}:*")
            ),
            tracing_configuration=aws.sfn.StateMachineTracingConfigurationArgs(
                enabled=True
            ),
            tags={
                **self.tags,
                'Name': f"migration-workflow-{self.environment_suffix}",
                'WorkflowType': 'Migration'
            },
            opts=ResourceOptions(parent=self)
        )

        # Rollback Workflow State Machine
        self.rollback_state_machine = aws.sfn.StateMachine(
            f"rollback-workflow-{self.environment_suffix}",
            name=f"rollback-workflow-{self.environment_suffix}",
            role_arn=self.state_machine_role.arn,
            definition=self._create_rollback_definition(args),
            logging_configuration=aws.sfn.StateMachineLoggingConfigurationArgs(
                level="ALL",
                include_execution_data=True,
                log_destination=self._create_log_group("rollback-workflow").arn.apply(lambda arn: f"{arn}:*")
            ),
            tracing_configuration=aws.sfn.StateMachineTracingConfigurationArgs(
                enabled=True
            ),
            tags={
                **self.tags,
                'Name': f"rollback-workflow-{self.environment_suffix}",
                'WorkflowType': 'Rollback'
            },
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            'migration_state_machine_arn': self.migration_state_machine.arn,
            'migration_state_machine_name': self.migration_state_machine.name,
            'rollback_state_machine_arn': self.rollback_state_machine.arn,
            'rollback_state_machine_name': self.rollback_state_machine.name
        })

    def _create_migration_definition(self, args: StepFunctionsStackArgs) -> Output[str]:
        """Create Step Functions definition for migration workflow."""

        return Output.all(
            args.validation_lambda_arn,
            args.dms_replication_task_arn,
            args.sns_topic_arn,
            args.checkpoints_bucket_name
        ).apply(lambda vals: json.dumps({
            "Comment": f"Migration workflow for {self.environment_suffix}",
            "StartAt": "SaveCheckpoint-Preparation",
            "States": {
                "SaveCheckpoint-Preparation": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::aws-sdk:s3:putObject",
                    "Parameters": {
                        "Bucket": vals[3],
                        "Key.$": "States.Format('checkpoints/preparation-{}.json', $$.Execution.Name)",
                        "Body.$": "$"
                    },
                    "Next": "NotifyPreparationStart",
                    "ResultPath": "$.checkpointResult"
                },
                "NotifyPreparationStart": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sns:publish",
                    "Parameters": {
                        "TopicArn": vals[2],
                        "Subject": f"Migration Started - {self.environment_suffix}",
                        "Message.$": "States.Format('Migration workflow started at {}', $$.State.EnteredTime)"
                    },
                    "Next": "StartDMSReplication",
                    "ResultPath": "$.notifyResult"
                },
                "StartDMSReplication": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::aws-sdk:databasemigration:startReplicationTask",
                    "Parameters": {
                        "ReplicationTaskArn": vals[1],
                        "StartReplicationTaskType": "start-replication"
                    },
                    "Next": "WaitForReplication",
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "HandleReplicationFailure",
                        "ResultPath": "$.error"
                    }],
                    "ResultPath": "$.replicationResult"
                },
                "WaitForReplication": {
                    "Type": "Wait",
                    "Seconds": 300,
                    "Next": "CheckReplicationStatus"
                },
                "CheckReplicationStatus": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::aws-sdk:databasemigration:describeReplicationTasks",
                    "Parameters": {
                        "Filters": [{
                            "Name": "replication-task-arn",
                            "Values": [vals[1]]
                        }]
                    },
                    "Next": "EvaluateReplicationStatus",
                    "ResultPath": "$.statusResult"
                },
                "EvaluateReplicationStatus": {
                    "Type": "Choice",
                    "Choices": [{
                        "Variable": "$.statusResult.ReplicationTasks[0].Status",
                        "StringEquals": "running",
                        "Next": "SaveCheckpoint-Replication"
                    }, {
                        "Variable": "$.statusResult.ReplicationTasks[0].Status",
                        "StringEquals": "failed",
                        "Next": "HandleReplicationFailure"
                    }],
                    "Default": "WaitForReplication"
                },
                "SaveCheckpoint-Replication": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::aws-sdk:s3:putObject",
                    "Parameters": {
                        "Bucket": vals[3],
                        "Key.$": "States.Format('checkpoints/replication-{}.json', $$.Execution.Name)",
                        "Body.$": "$"
                    },
                    "Next": "RunDataValidation",
                    "ResultPath": "$.checkpointResult"
                },
                "RunDataValidation": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": vals[0],
                        "Payload": {
                            "executionId.$": "$$.Execution.Name",
                            "timestamp.$": "$$.State.EnteredTime"
                        }
                    },
                    "Next": "EvaluateValidationResult",
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "HandleValidationFailure",
                        "ResultPath": "$.error"
                    }],
                    "ResultPath": "$.validationResult",
                    "Retry": [{
                        "ErrorEquals": ["States.TaskFailed"],
                        "IntervalSeconds": 60,
                        "MaxAttempts": 3,
                        "BackoffRate": 2.0
                    }]
                },
                "EvaluateValidationResult": {
                    "Type": "Choice",
                    "Choices": [{
                        "Variable": "$.validationResult.Payload.body",
                        "StringMatches": "*SUCCESS*",
                        "Next": "SaveCheckpoint-Validation"
                    }],
                    "Default": "HandleValidationFailure"
                },
                "SaveCheckpoint-Validation": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::aws-sdk:s3:putObject",
                    "Parameters": {
                        "Bucket": vals[3],
                        "Key.$": "States.Format('checkpoints/validation-{}.json', $$.Execution.Name)",
                        "Body.$": "$"
                    },
                    "Next": "NotifyCutoverReady",
                    "ResultPath": "$.checkpointResult"
                },
                "NotifyCutoverReady": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sns:publish",
                    "Parameters": {
                        "TopicArn": vals[2],
                        "Subject": f"Migration Ready for Cutover - {self.environment_suffix}",
                        "Message": "Migration validation complete. System is ready for cutover."
                    },
                    "Next": "MigrationComplete"
                },
                "MigrationComplete": {
                    "Type": "Succeed"
                },
                "HandleReplicationFailure": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sns:publish",
                    "Parameters": {
                        "TopicArn": vals[2],
                        "Subject": f"Migration Replication Failed - {self.environment_suffix}",
                        "Message.$": "States.Format('Replication failed: {}', $.error)"
                    },
                    "Next": "MigrationFailed"
                },
                "HandleValidationFailure": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sns:publish",
                    "Parameters": {
                        "TopicArn": vals[2],
                        "Subject": f"Migration Validation Failed - {self.environment_suffix}",
                        "Message.$": "States.Format('Validation failed: {}', $.error)"
                    },
                    "Next": "MigrationFailed"
                },
                "MigrationFailed": {
                    "Type": "Fail",
                    "Error": "MigrationFailed",
                    "Cause": "Migration workflow encountered an error"
                }
            }
        }))

    def _create_rollback_definition(self, args: StepFunctionsStackArgs) -> Output[str]:
        """Create Step Functions definition for rollback workflow."""

        return Output.all(
            args.sns_topic_arn,
            args.rollback_bucket_name,
            args.dms_replication_task_arn
        ).apply(lambda vals: json.dumps({
            "Comment": f"Rollback workflow for {self.environment_suffix}",
            "StartAt": "NotifyRollbackStart",
            "States": {
                "NotifyRollbackStart": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sns:publish",
                    "Parameters": {
                        "TopicArn": vals[0],
                        "Subject": f"Rollback Started - {self.environment_suffix}",
                        "Message.$": "States.Format('Rollback workflow started at {}', $$.State.EnteredTime)"
                    },
                    "Next": "SaveRollbackState",
                    "ResultPath": "$.notifyResult"
                },
                "SaveRollbackState": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::aws-sdk:s3:putObject",
                    "Parameters": {
                        "Bucket": vals[1],
                        "Key.$": "States.Format('rollback/state-{}.json', $$.Execution.Name)",
                        "Body.$": "$"
                    },
                    "Next": "StopDMSReplication",
                    "ResultPath": "$.saveResult"
                },
                "StopDMSReplication": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::aws-sdk:databasemigration:stopReplicationTask",
                    "Parameters": {
                        "ReplicationTaskArn": vals[2]
                    },
                    "Next": "WaitForReplicationStop",
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "NotifyRollbackComplete",
                        "ResultPath": "$.error"
                    }],
                    "ResultPath": "$.stopResult"
                },
                "WaitForReplicationStop": {
                    "Type": "Wait",
                    "Seconds": 60,
                    "Next": "NotifyRollbackComplete"
                },
                "NotifyRollbackComplete": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sns:publish",
                    "Parameters": {
                        "TopicArn": vals[0],
                        "Subject": f"Rollback Complete - {self.environment_suffix}",
                        "Message": "Rollback workflow completed successfully. System restored to previous state."
                    },
                    "Next": "RollbackSuccess"
                },
                "RollbackSuccess": {
                    "Type": "Succeed"
                }
            }
        }))

    def _create_state_machine_role(self, args: StepFunctionsStackArgs) -> aws.iam.Role:
        """Create IAM role for Step Functions state machine execution."""

        role = aws.iam.Role(
            f"state-machine-role-{self.environment_suffix}",
            name=f"state-machine-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "states.amazonaws.com"
                    }
                }]
            }),
            tags={
                **self.tags,
                'Name': f"state-machine-role-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Inline policy with necessary permissions
        aws.iam.RolePolicy(
            f"state-machine-policy-{self.environment_suffix}",
            role=role.name,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "lambda:InvokeFunction"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dms:StartReplicationTask",
                            "dms:StopReplicationTask",
                            "dms:DescribeReplicationTasks"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogDelivery",
                            "logs:GetLogDelivery",
                            "logs:UpdateLogDelivery",
                            "logs:DeleteLogDelivery",
                            "logs:ListLogDeliveries",
                            "logs:PutResourcePolicy",
                            "logs:DescribeResourcePolicies",
                            "logs:DescribeLogGroups"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "xray:PutTraceSegments",
                            "xray:PutTelemetryRecords",
                            "xray:GetSamplingRules",
                            "xray:GetSamplingTargets"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            opts=ResourceOptions(parent=role)
        )

        return role

    def _create_log_group(self, workflow_name: str) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch log group for state machine."""

        return aws.cloudwatch.LogGroup(
            f"{workflow_name}-logs-{self.environment_suffix}",
            name=f"/aws/vendedlogs/states/{workflow_name}-{self.environment_suffix}",
            retention_in_days=7,
            tags={
                **self.tags,
                'Name': f"{workflow_name}-logs-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )
