package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.449Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationOutputReference")
public class KinesisFirehoseDeliveryStreamElasticsearchConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisFirehoseDeliveryStreamElasticsearchConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisFirehoseDeliveryStreamElasticsearchConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisFirehoseDeliveryStreamElasticsearchConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchLoggingOptions(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationCloudwatchLoggingOptions value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLoggingOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProcessingConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationProcessingConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putProcessingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Configuration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationS3Configuration value) {
        software.amazon.jsii.Kernel.call(this, "putS3Configuration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcConfig(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig value) {
        software.amazon.jsii.Kernel.call(this, "putVpcConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBufferingInterval() {
        software.amazon.jsii.Kernel.call(this, "resetBufferingInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBufferingSize() {
        software.amazon.jsii.Kernel.call(this, "resetBufferingSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudwatchLoggingOptions() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLoggingOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterEndpoint() {
        software.amazon.jsii.Kernel.call(this, "resetClusterEndpoint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDomainArn() {
        software.amazon.jsii.Kernel.call(this, "resetDomainArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIndexRotationPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetIndexRotationPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProcessingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetProcessingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetryDuration() {
        software.amazon.jsii.Kernel.call(this, "resetRetryDuration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3BackupMode() {
        software.amazon.jsii.Kernel.call(this, "resetS3BackupMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTypeName() {
        software.amazon.jsii.Kernel.call(this, "resetTypeName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcConfig() {
        software.amazon.jsii.Kernel.call(this, "resetVpcConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationCloudwatchLoggingOptionsOutputReference getCloudwatchLoggingOptions() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationCloudwatchLoggingOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationProcessingConfigurationOutputReference getProcessingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "processingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationProcessingConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationS3ConfigurationOutputReference getS3Configuration() {
        return software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationS3ConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfigOutputReference getVpcConfig() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBufferingIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "bufferingIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBufferingSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "bufferingSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationCloudwatchLoggingOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainArnInput() {
        return software.amazon.jsii.Kernel.get(this, "domainArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIndexNameInput() {
        return software.amazon.jsii.Kernel.get(this, "indexNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIndexRotationPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "indexRotationPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationProcessingConfiguration getProcessingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "processingConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationProcessingConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRetryDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "retryDurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3BackupModeInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BackupModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationS3Configuration getS3ConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationS3Configuration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeNameInput() {
        return software.amazon.jsii.Kernel.get(this, "typeNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig getVpcConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBufferingInterval() {
        return software.amazon.jsii.Kernel.get(this, "bufferingInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBufferingInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bufferingInterval", java.util.Objects.requireNonNull(value, "bufferingInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBufferingSize() {
        return software.amazon.jsii.Kernel.get(this, "bufferingSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBufferingSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bufferingSize", java.util.Objects.requireNonNull(value, "bufferingSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "clusterEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterEndpoint", java.util.Objects.requireNonNull(value, "clusterEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainArn() {
        return software.amazon.jsii.Kernel.get(this, "domainArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainArn", java.util.Objects.requireNonNull(value, "domainArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIndexName() {
        return software.amazon.jsii.Kernel.get(this, "indexName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIndexName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "indexName", java.util.Objects.requireNonNull(value, "indexName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIndexRotationPeriod() {
        return software.amazon.jsii.Kernel.get(this, "indexRotationPeriod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIndexRotationPeriod(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "indexRotationPeriod", java.util.Objects.requireNonNull(value, "indexRotationPeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRetryDuration() {
        return software.amazon.jsii.Kernel.get(this, "retryDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRetryDuration(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "retryDuration", java.util.Objects.requireNonNull(value, "retryDuration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3BackupMode() {
        return software.amazon.jsii.Kernel.get(this, "s3BackupMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3BackupMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3BackupMode", java.util.Objects.requireNonNull(value, "s3BackupMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTypeName() {
        return software.amazon.jsii.Kernel.get(this, "typeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTypeName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "typeName", java.util.Objects.requireNonNull(value, "typeName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
