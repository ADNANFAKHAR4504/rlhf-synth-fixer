package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.450Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamExtendedS3Configuration")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamExtendedS3Configuration.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamExtendedS3Configuration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#bucket_arn KinesisFirehoseDeliveryStream#bucket_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_interval KinesisFirehoseDeliveryStream#buffering_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBufferingInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_size KinesisFirehoseDeliveryStream#buffering_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBufferingSize() {
        return null;
    }

    /**
     * cloudwatch_logging_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#cloudwatch_logging_options KinesisFirehoseDeliveryStream#cloudwatch_logging_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#compression_format KinesisFirehoseDeliveryStream#compression_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCompressionFormat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#custom_time_zone KinesisFirehoseDeliveryStream#custom_time_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomTimeZone() {
        return null;
    }

    /**
     * data_format_conversion_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#data_format_conversion_configuration KinesisFirehoseDeliveryStream#data_format_conversion_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfiguration getDataFormatConversionConfiguration() {
        return null;
    }

    /**
     * dynamic_partitioning_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#dynamic_partitioning_configuration KinesisFirehoseDeliveryStream#dynamic_partitioning_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDynamicPartitioningConfiguration getDynamicPartitioningConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#error_output_prefix KinesisFirehoseDeliveryStream#error_output_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getErrorOutputPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#file_extension KinesisFirehoseDeliveryStream#file_extension}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFileExtension() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#kms_key_arn KinesisFirehoseDeliveryStream#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#prefix KinesisFirehoseDeliveryStream#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * processing_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationProcessingConfiguration getProcessingConfiguration() {
        return null;
    }

    /**
     * s3_backup_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_backup_configuration KinesisFirehoseDeliveryStream#s3_backup_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationS3BackupConfiguration getS3BackupConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_backup_mode KinesisFirehoseDeliveryStream#s3_backup_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3BackupMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamExtendedS3Configuration> {
        java.lang.String bucketArn;
        java.lang.String roleArn;
        java.lang.Number bufferingInterval;
        java.lang.Number bufferingSize;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        java.lang.String compressionFormat;
        java.lang.String customTimeZone;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfiguration dataFormatConversionConfiguration;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDynamicPartitioningConfiguration dynamicPartitioningConfiguration;
        java.lang.String errorOutputPrefix;
        java.lang.String fileExtension;
        java.lang.String kmsKeyArn;
        java.lang.String prefix;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationProcessingConfiguration processingConfiguration;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationS3BackupConfiguration s3BackupConfiguration;
        java.lang.String s3BackupMode;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getBucketArn}
         * @param bucketArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#bucket_arn KinesisFirehoseDeliveryStream#bucket_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketArn(java.lang.String bucketArn) {
            this.bucketArn = bucketArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getBufferingInterval}
         * @param bufferingInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_interval KinesisFirehoseDeliveryStream#buffering_interval}.
         * @return {@code this}
         */
        public Builder bufferingInterval(java.lang.Number bufferingInterval) {
            this.bufferingInterval = bufferingInterval;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getBufferingSize}
         * @param bufferingSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_size KinesisFirehoseDeliveryStream#buffering_size}.
         * @return {@code this}
         */
        public Builder bufferingSize(java.lang.Number bufferingSize) {
            this.bufferingSize = bufferingSize;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getCloudwatchLoggingOptions}
         * @param cloudwatchLoggingOptions cloudwatch_logging_options block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#cloudwatch_logging_options KinesisFirehoseDeliveryStream#cloudwatch_logging_options}
         * @return {@code this}
         */
        public Builder cloudwatchLoggingOptions(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions) {
            this.cloudwatchLoggingOptions = cloudwatchLoggingOptions;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getCompressionFormat}
         * @param compressionFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#compression_format KinesisFirehoseDeliveryStream#compression_format}.
         * @return {@code this}
         */
        public Builder compressionFormat(java.lang.String compressionFormat) {
            this.compressionFormat = compressionFormat;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getCustomTimeZone}
         * @param customTimeZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#custom_time_zone KinesisFirehoseDeliveryStream#custom_time_zone}.
         * @return {@code this}
         */
        public Builder customTimeZone(java.lang.String customTimeZone) {
            this.customTimeZone = customTimeZone;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getDataFormatConversionConfiguration}
         * @param dataFormatConversionConfiguration data_format_conversion_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#data_format_conversion_configuration KinesisFirehoseDeliveryStream#data_format_conversion_configuration}
         * @return {@code this}
         */
        public Builder dataFormatConversionConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfiguration dataFormatConversionConfiguration) {
            this.dataFormatConversionConfiguration = dataFormatConversionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getDynamicPartitioningConfiguration}
         * @param dynamicPartitioningConfiguration dynamic_partitioning_configuration block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#dynamic_partitioning_configuration KinesisFirehoseDeliveryStream#dynamic_partitioning_configuration}
         * @return {@code this}
         */
        public Builder dynamicPartitioningConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDynamicPartitioningConfiguration dynamicPartitioningConfiguration) {
            this.dynamicPartitioningConfiguration = dynamicPartitioningConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getErrorOutputPrefix}
         * @param errorOutputPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#error_output_prefix KinesisFirehoseDeliveryStream#error_output_prefix}.
         * @return {@code this}
         */
        public Builder errorOutputPrefix(java.lang.String errorOutputPrefix) {
            this.errorOutputPrefix = errorOutputPrefix;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getFileExtension}
         * @param fileExtension Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#file_extension KinesisFirehoseDeliveryStream#file_extension}.
         * @return {@code this}
         */
        public Builder fileExtension(java.lang.String fileExtension) {
            this.fileExtension = fileExtension;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#kms_key_arn KinesisFirehoseDeliveryStream#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#prefix KinesisFirehoseDeliveryStream#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getProcessingConfiguration}
         * @param processingConfiguration processing_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
         * @return {@code this}
         */
        public Builder processingConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationProcessingConfiguration processingConfiguration) {
            this.processingConfiguration = processingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getS3BackupConfiguration}
         * @param s3BackupConfiguration s3_backup_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_backup_configuration KinesisFirehoseDeliveryStream#s3_backup_configuration}
         * @return {@code this}
         */
        public Builder s3BackupConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationS3BackupConfiguration s3BackupConfiguration) {
            this.s3BackupConfiguration = s3BackupConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration#getS3BackupMode}
         * @param s3BackupMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_backup_mode KinesisFirehoseDeliveryStream#s3_backup_mode}.
         * @return {@code this}
         */
        public Builder s3BackupMode(java.lang.String s3BackupMode) {
            this.s3BackupMode = s3BackupMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamExtendedS3Configuration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamExtendedS3Configuration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamExtendedS3Configuration {
        private final java.lang.String bucketArn;
        private final java.lang.String roleArn;
        private final java.lang.Number bufferingInterval;
        private final java.lang.Number bufferingSize;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        private final java.lang.String compressionFormat;
        private final java.lang.String customTimeZone;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfiguration dataFormatConversionConfiguration;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDynamicPartitioningConfiguration dynamicPartitioningConfiguration;
        private final java.lang.String errorOutputPrefix;
        private final java.lang.String fileExtension;
        private final java.lang.String kmsKeyArn;
        private final java.lang.String prefix;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationProcessingConfiguration processingConfiguration;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationS3BackupConfiguration s3BackupConfiguration;
        private final java.lang.String s3BackupMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketArn = software.amazon.jsii.Kernel.get(this, "bucketArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bufferingInterval = software.amazon.jsii.Kernel.get(this, "bufferingInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.bufferingSize = software.amazon.jsii.Kernel.get(this, "bufferingSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cloudwatchLoggingOptions = software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationCloudwatchLoggingOptions.class));
            this.compressionFormat = software.amazon.jsii.Kernel.get(this, "compressionFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customTimeZone = software.amazon.jsii.Kernel.get(this, "customTimeZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataFormatConversionConfiguration = software.amazon.jsii.Kernel.get(this, "dataFormatConversionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfiguration.class));
            this.dynamicPartitioningConfiguration = software.amazon.jsii.Kernel.get(this, "dynamicPartitioningConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDynamicPartitioningConfiguration.class));
            this.errorOutputPrefix = software.amazon.jsii.Kernel.get(this, "errorOutputPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileExtension = software.amazon.jsii.Kernel.get(this, "fileExtension", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.processingConfiguration = software.amazon.jsii.Kernel.get(this, "processingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationProcessingConfiguration.class));
            this.s3BackupConfiguration = software.amazon.jsii.Kernel.get(this, "s3BackupConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationS3BackupConfiguration.class));
            this.s3BackupMode = software.amazon.jsii.Kernel.get(this, "s3BackupMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketArn = java.util.Objects.requireNonNull(builder.bucketArn, "bucketArn is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.bufferingInterval = builder.bufferingInterval;
            this.bufferingSize = builder.bufferingSize;
            this.cloudwatchLoggingOptions = builder.cloudwatchLoggingOptions;
            this.compressionFormat = builder.compressionFormat;
            this.customTimeZone = builder.customTimeZone;
            this.dataFormatConversionConfiguration = builder.dataFormatConversionConfiguration;
            this.dynamicPartitioningConfiguration = builder.dynamicPartitioningConfiguration;
            this.errorOutputPrefix = builder.errorOutputPrefix;
            this.fileExtension = builder.fileExtension;
            this.kmsKeyArn = builder.kmsKeyArn;
            this.prefix = builder.prefix;
            this.processingConfiguration = builder.processingConfiguration;
            this.s3BackupConfiguration = builder.s3BackupConfiguration;
            this.s3BackupMode = builder.s3BackupMode;
        }

        @Override
        public final java.lang.String getBucketArn() {
            return this.bucketArn;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Number getBufferingInterval() {
            return this.bufferingInterval;
        }

        @Override
        public final java.lang.Number getBufferingSize() {
            return this.bufferingSize;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
            return this.cloudwatchLoggingOptions;
        }

        @Override
        public final java.lang.String getCompressionFormat() {
            return this.compressionFormat;
        }

        @Override
        public final java.lang.String getCustomTimeZone() {
            return this.customTimeZone;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfiguration getDataFormatConversionConfiguration() {
            return this.dataFormatConversionConfiguration;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDynamicPartitioningConfiguration getDynamicPartitioningConfiguration() {
            return this.dynamicPartitioningConfiguration;
        }

        @Override
        public final java.lang.String getErrorOutputPrefix() {
            return this.errorOutputPrefix;
        }

        @Override
        public final java.lang.String getFileExtension() {
            return this.fileExtension;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationProcessingConfiguration getProcessingConfiguration() {
            return this.processingConfiguration;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationS3BackupConfiguration getS3BackupConfiguration() {
            return this.s3BackupConfiguration;
        }

        @Override
        public final java.lang.String getS3BackupMode() {
            return this.s3BackupMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketArn", om.valueToTree(this.getBucketArn()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getBufferingInterval() != null) {
                data.set("bufferingInterval", om.valueToTree(this.getBufferingInterval()));
            }
            if (this.getBufferingSize() != null) {
                data.set("bufferingSize", om.valueToTree(this.getBufferingSize()));
            }
            if (this.getCloudwatchLoggingOptions() != null) {
                data.set("cloudwatchLoggingOptions", om.valueToTree(this.getCloudwatchLoggingOptions()));
            }
            if (this.getCompressionFormat() != null) {
                data.set("compressionFormat", om.valueToTree(this.getCompressionFormat()));
            }
            if (this.getCustomTimeZone() != null) {
                data.set("customTimeZone", om.valueToTree(this.getCustomTimeZone()));
            }
            if (this.getDataFormatConversionConfiguration() != null) {
                data.set("dataFormatConversionConfiguration", om.valueToTree(this.getDataFormatConversionConfiguration()));
            }
            if (this.getDynamicPartitioningConfiguration() != null) {
                data.set("dynamicPartitioningConfiguration", om.valueToTree(this.getDynamicPartitioningConfiguration()));
            }
            if (this.getErrorOutputPrefix() != null) {
                data.set("errorOutputPrefix", om.valueToTree(this.getErrorOutputPrefix()));
            }
            if (this.getFileExtension() != null) {
                data.set("fileExtension", om.valueToTree(this.getFileExtension()));
            }
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }
            if (this.getProcessingConfiguration() != null) {
                data.set("processingConfiguration", om.valueToTree(this.getProcessingConfiguration()));
            }
            if (this.getS3BackupConfiguration() != null) {
                data.set("s3BackupConfiguration", om.valueToTree(this.getS3BackupConfiguration()));
            }
            if (this.getS3BackupMode() != null) {
                data.set("s3BackupMode", om.valueToTree(this.getS3BackupMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamExtendedS3Configuration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamExtendedS3Configuration.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamExtendedS3Configuration.Jsii$Proxy) o;

            if (!bucketArn.equals(that.bucketArn)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.bufferingInterval != null ? !this.bufferingInterval.equals(that.bufferingInterval) : that.bufferingInterval != null) return false;
            if (this.bufferingSize != null ? !this.bufferingSize.equals(that.bufferingSize) : that.bufferingSize != null) return false;
            if (this.cloudwatchLoggingOptions != null ? !this.cloudwatchLoggingOptions.equals(that.cloudwatchLoggingOptions) : that.cloudwatchLoggingOptions != null) return false;
            if (this.compressionFormat != null ? !this.compressionFormat.equals(that.compressionFormat) : that.compressionFormat != null) return false;
            if (this.customTimeZone != null ? !this.customTimeZone.equals(that.customTimeZone) : that.customTimeZone != null) return false;
            if (this.dataFormatConversionConfiguration != null ? !this.dataFormatConversionConfiguration.equals(that.dataFormatConversionConfiguration) : that.dataFormatConversionConfiguration != null) return false;
            if (this.dynamicPartitioningConfiguration != null ? !this.dynamicPartitioningConfiguration.equals(that.dynamicPartitioningConfiguration) : that.dynamicPartitioningConfiguration != null) return false;
            if (this.errorOutputPrefix != null ? !this.errorOutputPrefix.equals(that.errorOutputPrefix) : that.errorOutputPrefix != null) return false;
            if (this.fileExtension != null ? !this.fileExtension.equals(that.fileExtension) : that.fileExtension != null) return false;
            if (this.kmsKeyArn != null ? !this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn != null) return false;
            if (this.prefix != null ? !this.prefix.equals(that.prefix) : that.prefix != null) return false;
            if (this.processingConfiguration != null ? !this.processingConfiguration.equals(that.processingConfiguration) : that.processingConfiguration != null) return false;
            if (this.s3BackupConfiguration != null ? !this.s3BackupConfiguration.equals(that.s3BackupConfiguration) : that.s3BackupConfiguration != null) return false;
            return this.s3BackupMode != null ? this.s3BackupMode.equals(that.s3BackupMode) : that.s3BackupMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketArn.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.bufferingInterval != null ? this.bufferingInterval.hashCode() : 0);
            result = 31 * result + (this.bufferingSize != null ? this.bufferingSize.hashCode() : 0);
            result = 31 * result + (this.cloudwatchLoggingOptions != null ? this.cloudwatchLoggingOptions.hashCode() : 0);
            result = 31 * result + (this.compressionFormat != null ? this.compressionFormat.hashCode() : 0);
            result = 31 * result + (this.customTimeZone != null ? this.customTimeZone.hashCode() : 0);
            result = 31 * result + (this.dataFormatConversionConfiguration != null ? this.dataFormatConversionConfiguration.hashCode() : 0);
            result = 31 * result + (this.dynamicPartitioningConfiguration != null ? this.dynamicPartitioningConfiguration.hashCode() : 0);
            result = 31 * result + (this.errorOutputPrefix != null ? this.errorOutputPrefix.hashCode() : 0);
            result = 31 * result + (this.fileExtension != null ? this.fileExtension.hashCode() : 0);
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            result = 31 * result + (this.processingConfiguration != null ? this.processingConfiguration.hashCode() : 0);
            result = 31 * result + (this.s3BackupConfiguration != null ? this.s3BackupConfiguration.hashCode() : 0);
            result = 31 * result + (this.s3BackupMode != null ? this.s3BackupMode.hashCode() : 0);
            return result;
        }
    }
}
