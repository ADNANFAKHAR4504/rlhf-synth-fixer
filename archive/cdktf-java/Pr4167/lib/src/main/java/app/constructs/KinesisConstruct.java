package app.constructs;

import com.hashicorp.cdktf.providers.aws.kinesis_stream.KinesisStream;
import com.hashicorp.cdktf.providers.aws.kinesis_stream.KinesisStreamConfig;
import com.hashicorp.cdktf.providers.aws.kinesis_stream.KinesisStreamStreamModeDetails;
import software.constructs.Construct;

import java.util.Map;

public class KinesisConstruct extends BaseConstruct {

    private final KinesisStream stream;

    public KinesisConstruct(final Construct scope, final String id) {
        super(scope, id);

        this.stream = new KinesisStream(this, "log-stream", KinesisStreamConfig.builder()
                .name(getResourcePrefix() + "-log-stream")
                .shardCount(getKinesisShards())
                .retentionPeriod(24)
                .encryptionType("KMS")
                .kmsKeyId("alias/aws/kinesis")
                .shardLevelMetrics(java.util.List.of(
                        "IncomingBytes",
                        "IncomingRecords",
                        "OutgoingBytes",
                        "OutgoingRecords"
                ))
                .streamModeDetails(KinesisStreamStreamModeDetails.builder()
                        .streamMode("PROVISIONED")
                        .build())
                .tags(mergeTags(Map.of(
                        "Name", getResourcePrefix() + "-log-stream",
                        "Purpose", "Real-time log ingestion"
                )))
                .build());
    }

    public KinesisStream getStream() {
        return stream;
    }
}
