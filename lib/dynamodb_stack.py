"""dynamodb_stack.py
DynamoDB tables stack with on-demand billing mode.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_dynamodb as dynamodb,
)
from constructs import Construct


class DynamoDBStackProps:
    """Properties for DynamoDB Stack."""

    def __init__(
        self,
        environment_suffix: str,
        environment: str
    ):
        self.environment_suffix = environment_suffix
        self.environment = environment


class DynamoDBStack(cdk.Stack):
    """
    DynamoDB Stack implementing on-demand billing mode optimization.
    Requirement 2: Convert DynamoDB tables from provisioned to on-demand billing mode
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: DynamoDBStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = props.environment_suffix
        environment = props.environment

        # Cost allocation tags
        tags = {
            "Environment": environment,
            "Team": "payments",
            "CostCenter": "engineering",
            "Project": "payment-processing"
        }

        # Transactions table - on-demand billing (Requirement 2)
        self.transactions_table = dynamodb.Table(
            self,
            f"{environment}-payment-table-transactions",
            partition_key=dynamodb.Attribute(
                name="transactionId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            # On-demand (Requirement 2)
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            point_in_time_recovery=True,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )

        # Users table - on-demand billing (Requirement 2)
        self.users_table = dynamodb.Table(
            self,
            f"{environment}-payment-table-users",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING
            ),
            # On-demand (Requirement 2)
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            point_in_time_recovery=True
        )

        # Payment methods table - on-demand billing (Requirement 2)
        self.payment_methods_table = dynamodb.Table(
            self,
            f"{environment}-payment-table-methods",
            partition_key=dynamodb.Attribute(
                name="methodId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING
            ),
            # On-demand (Requirement 2)
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            point_in_time_recovery=True
        )

        # Apply cost allocation tags
        for key, value in tags.items():
            cdk.Tags.of(self.transactions_table).add(key, value)
            cdk.Tags.of(self.users_table).add(key, value)
            cdk.Tags.of(self.payment_methods_table).add(key, value)

        # Outputs
        cdk.CfnOutput(
            self,
            "TransactionsTableName",
            value=self.transactions_table.table_name,
            export_name=f"{environment}-payment-table-transactions-name"
        )

        cdk.CfnOutput(
            self,
            "UsersTableName",
            value=self.users_table.table_name,
            export_name=f"{environment}-payment-table-users-name"
        )

        cdk.CfnOutput(
            self,
            "PaymentMethodsTableName",
            value=self.payment_methods_table.table_name,
            export_name=f"{environment}-payment-table-methods-name"
        )
