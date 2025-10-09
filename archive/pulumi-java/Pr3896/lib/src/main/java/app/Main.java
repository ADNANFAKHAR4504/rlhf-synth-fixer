package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import app.components.IamComponent;
import app.components.StorageComponent;
import app.components.StreamingComponent;
import app.components.IngestionComponent;
import app.components.QueryComponent;
import app.components.MonitoringComponent;

/**
 * Main class for time-series data platform infrastructure.
 * Deploys a comprehensive solution for processing financial market data feeds.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    /**
     * Main entry point for the Pulumi program.
     *
     * @param args Command line arguments (not used)
     */
    public static void main(final String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    /**
     * Defines the infrastructure resources for the time-series data platform.
     *
     * @param ctx The Pulumi context for exporting outputs
     */
    static void defineInfrastructure(final Context ctx) {
        String stackName = ctx.stackName().toLowerCase();
        String region = ctx.config().get("aws:region").orElse("us-west-2");

        // Get ENVIRONMENT_SUFFIX from environment variable or use stackName
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = stackName;
        }
        String resourcePrefix = "market-data-" + environmentSuffix;

        // Validate region
        if (!"us-west-2".equals(region)) {
            throw new IllegalArgumentException(
                "This infrastructure must be deployed in us-west-2 region"
            );
        }

        // Create IAM roles and policies first
        var iamComponent = new IamComponent(resourcePrefix + "-iam", region);

        // Create storage infrastructure (S3 data lake and Timestream)
        var storageComponent = new StorageComponent(resourcePrefix + "-storage", region);

        // Create streaming infrastructure (Kinesis Data Streams)
        var streamingComponent = new StreamingComponent(resourcePrefix + "-streaming", region);

        // Create data ingestion (Lambda functions)
        var ingestionComponent = new IngestionComponent(resourcePrefix + "-ingestion",
            iamComponent,
            storageComponent,
            streamingComponent,
            region);

        // Create query infrastructure (Glue, Athena, QuickSight)
        var queryComponent = new QueryComponent(resourcePrefix + "-query",
            storageComponent,
            iamComponent,
            region);

        // Create monitoring infrastructure (CloudWatch)
        var monitoringComponent = new MonitoringComponent(resourcePrefix + "-monitoring",
            streamingComponent,
            ingestionComponent,
            storageComponent,
            region);

        // Export important outputs
        ctx.export("timestreamDatabaseName", storageComponent.getTimestreamDatabaseName());
        ctx.export("timestreamTableName", storageComponent.getTimestreamTableName());
        ctx.export("dataLakeBucketName", storageComponent.getDataLakeBucketName());
        ctx.export("kinesisStreamName", streamingComponent.getStreamName());
        ctx.export("kinesisStreamArn", streamingComponent.getStreamArn());
        ctx.export("lambdaFunctionArn", ingestionComponent.getLambdaFunctionArn());
        ctx.export("glueDatabaseName", queryComponent.getGlueDatabaseName());
        ctx.export("athenaWorkgroupName", queryComponent.getAthenaWorkgroupName());
        ctx.export("quickSightDataSourceId", queryComponent.getQuickSightDataSourceId());
        ctx.export("dashboardUrl", monitoringComponent.getDashboardUrl());
    }
}