package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.449Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamElasticsearchConfiguration")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamElasticsearchConfiguration.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamElasticsearchConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#index_name KinesisFirehoseDeliveryStream#index_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIndexName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * s3_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_configuration KinesisFirehoseDeliveryStream#s3_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationS3Configuration getS3Configuration();

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
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#cluster_endpoint KinesisFirehoseDeliveryStream#cluster_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#domain_arn KinesisFirehoseDeliveryStream#domain_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#index_rotation_period KinesisFirehoseDeliveryStream#index_rotation_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIndexRotationPeriod() {
        return null;
    }

    /**
     * processing_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationProcessingConfiguration getProcessingConfiguration() {
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
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#type_name KinesisFirehoseDeliveryStream#type_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTypeName() {
        return null;
    }

    /**
     * vpc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#vpc_config KinesisFirehoseDeliveryStream#vpc_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig getVpcConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamElasticsearchConfiguration> {
        java.lang.String indexName;
        java.lang.String roleArn;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationS3Configuration s3Configuration;
        java.lang.Number bufferingInterval;
        java.lang.Number bufferingSize;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        java.lang.String clusterEndpoint;
        java.lang.String domainArn;
        java.lang.String indexRotationPeriod;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationProcessingConfiguration processingConfiguration;
        java.lang.Number retryDuration;
        java.lang.String s3BackupMode;
        java.lang.String typeName;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig vpcConfig;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getIndexName}
         * @param indexName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#index_name KinesisFirehoseDeliveryStream#index_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder indexName(java.lang.String indexName) {
            this.indexName = indexName;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getS3Configuration}
         * @param s3Configuration s3_configuration block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_configuration KinesisFirehoseDeliveryStream#s3_configuration}
         * @return {@code this}
         */
        public Builder s3Configuration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationS3Configuration s3Configuration) {
            this.s3Configuration = s3Configuration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getBufferingInterval}
         * @param bufferingInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_interval KinesisFirehoseDeliveryStream#buffering_interval}.
         * @return {@code this}
         */
        public Builder bufferingInterval(java.lang.Number bufferingInterval) {
            this.bufferingInterval = bufferingInterval;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getBufferingSize}
         * @param bufferingSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_size KinesisFirehoseDeliveryStream#buffering_size}.
         * @return {@code this}
         */
        public Builder bufferingSize(java.lang.Number bufferingSize) {
            this.bufferingSize = bufferingSize;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getCloudwatchLoggingOptions}
         * @param cloudwatchLoggingOptions cloudwatch_logging_options block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#cloudwatch_logging_options KinesisFirehoseDeliveryStream#cloudwatch_logging_options}
         * @return {@code this}
         */
        public Builder cloudwatchLoggingOptions(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions) {
            this.cloudwatchLoggingOptions = cloudwatchLoggingOptions;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getClusterEndpoint}
         * @param clusterEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#cluster_endpoint KinesisFirehoseDeliveryStream#cluster_endpoint}.
         * @return {@code this}
         */
        public Builder clusterEndpoint(java.lang.String clusterEndpoint) {
            this.clusterEndpoint = clusterEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getDomainArn}
         * @param domainArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#domain_arn KinesisFirehoseDeliveryStream#domain_arn}.
         * @return {@code this}
         */
        public Builder domainArn(java.lang.String domainArn) {
            this.domainArn = domainArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getIndexRotationPeriod}
         * @param indexRotationPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#index_rotation_period KinesisFirehoseDeliveryStream#index_rotation_period}.
         * @return {@code this}
         */
        public Builder indexRotationPeriod(java.lang.String indexRotationPeriod) {
            this.indexRotationPeriod = indexRotationPeriod;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getProcessingConfiguration}
         * @param processingConfiguration processing_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
         * @return {@code this}
         */
        public Builder processingConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationProcessingConfiguration processingConfiguration) {
            this.processingConfiguration = processingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getRetryDuration}
         * @param retryDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#retry_duration KinesisFirehoseDeliveryStream#retry_duration}.
         * @return {@code this}
         */
        public Builder retryDuration(java.lang.Number retryDuration) {
            this.retryDuration = retryDuration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getS3BackupMode}
         * @param s3BackupMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_backup_mode KinesisFirehoseDeliveryStream#s3_backup_mode}.
         * @return {@code this}
         */
        public Builder s3BackupMode(java.lang.String s3BackupMode) {
            this.s3BackupMode = s3BackupMode;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getTypeName}
         * @param typeName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#type_name KinesisFirehoseDeliveryStream#type_name}.
         * @return {@code this}
         */
        public Builder typeName(java.lang.String typeName) {
            this.typeName = typeName;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration#getVpcConfig}
         * @param vpcConfig vpc_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#vpc_config KinesisFirehoseDeliveryStream#vpc_config}
         * @return {@code this}
         */
        public Builder vpcConfig(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig vpcConfig) {
            this.vpcConfig = vpcConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamElasticsearchConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamElasticsearchConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamElasticsearchConfiguration {
        private final java.lang.String indexName;
        private final java.lang.String roleArn;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationS3Configuration s3Configuration;
        private final java.lang.Number bufferingInterval;
        private final java.lang.Number bufferingSize;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        private final java.lang.String clusterEndpoint;
        private final java.lang.String domainArn;
        private final java.lang.String indexRotationPeriod;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationProcessingConfiguration processingConfiguration;
        private final java.lang.Number retryDuration;
        private final java.lang.String s3BackupMode;
        private final java.lang.String typeName;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig vpcConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.indexName = software.amazon.jsii.Kernel.get(this, "indexName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Configuration = software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationS3Configuration.class));
            this.bufferingInterval = software.amazon.jsii.Kernel.get(this, "bufferingInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.bufferingSize = software.amazon.jsii.Kernel.get(this, "bufferingSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cloudwatchLoggingOptions = software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationCloudwatchLoggingOptions.class));
            this.clusterEndpoint = software.amazon.jsii.Kernel.get(this, "clusterEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainArn = software.amazon.jsii.Kernel.get(this, "domainArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.indexRotationPeriod = software.amazon.jsii.Kernel.get(this, "indexRotationPeriod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.processingConfiguration = software.amazon.jsii.Kernel.get(this, "processingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationProcessingConfiguration.class));
            this.retryDuration = software.amazon.jsii.Kernel.get(this, "retryDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.s3BackupMode = software.amazon.jsii.Kernel.get(this, "s3BackupMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.typeName = software.amazon.jsii.Kernel.get(this, "typeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcConfig = software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.indexName = java.util.Objects.requireNonNull(builder.indexName, "indexName is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.s3Configuration = java.util.Objects.requireNonNull(builder.s3Configuration, "s3Configuration is required");
            this.bufferingInterval = builder.bufferingInterval;
            this.bufferingSize = builder.bufferingSize;
            this.cloudwatchLoggingOptions = builder.cloudwatchLoggingOptions;
            this.clusterEndpoint = builder.clusterEndpoint;
            this.domainArn = builder.domainArn;
            this.indexRotationPeriod = builder.indexRotationPeriod;
            this.processingConfiguration = builder.processingConfiguration;
            this.retryDuration = builder.retryDuration;
            this.s3BackupMode = builder.s3BackupMode;
            this.typeName = builder.typeName;
            this.vpcConfig = builder.vpcConfig;
        }

        @Override
        public final java.lang.String getIndexName() {
            return this.indexName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationS3Configuration getS3Configuration() {
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
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
            return this.cloudwatchLoggingOptions;
        }

        @Override
        public final java.lang.String getClusterEndpoint() {
            return this.clusterEndpoint;
        }

        @Override
        public final java.lang.String getDomainArn() {
            return this.domainArn;
        }

        @Override
        public final java.lang.String getIndexRotationPeriod() {
            return this.indexRotationPeriod;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationProcessingConfiguration getProcessingConfiguration() {
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
        public final java.lang.String getTypeName() {
            return this.typeName;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig getVpcConfig() {
            return this.vpcConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("indexName", om.valueToTree(this.getIndexName()));
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
            if (this.getClusterEndpoint() != null) {
                data.set("clusterEndpoint", om.valueToTree(this.getClusterEndpoint()));
            }
            if (this.getDomainArn() != null) {
                data.set("domainArn", om.valueToTree(this.getDomainArn()));
            }
            if (this.getIndexRotationPeriod() != null) {
                data.set("indexRotationPeriod", om.valueToTree(this.getIndexRotationPeriod()));
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
            if (this.getTypeName() != null) {
                data.set("typeName", om.valueToTree(this.getTypeName()));
            }
            if (this.getVpcConfig() != null) {
                data.set("vpcConfig", om.valueToTree(this.getVpcConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamElasticsearchConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamElasticsearchConfiguration.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamElasticsearchConfiguration.Jsii$Proxy) o;

            if (!indexName.equals(that.indexName)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (!s3Configuration.equals(that.s3Configuration)) return false;
            if (this.bufferingInterval != null ? !this.bufferingInterval.equals(that.bufferingInterval) : that.bufferingInterval != null) return false;
            if (this.bufferingSize != null ? !this.bufferingSize.equals(that.bufferingSize) : that.bufferingSize != null) return false;
            if (this.cloudwatchLoggingOptions != null ? !this.cloudwatchLoggingOptions.equals(that.cloudwatchLoggingOptions) : that.cloudwatchLoggingOptions != null) return false;
            if (this.clusterEndpoint != null ? !this.clusterEndpoint.equals(that.clusterEndpoint) : that.clusterEndpoint != null) return false;
            if (this.domainArn != null ? !this.domainArn.equals(that.domainArn) : that.domainArn != null) return false;
            if (this.indexRotationPeriod != null ? !this.indexRotationPeriod.equals(that.indexRotationPeriod) : that.indexRotationPeriod != null) return false;
            if (this.processingConfiguration != null ? !this.processingConfiguration.equals(that.processingConfiguration) : that.processingConfiguration != null) return false;
            if (this.retryDuration != null ? !this.retryDuration.equals(that.retryDuration) : that.retryDuration != null) return false;
            if (this.s3BackupMode != null ? !this.s3BackupMode.equals(that.s3BackupMode) : that.s3BackupMode != null) return false;
            if (this.typeName != null ? !this.typeName.equals(that.typeName) : that.typeName != null) return false;
            return this.vpcConfig != null ? this.vpcConfig.equals(that.vpcConfig) : that.vpcConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.indexName.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.s3Configuration.hashCode());
            result = 31 * result + (this.bufferingInterval != null ? this.bufferingInterval.hashCode() : 0);
            result = 31 * result + (this.bufferingSize != null ? this.bufferingSize.hashCode() : 0);
            result = 31 * result + (this.cloudwatchLoggingOptions != null ? this.cloudwatchLoggingOptions.hashCode() : 0);
            result = 31 * result + (this.clusterEndpoint != null ? this.clusterEndpoint.hashCode() : 0);
            result = 31 * result + (this.domainArn != null ? this.domainArn.hashCode() : 0);
            result = 31 * result + (this.indexRotationPeriod != null ? this.indexRotationPeriod.hashCode() : 0);
            result = 31 * result + (this.processingConfiguration != null ? this.processingConfiguration.hashCode() : 0);
            result = 31 * result + (this.retryDuration != null ? this.retryDuration.hashCode() : 0);
            result = 31 * result + (this.s3BackupMode != null ? this.s3BackupMode.hashCode() : 0);
            result = 31 * result + (this.typeName != null ? this.typeName.hashCode() : 0);
            result = 31 * result + (this.vpcConfig != null ? this.vpcConfig.hashCode() : 0);
            return result;
        }
    }
}
