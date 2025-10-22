"""Kinesis infrastructure for video ingestion."""

from constructs import Construct
from cdktf_cdktf_provider_aws.kinesis_stream import KinesisStream


class KinesisConstruct(Construct):
    """Kinesis construct for video ingestion stream."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
    ):
        super().__init__(scope, construct_id)

        # Create Kinesis Data Stream
        self.stream = KinesisStream(
            self,
            "video_stream",
            name=f"streamflix-video-stream-{environment_suffix}",
            shard_count=2,
            retention_period=24,
            shard_level_metrics=[
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords",
                "WriteProvisionedThroughputExceeded",
                "ReadProvisionedThroughputExceeded",
                "IteratorAgeMilliseconds",
            ],
            stream_mode_details={
                "stream_mode": "PROVISIONED",
            },
            encryption_type="KMS",
            kms_key_id="alias/aws/kinesis",
            tags={"Name": f"streamflix-video-stream-{environment_suffix}"},
        )

    @property
    def stream_name(self):
        return self.stream.name

    @property
    def stream_arn(self):
        return self.stream.arn
