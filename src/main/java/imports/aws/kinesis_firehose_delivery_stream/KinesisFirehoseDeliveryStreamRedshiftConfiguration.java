package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.460Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamRedshiftConfiguration")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamRedshiftConfiguration.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamRedshiftConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#cluster_jdbcurl KinesisFirehoseDeliveryStream#cluster_jdbcurl}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterJdbcurl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#data_table_name KinesisFirehoseDeliveryStream#data_table_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataTableName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * s3_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_configuration KinesisFirehoseDeliveryStream#s3_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationS3Configuration getS3Configuration();

    /**
     * cloudwatch_logging_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#cloudwatch_logging_options KinesisFirehoseDeliveryStream#cloudwatch_logging_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#copy_options KinesisFirehoseDeliveryStream#copy_options}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCopyOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#data_table_columns KinesisFirehoseDeliveryStream#data_table_columns}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataTableColumns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#password KinesisFirehoseDeliveryStream#password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPassword() {
        return null;
    }

    /**
     * processing_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationProcessingConfiguration getProcessingConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#retry_duration KinesisFirehoseDeliveryStream#retry_duration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRetryDuration() {
        return null;
    }

    /**
     * s3_backup_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_backup_configuration KinesisFirehoseDeliveryStream#s3_backup_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationS3BackupConfiguration getS3BackupConfiguration() {
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
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationSecretsManagerConfiguration getSecretsManagerConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#username KinesisFirehoseDeliveryStream#username}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUsername() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamRedshiftConfiguration> {
        java.lang.String clusterJdbcurl;
        java.lang.String dataTableName;
        java.lang.String roleArn;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationS3Configuration s3Configuration;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        java.lang.String copyOptions;
        java.lang.String dataTableColumns;
        java.lang.String password;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationProcessingConfiguration processingConfiguration;
        java.lang.Number retryDuration;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationS3BackupConfiguration s3BackupConfiguration;
        java.lang.String s3BackupMode;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationSecretsManagerConfiguration secretsManagerConfiguration;
        java.lang.String username;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getClusterJdbcurl}
         * @param clusterJdbcurl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#cluster_jdbcurl KinesisFirehoseDeliveryStream#cluster_jdbcurl}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterJdbcurl(java.lang.String clusterJdbcurl) {
            this.clusterJdbcurl = clusterJdbcurl;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getDataTableName}
         * @param dataTableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#data_table_name KinesisFirehoseDeliveryStream#data_table_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataTableName(java.lang.String dataTableName) {
            this.dataTableName = dataTableName;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getS3Configuration}
         * @param s3Configuration s3_configuration block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_configuration KinesisFirehoseDeliveryStream#s3_configuration}
         * @return {@code this}
         */
        public Builder s3Configuration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationS3Configuration s3Configuration) {
            this.s3Configuration = s3Configuration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getCloudwatchLoggingOptions}
         * @param cloudwatchLoggingOptions cloudwatch_logging_options block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#cloudwatch_logging_options KinesisFirehoseDeliveryStream#cloudwatch_logging_options}
         * @return {@code this}
         */
        public Builder cloudwatchLoggingOptions(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions) {
            this.cloudwatchLoggingOptions = cloudwatchLoggingOptions;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getCopyOptions}
         * @param copyOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#copy_options KinesisFirehoseDeliveryStream#copy_options}.
         * @return {@code this}
         */
        public Builder copyOptions(java.lang.String copyOptions) {
            this.copyOptions = copyOptions;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getDataTableColumns}
         * @param dataTableColumns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#data_table_columns KinesisFirehoseDeliveryStream#data_table_columns}.
         * @return {@code this}
         */
        public Builder dataTableColumns(java.lang.String dataTableColumns) {
            this.dataTableColumns = dataTableColumns;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getPassword}
         * @param password Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#password KinesisFirehoseDeliveryStream#password}.
         * @return {@code this}
         */
        public Builder password(java.lang.String password) {
            this.password = password;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getProcessingConfiguration}
         * @param processingConfiguration processing_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
         * @return {@code this}
         */
        public Builder processingConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationProcessingConfiguration processingConfiguration) {
            this.processingConfiguration = processingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getRetryDuration}
         * @param retryDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#retry_duration KinesisFirehoseDeliveryStream#retry_duration}.
         * @return {@code this}
         */
        public Builder retryDuration(java.lang.Number retryDuration) {
            this.retryDuration = retryDuration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getS3BackupConfiguration}
         * @param s3BackupConfiguration s3_backup_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_backup_configuration KinesisFirehoseDeliveryStream#s3_backup_configuration}
         * @return {@code this}
         */
        public Builder s3BackupConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationS3BackupConfiguration s3BackupConfiguration) {
            this.s3BackupConfiguration = s3BackupConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getS3BackupMode}
         * @param s3BackupMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_backup_mode KinesisFirehoseDeliveryStream#s3_backup_mode}.
         * @return {@code this}
         */
        public Builder s3BackupMode(java.lang.String s3BackupMode) {
            this.s3BackupMode = s3BackupMode;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getSecretsManagerConfiguration}
         * @param secretsManagerConfiguration secrets_manager_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#secrets_manager_configuration KinesisFirehoseDeliveryStream#secrets_manager_configuration}
         * @return {@code this}
         */
        public Builder secretsManagerConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationSecretsManagerConfiguration secretsManagerConfiguration) {
            this.secretsManagerConfiguration = secretsManagerConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration#getUsername}
         * @param username Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#username KinesisFirehoseDeliveryStream#username}.
         * @return {@code this}
         */
        public Builder username(java.lang.String username) {
            this.username = username;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamRedshiftConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamRedshiftConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamRedshiftConfiguration {
        private final java.lang.String clusterJdbcurl;
        private final java.lang.String dataTableName;
        private final java.lang.String roleArn;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationS3Configuration s3Configuration;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        private final java.lang.String copyOptions;
        private final java.lang.String dataTableColumns;
        private final java.lang.String password;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationProcessingConfiguration processingConfiguration;
        private final java.lang.Number retryDuration;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationS3BackupConfiguration s3BackupConfiguration;
        private final java.lang.String s3BackupMode;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationSecretsManagerConfiguration secretsManagerConfiguration;
        private final java.lang.String username;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clusterJdbcurl = software.amazon.jsii.Kernel.get(this, "clusterJdbcurl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataTableName = software.amazon.jsii.Kernel.get(this, "dataTableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Configuration = software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationS3Configuration.class));
            this.cloudwatchLoggingOptions = software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationCloudwatchLoggingOptions.class));
            this.copyOptions = software.amazon.jsii.Kernel.get(this, "copyOptions", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataTableColumns = software.amazon.jsii.Kernel.get(this, "dataTableColumns", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.password = software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.processingConfiguration = software.amazon.jsii.Kernel.get(this, "processingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationProcessingConfiguration.class));
            this.retryDuration = software.amazon.jsii.Kernel.get(this, "retryDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.s3BackupConfiguration = software.amazon.jsii.Kernel.get(this, "s3BackupConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationS3BackupConfiguration.class));
            this.s3BackupMode = software.amazon.jsii.Kernel.get(this, "s3BackupMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretsManagerConfiguration = software.amazon.jsii.Kernel.get(this, "secretsManagerConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationSecretsManagerConfiguration.class));
            this.username = software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clusterJdbcurl = java.util.Objects.requireNonNull(builder.clusterJdbcurl, "clusterJdbcurl is required");
            this.dataTableName = java.util.Objects.requireNonNull(builder.dataTableName, "dataTableName is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.s3Configuration = java.util.Objects.requireNonNull(builder.s3Configuration, "s3Configuration is required");
            this.cloudwatchLoggingOptions = builder.cloudwatchLoggingOptions;
            this.copyOptions = builder.copyOptions;
            this.dataTableColumns = builder.dataTableColumns;
            this.password = builder.password;
            this.processingConfiguration = builder.processingConfiguration;
            this.retryDuration = builder.retryDuration;
            this.s3BackupConfiguration = builder.s3BackupConfiguration;
            this.s3BackupMode = builder.s3BackupMode;
            this.secretsManagerConfiguration = builder.secretsManagerConfiguration;
            this.username = builder.username;
        }

        @Override
        public final java.lang.String getClusterJdbcurl() {
            return this.clusterJdbcurl;
        }

        @Override
        public final java.lang.String getDataTableName() {
            return this.dataTableName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationS3Configuration getS3Configuration() {
            return this.s3Configuration;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
            return this.cloudwatchLoggingOptions;
        }

        @Override
        public final java.lang.String getCopyOptions() {
            return this.copyOptions;
        }

        @Override
        public final java.lang.String getDataTableColumns() {
            return this.dataTableColumns;
        }

        @Override
        public final java.lang.String getPassword() {
            return this.password;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationProcessingConfiguration getProcessingConfiguration() {
            return this.processingConfiguration;
        }

        @Override
        public final java.lang.Number getRetryDuration() {
            return this.retryDuration;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationS3BackupConfiguration getS3BackupConfiguration() {
            return this.s3BackupConfiguration;
        }

        @Override
        public final java.lang.String getS3BackupMode() {
            return this.s3BackupMode;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamRedshiftConfigurationSecretsManagerConfiguration getSecretsManagerConfiguration() {
            return this.secretsManagerConfiguration;
        }

        @Override
        public final java.lang.String getUsername() {
            return this.username;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("clusterJdbcurl", om.valueToTree(this.getClusterJdbcurl()));
            data.set("dataTableName", om.valueToTree(this.getDataTableName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("s3Configuration", om.valueToTree(this.getS3Configuration()));
            if (this.getCloudwatchLoggingOptions() != null) {
                data.set("cloudwatchLoggingOptions", om.valueToTree(this.getCloudwatchLoggingOptions()));
            }
            if (this.getCopyOptions() != null) {
                data.set("copyOptions", om.valueToTree(this.getCopyOptions()));
            }
            if (this.getDataTableColumns() != null) {
                data.set("dataTableColumns", om.valueToTree(this.getDataTableColumns()));
            }
            if (this.getPassword() != null) {
                data.set("password", om.valueToTree(this.getPassword()));
            }
            if (this.getProcessingConfiguration() != null) {
                data.set("processingConfiguration", om.valueToTree(this.getProcessingConfiguration()));
            }
            if (this.getRetryDuration() != null) {
                data.set("retryDuration", om.valueToTree(this.getRetryDuration()));
            }
            if (this.getS3BackupConfiguration() != null) {
                data.set("s3BackupConfiguration", om.valueToTree(this.getS3BackupConfiguration()));
            }
            if (this.getS3BackupMode() != null) {
                data.set("s3BackupMode", om.valueToTree(this.getS3BackupMode()));
            }
            if (this.getSecretsManagerConfiguration() != null) {
                data.set("secretsManagerConfiguration", om.valueToTree(this.getSecretsManagerConfiguration()));
            }
            if (this.getUsername() != null) {
                data.set("username", om.valueToTree(this.getUsername()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamRedshiftConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamRedshiftConfiguration.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamRedshiftConfiguration.Jsii$Proxy) o;

            if (!clusterJdbcurl.equals(that.clusterJdbcurl)) return false;
            if (!dataTableName.equals(that.dataTableName)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (!s3Configuration.equals(that.s3Configuration)) return false;
            if (this.cloudwatchLoggingOptions != null ? !this.cloudwatchLoggingOptions.equals(that.cloudwatchLoggingOptions) : that.cloudwatchLoggingOptions != null) return false;
            if (this.copyOptions != null ? !this.copyOptions.equals(that.copyOptions) : that.copyOptions != null) return false;
            if (this.dataTableColumns != null ? !this.dataTableColumns.equals(that.dataTableColumns) : that.dataTableColumns != null) return false;
            if (this.password != null ? !this.password.equals(that.password) : that.password != null) return false;
            if (this.processingConfiguration != null ? !this.processingConfiguration.equals(that.processingConfiguration) : that.processingConfiguration != null) return false;
            if (this.retryDuration != null ? !this.retryDuration.equals(that.retryDuration) : that.retryDuration != null) return false;
            if (this.s3BackupConfiguration != null ? !this.s3BackupConfiguration.equals(that.s3BackupConfiguration) : that.s3BackupConfiguration != null) return false;
            if (this.s3BackupMode != null ? !this.s3BackupMode.equals(that.s3BackupMode) : that.s3BackupMode != null) return false;
            if (this.secretsManagerConfiguration != null ? !this.secretsManagerConfiguration.equals(that.secretsManagerConfiguration) : that.secretsManagerConfiguration != null) return false;
            return this.username != null ? this.username.equals(that.username) : that.username == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clusterJdbcurl.hashCode();
            result = 31 * result + (this.dataTableName.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.s3Configuration.hashCode());
            result = 31 * result + (this.cloudwatchLoggingOptions != null ? this.cloudwatchLoggingOptions.hashCode() : 0);
            result = 31 * result + (this.copyOptions != null ? this.copyOptions.hashCode() : 0);
            result = 31 * result + (this.dataTableColumns != null ? this.dataTableColumns.hashCode() : 0);
            result = 31 * result + (this.password != null ? this.password.hashCode() : 0);
            result = 31 * result + (this.processingConfiguration != null ? this.processingConfiguration.hashCode() : 0);
            result = 31 * result + (this.retryDuration != null ? this.retryDuration.hashCode() : 0);
            result = 31 * result + (this.s3BackupConfiguration != null ? this.s3BackupConfiguration.hashCode() : 0);
            result = 31 * result + (this.s3BackupMode != null ? this.s3BackupMode.hashCode() : 0);
            result = 31 * result + (this.secretsManagerConfiguration != null ? this.secretsManagerConfiguration.hashCode() : 0);
            result = 31 * result + (this.username != null ? this.username.hashCode() : 0);
            return result;
        }
    }
}
