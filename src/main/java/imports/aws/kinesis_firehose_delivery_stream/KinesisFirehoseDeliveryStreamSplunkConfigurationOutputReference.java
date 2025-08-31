package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.465Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamSplunkConfigurationOutputReference")
public class KinesisFirehoseDeliveryStreamSplunkConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisFirehoseDeliveryStreamSplunkConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisFirehoseDeliveryStreamSplunkConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisFirehoseDeliveryStreamSplunkConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchLoggingOptions(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationCloudwatchLoggingOptions value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLoggingOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProcessingConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationProcessingConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putProcessingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Configuration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationS3Configuration value) {
        software.amazon.jsii.Kernel.call(this, "putS3Configuration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSecretsManagerConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationSecretsManagerConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSecretsManagerConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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

    public void resetHecAcknowledgmentTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetHecAcknowledgmentTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHecEndpointType() {
        software.amazon.jsii.Kernel.call(this, "resetHecEndpointType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHecToken() {
        software.amazon.jsii.Kernel.call(this, "resetHecToken", software.amazon.jsii.NativeType.VOID);
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

    public void resetSecretsManagerConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSecretsManagerConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationCloudwatchLoggingOptionsOutputReference getCloudwatchLoggingOptions() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationCloudwatchLoggingOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationProcessingConfigurationOutputReference getProcessingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "processingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationProcessingConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationS3ConfigurationOutputReference getS3Configuration() {
        return software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationS3ConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationSecretsManagerConfigurationOutputReference getSecretsManagerConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "secretsManagerConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationSecretsManagerConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBufferingIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "bufferingIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBufferingSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "bufferingSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationCloudwatchLoggingOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHecAcknowledgmentTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "hecAcknowledgmentTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHecEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "hecEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHecEndpointTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "hecEndpointTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHecTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "hecTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationProcessingConfiguration getProcessingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "processingConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationProcessingConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRetryDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "retryDurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3BackupModeInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BackupModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationS3Configuration getS3ConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationS3Configuration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationSecretsManagerConfiguration getSecretsManagerConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "secretsManagerConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationSecretsManagerConfiguration.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getHecAcknowledgmentTimeout() {
        return software.amazon.jsii.Kernel.get(this, "hecAcknowledgmentTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHecAcknowledgmentTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "hecAcknowledgmentTimeout", java.util.Objects.requireNonNull(value, "hecAcknowledgmentTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHecEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "hecEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHecEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hecEndpoint", java.util.Objects.requireNonNull(value, "hecEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHecEndpointType() {
        return software.amazon.jsii.Kernel.get(this, "hecEndpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHecEndpointType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hecEndpointType", java.util.Objects.requireNonNull(value, "hecEndpointType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHecToken() {
        return software.amazon.jsii.Kernel.get(this, "hecToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHecToken(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hecToken", java.util.Objects.requireNonNull(value, "hecToken is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRetryDuration() {
        return software.amazon.jsii.Kernel.get(this, "retryDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRetryDuration(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "retryDuration", java.util.Objects.requireNonNull(value, "retryDuration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3BackupMode() {
        return software.amazon.jsii.Kernel.get(this, "s3BackupMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3BackupMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3BackupMode", java.util.Objects.requireNonNull(value, "s3BackupMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
