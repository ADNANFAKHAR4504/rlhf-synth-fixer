package app.components;

import com.pulumi.core.Output;
import com.pulumi.aws.kinesis.Stream;
import com.pulumi.aws.kinesis.StreamArgs;
import com.pulumi.aws.kinesis.inputs.StreamStreamModeDetailsArgs;

import java.util.Map;

/**
 * Streaming component for Kinesis Data Streams.
 */
public class StreamingComponent {
    private final Stream kinesisStream;

    /**
     * Creates Kinesis Data Streams with enhanced fan-out.
     *
     * @param name component name
     * @param region AWS region
     */
    public StreamingComponent(final String name, final String region) {
        // Create Kinesis Data Stream
        this.kinesisStream = new Stream(name + "-market-feeds", StreamArgs.builder()
            .streamModeDetails(StreamStreamModeDetailsArgs.builder()
                .streamMode("ON_DEMAND")
                .build())
            .retentionPeriod(24)
            .shardLevelMetrics(
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords",
                "WriteProvisionedThroughputExceeded",
                "ReadProvisionedThroughputExceeded"
            )
            .tags(Map.of(
                "Component", "Streaming",
                "Purpose", "MarketDataFeeds",
                "Environment", "production",
                "ManagedBy", "pulumi",
                "CostCenter", "FinancialAnalytics",
                "BusinessUnit", "Trading"
            ))
            .build());
    }

    public Output<String> getStreamName() {
        return kinesisStream.name();
    }

    public Output<String> getStreamArn() {
        return kinesisStream.arn();
    }
}
