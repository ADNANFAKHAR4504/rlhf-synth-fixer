"""X-Ray tracing configuration stack"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_xray as xray,
)
from constructs import Construct


class XRayStackProps(cdk.StackProps):
    """Properties for XRayStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class XRayStack(Construct):
    """Stack for X-Ray tracing configuration"""

    def __init__(self, scope: Construct, construct_id: str, props: Optional[XRayStackProps] = None, **kwargs):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix if props else 'dev'

        # Create X-Ray sampling rule with 0.1 sampling rate (10%)
        sampling_rule = xray.CfnSamplingRule(
            self,
            f"PaymentSamplingRule-{env_suffix}",
            sampling_rule=xray.CfnSamplingRule.SamplingRuleProperty(
                fixed_rate=0.1,
                host="*",
                http_method="*",
                priority=100,
                reservoir_size=1,
                resource_arn="*",
                rule_name=f"pay-sample-{env_suffix}",
                service_name="*",
                service_type="*",
                url_path="*",
                version=1
            )
        )

        # Create X-Ray group for payment processing
        payment_group = xray.CfnGroup(
            self,
            f"PaymentGroup-{env_suffix}",
            group_name=f"payment-processing-{env_suffix}",
            filter_expression='service("payment-api") OR service("payment-lambda")'
        )

        # Create X-Ray group for API Gateway
        api_group = xray.CfnGroup(
            self,
            f"ApiGatewayGroup-{env_suffix}",
            group_name=f"api-gateway-{env_suffix}",
            filter_expression='service("AWS::ApiGateway::Stage")'
        )

        # Create X-Ray group for Lambda functions
        lambda_group = xray.CfnGroup(
            self,
            f"LambdaGroup-{env_suffix}",
            group_name=f"lambda-functions-{env_suffix}",
            filter_expression='service("AWS::Lambda") OR service("AWS::Lambda::Function")'
        )
