"""file_processing_stack.py
Stack containing all resources for the serverless file processing system.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_s3 as s3,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_s3_notifications as s3n,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class FileProcessingStackProps:
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        self.environment_suffix = environment_suffix


class FileProcessingStack(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[FileProcessingStackProps] = None
    ):
        super().__init__(scope, construct_id)

        environment_suffix = props.environment_suffix if props else 'dev'

        # Create S3 bucket for shipment files
        self.shipment_bucket = s3.Bucket(
            self, f"ShipmentBucket{environment_suffix}",
            bucket_name=f"shipment-files-{cdk.Aws.ACCOUNT_ID}-{cdk.Aws.REGION}-{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30)
                )
            ]
        )

        # Create DynamoDB table for metadata
        self.metadata_table = dynamodb.Table(
            self, f"MetadataTable{environment_suffix}",
            table_name=f"shipment-metadata-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="filename",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="upload_timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            encryption=dynamodb.TableEncryption.AWS_MANAGED
        )

        # Create CloudWatch log group
        log_group = logs.LogGroup(
            self, f"ProcessorLogGroup{environment_suffix}",
            log_group_name=f"/aws/lambda/shipment-processor-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create IAM role for Lambda
        lambda_role = iam.Role(
            self, f"ProcessorRole{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for shipment file processor Lambda function"
        )

        # Add permissions to Lambda role
        lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            resources=[f"{self.shipment_bucket.bucket_arn}/*"]
        ))

        lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "dynamodb:PutItem"
            ],
            resources=[self.metadata_table.table_arn]
        ))

        lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            resources=[log_group.log_group_arn]
        ))

        lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "cloudwatch:PutMetricData"
            ],
            resources=["*"],
            conditions={
                "StringEquals": {
                    "cloudwatch:namespace": f"ShipmentProcessing/{environment_suffix}"
                }
            }
        ))

        # Create Lambda function
        self.processor_function = lambda_.Function(
            self, f"ProcessorFunction{environment_suffix}",
            function_name=f"shipment-processor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_10,
            handler="processor.handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            memory_size=256,
            timeout=Duration.seconds(30),
            environment={
                "METADATA_TABLE": self.metadata_table.table_name,
                "ENVIRONMENT": environment_suffix,
                "METRICS_NAMESPACE": f"ShipmentProcessing/{environment_suffix}"
            },
            role=lambda_role,
            log_group=log_group
        )

        # Add S3 event notification
        self.shipment_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.processor_function)
        )

        # Create CloudWatch metrics
        success_metric = cloudwatch.Metric(
            namespace=f"ShipmentProcessing/{environment_suffix}",
            metric_name="ProcessingSuccess",
            statistic="Sum"
        )

        failure_metric = cloudwatch.Metric(
            namespace=f"ShipmentProcessing/{environment_suffix}",
            metric_name="ProcessingFailure",
            statistic="Sum"
        )

        # Create CloudWatch alarm for failure rate
        failure_rate_alarm = cloudwatch.Alarm(
            self, f"FailureRateAlarm{environment_suffix}",
            alarm_name=f"shipment-processing-failure-rate-{environment_suffix}",
            alarm_description="Alert when file processing failure rate exceeds 5%",
            metric=cloudwatch.MathExpression(
                expression="(failures / (successes + failures)) * 100",
                using_metrics={
                    "failures": failure_metric,
                    "successes": success_metric
                },
                period=Duration.minutes(5)
            ),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        # Outputs
        CfnOutput(
            self, "BucketName",
            value=self.shipment_bucket.bucket_name,
            description="S3 bucket for shipment files"
        )

        CfnOutput(
            self, "TableName",
            value=self.metadata_table.table_name,
            description="DynamoDB table for metadata"
        )

        CfnOutput(
            self, "FunctionName",
            value=self.processor_function.function_name,
            description="Lambda function name"
        )
