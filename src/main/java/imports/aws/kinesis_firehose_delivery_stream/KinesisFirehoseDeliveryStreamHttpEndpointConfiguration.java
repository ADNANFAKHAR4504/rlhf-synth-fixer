package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.452Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamHttpEndpointConfiguration")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamHttpEndpointConfiguration.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamHttpEndpointConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_configuration KinesisFirehoseDeliveryStream#s3_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationS3Configuration getS3Configuration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#url KinesisFirehoseDeliveryStream#url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUrl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#access_key KinesisFirehoseDeliveryStream#access_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessKey() {
        return null;
    }

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
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#name KinesisFirehoseDeliveryStream#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * processing_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationProcessingConfiguration getProcessingConfiguration() {
        return null;
    }

    /**
     * request_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#request_configuration KinesisFirehoseDeliveryStream#request_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration getRequestConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#retry_duration KinesisFirehoseDeliveryStream#retry_duration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRetryDuration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
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
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationSecretsManagerConfiguration getSecretsManagerConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamHttpEndpointConfiguration> {
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationS3Configuration s3Configuration;
        java.lang.String url;
        java.lang.String accessKey;
        java.lang.Number bufferingInterval;
        java.lang.Number bufferingSize;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        java.lang.String name;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationProcessingConfiguration processingConfiguration;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration requestConfiguration;
        java.lang.Number retryDuration;
        java.lang.String roleArn;
        java.lang.String s3BackupMode;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationSecretsManagerConfiguration secretsManagerConfiguration;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration#getS3Configuration}
         * @param s3Configuration s3_configuration block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_configuration KinesisFirehoseDeliveryStream#s3_configuration}
         * @return {@code this}
         */
        public Builder s3Configuration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationS3Configuration s3Configuration) {
            this.s3Configuration = s3Configuration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration#getUrl}
         * @param url Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#url KinesisFirehoseDeliveryStream#url}. This parameter is required.
         * @return {@code this}
         */
        public Builder url(java.lang.String url) {
            this.url = url;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration#getAccessKey}
         * @param accessKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#access_key KinesisFirehoseDeliveryStream#access_key}.
         * @return {@code this}
         */
        public Builder accessKey(java.lang.String accessKey) {
            this.accessKey = accessKey;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration#getBufferingInterval}
         * @param bufferingInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_interval KinesisFirehoseDeliveryStream#buffering_interval}.
         * @return {@code this}
         */
        public Builder bufferingInterval(java.lang.Number bufferingInterval) {
            this.bufferingInterval = bufferingInterval;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration#getBufferingSize}
         * @param bufferingSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_size KinesisFirehoseDeliveryStream#buffering_size}.
         * @return {@code this}
         */
        public Builder bufferingSize(java.lang.Number bufferingSize) {
            this.bufferingSize = bufferingSize;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration#getCloudwatchLoggingOptions}
         * @param cloudwatchLoggingOptions cloudwatch_logging_options block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#cloudwatch_logging_options KinesisFirehoseDeliveryStream#cloudwatch_logging_options}
         * @return {@code this}
         */
        public Builder cloudwatchLoggingOptions(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions) {
            this.cloudwatchLoggingOptions = cloudwatchLoggingOptions;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#name KinesisFirehoseDeliveryStream#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration#getProcessingConfiguration}
         * @param processingConfiguration processing_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
         * @return {@code this}
         */
        public Builder processingConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationProcessingConfiguration processingConfiguration) {
            this.processingConfiguration = processingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration#getRequestConfiguration}
         * @param requestConfiguration request_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#request_configuration KinesisFirehoseDeliveryStream#request_configuration}
         * @return {@code this}
         */
        public Builder requestConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration requestConfiguration) {
            this.requestConfiguration = requestConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration#getRetryDuration}
         * @param retryDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#retry_duration KinesisFirehoseDeliveryStream#retry_duration}.
         * @return {@code this}
         */
        public Builder retryDuration(java.lang.Number retryDuration) {
            this.retryDuration = retryDuration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration#getS3BackupMode}
         * @param s3BackupMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_backup_mode KinesisFirehoseDeliveryStream#s3_backup_mode}.
         * @return {@code this}
         */
        public Builder s3BackupMode(java.lang.String s3BackupMode) {
            this.s3BackupMode = s3BackupMode;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration#getSecretsManagerConfiguration}
         * @param secretsManagerConfiguration secrets_manager_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#secrets_manager_configuration KinesisFirehoseDeliveryStream#secrets_manager_configuration}
         * @return {@code this}
         */
        public Builder secretsManagerConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationSecretsManagerConfiguration secretsManagerConfiguration) {
            this.secretsManagerConfiguration = secretsManagerConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamHttpEndpointConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamHttpEndpointConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamHttpEndpointConfiguration {
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationS3Configuration s3Configuration;
        private final java.lang.String url;
        private final java.lang.String accessKey;
        private final java.lang.Number bufferingInterval;
        private final java.lang.Number bufferingSize;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        private final java.lang.String name;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationProcessingConfiguration processingConfiguration;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration requestConfiguration;
        private final java.lang.Number retryDuration;
        private final java.lang.String roleArn;
        private final java.lang.String s3BackupMode;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationSecretsManagerConfiguration secretsManagerConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Configuration = software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationS3Configuration.class));
            this.url = software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessKey = software.amazon.jsii.Kernel.get(this, "accessKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bufferingInterval = software.amazon.jsii.Kernel.get(this, "bufferingInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.bufferingSize = software.amazon.jsii.Kernel.get(this, "bufferingSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cloudwatchLoggingOptions = software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationCloudwatchLoggingOptions.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.processingConfiguration = software.amazon.jsii.Kernel.get(this, "processingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationProcessingConfiguration.class));
            this.requestConfiguration = software.amazon.jsii.Kernel.get(this, "requestConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration.class));
            this.retryDuration = software.amazon.jsii.Kernel.get(this, "retryDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3BackupMode = software.amazon.jsii.Kernel.get(this, "s3BackupMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretsManagerConfiguration = software.amazon.jsii.Kernel.get(this, "secretsManagerConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationSecretsManagerConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Configuration = java.util.Objects.requireNonNull(builder.s3Configuration, "s3Configuration is required");
            this.url = java.util.Objects.requireNonNull(builder.url, "url is required");
            this.accessKey = builder.accessKey;
            this.bufferingInterval = builder.bufferingInterval;
            this.bufferingSize = builder.bufferingSize;
            this.cloudwatchLoggingOptions = builder.cloudwatchLoggingOptions;
            this.name = builder.name;
            this.processingConfiguration = builder.processingConfiguration;
            this.requestConfiguration = builder.requestConfiguration;
            this.retryDuration = builder.retryDuration;
            this.roleArn = builder.roleArn;
            this.s3BackupMode = builder.s3BackupMode;
            this.secretsManagerConfiguration = builder.secretsManagerConfiguration;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationS3Configuration getS3Configuration() {
            return this.s3Configuration;
        }

        @Override
        public final java.lang.String getUrl() {
            return this.url;
        }

        @Override
        public final java.lang.String getAccessKey() {
            return this.accessKey;
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
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
            return this.cloudwatchLoggingOptions;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationProcessingConfiguration getProcessingConfiguration() {
            return this.processingConfiguration;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration getRequestConfiguration() {
            return this.requestConfiguration;
        }

        @Override
        public final java.lang.Number getRetryDuration() {
            return this.retryDuration;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getS3BackupMode() {
            return this.s3BackupMode;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationSecretsManagerConfiguration getSecretsManagerConfiguration() {
            return this.secretsManagerConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3Configuration", om.valueToTree(this.getS3Configuration()));
            data.set("url", om.valueToTree(this.getUrl()));
            if (this.getAccessKey() != null) {
                data.set("accessKey", om.valueToTree(this.getAccessKey()));
            }
            if (this.getBufferingInterval() != null) {
                data.set("bufferingInterval", om.valueToTree(this.getBufferingInterval()));
            }
            if (this.getBufferingSize() != null) {
                data.set("bufferingSize", om.valueToTree(this.getBufferingSize()));
            }
            if (this.getCloudwatchLoggingOptions() != null) {
                data.set("cloudwatchLoggingOptions", om.valueToTree(this.getCloudwatchLoggingOptions()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getProcessingConfiguration() != null) {
                data.set("processingConfiguration", om.valueToTree(this.getProcessingConfiguration()));
            }
            if (this.getRequestConfiguration() != null) {
                data.set("requestConfiguration", om.valueToTree(this.getRequestConfiguration()));
            }
            if (this.getRetryDuration() != null) {
                data.set("retryDuration", om.valueToTree(this.getRetryDuration()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }
            if (this.getS3BackupMode() != null) {
                data.set("s3BackupMode", om.valueToTree(this.getS3BackupMode()));
            }
            if (this.getSecretsManagerConfiguration() != null) {
                data.set("secretsManagerConfiguration", om.valueToTree(this.getSecretsManagerConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamHttpEndpointConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamHttpEndpointConfiguration.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamHttpEndpointConfiguration.Jsii$Proxy) o;

            if (!s3Configuration.equals(that.s3Configuration)) return false;
            if (!url.equals(that.url)) return false;
            if (this.accessKey != null ? !this.accessKey.equals(that.accessKey) : that.accessKey != null) return false;
            if (this.bufferingInterval != null ? !this.bufferingInterval.equals(that.bufferingInterval) : that.bufferingInterval != null) return false;
            if (this.bufferingSize != null ? !this.bufferingSize.equals(that.bufferingSize) : that.bufferingSize != null) return false;
            if (this.cloudwatchLoggingOptions != null ? !this.cloudwatchLoggingOptions.equals(that.cloudwatchLoggingOptions) : that.cloudwatchLoggingOptions != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.processingConfiguration != null ? !this.processingConfiguration.equals(that.processingConfiguration) : that.processingConfiguration != null) return false;
            if (this.requestConfiguration != null ? !this.requestConfiguration.equals(that.requestConfiguration) : that.requestConfiguration != null) return false;
            if (this.retryDuration != null ? !this.retryDuration.equals(that.retryDuration) : that.retryDuration != null) return false;
            if (this.roleArn != null ? !this.roleArn.equals(that.roleArn) : that.roleArn != null) return false;
            if (this.s3BackupMode != null ? !this.s3BackupMode.equals(that.s3BackupMode) : that.s3BackupMode != null) return false;
            return this.secretsManagerConfiguration != null ? this.secretsManagerConfiguration.equals(that.secretsManagerConfiguration) : that.secretsManagerConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Configuration.hashCode();
            result = 31 * result + (this.url.hashCode());
            result = 31 * result + (this.accessKey != null ? this.accessKey.hashCode() : 0);
            result = 31 * result + (this.bufferingInterval != null ? this.bufferingInterval.hashCode() : 0);
            result = 31 * result + (this.bufferingSize != null ? this.bufferingSize.hashCode() : 0);
            result = 31 * result + (this.cloudwatchLoggingOptions != null ? this.cloudwatchLoggingOptions.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.processingConfiguration != null ? this.processingConfiguration.hashCode() : 0);
            result = 31 * result + (this.requestConfiguration != null ? this.requestConfiguration.hashCode() : 0);
            result = 31 * result + (this.retryDuration != null ? this.retryDuration.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            result = 31 * result + (this.s3BackupMode != null ? this.s3BackupMode.hashCode() : 0);
            result = 31 * result + (this.secretsManagerConfiguration != null ? this.secretsManagerConfiguration.hashCode() : 0);
            return result;
        }
    }
}
