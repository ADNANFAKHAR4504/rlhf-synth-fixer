# Content Moderation System Infrastructure Implementation

Here's the complete CDKTF Python infrastructure code for the content moderation system:

## Main Stack File

```python
# lib/tap_stack.py
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.content_moderation_stack import ContentModerationStack


class TapStack(TerraformStack):
    """CDKTF Python stack for TAP infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-west-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Create Content Moderation Stack
        ContentModerationStack(
            self,
            "content-moderation",
            environment_suffix=environment_suffix,
            aws_region=aws_region
        )
```

## Content Moderation Stack

```python
# lib/content_moderation_stack.py
"""Content Moderation Stack with all AWS services."""

from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import S3BucketServerSideEncryptionConfiguration, S3BucketServerSideEncryptionConfigurationRuleA
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import S3BucketLifecycleConfiguration, S3BucketLifecycleConfigurationRule
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableGlobalSecondaryIndex
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

        S3BucketVersioning(
            self,
            "content-bucket-versioning",
            bucket=content_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        S3BucketServerSideEncryptionConfiguration(
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
                    expiration={
                        "days": 30
                    },
                    filter={
                        "prefix": "processed/"
                    }
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
                path=os.path.join(os.path.dirname(__file__), "lambda", "image_moderation.zip"),
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
                path=os.path.join(os.path.dirname(__file__), "lambda", "text_moderation.zip"),
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
                path=os.path.join(os.path.dirname(__file__), "lambda", "result_processor.zip"),
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
                            ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Image Moderation"}],
                            [".", "Errors", {"stat": "Sum", "label": "Image Errors"}],
                            [".", "Duration", {"stat": "Average", "label": "Image Duration"}]
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
                            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", {"dimensions": {"QueueName": f"human-review-queue-{environment_suffix}"}}]
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
                            ["AWS/States", "ExecutionsSucceeded", {"dimensions": {"StateMachineArn": state_machine.arn}}],
                            [".", "ExecutionsFailed", {"dimensions": {"StateMachineArn": state_machine.arn}}]
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
```

## Lambda Function - Image Moderation

```python
# lib/lambda/image_moderation.py
import json
import boto3
import os
from datetime import datetime

rekognition = boto3.client('rekognition')
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
sns = boto3.client('sns')

MODERATION_TABLE = os.environ['MODERATION_TABLE']
HUMAN_REVIEW_QUEUE = os.environ['HUMAN_REVIEW_QUEUE']
NOTIFICATION_TOPIC = os.environ['NOTIFICATION_TOPIC']
CONFIDENCE_THRESHOLD = float(os.environ.get('CONFIDENCE_THRESHOLD', 75))

def handler(event, context):
    """Process image moderation using AWS Rekognition."""
    try:
        content_id = event['contentId']
        s3_bucket = event['s3Bucket']
        s3_key = event['s3Key']

        # Call Rekognition to detect moderation labels
        response = rekognition.detect_moderation_labels(
            Image={
                'S3Object': {
                    'Bucket': s3_bucket,
                    'Name': s3_key
                }
            },
            MinConfidence=60.0
        )

        moderation_labels = response.get('ModerationLabels', [])

        # Check if any labels exceed threshold
        requires_review = False
        high_confidence_labels = []

        for label in moderation_labels:
            if label['Confidence'] >= CONFIDENCE_THRESHOLD:
                requires_review = True
                high_confidence_labels.append({
                    'Name': label['Name'],
                    'Confidence': label['Confidence'],
                    'ParentName': label.get('ParentName', '')
                })

        # Store result in DynamoDB
        table = dynamodb.Table(MODERATION_TABLE)
        timestamp = int(datetime.utcnow().timestamp() * 1000)

        result = {
            'contentId': content_id,
            'timestamp': timestamp,
            'contentType': 'image',
            's3Location': f"s3://{s3_bucket}/{s3_key}",
            'moderationLabels': high_confidence_labels,
            'requiresReview': requires_review,
            'reviewStatus': 'pending' if requires_review else 'approved',
            'processedAt': datetime.utcnow().isoformat()
        }

        table.put_item(Item=result)

        # If requires review, send notification
        if requires_review:
            message = {
                'contentId': content_id,
                'contentType': 'image',
                'labels': high_confidence_labels,
                's3Location': f"s3://{s3_bucket}/{s3_key}"
            }

            sns.publish(
                TopicArn=NOTIFICATION_TOPIC,
                Message=json.dumps(message),
                Subject='Content Requires Manual Review'
            )

        return {
            'statusCode': 200,
            'contentId': content_id,
            'requiresReview': requires_review,
            'moderationResult': result
        }

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise
```

## Lambda Function - Text Moderation

```python
# lib/lambda/text_moderation.py
import json
import boto3
import os
from datetime import datetime

comprehend = boto3.client('comprehend')
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
sns = boto3.client('sns')

MODERATION_TABLE = os.environ['MODERATION_TABLE']
HUMAN_REVIEW_QUEUE = os.environ['HUMAN_REVIEW_QUEUE']
NOTIFICATION_TOPIC = os.environ['NOTIFICATION_TOPIC']
TOXICITY_THRESHOLD = float(os.environ.get('TOXICITY_THRESHOLD', 0.7))

def handler(event, context):
    """Process text moderation using AWS Comprehend."""
    try:
        content_id = event['contentId']
        s3_bucket = event['s3Bucket']
        s3_key = event['s3Key']

        # Get text content from S3
        response = s3.get_object(Bucket=s3_bucket, Key=s3_key)
        text_content = response['Body'].read().decode('utf-8')

        # Limit text to 1KB for toxicity detection
        text_segments = [text_content[i:i+1024] for i in range(0, min(len(text_content), 10240), 1024)]

        # Detect toxicity
        toxicity_results = []
        max_toxicity_score = 0
        toxic_categories = []

        for segment in text_segments[:10]:  # API limit: 10 segments
            toxicity_response = comprehend.detect_toxic_content(
                TextSegments=[{'Text': segment}],
                LanguageCode='en'
            )

            for result in toxicity_response['ResultList']:
                toxicity_score = result.get('Toxicity', 0)
                if toxicity_score > max_toxicity_score:
                    max_toxicity_score = toxicity_score

                for label in result.get('Labels', []):
                    if label['Score'] > TOXICITY_THRESHOLD:
                        toxic_categories.append({
                            'Name': label['Name'],
                            'Score': label['Score']
                        })

        # Detect sentiment
        sentiment_response = comprehend.detect_sentiment(
            Text=text_content[:5000],  # Limit for sentiment API
            LanguageCode='en'
        )

        sentiment = sentiment_response.get('Sentiment', 'NEUTRAL')
        sentiment_scores = sentiment_response.get('SentimentScore', {})

        # Determine if review is needed
        requires_review = max_toxicity_score > TOXICITY_THRESHOLD or len(toxic_categories) > 0

        # Store result in DynamoDB
        table = dynamodb.Table(MODERATION_TABLE)
        timestamp = int(datetime.utcnow().timestamp() * 1000)

        result = {
            'contentId': content_id,
            'timestamp': timestamp,
            'contentType': 'text',
            's3Location': f"s3://{s3_bucket}/{s3_key}",
            'toxicityScore': max_toxicity_score,
            'toxicCategories': toxic_categories,
            'sentiment': sentiment,
            'sentimentScores': sentiment_scores,
            'requiresReview': requires_review,
            'reviewStatus': 'pending' if requires_review else 'approved',
            'processedAt': datetime.utcnow().isoformat()
        }

        table.put_item(Item=result)

        # If requires review, send notification
        if requires_review:
            message = {
                'contentId': content_id,
                'contentType': 'text',
                'toxicityScore': max_toxicity_score,
                'categories': toxic_categories,
                's3Location': f"s3://{s3_bucket}/{s3_key}"
            }

            sns.publish(
                TopicArn=NOTIFICATION_TOPIC,
                Message=json.dumps(message),
                Subject='Content Requires Manual Review'
            )

        return {
            'statusCode': 200,
            'contentId': content_id,
            'requiresReview': requires_review,
            'moderationResult': result
        }

    except Exception as e:
        print(f"Error processing text: {str(e)}")
        raise
```

## Lambda Function - Result Processor

```python
# lib/lambda/result_processor.py
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

MODERATION_TABLE = os.environ['MODERATION_TABLE']
CONTENT_BUCKET = os.environ['CONTENT_BUCKET']

def handler(event, context):
    """Process and finalize moderation results."""
    try:
        moderation_result = event.get('moderationResult', {})
        content_id = moderation_result.get('contentId')

        # Update DynamoDB with final status
        table = dynamodb.Table(MODERATION_TABLE)

        # Get current item
        response = table.get_item(
            Key={
                'contentId': content_id,
                'timestamp': moderation_result.get('timestamp')
            }
        )

        if 'Item' in response:
            # Update with final processing status
            table.update_item(
                Key={
                    'contentId': content_id,
                    'timestamp': moderation_result.get('timestamp')
                },
                UpdateExpression='SET processingStatus = :status, completedAt = :completed',
                ExpressionAttributeValues={
                    ':status': 'completed',
                    ':completed': datetime.utcnow().isoformat()
                }
            )

        # Move content to processed folder if approved
        if moderation_result.get('reviewStatus') == 'approved':
            s3_location = moderation_result.get('s3Location', '')
            if s3_location:
                # Parse S3 location
                parts = s3_location.replace('s3://', '').split('/', 1)
                if len(parts) == 2:
                    source_bucket = parts[0]
                    source_key = parts[1]
                    dest_key = f"processed/{source_key}"

                    # Copy to processed folder
                    s3.copy_object(
                        Bucket=CONTENT_BUCKET,
                        CopySource={'Bucket': source_bucket, 'Key': source_key},
                        Key=dest_key
                    )

        return {
            'statusCode': 200,
            'message': 'Result processed successfully',
            'contentId': content_id
        }

    except Exception as e:
        print(f"Error processing result: {str(e)}")
        raise
```