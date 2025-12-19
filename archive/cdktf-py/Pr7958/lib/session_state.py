from constructs import Construct
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableReplica


class SessionStateConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        secondary_provider,
        primary_region: str,
        secondary_region: str
    ):
        super().__init__(scope, construct_id)

        # DynamoDB global table for session state
        self.table = DynamodbTable(
            self,
            "session-table",
            name=f"trading-sessions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="sessionId",
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            attribute=[
                DynamodbTableAttribute(
                    name="sessionId",
                    type="S"
                )
            ],
            replica=[
                DynamodbTableReplica(
                    region_name=secondary_region
                )
            ],
            tags={"Name": f"trading-sessions-{environment_suffix}"},
            provider=primary_provider
        )

    @property
    def table_name(self):
        return self.table.name

    @property
    def table_arn(self):
        return self.table.arn
