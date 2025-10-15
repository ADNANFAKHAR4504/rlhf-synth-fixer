"""Content Moderation Stack with all AWS services."""

from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableAttribute,
    DynamodbTableGlobalSecondaryIndex
)
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.sfn_state_machine import SfnStateMachine
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
from cdktf import TerraformAsset, AssetType
import json
import os


class ContentModerationStack(Construct):
    """Content Moderation infrastructure stack."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
        **kwargs
    ):
        """Initialize the Content Moderation stack."""
        super().__init__(scope, construct_id)

        # S3 Bucket for content storage
        content_bucket = S3Bucket(
            self,
            "content-bucket",
            bucket=f"content-moderation-{environment_suffix}-{aws_region}",
            force_destroy=True
        )

        S3BucketVersioningA(
            self,
            "content-bucket-versioning",
            bucket=content_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        S3BucketServerSideEncryptionConfigurationA(
            self,
            "content-bucket-encryption",
            bucket=content_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default={
                        "sse_algorithm": "AES256"
                    }
                )
            ]
        )

        S3BucketPublicAccessBlock(
            self,
            "content-bucket-pab",
            bucket=content_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        S3BucketLifecycleConfiguration(
            self,
            "content-bucket-lifecycle",
            bucket=content_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="delete-processed-content",
                    status="Enabled",
                    expiration=[{
                        "days": 30
                    }],
                    filter=[{
                        "prefix": "processed/"
                    }]
                )
            ]
        )

        # DynamoDB Table for moderation results
        moderation_table = DynamodbTable(
            self,
            "moderation-results",
            name=f"moderation-results-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="contentId",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="contentId", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N"),
                DynamodbTableAttribute(name="reviewStatus", type="S")
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="ReviewStatusIndex",
                    hash_key="reviewStatus",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery={
                "enabled": True
            },
            server_side_encryption={
                "enabled": True
            }
        )

        # SQS Queues
        dlq = SqsQueue(
            self,
            "moderation-dlq",
            name=f"moderation-dlq-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            visibility_timeout_seconds=300,
            sqs_managed_sse_enabled=True
        )

        human_review_queue = SqsQueue(
            self,
            "human-review-queue",
            name=f"human-review-queue-{environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=345600,  # 4 days
            redrive_policy=json.dumps({
                "deadLetterTargetArn": dlq.arn,
                "maxReceiveCount": 3
            }),
            sqs_managed_sse_enabled=True
        )

        # SNS Topic for notifications
        notification_topic = SnsTopic(
            self,
            "reviewer-notifications",
            name=f"reviewer-notifications-{environment_suffix}",
            kms_master_key_id="alias/aws/sns"
        )

        # IAM Role for Lambda
        lambda_assume_role_policy = DataAwsIamPolicyDocument(
            self,
            "lambda-assume-role-policy",
            statement=[{
                "actions": ["sts:AssumeRole"],
                "principals": [{
                    "type": "Service",
                    "identifiers": ["lambda.amazonaws.com"]
                }],
                "effect": "Allow"
            }]
        )

        lambda_role = IamRole(
            self,
            "lambda-execution-role",
            name=f"moderation-lambda-role-{environment_suffix}",
            assume_role_policy=lambda_assume_role_policy.json
        )

        # Lambda execution policy
        lambda_policy = IamRolePolicy(
            self,
            "lambda-execution-policy",
            name="moderation-lambda-policy",
            role=lambda_role.id,
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
                        "Resource": f"arn:aws:logs:{aws_region}:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"{content_bucket.arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query"
                        ],
                        "Resource": [
                            moderation_table.arn,
                            f"{moderation_table.arn}/index/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rekognition:DetectModerationLabels"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "comprehend:DetectToxicContent",
                            "comprehend:DetectSentiment"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": [
                            human_review_queue.arn,
                            dlq.arn
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": notification_topic.arn
                    }
                ]
            })
        )

        # Lambda Functions
        image_moderation_lambda = LambdaFunction(
            self,
            "image-moderation",
            function_name=f"image-moderation-{environment_suffix}",
            runtime="python3.10",
            handler="image_moderation.handler",
            filename=TerraformAsset(
                self,
                "image-moderation-code",
                path=os.path.join(os.path.dirname(__file__), "lambda"),
                type=AssetType.ARCHIVE
            ).path,
            role=lambda_role.arn,
            timeout=60,
            memory_size=512,
            environment={
                "variables": {
                    "MODERATION_TABLE": moderation_table.name,
                    "HUMAN_REVIEW_QUEUE": human_review_queue.url,
                    "NOTIFICATION_TOPIC": notification_topic.arn,
                    "CONFIDENCE_THRESHOLD": "75"
                }
            }
        )

        text_moderation_lambda = LambdaFunction(
            self,
            "text-moderation",
            function_name=f"text-moderation-{environment_suffix}",
            runtime="python3.10",
            handler="text_moderation.handler",
            filename=TerraformAsset(
                self,
                "text-moderation-code",
                path=os.path.join(os.path.dirname(__file__), "lambda"),
                type=AssetType.ARCHIVE
            ).path,
            role=lambda_role.arn,
            timeout=60,
            memory_size=256,
            environment={
                "variables": {
                    "MODERATION_TABLE": moderation_table.name,
                    "HUMAN_REVIEW_QUEUE": human_review_queue.url,
                    "NOTIFICATION_TOPIC": notification_topic.arn,
                    "TOXICITY_THRESHOLD": "0.7"
                }
            }
        )

        result_processor_lambda = LambdaFunction(
            self,
            "result-processor",
            function_name=f"result-processor-{environment_suffix}",
            runtime="python3.10",
            handler="result_processor.handler",
            filename=TerraformAsset(
                self,
                "result-processor-code",
                path=os.path.join(os.path.dirname(__file__), "lambda"),
                type=AssetType.ARCHIVE
            ).path,
            role=lambda_role.arn,
            timeout=30,
            memory_size=256,
            environment={
                "variables": {
                    "MODERATION_TABLE": moderation_table.name,
                    "CONTENT_BUCKET": content_bucket.id
                }
            }
        )

        # Step Functions
        sfn_assume_role_policy = DataAwsIamPolicyDocument(
            self,
            "sfn-assume-role-policy",
            statement=[{
                "actions": ["sts:AssumeRole"],
                "principals": [{
                    "type": "Service",
                    "identifiers": ["states.amazonaws.com"]
                }],
                "effect": "Allow"
            }]
        )

        sfn_role = IamRole(
            self,
            "sfn-execution-role",
            name=f"moderation-sfn-role-{environment_suffix}",
            assume_role_policy=sfn_assume_role_policy.json
        )

        sfn_policy = IamRolePolicy(
            self,
            "sfn-execution-policy",
            name="moderation-sfn-policy",
            role=sfn_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "lambda:InvokeFunction"
                        ],
                        "Resource": [
                            image_moderation_lambda.arn,
                            text_moderation_lambda.arn,
                            result_processor_lambda.arn
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": human_review_queue.arn
                    }
                ]
            })
        )

        state_machine_definition = {
            "Comment": "Content moderation workflow",
            "StartAt": "DetermineContentType",
            "States": {
                "DetermineContentType": {
                    "Type": "Choice",
                    "Choices": [
                        {
                            "Variable": "$.contentType",
                            "StringEquals": "image",
                            "Next": "ProcessImage"
                        },
                        {
                            "Variable": "$.contentType",
                            "StringEquals": "text",
                            "Next": "ProcessText"
                        }
                    ],
                    "Default": "UnsupportedContent"
                },
                "ProcessImage": {
                    "Type": "Task",
                    "Resource": image_moderation_lambda.arn,
                    "Retry": [
                        {
                            "ErrorEquals": ["States.TaskFailed"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2
                        }
                    ],
                    "Next": "CheckModerationResult"
                },
                "ProcessText": {
                    "Type": "Task",
                    "Resource": text_moderation_lambda.arn,
                    "Retry": [
                        {
                            "ErrorEquals": ["States.TaskFailed"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2
                        }
                    ],
                    "Next": "CheckModerationResult"
                },
                "CheckModerationResult": {
                    "Type": "Choice",
                    "Choices": [
                        {
                            "Variable": "$.requiresReview",
                            "BooleanEquals": True,
                            "Next": "SendToHumanReview"
                        }
                    ],
                    "Default": "StoreResult"
                },
                "SendToHumanReview": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sqs:sendMessage",
                    "Parameters": {
                        "QueueUrl": human_review_queue.url,
                        "MessageBody.$": "$"
                    },
                    "Next": "StoreResult"
                },
                "StoreResult": {
                    "Type": "Task",
                    "Resource": result_processor_lambda.arn,
                    "End": True
                },
                "UnsupportedContent": {
                    "Type": "Fail",
                    "Error": "UnsupportedContentType",
                    "Cause": "Content type is not supported"
                }
            }
        }

        state_machine = SfnStateMachine(
            self,
            "moderation-workflow",
            name=f"moderation-workflow-{environment_suffix}",
            role_arn=sfn_role.arn,
            definition=json.dumps(state_machine_definition)
        )

        # CloudWatch Dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations"],
                            [".", "Errors"],
                            [".", "Duration"]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "Image Moderation Lambda Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/SQS", "ApproximateNumberOfMessagesVisible",
                             "QueueName", f"human-review-queue-{environment_suffix}"]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "Human Review Queue Depth"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/States", "ExecutionsSucceeded", "StateMachineArn", state_machine.arn],
                            [".", "ExecutionsFailed", ".", "."]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "Step Functions Execution Status"
                    }
                }
            ]
        }

        dashboard = CloudwatchDashboard(
            self,
            "moderation-dashboard",
            dashboard_name=f"moderation-dashboard-{environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )

        # CloudWatch Alarms
        lambda_error_alarm = CloudwatchMetricAlarm(
            self,
            "lambda-error-alarm",
            alarm_name=f"moderation-lambda-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_actions=[notification_topic.arn],
            alarm_description="Alert when Lambda errors exceed threshold"
        )

        queue_depth_alarm = CloudwatchMetricAlarm(
            self,
            "queue-depth-alarm",
            alarm_name=f"human-review-queue-depth-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ApproximateNumberOfMessagesVisible",
            namespace="AWS/SQS",
            period=300,
            statistic="Average",
            threshold=100,
            dimensions={
                "QueueName": f"human-review-queue-{environment_suffix}"
            },
            alarm_actions=[notification_topic.arn],
            alarm_description="Alert when human review queue depth is high"
        )

        sfn_failure_alarm = CloudwatchMetricAlarm(
            self,
            "sfn-failure-alarm",
            alarm_name=f"moderation-workflow-failures-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ExecutionsFailed",
            namespace="AWS/States",
            period=300,
            statistic="Sum",
            threshold=3,
            dimensions={
                "StateMachineArn": state_machine.arn
            },
            alarm_actions=[notification_topic.arn],
            alarm_description="Alert when Step Function executions fail"
        )
