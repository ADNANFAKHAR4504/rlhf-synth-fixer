package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.464Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationOutputReference")
public class KinesisFirehoseDeliveryStreamSnowflakeConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisFirehoseDeliveryStreamSnowflakeConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisFirehoseDeliveryStreamSnowflakeConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisFirehoseDeliveryStreamSnowflakeConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchLoggingOptions(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationCloudwatchLoggingOptions value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLoggingOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProcessingConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationProcessingConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putProcessingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Configuration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3Configuration value) {
        software.amazon.jsii.Kernel.call(this, "putS3Configuration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSecretsManagerConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSecretsManagerConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSecretsManagerConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSnowflakeRoleConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeRoleConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSnowflakeRoleConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSnowflakeVpcConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSnowflakeVpcConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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

    public void resetContentColumnName() {
        software.amazon.jsii.Kernel.call(this, "resetContentColumnName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataLoadingOption() {
        software.amazon.jsii.Kernel.call(this, "resetDataLoadingOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyPassphrase() {
        software.amazon.jsii.Kernel.call(this, "resetKeyPassphrase", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetadataColumnName() {
        software.amazon.jsii.Kernel.call(this, "resetMetadataColumnName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivateKey() {
        software.amazon.jsii.Kernel.call(this, "resetPrivateKey", software.amazon.jsii.NativeType.VOID);
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

    public void resetSnowflakeRoleConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSnowflakeRoleConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnowflakeVpcConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSnowflakeVpcConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUser() {
        software.amazon.jsii.Kernel.call(this, "resetUser", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationCloudwatchLoggingOptionsOutputReference getCloudwatchLoggingOptions() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationCloudwatchLoggingOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationProcessingConfigurationOutputReference getProcessingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "processingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationProcessingConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationOutputReference getS3Configuration() {
        return software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSecretsManagerConfigurationOutputReference getSecretsManagerConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "secretsManagerConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSecretsManagerConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeRoleConfigurationOutputReference getSnowflakeRoleConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "snowflakeRoleConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeRoleConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfigurationOutputReference getSnowflakeVpcConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "snowflakeVpcConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "accountUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBufferingIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "bufferingIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBufferingSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "bufferingSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationCloudwatchLoggingOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentColumnNameInput() {
        return software.amazon.jsii.Kernel.get(this, "contentColumnNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatabaseInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataLoadingOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "dataLoadingOptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyPassphraseInput() {
        return software.amazon.jsii.Kernel.get(this, "keyPassphraseInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetadataColumnNameInput() {
        return software.amazon.jsii.Kernel.get(this, "metadataColumnNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrivateKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "privateKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationProcessingConfiguration getProcessingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "processingConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationProcessingConfiguration.class));
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

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3Configuration getS3ConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3Configuration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSchemaInput() {
        return software.amazon.jsii.Kernel.get(this, "schemaInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSecretsManagerConfiguration getSecretsManagerConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "secretsManagerConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSecretsManagerConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeRoleConfiguration getSnowflakeRoleConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "snowflakeRoleConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeRoleConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfiguration getSnowflakeVpcConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "snowflakeVpcConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTableInput() {
        return software.amazon.jsii.Kernel.get(this, "tableInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserInput() {
        return software.amazon.jsii.Kernel.get(this, "userInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountUrl() {
        return software.amazon.jsii.Kernel.get(this, "accountUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountUrl", java.util.Objects.requireNonNull(value, "accountUrl is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getContentColumnName() {
        return software.amazon.jsii.Kernel.get(this, "contentColumnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentColumnName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentColumnName", java.util.Objects.requireNonNull(value, "contentColumnName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabase() {
        return software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatabase(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "database", java.util.Objects.requireNonNull(value, "database is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataLoadingOption() {
        return software.amazon.jsii.Kernel.get(this, "dataLoadingOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataLoadingOption(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataLoadingOption", java.util.Objects.requireNonNull(value, "dataLoadingOption is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyPassphrase() {
        return software.amazon.jsii.Kernel.get(this, "keyPassphrase", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyPassphrase(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyPassphrase", java.util.Objects.requireNonNull(value, "keyPassphrase is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetadataColumnName() {
        return software.amazon.jsii.Kernel.get(this, "metadataColumnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetadataColumnName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metadataColumnName", java.util.Objects.requireNonNull(value, "metadataColumnName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateKey() {
        return software.amazon.jsii.Kernel.get(this, "privateKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrivateKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "privateKey", java.util.Objects.requireNonNull(value, "privateKey is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getSchema() {
        return software.amazon.jsii.Kernel.get(this, "schema", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSchema(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "schema", java.util.Objects.requireNonNull(value, "schema is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTable() {
        return software.amazon.jsii.Kernel.get(this, "table", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTable(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "table", java.util.Objects.requireNonNull(value, "table is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUser() {
        return software.amazon.jsii.Kernel.get(this, "user", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUser(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "user", java.util.Objects.requireNonNull(value, "user is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
