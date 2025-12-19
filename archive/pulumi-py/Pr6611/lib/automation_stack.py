"""
Automation infrastructure module for Lambda and EventBridge.

This module creates:
- Lambda functions for Parameter Store secret rotation
- EventBridge custom event bus
- EventBridge rules for scheduled rotation and event forwarding
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class AutomationStackArgs:
    """Arguments for AutomationStack component."""

    def __init__(
        self,
        environment_suffix: str,
        lambda_role_arn: Output[str],
        log_group_arn: Output[str],
        kms_key_id: Output[str]
    ):
        self.environment_suffix = environment_suffix
        self.lambda_role_arn = lambda_role_arn
        self.log_group_arn = log_group_arn
        self.kms_key_id = kms_key_id


class AutomationStack(pulumi.ComponentResource):
    """
    AutomationStack component creates Lambda functions and EventBridge configuration.

    Exports:
        lambda_function_arn: Lambda function ARN
        event_bus_name: EventBridge event bus name
    """

    def __init__(
        self,
        name: str,
        args: AutomationStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:automation:AutomationStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Lambda function code for secret rotation
        lambda_code = """
import json
import boto3
import os
from datetime import datetime
import secrets
import string

ssm = boto3.client('ssm')

def generate_secret(length=32):
    \"\"\"Generate a random secret string.\"\"\"
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def handler(event, context):
    \"\"\"Rotate Parameter Store values.\"\"\"
    environment_suffix = os.environ['ENVIRONMENT_SUFFIX']

    # List of parameters to rotate
    parameter_names = [
        f'/{environment_suffix}/trading-api-key-1',
        f'/{environment_suffix}/trading-api-key-2',
        f'/{environment_suffix}/trading-api-secret'
    ]

    results = []

    for param_name in parameter_names:
        try:
            # Generate new secret value
            new_value = generate_secret()

            # Update parameter
            ssm.put_parameter(
                Name=param_name,
                Value=new_value,
                Type='SecureString',
                Overwrite=True
            )

            results.append({
                'parameter': param_name,
                'status': 'rotated',
                'timestamp': datetime.utcnow().isoformat()
            })

            print(f'Successfully rotated {param_name}')

        except Exception as e:
            results.append({
                'parameter': param_name,
                'status': 'failed',
                'error': str(e)
            })
            print(f'Failed to rotate {param_name}: {str(e)}')

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Secret rotation completed',
            'results': results
        })
    }
"""

        # Create Lambda function for secret rotation
        self.rotation_function = aws.lambda_.Function(
            f"secret-rotation-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=args.lambda_role_arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            ),
            timeout=30,
            tags={
                "Name": f"secret-rotation-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "automation-team",
                "CostCenter": "automation"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create EventBridge custom event bus
        self.event_bus = aws.cloudwatch.EventBus(
            f"app-events-{self.environment_suffix}",
            tags={
                "Name": f"app-events-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "application-team",
                "CostCenter": "application"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create EventBridge rule for scheduled rotation (every 30 days)
        self.rotation_rule = aws.cloudwatch.EventRule(
            f"rotation-schedule-{self.environment_suffix}",
            description="Trigger secret rotation every 30 days",
            schedule_expression="rate(30 days)",
            tags={
                "Name": f"rotation-schedule-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "automation-team",
                "CostCenter": "automation"
            },
            opts=ResourceOptions(parent=self.rotation_function)
        )

        # Create EventBridge target for Lambda
        self.rotation_target = aws.cloudwatch.EventTarget(
            f"rotation-target-{self.environment_suffix}",
            rule=self.rotation_rule.name,
            arn=self.rotation_function.arn,
            opts=ResourceOptions(parent=self.rotation_rule)
        )

        # Grant EventBridge permission to invoke Lambda
        self.lambda_permission = aws.lambda_.Permission(
            f"rotation-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.rotation_function.name,
            principal="events.amazonaws.com",
            source_arn=self.rotation_rule.arn,
            opts=ResourceOptions(parent=self.rotation_target)
        )

        # Create IAM role for EventBridge to write to CloudWatch Logs
        eventbridge_log_assume_role = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                actions=["sts:AssumeRole"],
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type="Service",
                    identifiers=["events.amazonaws.com"]
                )]
            )]
        )

        self.eventbridge_log_role = aws.iam.Role(
            f"eventbridge-log-role-{self.environment_suffix}",
            assume_role_policy=eventbridge_log_assume_role.json,
            tags={
                "Name": f"eventbridge-log-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "monitoring-team",
                "CostCenter": "monitoring"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create inline policy for CloudWatch Logs access
        eventbridge_log_policy = aws.iam.RolePolicy(
            f"eventbridge-log-policy-{self.environment_suffix}",
            role=self.eventbridge_log_role.id,
            policy=args.log_group_arn.apply(
                lambda log_arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": log_arn
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self.eventbridge_log_role)
        )

        # Create EventBridge rule to forward custom bus events to CloudWatch Logs
        self.log_forwarding_rule = aws.cloudwatch.EventRule(
            f"log-forwarding-{self.environment_suffix}",
            name=f"log-forwarding-{self.environment_suffix}",
            description="Forward application events to CloudWatch Logs",
            event_bus_name=self.event_bus.name,
            event_pattern=json.dumps({
                "source": [{"prefix": ""}]  # Match all events
            }),
            tags={
                "Name": f"log-forwarding-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "monitoring-team",
                "CostCenter": "monitoring"
            },
            opts=ResourceOptions(parent=self.event_bus)
        )

        # Create EventBridge target for CloudWatch Logs
        # Note: CloudWatch Logs as a target does not require or support role_arn
        self.log_target = aws.cloudwatch.EventTarget(
            f"log-target-{self.environment_suffix}",
            rule=self.log_forwarding_rule.name,
            event_bus_name=self.event_bus.name,
            arn=args.log_group_arn,
            opts=ResourceOptions(parent=self.log_forwarding_rule)
        )

        # Register outputs
        self.lambda_function_arn = self.rotation_function.arn
        self.event_bus_name = self.event_bus.name

        self.register_outputs({
            "lambda_function_arn": self.lambda_function_arn,
            "event_bus_name": self.event_bus_name
        })
