package app.components;

import com.pulumi.core.Output;
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
import com.pulumi.aws.glue.inputs.CatalogTableStorageDescriptorSerDeInfoArgs;
// import com.pulumi.aws.quicksight.DataSource;
// import com.pulumi.aws.quicksight.DataSourceArgs;
// import com.pulumi.aws.quicksight.inputs.DataSourceParametersArgs;
// import com.pulumi.aws.quicksight.inputs.DataSourceParametersAthenaArgs;

import java.util.Map;

/**
 * Query component for Glue, Athena, and QuickSight.
 */
public class QueryComponent {
    private final CatalogDatabase glueDatabase;
    private final CatalogTable glueTable;
    private final Workgroup athenaWorkgroup;
    // private final DataSource quickSightDataSource;

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

        // Create Glue catalog database with unique name
        String dbName = name.replace("-query", "").replace("market-data-", "") + "_catalog";
        this.glueDatabase = new CatalogDatabase(name + "-catalog-db",
            CatalogDatabaseArgs.builder()
                .name(dbName)
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
                    .serDeInfo(CatalogTableStorageDescriptorSerDeInfoArgs.builder()
                        .serializationLibrary("org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe")
                        .build()
                    )
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

        // Create Athena workgroup with unique name
        String wgName = name.replace("-query", "").replace("market-data-", "") + "-queries";
        this.athenaWorkgroup = new Workgroup(name + "-athena-wg", WorkgroupArgs.builder()
            .name(wgName)
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

        // Create QuickSight data source - DISABLED (requires account setup)
        // String dsId = name.replace("-query", "").replace("market-data-", "") + "-datasource";
        // this.quickSightDataSource = new DataSource(name + "-qs-datasource",
        //     DataSourceArgs.builder()
        //         .dataSourceId(dsId)
        //         .name("MarketDataSource")
        //         .type("ATHENA")
        //         .parameters(DataSourceParametersArgs.builder()
        //             .athena(DataSourceParametersAthenaArgs.builder()
        //                 .workGroup(athenaWorkgroup.name())
        //                 .build())
        //             .build())
        //         .build());
        // this.quickSightDataSource = null;
    }

    public Output<String> getGlueDatabaseName() {
        return glueDatabase.name();
    }

    public Output<String> getAthenaWorkgroupName() {
        return athenaWorkgroup.name();
    }

    public Output<String> getQuickSightDataSourceId() {
        return Output.of("quicksight-disabled");
    }
}
