"""DynamoDB table for payment transactions."""
from constructs import Construct
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable


class DynamoDbConstruct(Construct):
    """DynamoDB table with GSI and stream."""

    def __init__(self, scope: Construct, id: str, environment_suffix: str, kms_key_id: str):
        super().__init__(scope, id)

        self.table = DynamodbTable(
            self, "payment-transactions",
            name=f"payment-transactions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            attribute=[
                {"name": "transaction_id", "type": "S"},
                {"name": "customer_id", "type": "S"}
            ],
            global_secondary_index=[
                {
                    "name": "customer-index",
                    "hashKey": "customer_id",
                    "projectionType": "ALL"
                }
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery={"enabled": True},
            server_side_encryption={
                "enabled": True,
                "kms_key_arn": kms_key_id
            },
            tags={
                "Name": f"payment-transactions-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "payment-processing",
                "CostCenter": "engineering"
            }
        )

        self.stream_arn = self.table.stream_arn
