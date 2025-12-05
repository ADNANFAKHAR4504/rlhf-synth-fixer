"""
Lambda Health Check Construct
Creates Lambda function with VPC access to check Aurora connectivity
"""

import base64
import json
import os
from typing import List

from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_function_url import LambdaFunctionUrl
from constructs import Construct


class LambdaHealthCheckConstruct(Construct):
    """
    Lambda health check construct for Aurora database connectivity.
    """

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        region: str,
        vpc_id: str,
        private_subnet_ids: List[str],
        lambda_security_group_id: str,
        database_endpoint: str,
        database_secret_arn: str,
    ):
        super().__init__(scope, id)

        # CloudWatch Log Group
        log_group = CloudwatchLogGroup(
            self,
            "log-group",
            name=f"/aws/lambda/health-check-{environment_suffix}-{region}",
            retention_in_days=7,
            tags={
                "Name": f"health-check-logs-{environment_suffix}-{region}",
            }
        )

        # IAM Role for Lambda
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }

        lambda_role = IamRole(
            self,
            "lambda-role",
            name=f"lambda-health-check-role-{environment_suffix}-{region}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"lambda-health-check-role-{environment_suffix}-{region}",
            }
        )

        # Attach VPC execution policy
        IamRolePolicyAttachment(
            self,
            "vpc-execution-policy",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        )

        # Custom policy for Secrets Manager and CloudWatch
        custom_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": database_secret_arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"{log_group.arn}:*"
                }
            ]
        }

        custom_policy = IamPolicy(
            self,
            "custom-policy",
            name=f"lambda-health-check-policy-{environment_suffix}-{region}",
            policy=json.dumps(custom_policy_document),
            tags={
                "Name": f"lambda-health-check-policy-{environment_suffix}-{region}",
            }
        )

        IamRolePolicyAttachment(
            self,
            "custom-policy-attachment",
            role=lambda_role.name,
            policy_arn=custom_policy.arn,
        )

        # Lambda function code (inline for simplicity)
        lambda_code = """
import json
import boto3
import psycopg2
import os

secretsmanager = boto3.client('secretsmanager')

def lambda_handler(event, context):
    try:
        # Get database credentials from Secrets Manager
        secret_arn = os.environ['DB_SECRET_ARN']
        secret = secretsmanager.get_secret_value(SecretId=secret_arn)
        credentials = json.loads(secret['SecretString'])

        # Test database connection
        conn = psycopg2.connect(
            host=os.environ['DB_ENDPOINT'],
            port=5432,
            database=credentials.get('dbname', 'trading_db'),
            user=credentials['username'],
            password=credentials['password'],
            connect_timeout=5
        )

        # Execute simple query
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'healthy',
                'region': os.environ['AWS_REGION'],
                'timestamp': context.request_id
            })
        }
    except Exception as e:
        print(f"Health check failed: {str(e)}")
        return {
            'statusCode': 503,
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e),
                'region': os.environ.get('AWS_REGION', 'unknown')
            })
        }
"""

        # Create Lambda function
        self.function = LambdaFunction(
            self,
            "function",
            function_name=f"health-check-{environment_suffix}-{region}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=lambda_role.arn,
            timeout=30,
            memory_size=512,
            architectures=["arm64"],
            environment={
                "variables": {
                    "DB_ENDPOINT": database_endpoint,
                    "DB_SECRET_ARN": database_secret_arn,
                    "AWS_REGION": region,
                }
            },
            vpc_config={
                "subnet_ids": private_subnet_ids,
                "security_group_ids": [lambda_security_group_id],
            },
            # Use absolute path for Lambda deployment package
            filename=os.path.join(os.path.dirname(os.path.dirname(__file__)), "lambda", "health_check.zip"),
            source_code_hash=base64.b64encode(lambda_code.encode()).decode(),
            tags={
                "Name": f"health-check-{environment_suffix}-{region}",
            }
        )

        # Create Function URL for external health checks
        self._function_url_resource = LambdaFunctionUrl(
            self,
            "function-url",
            function_name=self.function.function_name,
            authorization_type="NONE",  # Public endpoint for Route53 health checks
            cors={
                "allow_origins": ["*"],
                "allow_methods": ["GET"],
                "max_age": 300,
            }
        )

    @property
    def function_name(self) -> str:
        return self.function.function_name

    @property
    def function_url(self) -> str:
        return self._function_url_resource.function_url