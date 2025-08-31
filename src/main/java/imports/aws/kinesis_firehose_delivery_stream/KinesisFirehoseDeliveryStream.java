package imports.aws.kinesis_firehose_delivery_stream;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream aws_kinesis_firehose_delivery_stream}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.448Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStream")
public class KinesisFirehoseDeliveryStream extends com.hashicorp.cdktf.TerraformResource {

    protected KinesisFirehoseDeliveryStream(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisFirehoseDeliveryStream(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStream.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream aws_kinesis_firehose_delivery_stream} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public KinesisFirehoseDeliveryStream(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a KinesisFirehoseDeliveryStream resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the KinesisFirehoseDeliveryStream to import. This parameter is required.
     * @param importFromId The id of the existing KinesisFirehoseDeliveryStream that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the KinesisFirehoseDeliveryStream to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStream.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a KinesisFirehoseDeliveryStream resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the KinesisFirehoseDeliveryStream to import. This parameter is required.
     * @param importFromId The id of the existing KinesisFirehoseDeliveryStream that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStream.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putElasticsearchConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putElasticsearchConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putExtendedS3Configuration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3Configuration value) {
        software.amazon.jsii.Kernel.call(this, "putExtendedS3Configuration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHttpEndpointConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putHttpEndpointConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIcebergConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putIcebergConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesisSourceConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamKinesisSourceConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putKinesisSourceConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMskSourceConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putMskSourceConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOpensearchConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putOpensearchConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOpensearchserverlessConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchserverlessConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putOpensearchserverlessConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRedshiftConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putRedshiftConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putServerSideEncryption(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamServerSideEncryption value) {
        software.amazon.jsii.Kernel.call(this, "putServerSideEncryption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSnowflakeConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSnowflakeConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSplunkConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSplunkConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetArn() {
        software.amazon.jsii.Kernel.call(this, "resetArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDestinationId() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetElasticsearchConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetElasticsearchConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExtendedS3Configuration() {
        software.amazon.jsii.Kernel.call(this, "resetExtendedS3Configuration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpEndpointConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetHttpEndpointConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIcebergConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetIcebergConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKinesisSourceConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetKinesisSourceConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMskSourceConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetMskSourceConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOpensearchConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetOpensearchConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOpensearchserverlessConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetOpensearchserverlessConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRedshiftConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetRedshiftConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServerSideEncryption() {
        software.amazon.jsii.Kernel.call(this, "resetServerSideEncryption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnowflakeConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSnowflakeConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSplunkConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSplunkConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersionId() {
        software.amazon.jsii.Kernel.call(this, "resetVersionId", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationOutputReference getElasticsearchConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "elasticsearchConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationOutputReference getExtendedS3Configuration() {
        return software.amazon.jsii.Kernel.get(this, "extendedS3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationOutputReference getHttpEndpointConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "httpEndpointConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationOutputReference getIcebergConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "icebergConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamKinesisSourceConfigurationOutputReference getKinesisSourceConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "kinesisSourceConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamKinesisSourceConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfigurationOutputReference getMskSourceConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "mskSourceConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfigurationOutputReference getOpensearchConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "opensearchConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchserverlessConfigurationOutputReference getOpensearchserverlessConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "opensearchserverlessConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchserverlessConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationOutputReference getRedshiftConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "redshiftConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamServerSideEncryptionOutputReference getServerSideEncryption() {
        return software.amazon.jsii.Kernel.get(this, "serverSideEncryption", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamServerSideEncryptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationOutputReference getSnowflakeConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "snowflakeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationOutputReference getSplunkConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "splunkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getArnInput() {
        return software.amazon.jsii.Kernel.get(this, "arnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationIdInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfiguration getElasticsearchConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "elasticsearchConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3Configuration getExtendedS3ConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "extendedS3ConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3Configuration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfiguration getHttpEndpointConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "httpEndpointConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfiguration getIcebergConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "icebergConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamKinesisSourceConfiguration getKinesisSourceConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisSourceConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamKinesisSourceConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfiguration getMskSourceConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "mskSourceConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfiguration getOpensearchConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "opensearchConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchserverlessConfiguration getOpensearchserverlessConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "opensearchserverlessConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchserverlessConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfiguration getRedshiftConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "redshiftConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamServerSideEncryption getServerSideEncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "serverSideEncryptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamServerSideEncryption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfiguration getSnowflakeConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "snowflakeConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfiguration getSplunkConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "splunkConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionIdInput() {
        return software.amazon.jsii.Kernel.get(this, "versionIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "arn", java.util.Objects.requireNonNull(value, "arn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestination() {
        return software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestination(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destination", java.util.Objects.requireNonNull(value, "destination is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationId() {
        return software.amazon.jsii.Kernel.get(this, "destinationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestinationId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destinationId", java.util.Objects.requireNonNull(value, "destinationId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersionId() {
        return software.amazon.jsii.Kernel.get(this, "versionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersionId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "versionId", java.util.Objects.requireNonNull(value, "versionId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStream}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStream> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#destination KinesisFirehoseDeliveryStream#destination}.
         * <p>
         * @return {@code this}
         * @param destination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#destination KinesisFirehoseDeliveryStream#destination}. This parameter is required.
         */
        public Builder destination(final java.lang.String destination) {
            this.config.destination(destination);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#name KinesisFirehoseDeliveryStream#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#name KinesisFirehoseDeliveryStream#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#arn KinesisFirehoseDeliveryStream#arn}.
         * <p>
         * @return {@code this}
         * @param arn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#arn KinesisFirehoseDeliveryStream#arn}. This parameter is required.
         */
        public Builder arn(final java.lang.String arn) {
            this.config.arn(arn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#destination_id KinesisFirehoseDeliveryStream#destination_id}.
         * <p>
         * @return {@code this}
         * @param destinationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#destination_id KinesisFirehoseDeliveryStream#destination_id}. This parameter is required.
         */
        public Builder destinationId(final java.lang.String destinationId) {
            this.config.destinationId(destinationId);
            return this;
        }

        /**
         * elasticsearch_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#elasticsearch_configuration KinesisFirehoseDeliveryStream#elasticsearch_configuration}
         * <p>
         * @return {@code this}
         * @param elasticsearchConfiguration elasticsearch_configuration block. This parameter is required.
         */
        public Builder elasticsearchConfiguration(final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfiguration elasticsearchConfiguration) {
            this.config.elasticsearchConfiguration(elasticsearchConfiguration);
            return this;
        }

        /**
         * extended_s3_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#extended_s3_configuration KinesisFirehoseDeliveryStream#extended_s3_configuration}
         * <p>
         * @return {@code this}
         * @param extendedS3Configuration extended_s3_configuration block. This parameter is required.
         */
        public Builder extendedS3Configuration(final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3Configuration extendedS3Configuration) {
            this.config.extendedS3Configuration(extendedS3Configuration);
            return this;
        }

        /**
         * http_endpoint_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#http_endpoint_configuration KinesisFirehoseDeliveryStream#http_endpoint_configuration}
         * <p>
         * @return {@code this}
         * @param httpEndpointConfiguration http_endpoint_configuration block. This parameter is required.
         */
        public Builder httpEndpointConfiguration(final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfiguration httpEndpointConfiguration) {
            this.config.httpEndpointConfiguration(httpEndpointConfiguration);
            return this;
        }

        /**
         * iceberg_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#iceberg_configuration KinesisFirehoseDeliveryStream#iceberg_configuration}
         * <p>
         * @return {@code this}
         * @param icebergConfiguration iceberg_configuration block. This parameter is required.
         */
        public Builder icebergConfiguration(final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfiguration icebergConfiguration) {
            this.config.icebergConfiguration(icebergConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#id KinesisFirehoseDeliveryStream#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#id KinesisFirehoseDeliveryStream#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * kinesis_source_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#kinesis_source_configuration KinesisFirehoseDeliveryStream#kinesis_source_configuration}
         * <p>
         * @return {@code this}
         * @param kinesisSourceConfiguration kinesis_source_configuration block. This parameter is required.
         */
        public Builder kinesisSourceConfiguration(final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamKinesisSourceConfiguration kinesisSourceConfiguration) {
            this.config.kinesisSourceConfiguration(kinesisSourceConfiguration);
            return this;
        }

        /**
         * msk_source_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#msk_source_configuration KinesisFirehoseDeliveryStream#msk_source_configuration}
         * <p>
         * @return {@code this}
         * @param mskSourceConfiguration msk_source_configuration block. This parameter is required.
         */
        public Builder mskSourceConfiguration(final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfiguration mskSourceConfiguration) {
            this.config.mskSourceConfiguration(mskSourceConfiguration);
            return this;
        }

        /**
         * opensearch_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#opensearch_configuration KinesisFirehoseDeliveryStream#opensearch_configuration}
         * <p>
         * @return {@code this}
         * @param opensearchConfiguration opensearch_configuration block. This parameter is required.
         */
        public Builder opensearchConfiguration(final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfiguration opensearchConfiguration) {
            this.config.opensearchConfiguration(opensearchConfiguration);
            return this;
        }

        /**
         * opensearchserverless_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#opensearchserverless_configuration KinesisFirehoseDeliveryStream#opensearchserverless_configuration}
         * <p>
         * @return {@code this}
         * @param opensearchserverlessConfiguration opensearchserverless_configuration block. This parameter is required.
         */
        public Builder opensearchserverlessConfiguration(final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchserverlessConfiguration opensearchserverlessConfiguration) {
            this.config.opensearchserverlessConfiguration(opensearchserverlessConfiguration);
            return this;
        }

        /**
         * redshift_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#redshift_configuration KinesisFirehoseDeliveryStream#redshift_configuration}
         * <p>
         * @return {@code this}
         * @param redshiftConfiguration redshift_configuration block. This parameter is required.
         */
        public Builder redshiftConfiguration(final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfiguration redshiftConfiguration) {
            this.config.redshiftConfiguration(redshiftConfiguration);
            return this;
        }

        /**
         * server_side_encryption block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#server_side_encryption KinesisFirehoseDeliveryStream#server_side_encryption}
         * <p>
         * @return {@code this}
         * @param serverSideEncryption server_side_encryption block. This parameter is required.
         */
        public Builder serverSideEncryption(final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamServerSideEncryption serverSideEncryption) {
            this.config.serverSideEncryption(serverSideEncryption);
            return this;
        }

        /**
         * snowflake_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#snowflake_configuration KinesisFirehoseDeliveryStream#snowflake_configuration}
         * <p>
         * @return {@code this}
         * @param snowflakeConfiguration snowflake_configuration block. This parameter is required.
         */
        public Builder snowflakeConfiguration(final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfiguration snowflakeConfiguration) {
            this.config.snowflakeConfiguration(snowflakeConfiguration);
            return this;
        }

        /**
         * splunk_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#splunk_configuration KinesisFirehoseDeliveryStream#splunk_configuration}
         * <p>
         * @return {@code this}
         * @param splunkConfiguration splunk_configuration block. This parameter is required.
         */
        public Builder splunkConfiguration(final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfiguration splunkConfiguration) {
            this.config.splunkConfiguration(splunkConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#tags KinesisFirehoseDeliveryStream#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#tags KinesisFirehoseDeliveryStream#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#tags_all KinesisFirehoseDeliveryStream#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#tags_all KinesisFirehoseDeliveryStream#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#timeouts KinesisFirehoseDeliveryStream#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#version_id KinesisFirehoseDeliveryStream#version_id}.
         * <p>
         * @return {@code this}
         * @param versionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#version_id KinesisFirehoseDeliveryStream#version_id}. This parameter is required.
         */
        public Builder versionId(final java.lang.String versionId) {
            this.config.versionId(versionId);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStream}.
         */
        @Override
        public imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStream build() {
            return new imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStream(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
