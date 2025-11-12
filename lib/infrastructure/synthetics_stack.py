"""
CloudWatch Synthetics canaries for endpoint monitoring.
BUG #25: Missing canary alarm configuration
"""

import json
import tempfile
import zipfile
from pathlib import Path

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


def _create_canary_zip(script: str) -> str:
    """Write the inline canary script to a temporary zip file and return its path."""
    temp_dir = Path(tempfile.mkdtemp(prefix="pulumi-canary-"))
    zip_path = temp_dir / "canary.zip"
    with zipfile.ZipFile(zip_path, mode="w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("handler.py", script)
    return str(zip_path)


class SyntheticsStack(pulumi.ComponentResource):
    """CloudWatch Synthetics canaries for endpoint health monitoring."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        primary_api_endpoint: Output[str],
        secondary_api_endpoint: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:infrastructure:SyntheticsStack', name, None, opts)

        primary_provider = aws.Provider(
            f"aws-synthetics-primary-{environment_suffix}",
            region=primary_region,
            opts=ResourceOptions(parent=self)
        )

        secondary_provider = aws.Provider(
            f"aws-synthetics-secondary-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        # S3 bucket for canary artifacts
        self.canary_bucket = aws.s3.Bucket(
            f"canary-artifacts-{environment_suffix}",
            bucket=f"canary-artifacts-{environment_suffix}",
            tags={**tags, 'Name': f"canary-artifacts-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # IAM role for canaries
        self.canary_role = aws.iam.Role(
            f"canary-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**tags, 'Name': f"canary-execution-role-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # IAM policy for canaries
        self.canary_policy = aws.iam.RolePolicy(
            f"canary-execution-policy-{environment_suffix}",
            role=self.canary_role.id,
            policy=self.canary_bucket.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": f"{arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetBucketLocation"
                        ],
                        "Resource": arn
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
                        "Resource": "*",
                        "Condition": {
                            "StringEquals": {
                                "cloudwatch:namespace": "CloudWatchSynthetics"
                            }
                        }
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        python_canary_script = """import json
import os
import urllib.request


def handler(event, context):
    url = os.environ.get('API_ENDPOINT')
    if not url:
        raise ValueError('API_ENDPOINT environment variable is required')

    with urllib.request.urlopen(url, timeout=10) as response:
        status = response.getcode()
        if status != 200:
            raise RuntimeError(f'Expected 200 response, received {status}')

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Health check passed'})
    }
"""

        canary_zip_path = _create_canary_zip(python_canary_script)

        # Primary region canary
        self.primary_canary = aws.synthetics.Canary(
            f"trading-api-canary-primary-{environment_suffix}",
            name=f"trading-canary-primary-{environment_suffix}",
            artifact_s3_location=pulumi.Output.concat("s3://", self.canary_bucket.bucket, "/canary-primary"),
            execution_role_arn=self.canary_role.arn,
            handler="handler.handler",
            zip_file=canary_zip_path,
            runtime_version="syn-python-selenium-7.0",  # Updated from deprecated syn-python-selenium-1.0
            schedule=aws.synthetics.CanaryScheduleArgs(
                expression="rate(5 minutes)"
            ),
            run_config=aws.synthetics.CanaryRunConfigArgs(
                timeout_in_seconds=60,
                environment_variables={
                    "API_ENDPOINT": primary_api_endpoint
                }
            ),
            tags={**tags, 'Name': f"trading-canary-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # Secondary region canary
        self.secondary_canary = aws.synthetics.Canary(
            f"trading-api-canary-secondary-{environment_suffix}",
            name=f"trading-canary-secondary-{environment_suffix}",
            artifact_s3_location=pulumi.Output.concat("s3://", self.canary_bucket.bucket, "/canary-secondary"),
            execution_role_arn=self.canary_role.arn,
            handler="handler.handler",
            zip_file=canary_zip_path,
            runtime_version="syn-python-selenium-7.0",  # Updated from deprecated syn-python-selenium-1.0
            schedule=aws.synthetics.CanaryScheduleArgs(
                expression="rate(5 minutes)"
            ),
            run_config=aws.synthetics.CanaryRunConfigArgs(
                timeout_in_seconds=60,
                environment_variables={
                    "API_ENDPOINT": secondary_api_endpoint
                }
            ),
            tags={**tags, 'Name': f"trading-canary-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # BUG #25: Missing CloudWatch alarms for canary success/failure monitoring
        # Should create alarms to monitor SuccessPercent metric for both canaries
        # Missing:
        # aws.cloudwatch.MetricAlarm(
        #     f"canary-alarm-primary-{environment_suffix}",
        #     metric_name="SuccessPercent",
        #     namespace="CloudWatchSynthetics",
        #     dimensions={"CanaryName": self.primary_canary.name},
        #     ...
        # )

        self.register_outputs({
            'primary_canary_name': self.primary_canary.name,
            'secondary_canary_name': self.secondary_canary.name,
        })
