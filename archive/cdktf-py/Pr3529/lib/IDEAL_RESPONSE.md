Here's the complete CDKTF Python infrastructure code for the container registry system:

## tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.ecr_stack import ECRStack
from lib.lambda_stack import LambdaStack
from lib.monitoring_stack import MonitoringStack
from lib.database_stack import DatabaseStack


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
        aws_region = kwargs.get('aws_region', 'us-east-2')
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

        # S3 backend automatically supports state locking via DynamoDB
        # No need to add use_lockfile override

        # Create Database Stack
        database_stack = DatabaseStack(
            self,
            environment_suffix=environment_suffix
        )

        # Create ECR Stack
        ecr_stack = ECRStack(
            self,
            environment_suffix=environment_suffix
        )

        # Create Lambda Stack
        lambda_stack = LambdaStack(
            self,
            environment_suffix=environment_suffix,
            ecr_repository_arn=ecr_stack.repository_arn,
            dynamodb_table_name=database_stack.table_name,
            dynamodb_table_arn=database_stack.table_arn
        )

        # Create Monitoring Stack
        monitoring_stack = MonitoringStack(
            self,
            environment_suffix=environment_suffix,
            ecr_repository_name=ecr_stack.repository_name,
            lambda_function_arn=lambda_stack.function_arn,
            lambda_function_name=lambda_stack.function_name,
            sns_topic_arn=lambda_stack.sns_topic_arn
        )
```

## ecr_stack.py

```python
"""ECR Stack for container registry infrastructure."""

from constructs import Construct
from cdktf_cdktf_provider_aws.ecr_repository import EcrRepository
from cdktf_cdktf_provider_aws.ecr_lifecycle_policy import EcrLifecyclePolicy
from cdktf_cdktf_provider_aws.ecr_registry_scanning_configuration import EcrRegistryScanningConfiguration
from cdktf_cdktf_provider_aws.ecr_pull_through_cache_rule import EcrPullThroughCacheRule
import json


class ECRStack(Construct):
    """ECR repository with scanning and lifecycle policies."""

    def __init__(
        self,
        scope: Construct,
        environment_suffix: str
    ):
        super().__init__(scope, "ECRStack")

        # Create ECR repository
        self.repository = EcrRepository(
            self,
            "container_registry",
            name=f"tap-container-registry-{environment_suffix}",
            image_tag_mutability="MUTABLE",
            image_scanning_configuration={
                "scan_on_push": True
            },
            encryption_configuration=[{
                "encryption_type": "AES256"
            }]
        )

        # Configure registry scanning
        EcrRegistryScanningConfiguration(
            self,
            "registry_scanning",
            scan_type="ENHANCED",
            rule=[
                {
                    "scanFrequency": "CONTINUOUS_SCAN",
                    "repositoryFilter": [
                        {
                            "filter": "*",
                            "filterType": "WILDCARD"
                        }
                    ]
                }
            ]
        )

        # Create lifecycle policy to retain last 30 images
        lifecycle_policy = {
            "rules": [
                {
                    "rulePriority": 1,
                    "description": "Keep last 30 images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 30
                    },
                    "action": {
                        "type": "expire"
                    }
                }
            ]
        }

        EcrLifecyclePolicy(
            self,
            "lifecycle_policy",
            repository=self.repository.name,
            policy=json.dumps(lifecycle_policy)
        )

        # Add pull through cache rule for ECR public images
        # Note: Docker Hub requires authentication credentials for pull-through cache
        # So we only enable ECR public cache which doesn't require authentication
        EcrPullThroughCacheRule(
            self,
            "ecr_public_cache",
            ecr_repository_prefix="ecr-public",
            upstream_registry_url="public.ecr.aws"
        )

        # Export outputs
        self.repository_arn = self.repository.arn
        self.repository_name = self.repository.name
```

## lambda_stack.py

```python
"""Lambda Stack for processing ECR scan results."""

from constructs import Construct
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf import AssetType, TerraformAsset
import json


class LambdaStack(Construct):
    """Lambda function for processing scan results."""

    def __init__(
        self,
        scope: Construct,
        environment_suffix: str,
        *,
        ecr_repository_arn: str,
        dynamodb_table_name: str,
        dynamodb_table_arn: str
    ):
        super().__init__(scope, "LambdaStack")

        # Create SNS topic for security alerts
        self.sns_topic = SnsTopic(
            self,
            "security_alerts",
            name=f"ecr-security-alerts-{environment_suffix}",
            display_name="ECR Security Alerts"
        )

        # Create IAM role for Lambda
        lambda_role = IamRole(
            self,
            "lambda_role",
            name=f"ecr-scan-processor-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Effect": "Allow"
                    }
                ]
            })
        )

        # Create IAM policy for Lambda
        lambda_policy = IamPolicy(
            self,
            "lambda_policy",
            name=f"ecr-scan-processor-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ecr:DescribeImageScanFindings",
                            "ecr:GetAuthorizationToken",
                            "ecr:BatchGetImage"
                        ],
                        "Resource": ecr_repository_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:GetItem"
                        ],
                        "Resource": dynamodb_table_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": self.sns_topic.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            })
        )

        # Attach policies to role
        IamRolePolicyAttachment(
            self,
            "lambda_policy_attachment",
            role=lambda_role.name,
            policy_arn=lambda_policy.arn
        )

        # Package Lambda function code
        lambda_asset = TerraformAsset(
            self,
            "lambda_code",
            path="lib/lambda",
            type=AssetType.ARCHIVE
        )

        # Create Lambda function
        self.lambda_function = LambdaFunction(
            self,
            "scan_processor",
            function_name=f"ecr-scan-processor-{environment_suffix}",
            role=lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            timeout=60,
            memory_size=256,
            filename=lambda_asset.path,
            source_code_hash=lambda_asset.asset_hash,
            environment={
                "variables": {
                    "DYNAMODB_TABLE": dynamodb_table_name,
                    "SNS_TOPIC_ARN": self.sns_topic.arn
                }
            }
        )

        # Grant EventBridge permission to invoke Lambda
        LambdaPermission(
            self,
            "eventbridge_permission",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function_name=self.lambda_function.function_name,
            principal="events.amazonaws.com"
        )

        # Export outputs
        self.function_arn = self.lambda_function.arn
        self.function_name = self.lambda_function.function_name
        self.sns_topic_arn = self.sns_topic.arn
```

## database_stack.py

```python
"""DynamoDB Stack for storing image metadata."""

from constructs import Construct
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable


class DatabaseStack(Construct):
    """DynamoDB table for image metadata storage."""

    def __init__(
        self,
        scope: Construct,
        environment_suffix: str
    ):
        super().__init__(scope, "DatabaseStack")

        # Create DynamoDB table
        self.table = DynamodbTable(
            self,
            "image_metadata",
            name=f"ecr-image-metadata-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="image_digest",
            range_key="push_timestamp",
            attribute=[
                {
                    "name": "image_digest",
                    "type": "S"
                },
                {
                    "name": "push_timestamp",
                    "type": "N"
                },
                {
                    "name": "repository_name",
                    "type": "S"
                }
            ],
            global_secondary_index=[
                {
                    "name": "repository-index",
                    "hashKey": "repository_name",
                    "rangeKey": "push_timestamp",
                    "projectionType": "ALL"
                }
            ],
            point_in_time_recovery={
                "enabled": True
            },
            server_side_encryption={
                "enabled": True
            }
        )

        # Export outputs
        self.table_name = self.table.name
        self.table_arn = self.table.arn
```

## monitoring_stack.py

```python
"""Monitoring Stack for CloudWatch and EventBridge."""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.scheduler_schedule import SchedulerSchedule
from cdktf_cdktf_provider_aws.scheduler_schedule_group import SchedulerScheduleGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
import json


class MonitoringStack(Construct):
    """Monitoring stack with CloudWatch and EventBridge."""

    def __init__(
        self,
        scope: Construct,
        environment_suffix: str,
        *,
        ecr_repository_name: str,
        lambda_function_arn: str,
        lambda_function_name: str,
        sns_topic_arn: str
    ):
        super().__init__(scope, "MonitoringStack")

        # Create EventBridge rule for ECR scan completion
        scan_rule = CloudwatchEventRule(
            self,
            "ecr_scan_complete",
            name=f"ecr-scan-complete-{environment_suffix}",
            description="Trigger Lambda on ECR scan completion",
            event_pattern=json.dumps({
                "source": ["aws.ecr"],
                "detail-type": ["ECR Image Scan"],
                "detail": {
                    "scan-status": ["COMPLETE"],
                    "repository-name": [ecr_repository_name]
                }
            })
        )

        # Add Lambda as target for EventBridge rule
        CloudwatchEventTarget(
            self,
            "scan_lambda_target",
            rule=scan_rule.name,
            arn=lambda_function_arn,
            target_id="1"
        )

        # Create EventBridge Scheduler group
        schedule_group = SchedulerScheduleGroup(
            self,
            "cleanup_schedule_group",
            name=f"ecr-cleanup-{environment_suffix}"
        )

        # Create role for EventBridge Scheduler
        scheduler_role = IamRole(
            self,
            "scheduler_role",
            name=f"ecr-scheduler-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "scheduler.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            inline_policy=[
                {
                    "name": "invoke_lambda",
                    "policy": json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": "lambda:InvokeFunction",
                                "Resource": lambda_function_arn
                            }
                        ]
                    })
                }
            ]
        )

        # Create periodic cleanup schedule
        SchedulerSchedule(
            self,
            "cleanup_schedule",
            name=f"ecr-cleanup-{environment_suffix}",
            group_name=schedule_group.name,
            flexible_time_window={
                "mode": "FLEXIBLE",
                "maximum_window_in_minutes": 15
            },
            schedule_expression="rate(1 day)",
            target={
                "arn": lambda_function_arn,
                "role_arn": scheduler_role.arn,
                "input": json.dumps({
                    "action": "cleanup",
                    "repository": ecr_repository_name
                })
            }
        )

        # Create CloudWatch Dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ECR", "RepositoryPushCount", {"stat": "Sum", "label": "Push Count"}],
                            [".", "RepositoryPullCount", {"stat": "Sum", "label": "Pull Count"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-2",
                        "title": "ECR Repository Activity"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Scan Processor Invocations"}],
                            [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                            [".", "Duration", {"stat": "Average", "label": "Duration (ms)"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-2",
                        "title": "Lambda Function Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/SNS", "NumberOfMessagesPublished", {"stat": "Sum", "label": "Security Alerts Sent"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": "us-east-2",
                        "title": "Security Notifications"
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            "ecr_dashboard",
            dashboard_name=f"ecr-registry-metrics-{environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )
```

## lambda/index.py

```python
import json
import os
import boto3
from datetime import datetime

# Initialize AWS clients - will be done inside handler to allow mocking
dynamodb = None
sns = None
ecr = None

def initialize_clients():
    """Initialize AWS clients."""
    global dynamodb, sns, ecr
    if dynamodb is None:
        dynamodb = boto3.resource('dynamodb')
    if sns is None:
        sns = boto3.client('sns')
    if ecr is None:
        ecr = boto3.client('ecr')

# Get environment variables - will be loaded at runtime
TABLE_NAME = None
SNS_TOPIC_ARN = None

def handler(event, context):
    """Process ECR scan results and send alerts for critical vulnerabilities."""

    # Initialize AWS clients
    initialize_clients()

    # Load environment variables
    global TABLE_NAME, SNS_TOPIC_ARN
    TABLE_NAME = os.environ.get('DYNAMODB_TABLE', 'ecr-image-metadata')
    SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')

    # Check if this is a cleanup event from EventBridge Scheduler
    if event.get('action') == 'cleanup':
        return handle_cleanup(event)

    # Parse ECR scan completion event
    detail = event['detail']
    repository_name = detail['repository-name']
    image_digest = detail['image-digest']
    image_tags = detail.get('image-tags', [])

    # Get scan findings from ECR
    try:
        response = ecr.describe_image_scan_findings(
            repositoryName=repository_name,
            imageId={'imageDigest': image_digest}
        )

        findings = response['imageScanFindings']
        finding_counts = findings.get('findingSeverityCounts', {})

        # Count vulnerabilities by severity
        critical_count = finding_counts.get('CRITICAL', 0)
        high_count = finding_counts.get('HIGH', 0)
        medium_count = finding_counts.get('MEDIUM', 0)
        low_count = finding_counts.get('LOW', 0)

        # Store metadata in DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        timestamp = int(datetime.now().timestamp())

        table.put_item(
            Item={
                'image_digest': image_digest,
                'push_timestamp': timestamp,
                'repository_name': repository_name,
                'image_tags': image_tags,
                'critical_vulnerabilities': critical_count,
                'high_vulnerabilities': high_count,
                'medium_vulnerabilities': medium_count,
                'low_vulnerabilities': low_count,
                'scan_status': 'COMPLETE',
                'scan_timestamp': timestamp
            }
        )

        # Send SNS alert if critical vulnerabilities found
        if critical_count > 0:
            message = {
                'repository': repository_name,
                'image_digest': image_digest,
                'image_tags': image_tags,
                'critical_vulnerabilities': critical_count,
                'high_vulnerabilities': high_count,
                'message': f'CRITICAL: Image {repository_name}:{image_tags[0] if image_tags else image_digest[:12]} has {critical_count} critical vulnerabilities!'
            }

            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f'ECR Security Alert - {critical_count} Critical Vulnerabilities',
                Message=json.dumps(message, indent=2)
            )

            print(f"Alert sent for {critical_count} critical vulnerabilities")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Scan results processed successfully',
                'repository': repository_name,
                'image_digest': image_digest,
                'vulnerabilities': finding_counts
            })
        }

    except Exception as e:
        print(f"Error processing scan results: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def handle_cleanup(event):
    """Handle periodic cleanup tasks."""
    repository_name = event.get('repository')

    # This function could be extended to perform additional cleanup tasks
    # For now, lifecycle policies handle image cleanup automatically

    print(f"Cleanup task executed for repository: {repository_name}")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Cleanup task completed',
            'repository': repository_name
        })
    }
```