"""Trading Analytics Platform Stack for Pulumi."""
import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Reusable stack class for trading analytics platform.
    Accepts environment name and creates appropriate resources.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize the trading analytics stack.

        Args:
            name: The name of the stack
            args: TapStackArgs containing environment_suffix and tags
            opts: Pulumi ResourceOptions
        """
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment = args.environment_suffix
        self.region = aws.get_region().name
        self.account_id = aws.get_caller_identity().account_id

        # Environment-specific configuration
        self.config = self._get_environment_config()

        # Resource name suffix for uniqueness
        self.suffix = f"{self.environment}-{self.region}"

        # Common tags for all resources
        self.common_tags = {
            'Environment': self.environment,
            'ManagedBy': 'Pulumi',
            'Project': 'TradingAnalytics',
            'Region': self.region
        }
        # Merge with provided tags if any
        if args.tags:
            self.common_tags.update(args.tags)

        # Create VPC for compute isolation
        self.vpc = self._create_vpc()

        # Create IAM role for Lambda
        self.lambda_role = self._create_lambda_role()

        # Create S3 bucket for data archival
        self.s3_bucket = self._create_s3_bucket()

        # Create DynamoDB table for analytics storage
        self.dynamodb_table = self._create_dynamodb_table()

        # Create CloudWatch log group
        self.log_group = self._create_log_group()

        # Create Lambda function for data processing
        self.lambda_function = self._create_lambda_function()

        # Register outputs if needed
        self.register_outputs({})

    def _get_environment_config(self):
        """Get environment-specific configuration values."""
        configs = {
            'dev': {
                'lambda_memory': 512,
                'log_retention_days': 7,
                'dynamodb_billing_mode': 'PAY_PER_REQUEST',
                's3_versioning': False,
                'dynamodb_read_capacity': None,
                'dynamodb_write_capacity': None
            },
            'staging': {
                'lambda_memory': 1024,
                'log_retention_days': 30,
                'dynamodb_billing_mode': 'PAY_PER_REQUEST',
                's3_versioning': False,
                'dynamodb_read_capacity': None,
                'dynamodb_write_capacity': None
            },
            'production': {
                'lambda_memory': 2048,
                'log_retention_days': 90,
                'dynamodb_billing_mode': 'PROVISIONED',
                's3_versioning': True,
                'dynamodb_read_capacity': 5,
                'dynamodb_write_capacity': 5
            }
        }
        return configs.get(self.environment, configs['dev'])

    def _create_vpc(self):
        """Create VPC with private subnets for compute isolation."""
        vpc = aws.ec2.Vpc(
            f'vpc-{self.suffix}',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, 'Name': f'vpc-{self.suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create private subnet
        self.private_subnet = aws.ec2.Subnet(
            f'private-subnet-{self.suffix}',
            vpc_id=vpc.id,
            cidr_block='10.0.1.0/24',
            availability_zone=f'{self.region}a',
            tags={**self.common_tags, 'Name': f'private-subnet-{self.suffix}'},
            opts=ResourceOptions(parent=self)
        )

        return vpc

    def _create_lambda_role(self):
        """Create IAM role for Lambda with least-privilege access."""
        # Lambda assume role policy
        assume_role_policy = aws.iam.get_policy_document(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    actions=['sts:AssumeRole'],
                    principals=[
                        aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                            type='Service',
                            identifiers=['lambda.amazonaws.com']
                        )
                    ]
                )
            ]
        )

        # Create the role
        role = aws.iam.Role(
            f'lambda-role-{self.suffix}',
            assume_role_policy=assume_role_policy.json,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f'lambda-basic-execution-{self.suffix}',
            role=role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=ResourceOptions(parent=self)
        )

        # Create custom policy for DynamoDB and S3 access
        custom_policy = aws.iam.Policy(
            f'lambda-custom-policy-{self.suffix}',
            policy=pulumi.Output.all(
                self.account_id,
                self.region,
                self.suffix
            ).apply(lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'dynamodb:PutItem',
                            'dynamodb:GetItem',
                            'dynamodb:Query',
                            'dynamodb:Scan',
                            'dynamodb:UpdateItem'
                        ],
                        'Resource': f'arn:aws:dynamodb:{args[1]}:{args[0]}:table/analytics-table-{args[2]}'
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            's3:PutObject',
                            's3:GetObject',
                            's3:ListBucket'
                        ],
                        'Resource': [
                            f'arn:aws:s3:::data-archive-{args[2]}',
                            f'arn:aws:s3:::data-archive-{args[2]}/*'
                        ]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents'
                        ],
                        'Resource': f'arn:aws:logs:{args[1]}:{args[0]}:log-group:/aws/lambda/data-processor-{args[2]}:*'
                    }
                ]
            })),
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach custom policy to role
        aws.iam.RolePolicyAttachment(
            f'lambda-custom-attachment-{self.suffix}',
            role=role.name,
            policy_arn=custom_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        return role

    def _create_s3_bucket(self):
        """Create S3 bucket for data archival."""
        bucket = aws.s3.Bucket(
            f'data-archive-{self.suffix}',
            bucket=f'data-archive-{self.suffix}',
            tags=self.common_tags,
            force_destroy=True,  # Allow destruction for all environments
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning only for production
        if self.config['s3_versioning']:
            aws.s3.BucketVersioningV2(
                f'data-archive-versioning-{self.suffix}',
                bucket=bucket.id,
                versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                    status='Enabled'
                ),
                opts=ResourceOptions(parent=self)
            )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f'data-archive-public-access-block-{self.suffix}',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        return bucket

    def _create_dynamodb_table(self):
        """Create DynamoDB table for analytics storage."""
        table_args = {
            'name': f'analytics-table-{self.suffix}',
            'billing_mode': self.config['dynamodb_billing_mode'],
            'hash_key': 'trade_id',
            'range_key': 'timestamp',
            'attributes': [
                aws.dynamodb.TableAttributeArgs(
                    name='trade_id',
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='timestamp',
                    type='N'
                )
            ],
            'tags': self.common_tags,
            'opts': ResourceOptions(parent=self)
        }

        # Add read/write capacity for production
        if self.config['dynamodb_billing_mode'] == 'PROVISIONED':
            table_args['read_capacity'] = self.config['dynamodb_read_capacity']
            table_args['write_capacity'] = self.config['dynamodb_write_capacity']

        table = aws.dynamodb.Table(
            f'analytics-table-{self.suffix}',
            **table_args
        )

        return table

    def _create_log_group(self):
        """Create CloudWatch log group for Lambda function."""
        log_group = aws.cloudwatch.LogGroup(
            f'lambda-log-group-{self.suffix}',
            name=f'/aws/lambda/data-processor-{self.suffix}',
            retention_in_days=self.config['log_retention_days'],
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        return log_group

    def _create_lambda_function(self):
        """Create Lambda function for real-time data processing."""
        # Create Lambda function code
        lambda_code = """
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

def handler(event, context):
    '''Process trading analytics data.'''
    table_name = os.environ['DYNAMODB_TABLE']
    bucket_name = os.environ['S3_BUCKET']

    # Process the event data
    trade_data = event.get('trade_data', {})
    trade_id = trade_data.get('trade_id', 'unknown')
    timestamp = int(datetime.now().timestamp())

    # Store in DynamoDB
    table = dynamodb.Table(table_name)
    table.put_item(
        Item={
            'trade_id': trade_id,
            'timestamp': timestamp,
            'data': json.dumps(trade_data)
        }
    )

    # Archive to S3
    s3.put_object(
        Bucket=bucket_name,
        Key=f'trades/{trade_id}/{timestamp}.json',
        Body=json.dumps(trade_data)
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Trade data processed successfully',
            'trade_id': trade_id,
            'timestamp': timestamp
        })
    }
"""

        # Create Lambda function
        lambda_function = aws.lambda_.Function(
            f'data-processor-{self.suffix}',
            name=f'data-processor-{self.suffix}',
            role=self.lambda_role.arn,
            runtime='python3.9',
            handler='index.handler',
            memory_size=self.config['lambda_memory'],
            timeout=30,
            architectures=['arm64'],
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(lambda_code)
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'DYNAMODB_TABLE': self.dynamodb_table.name,
                    'S3_BUCKET': self.s3_bucket.bucket,
                    'ENVIRONMENT': self.environment
                }
            ),
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        return lambda_function
