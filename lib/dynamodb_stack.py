"""dynamodb_stack.py
This module defines the DynamoDB stack for the product reviews table.
"""

from typing import Optional
from constructs import Construct
from aws_cdk import (
    aws_dynamodb as dynamodb,
    aws_applicationautoscaling as autoscaling,
    RemovalPolicy,
    CfnOutput,
)


class DynamoDBStackProps:
    """Properties for DynamoDBStack."""

    def __init__(self, environment_suffix: Optional[str] = None):
        self.environment_suffix = environment_suffix


class DynamoDBStack(Construct):
    """Stack for DynamoDB table with auto-scaling."""

    def __init__(
        self, scope: Construct, construct_id: str, props: DynamoDBStackProps = None
    ):
        super().__init__(scope, construct_id)

        suffix = props.environment_suffix if props else "dev"

        # Create DynamoDB table
        self.table = dynamodb.Table(
            self,
            f"ProductReviews{suffix}",
            table_name=f"ProductReviews-{suffix}",
            partition_key=dynamodb.Attribute(
                name="product_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="review_id", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True,
        )

        # Add Global Secondary Index
        self.table.add_global_secondary_index(
            index_name="ReviewerIdIndex",
            partition_key=dynamodb.Attribute(
                name="reviewer_id", type=dynamodb.AttributeType.STRING
            ),
            read_capacity=5,
            write_capacity=5,
        )

        # Configure auto-scaling for main table
        read_scaling = self.table.auto_scale_read_capacity(
            min_capacity=5, max_capacity=100
        )
        read_scaling.scale_on_utilization(target_utilization_percent=70)

        write_scaling = self.table.auto_scale_write_capacity(
            min_capacity=5, max_capacity=100
        )
        write_scaling.scale_on_utilization(target_utilization_percent=70)

        # Configure auto-scaling for GSI
        self.table.auto_scale_global_secondary_index_read_capacity(
            index_name="ReviewerIdIndex", min_capacity=5, max_capacity=100
        ).scale_on_utilization(target_utilization_percent=70)

        self.table.auto_scale_global_secondary_index_write_capacity(
            index_name="ReviewerIdIndex", min_capacity=5, max_capacity=100
        ).scale_on_utilization(target_utilization_percent=70)

        # Output table ARN
        CfnOutput(
            self,
            "TableArn",
            value=self.table.table_arn,
            description="DynamoDB Table ARN",
        )
