"""TAP Stack module for CDKTF Python infrastructure."""

from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableAttribute,
    DynamodbTablePointInTimeRecovery,
    DynamodbTableGlobalSecondaryIndex
)
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import (
    S3BucketVersioningA,
    S3BucketVersioningVersioningConfiguration
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
import zipfile


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

        # Single region provider (main provider for new resources)
        provider = AwsProvider(
            self,
            "aws",
            region=self.aws_region,
            default_tags=[default_tags]
        )

        # Legacy provider aliases for cleaning up orphaned multi-region resources
        # These are needed to destroy orphaned resources from previous deployments
        AwsProvider(
            self,
            "aws_primary",
            alias="primary",
            region=self.aws_region,
            default_tags=[default_tags]
        )

        AwsProvider(
            self,
            "aws_secondary",
            alias="secondary",
            region="us-west-2",
            default_tags=[default_tags]
        )

        # Create DynamoDB table for payment transactions
        self.payments_table = self._create_dynamodb_table(provider)

        # Create S3 bucket for audit logs
        self.audit_bucket = self._create_s3_bucket(provider)

        # Create Lambda function for payment processing
        self.payment_lambda = self._create_lambda_function(provider)

        # Create SNS topic for notifications
        self.notification_sns = self._create_sns_topic(provider)

        # Create CloudWatch alarms
        self._create_cloudwatch_alarms(provider)

        # Outputs
        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=self.payments_table.name,
            description="DynamoDB table name"
        )

        TerraformOutput(
            self,
            "audit_bucket_name",
            value=self.audit_bucket.bucket,
            description="S3 audit bucket name"
        )

        TerraformOutput(
            self,
            "lambda_arn",
            value=self.payment_lambda.arn,
            description="Lambda function ARN"
        )

        TerraformOutput(
            self,
            "sns_topic_arn",
            value=self.notification_sns.arn,
            description="SNS topic ARN"
        )

    def _create_dynamodb_table(self, provider):
        """Create DynamoDB table for payment transactions"""

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
            provider=provider
        )

        return table

    def _create_s3_bucket(self, provider):
        """Create S3 bucket for audit logs"""

        # Audit bucket
        audit_bucket = S3Bucket(
            self,
            "audit_bucket",
            bucket=f"payment-audit-{self.environment_suffix}",
            provider=provider
        )

        # Enable versioning on audit bucket
        S3BucketVersioningA(
            self,
            "audit_bucket_versioning",
            bucket=audit_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            ),
            provider=provider
        )

        return audit_bucket

    def _create_lambda_function(self, provider):
        """Create Lambda function for payment processing"""

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
            provider=provider
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
                        "Resource": f"{self.audit_bucket.arn}/*"
                    }
                ]
            }),
            provider=provider
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

        # Create zip file for Lambda deployment
        lambda_zip = os.path.join(lambda_dir, "payment_processor.zip")
        with zipfile.ZipFile(lambda_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(lambda_file, "payment_processor.py")

        # Payment Lambda
        payment_lambda = LambdaFunction(
            self,
            "payment_lambda",
            function_name=f"payment-processor-{self.environment_suffix}",
            role=lambda_role.arn,
            handler="payment_processor.handler",
            runtime="python3.11",
            filename=lambda_zip,
            environment={
                "variables": {
                    "DYNAMODB_TABLE": self.payments_table.name,
                    "S3_BUCKET": self.audit_bucket.bucket,
                    "REGION": self.aws_region
                }
            },
            timeout=30,
            memory_size=512,
            provider=provider
        )

        return payment_lambda

    def _create_sns_topic(self, provider):
        """Create SNS topic for notifications"""

        sns_topic = SnsTopic(
            self,
            "notification_topic",
            name=f"payment-notifications-{self.environment_suffix}",
            provider=provider
        )

        return sns_topic

    def _create_cloudwatch_alarms(self, provider):
        """Create CloudWatch alarms for monitoring"""

        # Alarm for Lambda errors
        CloudwatchMetricAlarm(
            self,
            "lambda_errors",
            alarm_name=f"payment-lambda-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert on Lambda errors",
            dimensions={
                "FunctionName": self.payment_lambda.function_name
            },
            alarm_actions=[self.notification_sns.arn],
            provider=provider
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
            alarm_actions=[self.notification_sns.arn],
            provider=provider
        )
