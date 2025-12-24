from typing import Optional

import aws_cdk as cdk
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_logs as logs
from aws_cdk import aws_s3 as s3
from aws_cdk.aws_lambda_event_sources import S3EventSource
from constructs import Construct


class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "dev"

        project_name = "tap"

        def resource_name(resource: str) -> str:
            return f"{project_name}-{environment_suffix}-{resource}"

        # S3 Bucket
        # Note: Always use DESTROY removal policy for LocalStack compatibility
        # Note: auto_delete_objects disabled to avoid Custom::S3AutoDeleteObjects CDK resource
        self.bucket = s3.Bucket(
            self,
            "AppBucket",
            bucket_name=resource_name("bucket"),
            versioned=False,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=False,
            public_read_access=False,
            encryption=s3.BucketEncryption.S3_MANAGED
        )

        # Lambda Function
        # Note: log_retention removed for LocalStack compatibility
        # CloudWatch log groups will be created automatically by Lambda
        self.lambda_fn = _lambda.Function(
            self,
            "AppLambda",
            function_name=resource_name("lambda"),
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline(
                """import json
def handler(event, context):
    try:
        print('Received event:', json.dumps(event, indent=2))
        for record in event['Records']:
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']
            print(f"New object created in bucket '{bucket_name}' with key '{object_key}'")
        return {'statusCode': 200, 'body': 'Successfully processed S3 event'}
    except Exception as e:
        print("An error occurred:", e)
        raise e"""
            ),
            environment={
                "BUCKET_NAME": self.bucket.bucket_name
            }
        )

        # Grant permissions to S3 bucket
        self.bucket.grant_read_write(self.lambda_fn)

        # Add S3 trigger. This automatically adds the necessary permissions
        # for the S3 service to invoke the Lambda function.
        self.lambda_fn.add_event_source(
            S3EventSource(
                self.bucket,
                events=[s3.EventType.OBJECT_CREATED]
            )
        )

        ## CloudWatch Alarms for the Lambda Function
        # Alarm for errors
        cloudwatch.Alarm(
            self,
            "LambdaErrorAlarm",
            metric=self.lambda_fn.metric_errors(),
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarm_description="Alarm when Lambda function has errors",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Alarm for throttles
        cloudwatch.Alarm(
            self,
            "LambdaThrottlesAlarm",
            metric=self.lambda_fn.metric_throttles(),
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarm_description="Alarm when Lambda function is throttled",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Alarm for a long duration (e.g., more than 5 seconds)
        cloudwatch.Alarm(
            self,
            "LambdaDurationAlarm",
            metric=self.lambda_fn.metric_duration(period=cdk.Duration.minutes(1)),
            threshold=5000, # Threshold in milliseconds (5 seconds)
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarm_description="Alarm when Lambda function duration exceeds 5 seconds",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        cdk.CfnOutput(
            self,
            "S3BucketName",
            value=self.bucket.bucket_name,
            export_name=f"{resource_name('bucket')}-name"
        )

        cdk.CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.lambda_fn.function_name,
            export_name=f"{resource_name('lambda')}-name"
        )

        cdk.CfnOutput(
            self,
            "LambdaRoleArn",
            value=self.lambda_fn.role.role_arn if self.lambda_fn.role else "N/A",
            export_name=f"{resource_name('lambda')}-role-arn"
        )
