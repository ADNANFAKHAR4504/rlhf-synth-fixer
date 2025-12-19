"""Synthetics stack with CloudWatch Synthetics canaries"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_synthetics as synthetics,
    aws_iam as iam,
    aws_s3 as s3,
)
from constructs import Construct


class SyntheticsStackProps(cdk.StackProps):
    """Properties for SyntheticsStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class SyntheticsStack(Construct):
    """Stack for CloudWatch Synthetics canaries"""

    def __init__(self, scope: Construct, construct_id: str, props: Optional[SyntheticsStackProps] = None, **kwargs):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix if props else 'dev'

        # Create S3 bucket for canary artifacts
        artifacts_bucket = s3.Bucket(
            self,
            f"CanaryArtifacts-{env_suffix}",
            bucket_name=f"payment-canary-artifacts-{env_suffix}-{cdk.Stack.of(self).account}",
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        # Health check canary
        health_canary_role = self._create_canary_role(f"health-{env_suffix}", artifacts_bucket)

        health_canary = synthetics.CfnCanary(
            self,
            f"HealthCanary-{env_suffix}",
            name=f"health-check-{env_suffix}",
            artifact_s3_location=f"s3://{artifacts_bucket.bucket_name}/health",
            execution_role_arn=health_canary_role.role_arn,
            runtime_version="syn-python-selenium-7.0",
            schedule=synthetics.CfnCanary.ScheduleProperty(
                expression="rate(5 minutes)"
            ),
            code=synthetics.CfnCanary.CodeProperty(
                handler="health_check.handler",
                script="""
from aws_synthetics.selenium import synthetics_webdriver as webdriver
from aws_synthetics.common import synthetics_logger as logger
from aws_synthetics.common import synthetics_configuration

def handler(event, context):
    # Configure synthetics
    synthetics_configuration.set_config({
        "screenshot_on_step_start": False,
        "screenshot_on_step_success": False,
        "screenshot_on_step_failure": True
    })

    url = "https://api.example.com/health"
    browser = webdriver.Chrome()
    browser.set_viewport_size(1920, 1080)

    try:
        browser.get(url)
        response_text = browser.page_source
        logger.info(f"Health check completed for {url}")

        # Verify response contains expected content
        if "OK" in response_text or "healthy" in response_text.lower():
            logger.info("Health check passed")
        else:
            logger.error("Health check failed - unexpected response")

    except Exception as e:
        logger.error(f"Health check failed with error: {str(e)}")
        raise
    finally:
        browser.quit()

    return "Success"
"""
            ),
            start_canary_after_creation=True
        )

        # Payment processing canary
        payment_canary_role = self._create_canary_role(f"payment-{env_suffix}", artifacts_bucket)

        payment_canary = synthetics.CfnCanary(
            self,
            f"PaymentCanary-{env_suffix}",
            name=f"payment-api-{env_suffix}",
            artifact_s3_location=f"s3://{artifacts_bucket.bucket_name}/payment",
            execution_role_arn=payment_canary_role.role_arn,
            runtime_version="syn-python-selenium-7.0",
            schedule=synthetics.CfnCanary.ScheduleProperty(
                expression="rate(5 minutes)"
            ),
            code=synthetics.CfnCanary.CodeProperty(
                handler="payment_check.handler",
                script="""
from aws_synthetics.selenium import synthetics_webdriver as webdriver
from aws_synthetics.common import synthetics_logger as logger
from aws_synthetics.common import synthetics_configuration
import time

def handler(event, context):
    # Configure synthetics
    synthetics_configuration.set_config({
        "screenshot_on_step_start": False,
        "screenshot_on_step_success": False,
        "screenshot_on_step_failure": True
    })

    url = "https://api.example.com/api/v1/process-payment"
    browser = webdriver.Chrome()
    browser.set_viewport_size(1920, 1080)

    try:
        start_time = time.time()
        browser.get(url)
        end_time = time.time()

        response_time = (end_time - start_time) * 1000
        logger.info(f"Payment API response time: {response_time}ms")

        # Check response time SLA
        if response_time > 3000:
            logger.warning(f"Payment API slow response: {response_time}ms")

        response_text = browser.page_source
        logger.info(f"Payment API check completed")

    except Exception as e:
        logger.error(f"Payment API check failed with error: {str(e)}")
        raise
    finally:
        browser.quit()

    return "Success"
"""
            ),
            start_canary_after_creation=True
        )

    def _create_canary_role(self, name: str, bucket: s3.Bucket) -> iam.Role:
        """Create IAM role for canary execution"""
        role = iam.Role(
            self,
            f"CanaryRole-{name}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        bucket.grant_read_write(role)

        role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "s3:ListAllMyBuckets",
                    "cloudwatch:PutMetricData",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=["*"]
            )
        )

        return role
