package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamIcebergConfiguration")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamIcebergConfiguration.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamIcebergConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#catalog_arn KinesisFirehoseDeliveryStream#catalog_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCatalogArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * s3_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_configuration KinesisFirehoseDeliveryStream#s3_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationS3Configuration getS3Configuration();

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
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
        return null;
    }

    /**
     * destination_table_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#destination_table_configuration KinesisFirehoseDeliveryStream#destination_table_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDestinationTableConfiguration() {
        return null;
    }

    /**
     * processing_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfiguration getProcessingConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#retry_duration KinesisFirehoseDeliveryStream#retry_duration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRetryDuration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_backup_mode KinesisFirehoseDeliveryStream#s3_backup_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3BackupMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamIcebergConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamIcebergConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamIcebergConfiguration> {
        java.lang.String catalogArn;
        java.lang.String roleArn;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationS3Configuration s3Configuration;
        java.lang.Number bufferingInterval;
        java.lang.Number bufferingSize;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        java.lang.Object destinationTableConfiguration;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfiguration processingConfiguration;
        java.lang.Number retryDuration;
        java.lang.String s3BackupMode;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfiguration#getCatalogArn}
         * @param catalogArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#catalog_arn KinesisFirehoseDeliveryStream#catalog_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder catalogArn(java.lang.String catalogArn) {
            this.catalogArn = catalogArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfiguration#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfiguration#getS3Configuration}
         * @param s3Configuration s3_configuration block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_configuration KinesisFirehoseDeliveryStream#s3_configuration}
         * @return {@code this}
         */
        public Builder s3Configuration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationS3Configuration s3Configuration) {
            this.s3Configuration = s3Configuration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfiguration#getBufferingInterval}
         * @param bufferingInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_interval KinesisFirehoseDeliveryStream#buffering_interval}.
         * @return {@code this}
         */
        public Builder bufferingInterval(java.lang.Number bufferingInterval) {
            this.bufferingInterval = bufferingInterval;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfiguration#getBufferingSize}
         * @param bufferingSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_size KinesisFirehoseDeliveryStream#buffering_size}.
         * @return {@code this}
         */
        public Builder bufferingSize(java.lang.Number bufferingSize) {
            this.bufferingSize = bufferingSize;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfiguration#getCloudwatchLoggingOptions}
         * @param cloudwatchLoggingOptions cloudwatch_logging_options block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#cloudwatch_logging_options KinesisFirehoseDeliveryStream#cloudwatch_logging_options}
         * @return {@code this}
         */
        public Builder cloudwatchLoggingOptions(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions) {
            this.cloudwatchLoggingOptions = cloudwatchLoggingOptions;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfiguration#getDestinationTableConfiguration}
         * @param destinationTableConfiguration destination_table_configuration block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#destination_table_configuration KinesisFirehoseDeliveryStream#destination_table_configuration}
         * @return {@code this}
         */
        public Builder destinationTableConfiguration(com.hashicorp.cdktf.IResolvable destinationTableConfiguration) {
            this.destinationTableConfiguration = destinationTableConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfiguration#getDestinationTableConfiguration}
         * @param destinationTableConfiguration destination_table_configuration block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#destination_table_configuration KinesisFirehoseDeliveryStream#destination_table_configuration}
         * @return {@code this}
         */
        public Builder destinationTableConfiguration(java.util.List<? extends imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration> destinationTableConfiguration) {
            this.destinationTableConfiguration = destinationTableConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfiguration#getProcessingConfiguration}
         * @param processingConfiguration processing_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
         * @return {@code this}
         */
        public Builder processingConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfiguration processingConfiguration) {
            this.processingConfiguration = processingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfiguration#getRetryDuration}
         * @param retryDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#retry_duration KinesisFirehoseDeliveryStream#retry_duration}.
         * @return {@code this}
         */
        public Builder retryDuration(java.lang.Number retryDuration) {
            this.retryDuration = retryDuration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfiguration#getS3BackupMode}
         * @param s3BackupMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_backup_mode KinesisFirehoseDeliveryStream#s3_backup_mode}.
         * @return {@code this}
         */
        public Builder s3BackupMode(java.lang.String s3BackupMode) {
            this.s3BackupMode = s3BackupMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamIcebergConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamIcebergConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamIcebergConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamIcebergConfiguration {
        private final java.lang.String catalogArn;
        private final java.lang.String roleArn;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationS3Configuration s3Configuration;
        private final java.lang.Number bufferingInterval;
        private final java.lang.Number bufferingSize;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        private final java.lang.Object destinationTableConfiguration;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfiguration processingConfiguration;
        private final java.lang.Number retryDuration;
        private final java.lang.String s3BackupMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.catalogArn = software.amazon.jsii.Kernel.get(this, "catalogArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Configuration = software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationS3Configuration.class));
            this.bufferingInterval = software.amazon.jsii.Kernel.get(this, "bufferingInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.bufferingSize = software.amazon.jsii.Kernel.get(this, "bufferingSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cloudwatchLoggingOptions = software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationCloudwatchLoggingOptions.class));
            this.destinationTableConfiguration = software.amazon.jsii.Kernel.get(this, "destinationTableConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.processingConfiguration = software.amazon.jsii.Kernel.get(this, "processingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfiguration.class));
            this.retryDuration = software.amazon.jsii.Kernel.get(this, "retryDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.s3BackupMode = software.amazon.jsii.Kernel.get(this, "s3BackupMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.catalogArn = java.util.Objects.requireNonNull(builder.catalogArn, "catalogArn is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.s3Configuration = java.util.Objects.requireNonNull(builder.s3Configuration, "s3Configuration is required");
            this.bufferingInterval = builder.bufferingInterval;
            this.bufferingSize = builder.bufferingSize;
            this.cloudwatchLoggingOptions = builder.cloudwatchLoggingOptions;
            this.destinationTableConfiguration = builder.destinationTableConfiguration;
            this.processingConfiguration = builder.processingConfiguration;
            this.retryDuration = builder.retryDuration;
            this.s3BackupMode = builder.s3BackupMode;
        }

        @Override
        public final java.lang.String getCatalogArn() {
            return this.catalogArn;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationS3Configuration getS3Configuration() {
            return this.s3Configuration;
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
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
            return this.cloudwatchLoggingOptions;
        }

        @Override
        public final java.lang.Object getDestinationTableConfiguration() {
            return this.destinationTableConfiguration;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfiguration getProcessingConfiguration() {
            return this.processingConfiguration;
        }

        @Override
        public final java.lang.Number getRetryDuration() {
            return this.retryDuration;
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

            data.set("catalogArn", om.valueToTree(this.getCatalogArn()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("s3Configuration", om.valueToTree(this.getS3Configuration()));
            if (this.getBufferingInterval() != null) {
                data.set("bufferingInterval", om.valueToTree(this.getBufferingInterval()));
            }
            if (this.getBufferingSize() != null) {
                data.set("bufferingSize", om.valueToTree(this.getBufferingSize()));
            }
            if (this.getCloudwatchLoggingOptions() != null) {
                data.set("cloudwatchLoggingOptions", om.valueToTree(this.getCloudwatchLoggingOptions()));
            }
            if (this.getDestinationTableConfiguration() != null) {
                data.set("destinationTableConfiguration", om.valueToTree(this.getDestinationTableConfiguration()));
            }
            if (this.getProcessingConfiguration() != null) {
                data.set("processingConfiguration", om.valueToTree(this.getProcessingConfiguration()));
            }
            if (this.getRetryDuration() != null) {
                data.set("retryDuration", om.valueToTree(this.getRetryDuration()));
            }
            if (this.getS3BackupMode() != null) {
                data.set("s3BackupMode", om.valueToTree(this.getS3BackupMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamIcebergConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamIcebergConfiguration.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamIcebergConfiguration.Jsii$Proxy) o;

            if (!catalogArn.equals(that.catalogArn)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (!s3Configuration.equals(that.s3Configuration)) return false;
            if (this.bufferingInterval != null ? !this.bufferingInterval.equals(that.bufferingInterval) : that.bufferingInterval != null) return false;
            if (this.bufferingSize != null ? !this.bufferingSize.equals(that.bufferingSize) : that.bufferingSize != null) return false;
            if (this.cloudwatchLoggingOptions != null ? !this.cloudwatchLoggingOptions.equals(that.cloudwatchLoggingOptions) : that.cloudwatchLoggingOptions != null) return false;
            if (this.destinationTableConfiguration != null ? !this.destinationTableConfiguration.equals(that.destinationTableConfiguration) : that.destinationTableConfiguration != null) return false;
            if (this.processingConfiguration != null ? !this.processingConfiguration.equals(that.processingConfiguration) : that.processingConfiguration != null) return false;
            if (this.retryDuration != null ? !this.retryDuration.equals(that.retryDuration) : that.retryDuration != null) return false;
            return this.s3BackupMode != null ? this.s3BackupMode.equals(that.s3BackupMode) : that.s3BackupMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.catalogArn.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.s3Configuration.hashCode());
            result = 31 * result + (this.bufferingInterval != null ? this.bufferingInterval.hashCode() : 0);
            result = 31 * result + (this.bufferingSize != null ? this.bufferingSize.hashCode() : 0);
            result = 31 * result + (this.cloudwatchLoggingOptions != null ? this.cloudwatchLoggingOptions.hashCode() : 0);
            result = 31 * result + (this.destinationTableConfiguration != null ? this.destinationTableConfiguration.hashCode() : 0);
            result = 31 * result + (this.processingConfiguration != null ? this.processingConfiguration.hashCode() : 0);
            result = 31 * result + (this.retryDuration != null ? this.retryDuration.hashCode() : 0);
            result = 31 * result + (this.s3BackupMode != null ? this.s3BackupMode.hashCode() : 0);
            return result;
        }
    }
}
