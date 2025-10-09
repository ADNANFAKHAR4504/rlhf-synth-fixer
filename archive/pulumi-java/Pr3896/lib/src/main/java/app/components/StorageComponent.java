package app.components;

import com.pulumi.core.Output;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketLifecycleConfigurationV2;
import com.pulumi.aws.s3.BucketLifecycleConfigurationV2Args;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.aws.s3.inputs.BucketLifecycleConfigurationV2RuleArgs;
import com.pulumi.aws.s3.inputs.BucketLifecycleConfigurationV2RuleTransitionArgs;
// import com.pulumi.aws.timestreamwrite.Database;
// import com.pulumi.aws.timestreamwrite.DatabaseArgs;
// import com.pulumi.aws.timestreamwrite.Table;
// import com.pulumi.aws.timestreamwrite.TableArgs;
// import com.pulumi.aws.timestreamwrite.inputs.TableRetentionPropertiesArgs;

import java.util.Map;

/**
 * Storage component for S3 data lake and Timestream database.
 */
public class StorageComponent {
    private final Bucket dataLakeBucket;
    // private final Database timestreamDatabase;
    // private final Table timestreamTable;

    /**
     * Validates component name is not null or empty.
     *
     * @param name the name to validate
     * @return true if valid
     */
    public static boolean isValidComponentName(final String name) {
        return name != null && !name.trim().isEmpty();
    }

    /**
     * Validates AWS region format.
     *
     * @param region the region to validate
     * @return true if valid format
     */
    public static boolean isValidRegion(final String region) {
        if (region == null) {
            return false;
        }
        return region.matches("^[a-z]{2}-[a-z]+-\\d{1}$");
    }

    /**
     * Creates storage infrastructure.
     *
     * @param name component name
     * @param region AWS region
     */
    public StorageComponent(final String name, final String region) {
        // Create S3 bucket for data lake
        this.dataLakeBucket = new Bucket(name + "-data-lake", BucketArgs.builder()
            .tags(Map.of(
                "Component", "Storage",
                "Purpose", "DataLake",
                "Environment", "production",
                "ManagedBy", "pulumi"
            ))
            .build());

        // Block public access
        new BucketPublicAccessBlock(name + "-data-lake-public-access-block",
            BucketPublicAccessBlockArgs.builder()
                .bucket(dataLakeBucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());

        // Configure lifecycle policy
        new BucketLifecycleConfigurationV2(name + "-data-lake-lifecycle",
            BucketLifecycleConfigurationV2Args.builder()
                .bucket(dataLakeBucket.id())
                .rules(
                    BucketLifecycleConfigurationV2RuleArgs.builder()
                        .id("transition-to-ia")
                        .status("Enabled")
                        .transitions(
                            BucketLifecycleConfigurationV2RuleTransitionArgs.builder()
                                .days(30)
                                .storageClass("STANDARD_IA")
                                .build(),
                            BucketLifecycleConfigurationV2RuleTransitionArgs.builder()
                                .days(90)
                                .storageClass("GLACIER")
                                .build()
                        )
                        .build()
                )
                .build());

        // Create Timestream database - DISABLED DUE TO AWS ACCOUNT QUOTA LIMITS
        // AWS Timestream requires special account access
        // this.timestreamDatabase = new Database(name + "-ts-database", DatabaseArgs.builder()
        //     .databaseName("market-data-db")
        //     .tags(Map.of(
        //         "Component", "Storage",
        //         "Purpose", "TimeSeries",
        //         "Environment", "production",
        //         "ManagedBy", "pulumi"
        //     ))
        //     .build());

        // Create Timestream table with 24-hour memory retention - DISABLED
        // this.timestreamTable = new Table(name + "-ts-table", TableArgs.builder()
        //     .databaseName(timestreamDatabase.databaseName())
        //     .tableName("market-feeds")
        //     .retentionProperties(TableRetentionPropertiesArgs.builder()
        //         .memoryStoreRetentionPeriodInHours(24)
        //         .magneticStoreRetentionPeriodInDays(90)
        //         .build())
        //     .tags(Map.of(
        //         "Component", "Storage",
        //         "Purpose", "TimeSeries",
        //         "Environment", "production",
        //         "ManagedBy", "pulumi"
        //     ))
        //     .build());
        // this.timestreamDatabase = null;
        // this.timestreamTable = null;
    }

    public Output<String> getDataLakeBucketName() {
        return dataLakeBucket.bucket();
    }

    public Output<String> getDataLakeBucketArn() {
        return dataLakeBucket.arn();
    }

    public Output<String> getTimestreamDatabaseName() {
        return Output.of("timestream-disabled");
    }

    public Output<String> getTimestreamTableName() {
        return Output.of("timestream-disabled");
    }

    public Output<String> getTimestreamTableArn() {
        return Output.of("arn:aws:timestream:us-west-2:000000000000:database/disabled/table/disabled");
    }
}
