"""
tap_stack.py

Multi-environment infrastructure stack for deploying consistent infrastructure
across development, staging, and production environments.
"""

from typing import Optional, Dict, Any
import json

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class TapStackArgs:
    """
    Arguments for the TapStack component.

    Args:
        environment_suffix: Environment identifier (dev, staging, production)
        lambda_memory_mb: Memory allocation for Lambda functions
        log_retention_days: CloudWatch log retention period
        enable_versioning: Whether to enable S3 versioning
        tags: Additional tags to apply to resources
    """

    def __init__(
        self,
        environment_suffix: str,
        lambda_memory_mb: int = 512,
        log_retention_days: int = 7,
        enable_versioning: bool = False,
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.lambda_memory_mb = lambda_memory_mb
        self.log_retention_days = log_retention_days
        self.enable_versioning = enable_versioning
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi ComponentResource for multi-environment infrastructure.

    This component creates identical infrastructure across different environments
    with configuration-driven differences for environment-specific settings.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        child_opts = ResourceOptions(parent=self)

        # Merge environment tags with provided tags
        resource_tags = {
            'Environment': args.environment_suffix,
            'ManagedBy': 'Pulumi',
            **args.tags
        }

        # Create S3 bucket for storage
        self.bucket = aws.s3.Bucket(
            f'storage-bucket-{args.environment_suffix}',
            bucket=f'tap-storage-{args.environment_suffix}',
            versioning=aws.s3.BucketVersioningArgs(
                enabled=args.enable_versioning
            ),
            tags=resource_tags,
            opts=child_opts
        )

        # Block public access to S3 bucket
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f'storage-bucket-public-access-{args.environment_suffix}',
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=child_opts
        )

        # Create IAM role for Lambda execution
        lambda_role = aws.iam.Role(
            f'lambda-execution-role-{args.environment_suffix}',
            name=f'tap-lambda-execution-{args.environment_suffix}',
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'sts:AssumeRole',
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'lambda.amazonaws.com'
                    }
                }]
            }),
            tags=resource_tags,
            opts=child_opts
        )

        # Attach basic Lambda execution policy
        lambda_basic_policy_attachment = aws.iam.RolePolicyAttachment(
            f'lambda-basic-execution-{args.environment_suffix}',
            role=lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=child_opts
        )

        # Create custom policy for S3 access
        lambda_s3_policy = aws.iam.Policy(
            f'lambda-s3-policy-{args.environment_suffix}',
            name=f'tap-lambda-s3-access-{args.environment_suffix}',
            policy=self.bucket.arn.apply(lambda arn: json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': [
                        's3:GetObject',
                        's3:PutObject',
                        's3:ListBucket'
                    ],
                    'Resource': [
                        arn,
                        f'{arn}/*'
                    ]
                }]
            })),
            tags=resource_tags,
            opts=child_opts
        )

        # Attach S3 policy to Lambda role
        lambda_s3_policy_attachment = aws.iam.RolePolicyAttachment(
            f'lambda-s3-policy-attachment-{args.environment_suffix}',
            role=lambda_role.name,
            policy_arn=lambda_s3_policy.arn,
            opts=child_opts
        )

        # Create CloudWatch log group for Lambda
        self.log_group = aws.cloudwatch.LogGroup(
            f'lambda-log-group-{args.environment_suffix}',
            name=f'/aws/lambda/tap-processor-{args.environment_suffix}',
            retention_in_days=args.log_retention_days,
            tags=resource_tags,
            opts=child_opts
        )

        # Create Lambda function for data processing
        self.lambda_function = aws.lambda_.Function(
            f'processor-lambda-{args.environment_suffix}',
            name=f'tap-processor-{args.environment_suffix}',
            role=lambda_role.arn,
            runtime='python3.11',
            handler='index.handler',
            memory_size=args.lambda_memory_mb,
            timeout=30,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset("""
import json
import boto3
import os

s3_client = boto3.client('s3')

def handler(event, context):
    '''
    Process data and store results in S3.
    '''
    bucket_name = os.environ.get('BUCKET_NAME')
    environment = os.environ.get('ENVIRONMENT')

    print(f'Processing data in {environment} environment')

    # Sample processing logic
    result = {
        'status': 'success',
        'environment': environment,
        'message': 'Data processed successfully'
    }

    # Store result in S3
    try:
        s3_client.put_object(
            Bucket=bucket_name,
            Key=f'results/{environment}/latest.json',
            Body=json.dumps(result),
            ContentType='application/json'
        )
    except Exception as e:
        print(f'Error storing result: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

    return {
        'statusCode': 200,
        'body': json.dumps(result)
    }
""")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'BUCKET_NAME': self.bucket.id,
                    'ENVIRONMENT': args.environment_suffix,
                }
            ),
            tags=resource_tags,
            opts=ResourceOptions(
                parent=self,
                depends_on=[
                    lambda_basic_policy_attachment,
                    lambda_s3_policy_attachment,
                    self.log_group
                ]
            )
        )

        # Create CloudWatch metric alarm for Lambda errors
        self.error_alarm = aws.cloudwatch.MetricAlarm(
            f'lambda-error-alarm-{args.environment_suffix}',
            name=f'tap-lambda-errors-{args.environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='Errors',
            namespace='AWS/Lambda',
            period=300,
            statistic='Sum',
            threshold=5,
            alarm_description=f'Lambda error count exceeded in {args.environment_suffix}',
            dimensions={
                'FunctionName': self.lambda_function.name
            },
            tags=resource_tags,
            opts=child_opts
        )

        # Register outputs
        self.register_outputs({
            'bucket_name': self.bucket.id,
            'lambda_function_name': self.lambda_function.name,
            'lambda_function_arn': self.lambda_function.arn,
            'log_group_name': self.log_group.name,
            'environment': args.environment_suffix
        })