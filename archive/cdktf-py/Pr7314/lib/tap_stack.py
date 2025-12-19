from cdktf import TerraformStack, TerraformOutput, Fn, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition
)
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import (
    IamRolePolicyAttachment
)
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable, DynamodbTableAttribute, DynamodbTableGlobalSecondaryIndex
)
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import (
    CloudwatchMetricAlarm,
    CloudwatchMetricAlarmMetricQuery,
    CloudwatchMetricAlarmMetricQueryMetric
)
import json
import os
import zipfile
import hashlib
import base64


class TapStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        stack_id: str,
        environment_suffix: str,
        state_bucket: str = None,
        state_bucket_region: str = None,
        aws_region: str = None,
        default_tags: dict = None,
        **kwargs
    ):
        super().__init__(scope, stack_id)

        # Get environment suffix from parameter or environment variable
        self.environment_suffix = environment_suffix or os.environ.get('ENVIRONMENT_SUFFIX', 'test')
        state_bucket = state_bucket or os.environ.get('TERRAFORM_STATE_BUCKET')
        state_bucket_region = state_bucket_region or os.environ.get('TERRAFORM_STATE_BUCKET_REGION', 'us-east-1')

        # Configure S3 backend for remote state (if state_bucket is provided)
        # Note: DynamoDB table for locking is not included to avoid ResourceNotFoundException
        # State locking can be added later if needed by setting TERRAFORM_STATE_LOCK_TABLE env var
        if state_bucket:
            S3Backend(
                self,
                bucket=state_bucket,
                key=f"tap/{self.environment_suffix}/terraform.tfstate",
                region=state_bucket_region,
                encrypt=True
            )
            print(f'✅ Configured S3 backend: s3://{state_bucket}/tap/{self.environment_suffix}/terraform.tfstate')

        # Define regions and their CIDR blocks
        self.regions = [
            {"name": "us-east-1", "cidr": "10.0.0.0/16"},
            {"name": "eu-west-1", "cidr": "10.1.0.0/16"},
            {"name": "ap-southeast-1", "cidr": "10.2.0.0/16"}
        ]

        # Create Lambda deployment package
        lib_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(lib_dir)  # Go up one level from lib/ to project root
        lambda_code_path = os.path.join(lib_dir, "lambda", "index.py")
        # Create ZIP in project root for easier Terraform access
        lambda_zip_path = os.path.join(project_root, "lambda_function.zip")
        
        # Read Lambda code content
        if os.path.exists(lambda_code_path):
            with open(lambda_code_path, "r") as f:
                lambda_code_content = f.read()
        else:
            # Fallback code if file doesn't exist
            lambda_code_content = """
import json
import os
import boto3
from botocore.exceptions import ClientError

def handler(event, context):
    '''
    ETL Lambda function for data analytics processing
    '''
    try:
        # Get environment variables
        bucket_name = os.environ.get('BUCKET_NAME')
        table_name = os.environ.get('TABLE_NAME')
        region = os.environ.get('REGION')
        environment = os.environ.get('ENVIRONMENT_SUFFIX')
        
        # Initialize AWS clients
        s3 = boto3.client('s3', region_name=region)
        dynamodb = boto3.resource('dynamodb', region_name=region)
        
        # Process S3 event
        for record in event.get('Records', []):
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            # Process the file (simplified)
            print(f"Processing {key} from {bucket} in {region}")
            
            # Update DynamoDB with job metadata
            table = dynamodb.Table(table_name)
            table.put_item(
                Item={
                    'job_id': context.request_id,
                    'timestamp': int(context.aws_request_id[-8:], 16),
                    'bucket': bucket,
                    'key': key,
                    'region': region,
                    'status': 'processed',
                    'environment': environment
                }
            )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing completed successfully',
                'region': region
            })
        }
    except Exception as e:
        print(f"Error processing: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
"""
        
        # Create ZIP file for Lambda deployment
        with zipfile.ZipFile(lambda_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Write the Lambda code as index.py
            zipf.writestr("index.py", lambda_code_content)
        
        # Calculate SHA256 hash for source_code_hash
        with open(lambda_zip_path, 'rb') as f:
            zip_hash = hashlib.sha256(f.read()).digest()
            self.lambda_zip_hash_base64 = base64.b64encode(zip_hash).decode('utf-8')
        
        # Store the ZIP file path for use in Lambda functions
        # Use relative path from Terraform working directory (cdktf.out/stacks/{stack_id}/)
        # Relative path: ../../../lambda_function.zip (up 3 levels: stacks -> cdktf.out -> project root)
        self.lambda_zip_path = "../../../lambda_function.zip"

        # Deploy infrastructure to each region
        for region_config in self.regions:
            self.create_regional_infrastructure(region_config)

    def create_regional_infrastructure(self, region_config: dict):
        """Create complete infrastructure for a single region"""
        region = region_config["name"]
        cidr = region_config["cidr"]

        # Create AWS provider for this region
        provider = AwsProvider(
            self,
            f"aws_{region.replace('-', '_')}",
            region=region,
            alias=region
        )

        # Create VPC
        vpc = Vpc(
            self,
            f"vpc_{region.replace('-', '_')}",
            cidr_block=cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"analytics-vpc-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Create S3 bucket for raw data storage
        bucket = S3Bucket(
            self,
            f"data_bucket_{region.replace('-', '_')}",
            bucket=f"analytics-bucket-{region}-{self.environment_suffix}",
            force_destroy=True,
            tags={
                "Name": f"analytics-bucket-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            f"bucket_versioning_{region.replace('-', '_')}",
            bucket=bucket.id,
            versioning_configuration={
                "status": "Enabled"
            },
            provider=provider
        )

        # Enable SSE-S3 encryption
        encryption_default = (
            S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                sse_algorithm="AES256"
            )
        )
        S3BucketServerSideEncryptionConfigurationA(
            self,
            f"bucket_encryption_{region.replace('-', '_')}",
            bucket=bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=encryption_default
            )],
            provider=provider
        )

        # Configure lifecycle policy to transition to Glacier after 90 days
        S3BucketLifecycleConfiguration(
            self,
            f"bucket_lifecycle_{region.replace('-', '_')}",
            bucket=bucket.id,
            rule=[S3BucketLifecycleConfigurationRule(
                id="transition-to-glacier",
                status="Enabled",
                transition=[S3BucketLifecycleConfigurationRuleTransition(
                    days=90,
                    storage_class="GLACIER"
                )]
            )],
            provider=provider
        )

        # Create IAM role for Lambda
        lambda_role = IamRole(
            self,
            f"lambda_role_{region.replace('-', '_')}",
            name=f"analytics-lambda-role-{region}-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            inline_policy=[IamRoleInlinePolicy(
                name="lambda-permissions",
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObject",
                                "s3:PutObject"
                            ],
                            "Resource": f"{bucket.arn}/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:GetItem"
                            ],
                            "Resource": (
                                f"arn:aws:dynamodb:{region}:*:table/"
                                f"analytics-jobs-{region}-{self.environment_suffix}"
                            )
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "sqs:ReceiveMessage",
                                "sqs:DeleteMessage",
                                "sqs:GetQueueAttributes"
                            ],
                            "Resource": (
                                f"arn:aws:sqs:{region}:*:"
                                f"analytics-queue-{region}-{self.environment_suffix}"
                            )
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": (
                                f"arn:aws:logs:{region}:*:log-group:"
                                f"/aws/lambda/analytics-etl-{region}-"
                                f"{self.environment_suffix}:*"
                            )
                        }
                    ]
                })
            )],
            tags={
                "Name": f"analytics-lambda-role-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            f"lambda_basic_execution_{region.replace('-', '_')}",
            role=lambda_role.name,
            policy_arn=(
                "arn:aws:iam::aws:policy/service-role/"
                "AWSLambdaBasicExecutionRole"
            ),
            provider=provider
        )

        # Create CloudWatch Log Group for Lambda
        log_group = CloudwatchLogGroup(
            self,
            f"lambda_log_group_{region.replace('-', '_')}",
            name=f"/aws/lambda/analytics-etl-{region}-{self.environment_suffix}",
            retention_in_days=30,
            tags={
                "Name": f"analytics-lambda-logs-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Create Lambda function
        # Use the programmatically created ZIP file
        lambda_function = LambdaFunction(
            self,
            f"etl_lambda_{region.replace('-', '_')}",
            function_name=f"analytics-etl-{region}-{self.environment_suffix}",
            role=lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            memory_size=1024,
            timeout=300,
            filename=self.lambda_zip_path,
            source_code_hash=self.lambda_zip_hash_base64,
            environment={
                "variables": {
                    "BUCKET_NAME": bucket.id,
                    "TABLE_NAME": f"analytics-jobs-{region}-{self.environment_suffix}",
                    "REGION": region,
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            },
            tags={
                "Name": f"analytics-etl-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider,
            depends_on=[log_group]
        )

        # Create DynamoDB table for job metadata
        dynamodb_table = DynamodbTable(
            self,
            f"jobs_table_{region.replace('-', '_')}",
            name=f"analytics-jobs-{region}-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="job_id",
            attribute=[
                DynamodbTableAttribute(
                    name="job_id",
                    type="S"
                ),
                DynamodbTableAttribute(
                    name="timestamp",
                    type="N"
                )
            ],
            global_secondary_index=[DynamodbTableGlobalSecondaryIndex(
                name="timestamp-index",
                hash_key="timestamp",
                projection_type="ALL"
            )],
            point_in_time_recovery={
                "enabled": True
            },
            tags={
                "Name": f"analytics-jobs-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Create dead-letter queue
        dlq = SqsQueue(
            self,
            f"dlq_{region.replace('-', '_')}",
            name=f"analytics-dlq-{region}-{self.environment_suffix}",
            tags={
                "Name": f"analytics-dlq-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Create SQS queue for event processing
        queue = SqsQueue(
            self,
            f"event_queue_{region.replace('-', '_')}",
            name=f"analytics-queue-{region}-{self.environment_suffix}",
            visibility_timeout_seconds=300,
            redrive_policy=json.dumps({
                "deadLetterTargetArn": dlq.arn,
                "maxReceiveCount": 3
            }),
            tags={
                "Name": f"analytics-queue-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Create EventBridge rule for S3 events
        event_rule = CloudwatchEventRule(
            self,
            f"s3_event_rule_{region.replace('-', '_')}",
            name=f"analytics-s3-events-{region}-{self.environment_suffix}",
            description="Trigger Lambda on S3 object creation",
            event_pattern=json.dumps({
                "source": ["aws.s3"],
                "detail-type": ["Object Created"],
                "detail": {
                    "bucket": {
                        "name": [bucket.id]
                    }
                }
            }),
            tags={
                "Name": f"analytics-s3-events-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Add Lambda as target for EventBridge rule
        CloudwatchEventTarget(
            self,
            f"event_target_{region.replace('-', '_')}",
            rule=event_rule.name,
            arn=lambda_function.arn,
            provider=provider
        )

        # Grant EventBridge permission to invoke Lambda
        LambdaPermission(
            self,
            f"lambda_eventbridge_permission_{region.replace('-', '_')}",
            statement_id="AllowExecutionFromEventBridge",
            action="lambda:InvokeFunction",
            function_name=lambda_function.function_name,
            principal="events.amazonaws.com",
            source_arn=event_rule.arn,
            provider=provider
        )

        # Create CloudWatch dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Invocations"}],
                            [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                            [".", "Duration", {"stat": "Average", "label": "Avg Duration"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": region,
                        "title": "Lambda Metrics",
                        "yAxis": {
                            "left": {
                                "min": 0
                            }
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            [
                                "AWS/SQS",
                                "ApproximateNumberOfMessagesVisible",
                                {"stat": "Average", "label": "Queue Depth"}
                            ],
                            [
                                ".",
                                "NumberOfMessagesSent",
                                {"stat": "Sum", "label": "Messages Sent"}
                            ],
                            [
                                ".",
                                "NumberOfMessagesReceived",
                                {"stat": "Sum", "label": "Messages Received"}
                            ]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": region,
                        "title": "SQS Metrics"
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            f"monitoring_dashboard_{region.replace('-', '_')}",
            dashboard_name=f"analytics-monitoring-{region}-{self.environment_suffix}",
            dashboard_body=json.dumps(dashboard_body),
            provider=provider
        )

        # Create CloudWatch alarm for Lambda errors
        CloudwatchMetricAlarm(
            self,
            f"lambda_error_alarm_{region.replace('-', '_')}",
            alarm_name=f"analytics-lambda-errors-{region}-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when Lambda error rate exceeds threshold",
            dimensions={
                "FunctionName": lambda_function.function_name
            },
            tags={
                "Name": f"analytics-lambda-errors-{region}-{self.environment_suffix}",
                "Environment": "Production",
                "ManagedBy": "CDKTF",
                "Region": region
            },
            provider=provider
        )

        # Create outputs for this region
        TerraformOutput(
            self,
            f"s3_bucket_name_{region.replace('-', '_')}",
            value=bucket.id,
            description=f"S3 bucket name in {region}"
        )

        TerraformOutput(
            self,
            f"lambda_function_arn_{region.replace('-', '_')}",
            value=lambda_function.arn,
            description=f"Lambda function ARN in {region}"
        )

        TerraformOutput(
            self,
            f"dynamodb_table_name_{region.replace('-', '_')}",
            value=dynamodb_table.name,
            description=f"DynamoDB table name in {region}"
        )

        TerraformOutput(
            self,
            f"sqs_queue_url_{region.replace('-', '_')}",
            value=queue.url,
            description=f"SQS queue URL in {region}"
        )

        TerraformOutput(
            self,
            f"vpc_id_{region.replace('-', '_')}",
            value=vpc.id,
            description=f"VPC ID in {region}"
        )
