"""
Lambda@Edge Stack for request/response manipulation.
"""

import pulumi
from pulumi_aws import iam, lambda_, Provider
from pulumi import ResourceOptions, Output
from typing import Optional
import json


class LambdaEdgeStack(pulumi.ComponentResource):
    """
    Creates Lambda@Edge functions for viewer request and origin response manipulation.
    Note: Lambda@Edge functions must be created in us-east-1 region.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        dynamodb_table_name: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:lambda:LambdaEdgeStack', name, None, opts)

        # Create provider for us-east-1 (required for Lambda@Edge)
        us_east_1_provider = Provider(
            f"us-east-1-provider-{environment_suffix}",
            region="us-east-1",
            opts=ResourceOptions(parent=self)
        )

        # IAM role for Lambda@Edge
        lambda_edge_role = iam.Role(
            f"lambda-edge-role-{environment_suffix}",
            name=f"tap-lambda-edge-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": [
                                "lambda.amazonaws.com",
                                "edgelambda.amazonaws.com"
                            ]
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags=tags,
            opts=ResourceOptions(parent=self, provider=us_east_1_provider)
        )

        # Attach basic Lambda execution policy
        iam.RolePolicyAttachment(
            f"lambda-edge-basic-execution-{environment_suffix}",
            role=lambda_edge_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self, provider=us_east_1_provider)
        )

        # Create inline policy for DynamoDB and CloudWatch access
        lambda_edge_policy = iam.RolePolicy(
            f"lambda-edge-policy-{environment_suffix}",
            role=lambda_edge_role.id,
            policy=pulumi.Output.all(dynamodb_table_name).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:GetItem",
                                "dynamodb:Query",
                                "dynamodb:Scan"
                            ],
                            "Resource": f"arn:aws:dynamodb:*:*:table/{args[0]}"
                        },
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
                                "cloudwatch:PutMetricData"
                            ],
                            "Resource": "*"
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self, provider=us_east_1_provider)
        )

        # Viewer Request Lambda function for A/B testing
        viewer_request_code = """
import json
import hashlib

def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    headers = request['headers']

    # Get or create user identifier
    user_id = None
    if 'cookie' in headers:
        cookies = headers['cookie'][0]['value']
        for cookie in cookies.split(';'):
            if 'user_id=' in cookie:
                user_id = cookie.split('=')[1].strip()

    # Generate user_id if not exists
    if not user_id:
        user_id = hashlib.md5(str(headers.get('x-forwarded-for', [''])[0]['value']).encode()).hexdigest()[:16]

    # A/B test routing - hash user_id to determine variant
    variant = 'A' if int(user_id[:8], 16) % 2 == 0 else 'B'

    # Add custom headers
    headers['x-ab-variant'] = [{'key': 'X-AB-Variant', 'value': variant}]
    headers['x-user-id'] = [{'key': 'X-User-ID', 'value': user_id}]

    # Route to different origin paths based on variant
    if variant == 'B':
        request['uri'] = '/variant-b' + request['uri']

    return request
"""

        self.viewer_request_function = lambda_.Function(
            f"viewer-request-function-{environment_suffix}",
            name=f"tap-viewer-request-{environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=lambda_edge_role.arn,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(viewer_request_code)
            }),
            publish=True,
            timeout=5,
            memory_size=128,
            tags=tags,
            opts=ResourceOptions(
                parent=self,
                provider=us_east_1_provider,
                depends_on=[lambda_edge_policy]
            )
        )

        # Origin Response Lambda function for personalization
        origin_response_code = """
import json
from datetime import datetime

def lambda_handler(event, context):
    response = event['Records'][0]['cf']['response']
    request = event['Records'][0]['cf']['request']
    headers = response['headers']

    # Add security headers
    headers['strict-transport-security'] = [{
        'key': 'Strict-Transport-Security',
        'value': 'max-age=31536000; includeSubDomains'
    }]
    headers['x-content-type-options'] = [{
        'key': 'X-Content-Type-Options',
        'value': 'nosniff'
    }]
    headers['x-frame-options'] = [{
        'key': 'X-Frame-Options',
        'value': 'DENY'
    }]
    headers['x-xss-protection'] = [{
        'key': 'X-XSS-Protection',
        'value': '1; mode=block'
    }]

    # Add custom personalization header
    request_headers = request['headers']
    if 'x-ab-variant' in request_headers:
        variant = request_headers['x-ab-variant'][0]['value']
        headers['x-personalization'] = [{
            'key': 'X-Personalization',
            'value': f'variant-{variant}'
        }]

    # Add cache control
    headers['cache-control'] = [{
        'key': 'Cache-Control',
        'value': 'public, max-age=3600'
    }]

    return response
"""

        self.origin_response_function = lambda_.Function(
            f"origin-response-function-{environment_suffix}",
            name=f"tap-origin-response-{environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=lambda_edge_role.arn,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(origin_response_code)
            }),
            publish=True,
            timeout=5,
            memory_size=128,
            tags=tags,
            opts=ResourceOptions(
                parent=self,
                provider=us_east_1_provider,
                depends_on=[lambda_edge_policy]
            )
        )

        self.viewer_request_function_qualified_arn = self.viewer_request_function.qualified_arn
        self.origin_response_function_qualified_arn = self.origin_response_function.qualified_arn
        self.viewer_request_function_name = self.viewer_request_function.name
        self.origin_response_function_name = self.origin_response_function.name

        self.register_outputs({
            'viewer_request_function_qualified_arn': self.viewer_request_function_qualified_arn,
            'origin_response_function_qualified_arn': self.origin_response_function_qualified_arn,
            'viewer_request_function_name': self.viewer_request_function_name,
            'origin_response_function_name': self.origin_response_function_name
        })
