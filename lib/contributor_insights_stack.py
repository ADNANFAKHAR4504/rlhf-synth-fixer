"""CloudWatch Contributor Insights rules stack"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
)
from constructs import Construct


class ContributorInsightsStackProps(cdk.StackProps):
    """Properties for ContributorInsightsStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class ContributorInsightsStack(Construct):
    """Stack for CloudWatch Contributor Insights rules"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[ContributorInsightsStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix if props else 'dev'

        # Contributor Insights rule for top API consumers
        api_consumers_rule = cloudwatch.CfnInsightRule(
            self,
            f"TopApiConsumersRule-{env_suffix}",
            rule_name=f"top-api-consumers-{env_suffix}",
            rule_state="ENABLED",
            rule_body="""{
                "Schema": {
                    "Name": "CloudWatchLogRule",
                    "Version": 1
                },
                "LogGroupNames": [
                    "/aws/apigateway/payment-api-""" + env_suffix + """"
                ],
                "LogFormat": "JSON",
                "Contribution": {
                    "Keys": [
                        "$.sourceIpAddress"
                    ],
                    "Filters": []
                },
                "AggregateOn": "Count"
            }"""
        )

        # Contributor Insights rule for error-prone Lambda functions
        lambda_errors_rule = cloudwatch.CfnInsightRule(
            self,
            f"ErrorProneLambdasRule-{env_suffix}",
            rule_name=f"error-prone-lambdas-{env_suffix}",
            rule_state="ENABLED",
            rule_body="""{
                "Schema": {
                    "Name": "CloudWatchLogRule",
                    "Version": 1
                },
                "LogGroupNames": [
                    "/aws/lambda/payment-processing-""" + env_suffix + """"
                ],
                "LogFormat": "JSON",
                "Contribution": {
                    "Keys": [
                        "$.functionName",
                        "$.errorType"
                    ],
                    "Filters": [
                        {
                            "Match": "$.level",
                            "In": [
                                "ERROR",
                                "FATAL"
                            ]
                        }
                    ]
                },
                "AggregateOn": "Count"
            }"""
        )

        # Contributor Insights rule for DynamoDB throttling by table
        dynamodb_throttles_rule = cloudwatch.CfnInsightRule(
            self,
            f"DynamoDBThrottlesRule-{env_suffix}",
            rule_name=f"dynamodb-throttles-by-table-{env_suffix}",
            rule_state="ENABLED",
            rule_body="""{
                "Schema": {
                    "Name": "CloudWatchLogRule",
                    "Version": 1
                },
                "LogGroupNames": [
                    "/aws/dynamodb/transactions-""" + env_suffix + """"
                ],
                "LogFormat": "JSON",
                "Contribution": {
                    "Keys": [
                        "$.tableName",
                        "$.operation"
                    ],
                    "Filters": [
                        {
                            "Match": "$.errorCode",
                            "In": [
                                "ProvisionedThroughputExceededException",
                                "ThrottlingException"
                            ]
                        }
                    ]
                },
                "AggregateOn": "Count"
            }"""
        )
