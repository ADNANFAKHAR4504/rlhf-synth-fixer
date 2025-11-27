"""TAP Stack module for CDKTF Python infrastructure."""

from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableReplica,
    DynamodbTableAttribute,
    DynamodbTablePointInTimeRecovery,
    DynamodbTableGlobalSecondaryIndex
)
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import (
    S3BucketVersioningA,
    S3BucketVersioningVersioningConfiguration
)
from cdktf_cdktf_provider_aws.s3_bucket_replication_configuration import (
    S3BucketReplicationConfigurationA,
    S3BucketReplicationConfigurationRule,
    S3BucketReplicationConfigurationRuleDestination,
    S3BucketReplicationConfigurationRuleFilter
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import (
    CloudwatchMetricAlarm
)
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
import json
import os


class TapStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        ns: str,
        environment_suffix: str,
        state_bucket: str,
        state_bucket_region: str,
        aws_region: str,
        default_tags: dict
    ):
        super().__init__(scope, ns)

        self.environment_suffix = environment_suffix
        self.state_bucket = state_bucket
        self.state_bucket_region = state_bucket_region
        self.aws_region = aws_region
        self.default_tags = default_tags

        # Configure S3 backend for Terraform state
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"tap-stack-{environment_suffix}.tfstate",
            region=state_bucket_region
        )

        # Primary region (us-east-1)
        primary_provider = AwsProvider(
            self,
            "aws_primary",
            region="us-east-1",
            alias="primary",
            default_tags=[default_tags]
        )

        # Secondary region (us-west-2)
        secondary_provider = AwsProvider(
            self,
            "aws_secondary",
            region="us-west-2",
            alias="secondary",
            default_tags=[default_tags]
        )

        # Create DynamoDB Global Table for payment transactions
        self.payments_table = self._create_dynamodb_table(primary_provider, secondary_provider)

        # Create S3 buckets with cross-region replication
        self.primary_bucket, self.secondary_bucket = self._create_s3_replication(
            primary_provider, secondary_provider
        )

        # Create Lambda functions in both regions
        self.primary_lambda, self.secondary_lambda = self._create_lambda_functions(
            primary_provider, secondary_provider
        )

        # Create SNS topics for notifications
        self.primary_sns, self.secondary_sns = self._create_sns_topics(
            primary_provider, secondary_provider
        )

        # Create CloudWatch alarms
        self._create_cloudwatch_alarms(primary_provider, secondary_provider)

        # Outputs
        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=self.payments_table.name,
            description="DynamoDB Global Table name"
        )

        TerraformOutput(
            self,
            "primary_bucket_name",
            value=self.primary_bucket.bucket,
            description="Primary S3 bucket name"
        )

        TerraformOutput(
            self,
            "secondary_bucket_name",
            value=self.secondary_bucket.bucket,
            description="Secondary S3 bucket name"
        )

        TerraformOutput(
            self,
            "primary_lambda_arn",
            value=self.primary_lambda.arn,
            description="Primary Lambda function ARN"
        )

        TerraformOutput(
            self,
            "secondary_lambda_arn",
            value=self.secondary_lambda.arn,
            description="Secondary Lambda function ARN"
        )

    def _create_dynamodb_table(self, primary_provider, secondary_provider):
        """Create DynamoDB Global Table with cross-region replication"""

        table = DynamodbTable(
            self,
            "payments_table",
            name=f"payments-table-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            attribute=[
                DynamodbTableAttribute(name="transaction_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N"),
                DynamodbTableAttribute(name="status", type="S")
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="status-index",
                    hash_key="status",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            replica=[
                DynamodbTableReplica(region_name="us-west-2")
            ],
            provider=primary_provider
        )

        return table

    def _create_s3_replication(self, primary_provider, secondary_provider):
        """Create S3 buckets with cross-region replication"""

        # IAM role for replication
        replication_role = IamRole(
            self,
            "s3_replication_role",
            name=f"s3-replication-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            provider=primary_provider
        )

        # Primary bucket (source)
        primary_bucket = S3Bucket(
            self,
            "primary_audit_bucket",
            bucket=f"payment-audit-primary-{self.environment_suffix}",
            provider=primary_provider
        )

        # Enable versioning on primary bucket
        S3BucketVersioningA(
            self,
            "primary_bucket_versioning",
            bucket=primary_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            ),
            provider=primary_provider
        )

        # Secondary bucket (destination)
        secondary_bucket = S3Bucket(
            self,
            "secondary_audit_bucket",
            bucket=f"payment-audit-secondary-{self.environment_suffix}",
            provider=secondary_provider
        )

        # Enable versioning on secondary bucket
        S3BucketVersioningA(
            self,
            "secondary_bucket_versioning",
            bucket=secondary_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            ),
            provider=secondary_provider
        )

        # Replication policy
        replication_policy = IamRolePolicy(
            self,
            "replication_policy",
            role=replication_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetReplicationConfiguration",
                            "s3:ListBucket"
                        ],
                        "Resource": primary_bucket.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObjectVersionForReplication",
                            "s3:GetObjectVersionAcl"
                        ],
                        "Resource": f"{primary_bucket.arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ReplicateObject",
                            "s3:ReplicateDelete"
                        ],
                        "Resource": f"{secondary_bucket.arn}/*"
                    }
                ]
            }),
            provider=primary_provider
        )

        # Replication configuration
        S3BucketReplicationConfigurationA(
            self,
            "bucket_replication",
            bucket=primary_bucket.id,
            role=replication_role.arn,
            rule=[S3BucketReplicationConfigurationRule(
                id="replicate-all",
                status="Enabled",
                priority=1,
                filter=S3BucketReplicationConfigurationRuleFilter(prefix=""),
                destination=S3BucketReplicationConfigurationRuleDestination(
                    bucket=secondary_bucket.arn,
                    storage_class="STANDARD"
                )
            )],
            depends_on=[replication_policy],
            provider=primary_provider
        )

        return primary_bucket, secondary_bucket

    def _create_lambda_functions(self, primary_provider, secondary_provider):
        """Create Lambda functions in both regions for payment processing"""

        # IAM role for Lambda
        lambda_role = IamRole(
            self,
            "lambda_execution_role",
            name=f"payment-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            provider=primary_provider
        )

        # Lambda policy
        IamRolePolicy(
            self,
            "lambda_policy",
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
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:UpdateItem"
                        ],
                        "Resource": self.payments_table.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": [
                            f"{self.primary_bucket.arn}/*",
                            f"{self.secondary_bucket.arn}/*"
                        ]
                    }
                ]
            }),
            provider=primary_provider
        )

        # Lambda function code
        lambda_code = """
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

def handler(event, context):
    table_name = os.environ['DYNAMODB_TABLE']
    bucket_name = os.environ['S3_BUCKET']

    table = dynamodb.Table(table_name)

    # Process payment
    transaction_id = event.get('transaction_id', 'unknown')
    amount = event.get('amount', 0)
    timestamp = int(datetime.now().timestamp())

    # Store in DynamoDB
    table.put_item(
        Item={
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'status': 'completed',
            'amount': amount
        }
    )

    # Store audit log in S3
    s3.put_object(
        Bucket=bucket_name,
        Key=f"transactions/{transaction_id}.json",
        Body=json.dumps(event)
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Payment processed',
            'transaction_id': transaction_id
        })
    }
"""

        # Create Lambda deployment package directory
        lambda_dir = os.path.join(os.getcwd(), "lib", "lambda")
        os.makedirs(lambda_dir, exist_ok=True)

        # Write Lambda code to file
        lambda_file = os.path.join(lambda_dir, "payment_processor.py")
        with open(lambda_file, "w", encoding="utf-8") as f:
            f.write(lambda_code)

        # Primary Lambda
        primary_lambda = LambdaFunction(
            self,
            "primary_payment_lambda",
            function_name=f"payment-processor-primary-{self.environment_suffix}",
            role=lambda_role.arn,
            handler="payment_processor.handler",
            runtime="python3.11",
            filename=lambda_file,
            environment={
                "variables": {
                    "DYNAMODB_TABLE": self.payments_table.name,
                    "S3_BUCKET": self.primary_bucket.bucket,
                    "REGION": "us-east-1"
                }
            },
            timeout=30,
            memory_size=512,
            provider=primary_provider
        )

        # Secondary Lambda (same role, different bucket)
        secondary_lambda = LambdaFunction(
            self,
            "secondary_payment_lambda",
            function_name=f"payment-processor-secondary-{self.environment_suffix}",
            role=lambda_role.arn,
            handler="payment_processor.handler",
            runtime="python3.11",
            filename=lambda_file,
            environment={
                "variables": {
                    "DYNAMODB_TABLE": self.payments_table.name,
                    "S3_BUCKET": self.secondary_bucket.bucket,
                    "REGION": "us-west-2"
                }
            },
            timeout=30,
            memory_size=512,
            provider=secondary_provider
        )

        return primary_lambda, secondary_lambda

    def _create_sns_topics(self, primary_provider, secondary_provider):
        """Create SNS topics for notifications"""

        primary_sns = SnsTopic(
            self,
            "primary_notification_topic",
            name=f"payment-notifications-primary-{self.environment_suffix}",
            provider=primary_provider
        )

        secondary_sns = SnsTopic(
            self,
            "secondary_notification_topic",
            name=f"payment-notifications-secondary-{self.environment_suffix}",
            provider=secondary_provider
        )

        return primary_sns, secondary_sns

    def _create_cloudwatch_alarms(self, primary_provider, secondary_provider):
        """Create CloudWatch alarms for monitoring"""

        # Alarm for primary Lambda errors
        CloudwatchMetricAlarm(
            self,
            "primary_lambda_errors",
            alarm_name=f"payment-lambda-errors-primary-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert on Lambda errors in primary region",
            dimensions={
                "FunctionName": self.primary_lambda.function_name
            },
            alarm_actions=[self.primary_sns.arn],
            provider=primary_provider
        )

        # Alarm for secondary Lambda errors
        CloudwatchMetricAlarm(
            self,
            "secondary_lambda_errors",
            alarm_name=f"payment-lambda-errors-secondary-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert on Lambda errors in secondary region",
            dimensions={
                "FunctionName": self.secondary_lambda.function_name
            },
            alarm_actions=[self.secondary_sns.arn],
            provider=secondary_provider
        )

        # Alarm for DynamoDB throttling
        CloudwatchMetricAlarm(
            self,
            "dynamodb_throttle_alarm",
            alarm_name=f"payments-table-throttle-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UserErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert on DynamoDB throttling",
            dimensions={
                "TableName": self.payments_table.name
            },
            alarm_actions=[self.primary_sns.arn],
            provider=primary_provider
        )
