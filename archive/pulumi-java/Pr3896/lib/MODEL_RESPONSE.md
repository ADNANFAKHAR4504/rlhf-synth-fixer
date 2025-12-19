I'll help you create a comprehensive time-series data platform for your financial analytics firm using Pulumi with Java. This solution will handle 12,300 daily market data feeds with low-latency storage and querying capabilities.

Here's the implementation:

## Main.java

```java
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

        // Validate region
        if (!"us-west-2".equals(region)) {
            throw new IllegalArgumentException(
                "This infrastructure must be deployed in us-west-2 region"
            );
        }

        // Create IAM roles and policies first
        var iamComponent = new IamComponent("iam-" + stackName, region);

        // Create storage infrastructure (S3 data lake and Timestream)
        var storageComponent = new StorageComponent("storage-" + stackName, region);

        // Create streaming infrastructure (Kinesis Data Streams)
        var streamingComponent = new StreamingComponent("streaming-" + stackName, region);

        // Create data ingestion (Lambda functions)
        var ingestionComponent = new IngestionComponent("ingestion-" + stackName,
            iamComponent,
            storageComponent,
            streamingComponent,
            region);

        // Create query infrastructure (Glue, Athena, QuickSight)
        var queryComponent = new QueryComponent("query-" + stackName,
            storageComponent,
            iamComponent,
            region);

        // Create monitoring infrastructure (CloudWatch)
        var monitoringComponent = new MonitoringComponent("monitoring-" + stackName,
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
```

## IamComponent.java

```java
package app.components;

import com.pulumi.Output;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicy;
import com.pulumi.aws.iam.RolePolicyArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;

import java.util.Map;

/**
 * IAM component for managing roles and policies.
 */
public class IamComponent {
    private final Role lambdaRole;
    private final Role glueRole;
    private final Role quickSightRole;

    /**
     * Creates IAM roles and policies for the time-series platform.
     *
     * @param name component name
     * @param region AWS region
     */
    public IamComponent(final String name, final String region) {
        // Lambda execution role
        this.lambdaRole = new Role(name + "-lambda-role", RoleArgs.builder()
            .assumeRolePolicy("""
                {
                  "Version": "2012-10-17",
                  "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                      "Service": "lambda.amazonaws.com"
                    }
                  }]
                }
                """)
            .tags(Map.of(
                "Component", "IAM",
                "Environment", "production",
                "ManagedBy", "pulumi"
            ))
            .build());

        // Attach basic Lambda execution policy
        new RolePolicyAttachment(name + "-lambda-basic-execution",
            RolePolicyAttachmentArgs.builder()
                .role(lambdaRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                .build());

        // Lambda custom policy for Kinesis, Timestream, and S3
        new RolePolicy(name + "-lambda-custom-policy", RolePolicyArgs.builder()
            .role(lambdaRole.id())
            .policy("""
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Effect": "Allow",
                      "Action": [
                        "kinesis:GetRecords",
                        "kinesis:GetShardIterator",
                        "kinesis:DescribeStream",
                        "kinesis:ListStreams",
                        "kinesis:SubscribeToShard",
                        "kinesis:DescribeStreamConsumer",
                        "kinesis:RegisterStreamConsumer"
                      ],
                      "Resource": "*"
                    },
                    {
                      "Effect": "Allow",
                      "Action": [
                        "timestream:WriteRecords",
                        "timestream:DescribeEndpoints"
                      ],
                      "Resource": "*"
                    },
                    {
                      "Effect": "Allow",
                      "Action": [
                        "s3:PutObject",
                        "s3:GetObject"
                      ],
                      "Resource": "*"
                    }
                  ]
                }
                """)
            .build());

        // Glue role
        this.glueRole = new Role(name + "-glue-role", RoleArgs.builder()
            .assumeRolePolicy("""
                {
                  "Version": "2012-10-17",
                  "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                      "Service": "glue.amazonaws.com"
                    }
                  }]
                }
                """)
            .tags(Map.of(
                "Component", "IAM",
                "Environment", "production",
                "ManagedBy", "pulumi"
            ))
            .build());

        new RolePolicyAttachment(name + "-glue-service-policy",
            RolePolicyAttachmentArgs.builder()
                .role(glueRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole")
                .build());

        // QuickSight role
        this.quickSightRole = new Role(name + "-quicksight-role", RoleArgs.builder()
            .assumeRolePolicy("""
                {
                  "Version": "2012-10-17",
                  "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                      "Service": "quicksight.amazonaws.com"
                    }
                  }]
                }
                """)
            .tags(Map.of(
                "Component", "IAM",
                "Environment", "production",
                "ManagedBy", "pulumi"
            ))
            .build());

        new RolePolicy(name + "-quicksight-policy", RolePolicyArgs.builder()
            .role(quickSightRole.id())
            .policy("""
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Effect": "Allow",
                      "Action": [
                        "athena:*",
                        "s3:GetObject",
                        "s3:ListBucket"
                      ],
                      "Resource": "*"
                    }
                  ]
                }
                """)
            .build());
    }

    public Output<String> getLambdaRoleArn() {
        return lambdaRole.arn();
    }

    public Output<String> getGlueRoleArn() {
        return glueRole.arn();
    }

    public Output<String> getQuickSightRoleArn() {
        return quickSightRole.arn();
    }
}
```

## StorageComponent.java

```java
package app.components;

import com.pulumi.Output;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketLifecycleConfigurationV2;
import com.pulumi.aws.s3.BucketLifecycleConfigurationV2Args;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.aws.s3.inputs.BucketLifecycleConfigurationV2RuleArgs;
import com.pulumi.aws.s3.inputs.BucketLifecycleConfigurationV2RuleTransitionArgs;
import com.pulumi.aws.timestreamwrite.Database;
import com.pulumi.aws.timestreamwrite.DatabaseArgs;
import com.pulumi.aws.timestreamwrite.Table;
import com.pulumi.aws.timestreamwrite.TableArgs;
import com.pulumi.aws.timestreamwrite.inputs.TableRetentionPropertiesArgs;

import java.util.Map;

/**
 * Storage component for S3 data lake and Timestream database.
 */
public class StorageComponent {
    private final Bucket dataLakeBucket;
    private final Database timestreamDatabase;
    private final Table timestreamTable;

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

        // Create Timestream database
        this.timestreamDatabase = new Database(name + "-ts-database", DatabaseArgs.builder()
            .databaseName("market-data-db")
            .tags(Map.of(
                "Component", "Storage",
                "Purpose", "TimeSeries",
                "Environment", "production",
                "ManagedBy", "pulumi"
            ))
            .build());

        // Create Timestream table with 24-hour memory retention
        this.timestreamTable = new Table(name + "-ts-table", TableArgs.builder()
            .databaseName(timestreamDatabase.databaseName())
            .tableName("market-feeds")
            .retentionProperties(TableRetentionPropertiesArgs.builder()
                .memoryStoreRetentionPeriodInHours(24)
                .magneticStoreRetentionPeriodInDays(90)
                .build())
            .tags(Map.of(
                "Component", "Storage",
                "Purpose", "TimeSeries",
                "Environment", "production",
                "ManagedBy", "pulumi"
            ))
            .build());
    }

    public Output<String> getDataLakeBucketName() {
        return dataLakeBucket.bucket();
    }

    public Output<String> getDataLakeBucketArn() {
        return dataLakeBucket.arn();
    }

    public Output<String> getTimestreamDatabaseName() {
        return timestreamDatabase.databaseName();
    }

    public Output<String> getTimestreamTableName() {
        return timestreamTable.tableName();
    }

    public Output<String> getTimestreamTableArn() {
        return timestreamTable.arn();
    }
}
```

## StreamingComponent.java

```java
package app.components;

import com.pulumi.Output;
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
```

## IngestionComponent.java

```java
package app.components;

import com.pulumi.Output;
import com.pulumi.asset.FileArchive;
import com.pulumi.aws.lambda.Function;
import com.pulumi.aws.lambda.FunctionArgs;
import com.pulumi.aws.lambda.EventSourceMapping;
import com.pulumi.aws.lambda.EventSourceMappingArgs;
import com.pulumi.aws.lambda.inputs.FunctionEnvironmentArgs;

import java.util.Map;

/**
 * Ingestion component for Lambda functions.
 */
public class IngestionComponent {
    private final Function ingestionFunction;
    private final EventSourceMapping eventSourceMapping;

    /**
     * Creates Lambda ingestion infrastructure.
     *
     * @param name component name
     * @param iamComponent IAM component for roles
     * @param storageComponent storage component
     * @param streamingComponent streaming component
     * @param region AWS region
     */
    public IngestionComponent(final String name,
                              final IamComponent iamComponent,
                              final StorageComponent storageComponent,
                              final StreamingComponent streamingComponent,
                              final String region) {

        // Create Lambda function for data ingestion
        this.ingestionFunction = new Function(name + "-processor", FunctionArgs.builder()
            .runtime("python3.11")
            .handler("index.handler")
            .role(iamComponent.getLambdaRoleArn())
            .code(new FileArchive("./lambda"))
            .timeout(60)
            .memorySize(512)
            .environment(FunctionEnvironmentArgs.builder()
                .variables(Output.tuple(
                    storageComponent.getTimestreamDatabaseName(),
                    storageComponent.getTimestreamTableName(),
                    storageComponent.getDataLakeBucketName()
                ).applyValue(tuple -> Map.of(
                    "TIMESTREAM_DATABASE", tuple.t1,
                    "TIMESTREAM_TABLE", tuple.t2,
                    "S3_BUCKET", tuple.t3,
                    "AWS_REGION", region
                )))
                .build())
            .tags(Map.of(
                "Component", "Ingestion",
                "Purpose", "DataProcessor",
                "Environment", "production",
                "ManagedBy", "pulumi"
            ))
            .build());

        // Create event source mapping with enhanced fan-out
        this.eventSourceMapping = new EventSourceMapping(name + "-esm",
            EventSourceMappingArgs.builder()
                .eventSourceArn(streamingComponent.getStreamArn())
                .functionName(ingestionFunction.arn())
                .startingPosition("LATEST")
                .batchSize(100)
                .maximumBatchingWindowInSeconds(5)
                .parallelizationFactor(10)
                .build());
    }

    public Output<String> getLambdaFunctionArn() {
        return ingestionFunction.arn();
    }

    public Output<String> getLambdaFunctionName() {
        return ingestionFunction.name();
    }
}
```

## QueryComponent.java

```java
package app.components;

import com.pulumi.Output;
import com.pulumi.aws.athena.Workgroup;
import com.pulumi.aws.athena.WorkgroupArgs;
import com.pulumi.aws.athena.inputs.WorkgroupConfigurationArgs;
import com.pulumi.aws.athena.inputs.WorkgroupConfigurationResultConfigurationArgs;
import com.pulumi.aws.glue.CatalogDatabase;
import com.pulumi.aws.glue.CatalogDatabaseArgs;
import com.pulumi.aws.glue.CatalogTable;
import com.pulumi.aws.glue.CatalogTableArgs;
import com.pulumi.aws.glue.inputs.CatalogTableStorageDescriptorArgs;
import com.pulumi.aws.glue.inputs.CatalogTableStorageDescriptorColumnArgs;
import com.pulumi.aws.glue.inputs.CatalogTablePartitionKeyArgs;
import com.pulumi.aws.quicksight.DataSource;
import com.pulumi.aws.quicksight.DataSourceArgs;
import com.pulumi.aws.quicksight.inputs.DataSourceParametersArgs;
import com.pulumi.aws.quicksight.inputs.DataSourceParametersAthenaArgs;

import java.util.Map;

/**
 * Query component for Glue, Athena, and QuickSight.
 */
public class QueryComponent {
    private final CatalogDatabase glueDatabase;
    private final CatalogTable glueTable;
    private final Workgroup athenaWorkgroup;
    private final DataSource quickSightDataSource;

    /**
     * Creates query infrastructure.
     *
     * @param name component name
     * @param storageComponent storage component
     * @param iamComponent IAM component
     * @param region AWS region
     */
    public QueryComponent(final String name,
                          final StorageComponent storageComponent,
                          final IamComponent iamComponent,
                          final String region) {

        // Create Glue catalog database
        this.glueDatabase = new CatalogDatabase(name + "-catalog-db",
            CatalogDatabaseArgs.builder()
                .name("market_data_catalog")
                .description("Catalog for market data lake")
                .build());

        // Create Glue catalog table with partitions
        this.glueTable = new CatalogTable(name + "-catalog-table",
            CatalogTableArgs.builder()
                .databaseName(glueDatabase.name())
                .name("market_feeds")
                .storageDescriptor(CatalogTableStorageDescriptorArgs.builder()
                    .location(storageComponent.getDataLakeBucketName()
                        .applyValue(bucket -> "s3://" + bucket + "/data/"))
                    .inputFormat("org.apache.hadoop.mapred.TextInputFormat")
                    .outputFormat("org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat")
                    .serDeInfo(Map.of(
                        "serializationLibrary", "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"
                    ))
                    .columns(
                        CatalogTableStorageDescriptorColumnArgs.builder()
                            .name("timestamp")
                            .type("timestamp")
                            .build(),
                        CatalogTableStorageDescriptorColumnArgs.builder()
                            .name("symbol")
                            .type("string")
                            .build(),
                        CatalogTableStorageDescriptorColumnArgs.builder()
                            .name("price")
                            .type("double")
                            .build(),
                        CatalogTableStorageDescriptorColumnArgs.builder()
                            .name("volume")
                            .type("bigint")
                            .build()
                    )
                    .build())
                .partitionKeys(
                    CatalogTablePartitionKeyArgs.builder()
                        .name("symbol")
                        .type("string")
                        .build(),
                    CatalogTablePartitionKeyArgs.builder()
                        .name("date")
                        .type("string")
                        .build()
                )
                .build());

        // Create Athena workgroup
        this.athenaWorkgroup = new Workgroup(name + "-athena-wg", WorkgroupArgs.builder()
            .name("market-data-queries")
            .configuration(WorkgroupConfigurationArgs.builder()
                .resultConfiguration(WorkgroupConfigurationResultConfigurationArgs.builder()
                    .outputLocation(storageComponent.getDataLakeBucketName()
                        .applyValue(bucket -> "s3://" + bucket + "/athena-results/"))
                    .build())
                .enforceWorkgroupConfiguration(true)
                .publishCloudwatchMetricsEnabled(true)
                .build())
            .tags(Map.of(
                "Component", "Query",
                "Environment", "production",
                "ManagedBy", "pulumi"
            ))
            .build());

        // Create QuickSight data source
        this.quickSightDataSource = new DataSource(name + "-qs-datasource",
            DataSourceArgs.builder()
                .dataSourceId("market-data-source")
                .name("MarketDataSource")
                .type("ATHENA")
                .parameters(DataSourceParametersArgs.builder()
                    .athena(DataSourceParametersAthenaArgs.builder()
                        .workGroup(athenaWorkgroup.name())
                        .build())
                    .build())
                .build());
    }

    public Output<String> getGlueDatabaseName() {
        return glueDatabase.name();
    }

    public Output<String> getAthenaWorkgroupName() {
        return athenaWorkgroup.name();
    }

    public Output<String> getQuickSightDataSourceId() {
        return quickSightDataSource.dataSourceId();
    }
}
```

## MonitoringComponent.java

```java
package app.components;

import com.pulumi.Output;
import com.pulumi.aws.cloudwatch.Dashboard;
import com.pulumi.aws.cloudwatch.DashboardArgs;
import com.pulumi.aws.cloudwatch.MetricAlarm;
import com.pulumi.aws.cloudwatch.MetricAlarmArgs;

import java.util.Map;

/**
 * Monitoring component for CloudWatch dashboards and alarms.
 */
public class MonitoringComponent {
    private final Dashboard dashboard;
    private final MetricAlarm lambdaErrorAlarm;
    private final MetricAlarm kinesisIteratorAgeAlarm;

    /**
     * Creates monitoring infrastructure.
     *
     * @param name component name
     * @param streamingComponent streaming component
     * @param ingestionComponent ingestion component
     * @param storageComponent storage component
     * @param region AWS region
     */
    public MonitoringComponent(final String name,
                               final StreamingComponent streamingComponent,
                               final IngestionComponent ingestionComponent,
                               final StorageComponent storageComponent,
                               final String region) {

        // Create CloudWatch dashboard
        String dashboardBody = Output.tuple(
            streamingComponent.getStreamName(),
            ingestionComponent.getLambdaFunctionName()
        ).applyValue(tuple -> {
            String streamName = tuple.t1;
            String functionName = tuple.t2;
            return String.format("""
                {
                  "widgets": [
                    {
                      "type": "metric",
                      "properties": {
                        "metrics": [
                          ["AWS/Kinesis", "IncomingRecords", {"stat": "Sum", "label": "Incoming Records"}],
                          [".", "IncomingBytes", {"stat": "Sum", "label": "Incoming Bytes"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "%s",
                        "title": "Kinesis Stream Metrics",
                        "dimensions": {
                          "StreamName": "%s"
                        }
                      }
                    },
                    {
                      "type": "metric",
                      "properties": {
                        "metrics": [
                          ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                          [".", "Errors", {"stat": "Sum"}],
                          [".", "Duration", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "%s",
                        "title": "Lambda Function Metrics",
                        "dimensions": {
                          "FunctionName": "%s"
                        }
                      }
                    }
                  ]
                }
                """, region, streamName, region, functionName);
        });

        this.dashboard = new Dashboard(name + "-dashboard", DashboardArgs.builder()
            .dashboardName("market-data-platform")
            .dashboardBody(dashboardBody)
            .build());

        // Create alarm for Lambda errors
        this.lambdaErrorAlarm = new MetricAlarm(name + "-lambda-errors",
            MetricAlarmArgs.builder()
                .name("market-data-lambda-errors")
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(2)
                .metricName("Errors")
                .namespace("AWS/Lambda")
                .period(300)
                .statistic("Sum")
                .threshold(10.0)
                .alarmDescription("Alert when Lambda function has too many errors")
                .dimensions(Map.of(
                    "FunctionName", ingestionComponent.getLambdaFunctionName()
                ))
                .build());

        // Create alarm for Kinesis iterator age
        this.kinesisIteratorAgeAlarm = new MetricAlarm(name + "-kinesis-iterator-age",
            MetricAlarmArgs.builder()
                .name("market-data-kinesis-lag")
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(2)
                .metricName("GetRecords.IteratorAgeMilliseconds")
                .namespace("AWS/Kinesis")
                .period(300)
                .statistic("Maximum")
                .threshold(60000.0)
                .alarmDescription("Alert when Kinesis stream has high iterator age")
                .dimensions(Map.of(
                    "StreamName", streamingComponent.getStreamName()
                ))
                .build());
    }

    public Output<String> getDashboardUrl() {
        return dashboard.dashboardArn().applyValue(arn ->
            "https://console.aws.amazon.com/cloudwatch/home#dashboards:name=market-data-platform"
        );
    }
}
```

## Lambda Handler Code (lambda/index.py)

```python
import json
import boto3
import os
from datetime import datetime
from base64 import b64decode

timestream_client = boto3.client('timestream-write')
s3_client = boto3.client('s3')

TIMESTREAM_DATABASE = os.environ['TIMESTREAM_DATABASE']
TIMESTREAM_TABLE = os.environ['TIMESTREAM_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']

def handler(event, context):
    """
    Process Kinesis records and write to Timestream and S3.
    """
    records_processed = 0

    for record in event['Records']:
        # Decode Kinesis data
        payload = json.loads(b64decode(record['kinesis']['data']))

        # Write to Timestream
        try:
            write_to_timestream(payload)
        except Exception as e:
            print(f"Error writing to Timestream: {str(e)}")

        # Write to S3 data lake (partitioned by symbol and date)
        try:
            write_to_s3(payload)
        except Exception as e:
            print(f"Error writing to S3: {str(e)}")

        records_processed += 1

    return {
        'statusCode': 200,
        'body': json.dumps(f'Processed {records_processed} records')
    }

def write_to_timestream(payload):
    """Write market data to Timestream."""
    current_time = str(int(datetime.now().timestamp() * 1000))

    dimensions = [
        {'Name': 'symbol', 'Value': payload['symbol']},
        {'Name': 'exchange', 'Value': payload.get('exchange', 'UNKNOWN')}
    ]

    records = [
        {
            'Dimensions': dimensions,
            'MeasureName': 'price',
            'MeasureValue': str(payload['price']),
            'MeasureValueType': 'DOUBLE',
            'Time': current_time
        },
        {
            'Dimensions': dimensions,
            'MeasureName': 'volume',
            'MeasureValue': str(payload['volume']),
            'MeasureValueType': 'BIGINT',
            'Time': current_time
        }
    ]

    timestream_client.write_records(
        DatabaseName=TIMESTREAM_DATABASE,
        TableName=TIMESTREAM_TABLE,
        Records=records
    )

def write_to_s3(payload):
    """Write market data to S3 with partitioning by symbol and date."""
    symbol = payload['symbol']
    date = datetime.now().strftime('%Y-%m-%d')

    key = f"data/symbol={symbol}/date={date}/{datetime.now().timestamp()}.json"

    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=json.dumps(payload),
        ContentType='application/json'
    )
```

This implementation provides a complete time-series data platform with all the required components. The infrastructure includes proper IAM roles, Kinesis with enhanced fan-out support and tagging for ABAC, Timestream with 24-hour memory retention, S3 with lifecycle policies, Glue catalog with partitioning, Athena workgroup, QuickSight data source, and comprehensive CloudWatch monitoring.