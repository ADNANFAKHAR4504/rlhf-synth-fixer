package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.115Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceParametersOutputReference")
public class QuicksightDataSourceParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSourceParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSourceParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSourceParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAmazonElasticsearch(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersAmazonElasticsearch value) {
        software.amazon.jsii.Kernel.call(this, "putAmazonElasticsearch", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAthena(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersAthena value) {
        software.amazon.jsii.Kernel.call(this, "putAthena", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAurora(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersAurora value) {
        software.amazon.jsii.Kernel.call(this, "putAurora", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAuroraPostgresql(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersAuroraPostgresql value) {
        software.amazon.jsii.Kernel.call(this, "putAuroraPostgresql", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAwsIotAnalytics(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersAwsIotAnalytics value) {
        software.amazon.jsii.Kernel.call(this, "putAwsIotAnalytics", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDatabricks(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersDatabricks value) {
        software.amazon.jsii.Kernel.call(this, "putDatabricks", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJira(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersJira value) {
        software.amazon.jsii.Kernel.call(this, "putJira", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMariaDb(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersMariaDb value) {
        software.amazon.jsii.Kernel.call(this, "putMariaDb", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMysql(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersMysql value) {
        software.amazon.jsii.Kernel.call(this, "putMysql", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOracle(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersOracle value) {
        software.amazon.jsii.Kernel.call(this, "putOracle", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPostgresql(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersPostgresql value) {
        software.amazon.jsii.Kernel.call(this, "putPostgresql", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPresto(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersPresto value) {
        software.amazon.jsii.Kernel.call(this, "putPresto", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRds(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersRds value) {
        software.amazon.jsii.Kernel.call(this, "putRds", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRedshift(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersRedshift value) {
        software.amazon.jsii.Kernel.call(this, "putRedshift", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3 value) {
        software.amazon.jsii.Kernel.call(this, "putS3", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putServiceNow(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersServiceNow value) {
        software.amazon.jsii.Kernel.call(this, "putServiceNow", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSnowflake(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersSnowflake value) {
        software.amazon.jsii.Kernel.call(this, "putSnowflake", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSpark(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersSpark value) {
        software.amazon.jsii.Kernel.call(this, "putSpark", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSqlServer(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersSqlServer value) {
        software.amazon.jsii.Kernel.call(this, "putSqlServer", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTeradata(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersTeradata value) {
        software.amazon.jsii.Kernel.call(this, "putTeradata", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTwitter(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersTwitter value) {
        software.amazon.jsii.Kernel.call(this, "putTwitter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAmazonElasticsearch() {
        software.amazon.jsii.Kernel.call(this, "resetAmazonElasticsearch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAthena() {
        software.amazon.jsii.Kernel.call(this, "resetAthena", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAurora() {
        software.amazon.jsii.Kernel.call(this, "resetAurora", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuroraPostgresql() {
        software.amazon.jsii.Kernel.call(this, "resetAuroraPostgresql", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAwsIotAnalytics() {
        software.amazon.jsii.Kernel.call(this, "resetAwsIotAnalytics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatabricks() {
        software.amazon.jsii.Kernel.call(this, "resetDatabricks", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJira() {
        software.amazon.jsii.Kernel.call(this, "resetJira", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMariaDb() {
        software.amazon.jsii.Kernel.call(this, "resetMariaDb", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMysql() {
        software.amazon.jsii.Kernel.call(this, "resetMysql", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOracle() {
        software.amazon.jsii.Kernel.call(this, "resetOracle", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPostgresql() {
        software.amazon.jsii.Kernel.call(this, "resetPostgresql", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPresto() {
        software.amazon.jsii.Kernel.call(this, "resetPresto", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRds() {
        software.amazon.jsii.Kernel.call(this, "resetRds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRedshift() {
        software.amazon.jsii.Kernel.call(this, "resetRedshift", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3() {
        software.amazon.jsii.Kernel.call(this, "resetS3", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceNow() {
        software.amazon.jsii.Kernel.call(this, "resetServiceNow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnowflake() {
        software.amazon.jsii.Kernel.call(this, "resetSnowflake", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpark() {
        software.amazon.jsii.Kernel.call(this, "resetSpark", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSqlServer() {
        software.amazon.jsii.Kernel.call(this, "resetSqlServer", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTeradata() {
        software.amazon.jsii.Kernel.call(this, "resetTeradata", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTwitter() {
        software.amazon.jsii.Kernel.call(this, "resetTwitter", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersAmazonElasticsearchOutputReference getAmazonElasticsearch() {
        return software.amazon.jsii.Kernel.get(this, "amazonElasticsearch", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersAmazonElasticsearchOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersAthenaOutputReference getAthena() {
        return software.amazon.jsii.Kernel.get(this, "athena", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersAthenaOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersAuroraOutputReference getAurora() {
        return software.amazon.jsii.Kernel.get(this, "aurora", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersAuroraOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersAuroraPostgresqlOutputReference getAuroraPostgresql() {
        return software.amazon.jsii.Kernel.get(this, "auroraPostgresql", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersAuroraPostgresqlOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersAwsIotAnalyticsOutputReference getAwsIotAnalytics() {
        return software.amazon.jsii.Kernel.get(this, "awsIotAnalytics", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersAwsIotAnalyticsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersDatabricksOutputReference getDatabricks() {
        return software.amazon.jsii.Kernel.get(this, "databricks", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersDatabricksOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersJiraOutputReference getJira() {
        return software.amazon.jsii.Kernel.get(this, "jira", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersJiraOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersMariaDbOutputReference getMariaDb() {
        return software.amazon.jsii.Kernel.get(this, "mariaDb", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersMariaDbOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersMysqlOutputReference getMysql() {
        return software.amazon.jsii.Kernel.get(this, "mysql", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersMysqlOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersOracleOutputReference getOracle() {
        return software.amazon.jsii.Kernel.get(this, "oracle", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersOracleOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersPostgresqlOutputReference getPostgresql() {
        return software.amazon.jsii.Kernel.get(this, "postgresql", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersPostgresqlOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersPrestoOutputReference getPresto() {
        return software.amazon.jsii.Kernel.get(this, "presto", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersPrestoOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersRdsOutputReference getRds() {
        return software.amazon.jsii.Kernel.get(this, "rds", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersRdsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersRedshiftOutputReference getRedshift() {
        return software.amazon.jsii.Kernel.get(this, "redshift", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersRedshiftOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3OutputReference getS3() {
        return software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3OutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersServiceNowOutputReference getServiceNow() {
        return software.amazon.jsii.Kernel.get(this, "serviceNow", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersServiceNowOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersSnowflakeOutputReference getSnowflake() {
        return software.amazon.jsii.Kernel.get(this, "snowflake", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersSnowflakeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersSparkOutputReference getSpark() {
        return software.amazon.jsii.Kernel.get(this, "spark", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersSparkOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersSqlServerOutputReference getSqlServer() {
        return software.amazon.jsii.Kernel.get(this, "sqlServer", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersSqlServerOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersTeradataOutputReference getTeradata() {
        return software.amazon.jsii.Kernel.get(this, "teradata", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersTeradataOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersTwitterOutputReference getTwitter() {
        return software.amazon.jsii.Kernel.get(this, "twitter", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersTwitterOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersAmazonElasticsearch getAmazonElasticsearchInput() {
        return software.amazon.jsii.Kernel.get(this, "amazonElasticsearchInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersAmazonElasticsearch.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersAthena getAthenaInput() {
        return software.amazon.jsii.Kernel.get(this, "athenaInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersAthena.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersAurora getAuroraInput() {
        return software.amazon.jsii.Kernel.get(this, "auroraInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersAurora.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersAuroraPostgresql getAuroraPostgresqlInput() {
        return software.amazon.jsii.Kernel.get(this, "auroraPostgresqlInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersAuroraPostgresql.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersAwsIotAnalytics getAwsIotAnalyticsInput() {
        return software.amazon.jsii.Kernel.get(this, "awsIotAnalyticsInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersAwsIotAnalytics.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersDatabricks getDatabricksInput() {
        return software.amazon.jsii.Kernel.get(this, "databricksInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersDatabricks.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersJira getJiraInput() {
        return software.amazon.jsii.Kernel.get(this, "jiraInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersJira.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersMariaDb getMariaDbInput() {
        return software.amazon.jsii.Kernel.get(this, "mariaDbInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersMariaDb.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersMysql getMysqlInput() {
        return software.amazon.jsii.Kernel.get(this, "mysqlInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersMysql.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersOracle getOracleInput() {
        return software.amazon.jsii.Kernel.get(this, "oracleInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersOracle.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersPostgresql getPostgresqlInput() {
        return software.amazon.jsii.Kernel.get(this, "postgresqlInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersPostgresql.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersPresto getPrestoInput() {
        return software.amazon.jsii.Kernel.get(this, "prestoInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersPresto.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersRds getRdsInput() {
        return software.amazon.jsii.Kernel.get(this, "rdsInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersRds.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersRedshift getRedshiftInput() {
        return software.amazon.jsii.Kernel.get(this, "redshiftInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersRedshift.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3 getS3Input() {
        return software.amazon.jsii.Kernel.get(this, "s3Input", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersS3.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersServiceNow getServiceNowInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceNowInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersServiceNow.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersSnowflake getSnowflakeInput() {
        return software.amazon.jsii.Kernel.get(this, "snowflakeInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersSnowflake.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersSpark getSparkInput() {
        return software.amazon.jsii.Kernel.get(this, "sparkInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersSpark.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersSqlServer getSqlServerInput() {
        return software.amazon.jsii.Kernel.get(this, "sqlServerInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersSqlServer.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersTeradata getTeradataInput() {
        return software.amazon.jsii.Kernel.get(this, "teradataInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersTeradata.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersTwitter getTwitterInput() {
        return software.amazon.jsii.Kernel.get(this, "twitterInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersTwitter.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
