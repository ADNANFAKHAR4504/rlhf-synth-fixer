"""DynamoDB Stack for storing image metadata."""

from constructs import Construct
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable


class DatabaseStack(Construct):
    """DynamoDB table for image metadata storage."""

    def __init__(
        self,
        scope: Construct,
        environment_suffix: str
    ):
        super().__init__(scope, "DatabaseStack")

        # Create DynamoDB table
        self.table = DynamodbTable(
            self,
            "image_metadata",
            name=f"ecr-image-metadata-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="image_digest",
            range_key="push_timestamp",
            attribute=[
                {
                    "name": "image_digest",
                    "type": "S"
                },
                {
                    "name": "push_timestamp",
                    "type": "N"
                },
                {
                    "name": "repository_name",
                    "type": "S"
                }
            ],
            global_secondary_index=[
                {
                    "name": "repository-index",
                    "hashKey": "repository_name",
                    "rangeKey": "push_timestamp",
                    "projectionType": "ALL"
                }
            ],
            point_in_time_recovery={
                "enabled": True
            },
            server_side_encryption={
                "enabled": True
            }
        )

        # Export outputs
        self.table_name = self.table.name
        self.table_arn = self.table.arn
