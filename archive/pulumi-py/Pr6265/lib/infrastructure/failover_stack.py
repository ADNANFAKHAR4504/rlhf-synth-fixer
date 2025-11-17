"""
Automated failover orchestration.
BUG #21: Lambda timeout too short for RDS failover operations
BUG #22: Missing error handling and retry logic in failover code
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class FailoverStack(pulumi.ComponentResource):
    """Lambda-based automated failover orchestration."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        aurora_global_cluster_id: Output[str],
        secondary_cluster_arn: Output[str],
        route53_health_check_id: Output[str],
        composite_alarm_arn: Output[str],
        sns_topic_arn: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:infrastructure:FailoverStack', name, None, opts)

        primary_provider = aws.Provider(
            f"aws-failover-primary-{environment_suffix}",
            region=primary_region,
            opts=ResourceOptions(parent=self)
        )

        # IAM role for failover Lambda
        self.failover_role = aws.iam.Role(
            f"failover-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**tags, 'Name': f"failover-lambda-role-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # IAM policy for failover operations
        self.failover_policy = aws.iam.RolePolicy(
            f"failover-lambda-policy-{environment_suffix}",
            role=self.failover_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:FailoverGlobalCluster",
                            "rds:DescribeGlobalClusters",
                            "rds:DescribeDBClusters"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            opts=ResourceOptions(parent=self)
        )

        # BUG #22: Failover Lambda code missing error handling and retry logic
        failover_code = """
import json
import os
import boto3

rds_client = boto3.client('rds')
sns_client = boto3.client('sns')

def handler(event, context):
    global_cluster_id = os.environ.get('GLOBAL_CLUSTER_ID')
    secondary_cluster_arn = os.environ.get('SECONDARY_CLUSTER_ARN')
    sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')

    # BUG #22: No error handling, no retry logic, no validation
    # Just attempting failover without any safety checks
    response = rds_client.failover_global_cluster(
        GlobalClusterIdentifier=global_cluster_id,
        TargetDbClusterIdentifier=secondary_cluster_arn
    )

    # BUG #22: No error handling for SNS publish failure
    sns_client.publish(
        TopicArn=sns_topic_arn,
        Subject='Failover Initiated',
        Message=f'Failover initiated for cluster {global_cluster_id}'
    )

    return {
        'statusCode': 200,
        'body': json.dumps('Failover initiated')
    }
"""

        # BUG #21: Lambda timeout too short for RDS operations
        self.failover_function = aws.lambda_.Function(
            f"failover-orchestrator-{environment_suffix}",
            name=f"failover-orchestrator-{environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=self.failover_role.arn,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(failover_code)
            }),
            timeout=60,  # BUG #21: Should be 300 for RDS operations
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'GLOBAL_CLUSTER_ID': aurora_global_cluster_id,
                    'SECONDARY_CLUSTER_ARN': secondary_cluster_arn,
                    'SNS_TOPIC_ARN': sns_topic_arn
                }
            ),
            tags={**tags, 'Name': f"failover-orchestrator-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )
        
        # Initialize attributes immediately after function creation
        self.failover_function_arn = self.failover_function.arn
        self.failover_function_name = self.failover_function.name

        # EventBridge rule to trigger failover on composite alarm
        self.failover_rule = aws.cloudwatch.EventRule(
            f"failover-trigger-rule-{environment_suffix}",
            name=f"failover-trigger-rule-{environment_suffix}",
            description="Trigger failover when composite alarm enters ALARM state",
            event_pattern=composite_alarm_arn.apply(lambda arn: json.dumps({
                "source": ["aws.cloudwatch"],
                "detail-type": ["CloudWatch Alarm State Change"],
                "resources": [arn],
                "detail": {
                    "state": {
                        "value": ["ALARM"]
                    }
                }
            })),
            tags={**tags, 'Name': f"failover-trigger-rule-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        self.failover_target = aws.cloudwatch.EventTarget(
            f"failover-lambda-target-{environment_suffix}",
            rule=self.failover_rule.name,
            arn=self.failover_function.arn,
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # Lambda permission for EventBridge
        aws.lambda_.Permission(
            f"failover-eventbridge-permission-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.failover_function.name,
            principal="events.amazonaws.com",
            source_arn=self.failover_rule.arn,
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        self.register_outputs({
            'failover_function_arn': self.failover_function.arn,
            'failover_function_name': self.failover_function.name,
        })
