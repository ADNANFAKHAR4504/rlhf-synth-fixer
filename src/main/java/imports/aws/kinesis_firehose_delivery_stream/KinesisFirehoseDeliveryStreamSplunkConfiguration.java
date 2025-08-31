package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.465Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamSplunkConfiguration")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamSplunkConfiguration.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamSplunkConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#hec_endpoint KinesisFirehoseDeliveryStream#hec_endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHecEndpoint();

    /**
     * s3_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_configuration KinesisFirehoseDeliveryStream#s3_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationS3Configuration getS3Configuration();

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
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#hec_acknowledgment_timeout KinesisFirehoseDeliveryStream#hec_acknowledgment_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHecAcknowledgmentTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#hec_endpoint_type KinesisFirehoseDeliveryStream#hec_endpoint_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHecEndpointType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#hec_token KinesisFirehoseDeliveryStream#hec_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHecToken() {
        return null;
    }

    /**
     * processing_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationProcessingConfiguration getProcessingConfiguration() {
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
     * secrets_manager_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#secrets_manager_configuration KinesisFirehoseDeliveryStream#secrets_manager_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationSecretsManagerConfiguration getSecretsManagerConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamSplunkConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamSplunkConfiguration> {
        java.lang.String hecEndpoint;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationS3Configuration s3Configuration;
        java.lang.Number bufferingInterval;
        java.lang.Number bufferingSize;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        java.lang.Number hecAcknowledgmentTimeout;
        java.lang.String hecEndpointType;
        java.lang.String hecToken;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationProcessingConfiguration processingConfiguration;
        java.lang.Number retryDuration;
        java.lang.String s3BackupMode;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationSecretsManagerConfiguration secretsManagerConfiguration;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration#getHecEndpoint}
         * @param hecEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#hec_endpoint KinesisFirehoseDeliveryStream#hec_endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder hecEndpoint(java.lang.String hecEndpoint) {
            this.hecEndpoint = hecEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration#getS3Configuration}
         * @param s3Configuration s3_configuration block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_configuration KinesisFirehoseDeliveryStream#s3_configuration}
         * @return {@code this}
         */
        public Builder s3Configuration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationS3Configuration s3Configuration) {
            this.s3Configuration = s3Configuration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration#getBufferingInterval}
         * @param bufferingInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_interval KinesisFirehoseDeliveryStream#buffering_interval}.
         * @return {@code this}
         */
        public Builder bufferingInterval(java.lang.Number bufferingInterval) {
            this.bufferingInterval = bufferingInterval;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration#getBufferingSize}
         * @param bufferingSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_size KinesisFirehoseDeliveryStream#buffering_size}.
         * @return {@code this}
         */
        public Builder bufferingSize(java.lang.Number bufferingSize) {
            this.bufferingSize = bufferingSize;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration#getCloudwatchLoggingOptions}
         * @param cloudwatchLoggingOptions cloudwatch_logging_options block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#cloudwatch_logging_options KinesisFirehoseDeliveryStream#cloudwatch_logging_options}
         * @return {@code this}
         */
        public Builder cloudwatchLoggingOptions(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions) {
            this.cloudwatchLoggingOptions = cloudwatchLoggingOptions;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration#getHecAcknowledgmentTimeout}
         * @param hecAcknowledgmentTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#hec_acknowledgment_timeout KinesisFirehoseDeliveryStream#hec_acknowledgment_timeout}.
         * @return {@code this}
         */
        public Builder hecAcknowledgmentTimeout(java.lang.Number hecAcknowledgmentTimeout) {
            this.hecAcknowledgmentTimeout = hecAcknowledgmentTimeout;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration#getHecEndpointType}
         * @param hecEndpointType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#hec_endpoint_type KinesisFirehoseDeliveryStream#hec_endpoint_type}.
         * @return {@code this}
         */
        public Builder hecEndpointType(java.lang.String hecEndpointType) {
            this.hecEndpointType = hecEndpointType;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration#getHecToken}
         * @param hecToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#hec_token KinesisFirehoseDeliveryStream#hec_token}.
         * @return {@code this}
         */
        public Builder hecToken(java.lang.String hecToken) {
            this.hecToken = hecToken;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration#getProcessingConfiguration}
         * @param processingConfiguration processing_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
         * @return {@code this}
         */
        public Builder processingConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationProcessingConfiguration processingConfiguration) {
            this.processingConfiguration = processingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration#getRetryDuration}
         * @param retryDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#retry_duration KinesisFirehoseDeliveryStream#retry_duration}.
         * @return {@code this}
         */
        public Builder retryDuration(java.lang.Number retryDuration) {
            this.retryDuration = retryDuration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration#getS3BackupMode}
         * @param s3BackupMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_backup_mode KinesisFirehoseDeliveryStream#s3_backup_mode}.
         * @return {@code this}
         */
        public Builder s3BackupMode(java.lang.String s3BackupMode) {
            this.s3BackupMode = s3BackupMode;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration#getSecretsManagerConfiguration}
         * @param secretsManagerConfiguration secrets_manager_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#secrets_manager_configuration KinesisFirehoseDeliveryStream#secrets_manager_configuration}
         * @return {@code this}
         */
        public Builder secretsManagerConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationSecretsManagerConfiguration secretsManagerConfiguration) {
            this.secretsManagerConfiguration = secretsManagerConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamSplunkConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamSplunkConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamSplunkConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamSplunkConfiguration {
        private final java.lang.String hecEndpoint;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationS3Configuration s3Configuration;
        private final java.lang.Number bufferingInterval;
        private final java.lang.Number bufferingSize;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        private final java.lang.Number hecAcknowledgmentTimeout;
        private final java.lang.String hecEndpointType;
        private final java.lang.String hecToken;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationProcessingConfiguration processingConfiguration;
        private final java.lang.Number retryDuration;
        private final java.lang.String s3BackupMode;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationSecretsManagerConfiguration secretsManagerConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hecEndpoint = software.amazon.jsii.Kernel.get(this, "hecEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Configuration = software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationS3Configuration.class));
            this.bufferingInterval = software.amazon.jsii.Kernel.get(this, "bufferingInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.bufferingSize = software.amazon.jsii.Kernel.get(this, "bufferingSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cloudwatchLoggingOptions = software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationCloudwatchLoggingOptions.class));
            this.hecAcknowledgmentTimeout = software.amazon.jsii.Kernel.get(this, "hecAcknowledgmentTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.hecEndpointType = software.amazon.jsii.Kernel.get(this, "hecEndpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hecToken = software.amazon.jsii.Kernel.get(this, "hecToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.processingConfiguration = software.amazon.jsii.Kernel.get(this, "processingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationProcessingConfiguration.class));
            this.retryDuration = software.amazon.jsii.Kernel.get(this, "retryDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.s3BackupMode = software.amazon.jsii.Kernel.get(this, "s3BackupMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretsManagerConfiguration = software.amazon.jsii.Kernel.get(this, "secretsManagerConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationSecretsManagerConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hecEndpoint = java.util.Objects.requireNonNull(builder.hecEndpoint, "hecEndpoint is required");
            this.s3Configuration = java.util.Objects.requireNonNull(builder.s3Configuration, "s3Configuration is required");
            this.bufferingInterval = builder.bufferingInterval;
            this.bufferingSize = builder.bufferingSize;
            this.cloudwatchLoggingOptions = builder.cloudwatchLoggingOptions;
            this.hecAcknowledgmentTimeout = builder.hecAcknowledgmentTimeout;
            this.hecEndpointType = builder.hecEndpointType;
            this.hecToken = builder.hecToken;
            this.processingConfiguration = builder.processingConfiguration;
            this.retryDuration = builder.retryDuration;
            this.s3BackupMode = builder.s3BackupMode;
            this.secretsManagerConfiguration = builder.secretsManagerConfiguration;
        }

        @Override
        public final java.lang.String getHecEndpoint() {
            return this.hecEndpoint;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationS3Configuration getS3Configuration() {
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
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
            return this.cloudwatchLoggingOptions;
        }

        @Override
        public final java.lang.Number getHecAcknowledgmentTimeout() {
            return this.hecAcknowledgmentTimeout;
        }

        @Override
        public final java.lang.String getHecEndpointType() {
            return this.hecEndpointType;
        }

        @Override
        public final java.lang.String getHecToken() {
            return this.hecToken;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationProcessingConfiguration getProcessingConfiguration() {
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
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSplunkConfigurationSecretsManagerConfiguration getSecretsManagerConfiguration() {
            return this.secretsManagerConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("hecEndpoint", om.valueToTree(this.getHecEndpoint()));
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
            if (this.getHecAcknowledgmentTimeout() != null) {
                data.set("hecAcknowledgmentTimeout", om.valueToTree(this.getHecAcknowledgmentTimeout()));
            }
            if (this.getHecEndpointType() != null) {
                data.set("hecEndpointType", om.valueToTree(this.getHecEndpointType()));
            }
            if (this.getHecToken() != null) {
                data.set("hecToken", om.valueToTree(this.getHecToken()));
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
            if (this.getSecretsManagerConfiguration() != null) {
                data.set("secretsManagerConfiguration", om.valueToTree(this.getSecretsManagerConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamSplunkConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamSplunkConfiguration.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamSplunkConfiguration.Jsii$Proxy) o;

            if (!hecEndpoint.equals(that.hecEndpoint)) return false;
            if (!s3Configuration.equals(that.s3Configuration)) return false;
            if (this.bufferingInterval != null ? !this.bufferingInterval.equals(that.bufferingInterval) : that.bufferingInterval != null) return false;
            if (this.bufferingSize != null ? !this.bufferingSize.equals(that.bufferingSize) : that.bufferingSize != null) return false;
            if (this.cloudwatchLoggingOptions != null ? !this.cloudwatchLoggingOptions.equals(that.cloudwatchLoggingOptions) : that.cloudwatchLoggingOptions != null) return false;
            if (this.hecAcknowledgmentTimeout != null ? !this.hecAcknowledgmentTimeout.equals(that.hecAcknowledgmentTimeout) : that.hecAcknowledgmentTimeout != null) return false;
            if (this.hecEndpointType != null ? !this.hecEndpointType.equals(that.hecEndpointType) : that.hecEndpointType != null) return false;
            if (this.hecToken != null ? !this.hecToken.equals(that.hecToken) : that.hecToken != null) return false;
            if (this.processingConfiguration != null ? !this.processingConfiguration.equals(that.processingConfiguration) : that.processingConfiguration != null) return false;
            if (this.retryDuration != null ? !this.retryDuration.equals(that.retryDuration) : that.retryDuration != null) return false;
            if (this.s3BackupMode != null ? !this.s3BackupMode.equals(that.s3BackupMode) : that.s3BackupMode != null) return false;
            return this.secretsManagerConfiguration != null ? this.secretsManagerConfiguration.equals(that.secretsManagerConfiguration) : that.secretsManagerConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hecEndpoint.hashCode();
            result = 31 * result + (this.s3Configuration.hashCode());
            result = 31 * result + (this.bufferingInterval != null ? this.bufferingInterval.hashCode() : 0);
            result = 31 * result + (this.bufferingSize != null ? this.bufferingSize.hashCode() : 0);
            result = 31 * result + (this.cloudwatchLoggingOptions != null ? this.cloudwatchLoggingOptions.hashCode() : 0);
            result = 31 * result + (this.hecAcknowledgmentTimeout != null ? this.hecAcknowledgmentTimeout.hashCode() : 0);
            result = 31 * result + (this.hecEndpointType != null ? this.hecEndpointType.hashCode() : 0);
            result = 31 * result + (this.hecToken != null ? this.hecToken.hashCode() : 0);
            result = 31 * result + (this.processingConfiguration != null ? this.processingConfiguration.hashCode() : 0);
            result = 31 * result + (this.retryDuration != null ? this.retryDuration.hashCode() : 0);
            result = 31 * result + (this.s3BackupMode != null ? this.s3BackupMode.hashCode() : 0);
            result = 31 * result + (this.secretsManagerConfiguration != null ? this.secretsManagerConfiguration.hashCode() : 0);
            return result;
        }
    }
}
