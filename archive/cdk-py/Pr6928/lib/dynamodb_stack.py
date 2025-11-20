"""dynamodb_stack.py
DynamoDB global tables with point-in-time recovery.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import aws_dynamodb as dynamodb
from constructs import Construct


class DynamoDBStackProps:
    """Properties for DynamoDB stack."""

    def __init__(
        self,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str
    ):
        self.environment_suffix = environment_suffix
        self.primary_region = primary_region
        self.secondary_region = secondary_region


class DynamoDBStack(Construct):
    """Creates DynamoDB global table with PITR."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: DynamoDBStackProps
    ):
        super().__init__(scope, construct_id)

        # Create DynamoDB table (single region for testing)
        self.table = dynamodb.TableV2(
            self,
            f'TransactionTable{props.environment_suffix}',
            table_name=f'dr-transactions-{props.environment_suffix}',
            partition_key=dynamodb.Attribute(
                name='transactionId',
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name='timestamp',
                type=dynamodb.AttributeType.NUMBER
            ),
            billing=dynamodb.Billing.on_demand(),
            point_in_time_recovery=True,
            deletion_protection=False,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            global_secondary_indexes=[
                dynamodb.GlobalSecondaryIndexPropsV2(
                    index_name='StatusIndex',
                    partition_key=dynamodb.Attribute(
                        name='status',
                        type=dynamodb.AttributeType.STRING
                    ),
                    sort_key=dynamodb.Attribute(
                        name='timestamp',
                        type=dynamodb.AttributeType.NUMBER
                    )
                )
            ]
        )

        # Add TTL attribute
        cfn_table = self.table.node.default_child
        cfn_table.time_to_live_specification = dynamodb.CfnGlobalTable.TimeToLiveSpecificationProperty(
            enabled=True,
            attribute_name='ttl'
        )

        # Tags
        cdk.Tags.of(self.table).add('DR-Role', 'Global-Table')

        # Outputs
        cdk.CfnOutput(
            self,
            'TableName',
            value=self.table.table_name,
            description='DynamoDB table name'
        )
        cdk.CfnOutput(
            self,
            'TableArn',
            value=self.table.table_arn,
            description='DynamoDB table ARN'
        )