package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.461Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamSnowflakeConfiguration")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamSnowflakeConfiguration.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamSnowflakeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#account_url KinesisFirehoseDeliveryStream#account_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccountUrl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#database KinesisFirehoseDeliveryStream#database}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabase();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * s3_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_configuration KinesisFirehoseDeliveryStream#s3_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3Configuration getS3Configuration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#schema KinesisFirehoseDeliveryStream#schema}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSchema();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#table KinesisFirehoseDeliveryStream#table}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTable();

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
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#content_column_name KinesisFirehoseDeliveryStream#content_column_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentColumnName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#data_loading_option KinesisFirehoseDeliveryStream#data_loading_option}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataLoadingOption() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#key_passphrase KinesisFirehoseDeliveryStream#key_passphrase}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyPassphrase() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#metadata_column_name KinesisFirehoseDeliveryStream#metadata_column_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMetadataColumnName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#private_key KinesisFirehoseDeliveryStream#private_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivateKey() {
        return null;
    }

    /**
     * processing_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationProcessingConfiguration getProcessingConfiguration() {
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
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSecretsManagerConfiguration getSecretsManagerConfiguration() {
        return null;
    }

    /**
     * snowflake_role_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#snowflake_role_configuration KinesisFirehoseDeliveryStream#snowflake_role_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeRoleConfiguration getSnowflakeRoleConfiguration() {
        return null;
    }

    /**
     * snowflake_vpc_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#snowflake_vpc_configuration KinesisFirehoseDeliveryStream#snowflake_vpc_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfiguration getSnowflakeVpcConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#user KinesisFirehoseDeliveryStream#user}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUser() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamSnowflakeConfiguration> {
        java.lang.String accountUrl;
        java.lang.String database;
        java.lang.String roleArn;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3Configuration s3Configuration;
        java.lang.String schema;
        java.lang.String table;
        java.lang.Number bufferingInterval;
        java.lang.Number bufferingSize;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        java.lang.String contentColumnName;
        java.lang.String dataLoadingOption;
        java.lang.String keyPassphrase;
        java.lang.String metadataColumnName;
        java.lang.String privateKey;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationProcessingConfiguration processingConfiguration;
        java.lang.Number retryDuration;
        java.lang.String s3BackupMode;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSecretsManagerConfiguration secretsManagerConfiguration;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeRoleConfiguration snowflakeRoleConfiguration;
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfiguration snowflakeVpcConfiguration;
        java.lang.String user;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getAccountUrl}
         * @param accountUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#account_url KinesisFirehoseDeliveryStream#account_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder accountUrl(java.lang.String accountUrl) {
            this.accountUrl = accountUrl;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getDatabase}
         * @param database Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#database KinesisFirehoseDeliveryStream#database}. This parameter is required.
         * @return {@code this}
         */
        public Builder database(java.lang.String database) {
            this.database = database;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getS3Configuration}
         * @param s3Configuration s3_configuration block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_configuration KinesisFirehoseDeliveryStream#s3_configuration}
         * @return {@code this}
         */
        public Builder s3Configuration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3Configuration s3Configuration) {
            this.s3Configuration = s3Configuration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getSchema}
         * @param schema Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#schema KinesisFirehoseDeliveryStream#schema}. This parameter is required.
         * @return {@code this}
         */
        public Builder schema(java.lang.String schema) {
            this.schema = schema;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getTable}
         * @param table Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#table KinesisFirehoseDeliveryStream#table}. This parameter is required.
         * @return {@code this}
         */
        public Builder table(java.lang.String table) {
            this.table = table;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getBufferingInterval}
         * @param bufferingInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_interval KinesisFirehoseDeliveryStream#buffering_interval}.
         * @return {@code this}
         */
        public Builder bufferingInterval(java.lang.Number bufferingInterval) {
            this.bufferingInterval = bufferingInterval;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getBufferingSize}
         * @param bufferingSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#buffering_size KinesisFirehoseDeliveryStream#buffering_size}.
         * @return {@code this}
         */
        public Builder bufferingSize(java.lang.Number bufferingSize) {
            this.bufferingSize = bufferingSize;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getCloudwatchLoggingOptions}
         * @param cloudwatchLoggingOptions cloudwatch_logging_options block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#cloudwatch_logging_options KinesisFirehoseDeliveryStream#cloudwatch_logging_options}
         * @return {@code this}
         */
        public Builder cloudwatchLoggingOptions(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions) {
            this.cloudwatchLoggingOptions = cloudwatchLoggingOptions;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getContentColumnName}
         * @param contentColumnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#content_column_name KinesisFirehoseDeliveryStream#content_column_name}.
         * @return {@code this}
         */
        public Builder contentColumnName(java.lang.String contentColumnName) {
            this.contentColumnName = contentColumnName;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getDataLoadingOption}
         * @param dataLoadingOption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#data_loading_option KinesisFirehoseDeliveryStream#data_loading_option}.
         * @return {@code this}
         */
        public Builder dataLoadingOption(java.lang.String dataLoadingOption) {
            this.dataLoadingOption = dataLoadingOption;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getKeyPassphrase}
         * @param keyPassphrase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#key_passphrase KinesisFirehoseDeliveryStream#key_passphrase}.
         * @return {@code this}
         */
        public Builder keyPassphrase(java.lang.String keyPassphrase) {
            this.keyPassphrase = keyPassphrase;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getMetadataColumnName}
         * @param metadataColumnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#metadata_column_name KinesisFirehoseDeliveryStream#metadata_column_name}.
         * @return {@code this}
         */
        public Builder metadataColumnName(java.lang.String metadataColumnName) {
            this.metadataColumnName = metadataColumnName;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getPrivateKey}
         * @param privateKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#private_key KinesisFirehoseDeliveryStream#private_key}.
         * @return {@code this}
         */
        public Builder privateKey(java.lang.String privateKey) {
            this.privateKey = privateKey;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getProcessingConfiguration}
         * @param processingConfiguration processing_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#processing_configuration KinesisFirehoseDeliveryStream#processing_configuration}
         * @return {@code this}
         */
        public Builder processingConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationProcessingConfiguration processingConfiguration) {
            this.processingConfiguration = processingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getRetryDuration}
         * @param retryDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#retry_duration KinesisFirehoseDeliveryStream#retry_duration}.
         * @return {@code this}
         */
        public Builder retryDuration(java.lang.Number retryDuration) {
            this.retryDuration = retryDuration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getS3BackupMode}
         * @param s3BackupMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_backup_mode KinesisFirehoseDeliveryStream#s3_backup_mode}.
         * @return {@code this}
         */
        public Builder s3BackupMode(java.lang.String s3BackupMode) {
            this.s3BackupMode = s3BackupMode;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getSecretsManagerConfiguration}
         * @param secretsManagerConfiguration secrets_manager_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#secrets_manager_configuration KinesisFirehoseDeliveryStream#secrets_manager_configuration}
         * @return {@code this}
         */
        public Builder secretsManagerConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSecretsManagerConfiguration secretsManagerConfiguration) {
            this.secretsManagerConfiguration = secretsManagerConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getSnowflakeRoleConfiguration}
         * @param snowflakeRoleConfiguration snowflake_role_configuration block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#snowflake_role_configuration KinesisFirehoseDeliveryStream#snowflake_role_configuration}
         * @return {@code this}
         */
        public Builder snowflakeRoleConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeRoleConfiguration snowflakeRoleConfiguration) {
            this.snowflakeRoleConfiguration = snowflakeRoleConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getSnowflakeVpcConfiguration}
         * @param snowflakeVpcConfiguration snowflake_vpc_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#snowflake_vpc_configuration KinesisFirehoseDeliveryStream#snowflake_vpc_configuration}
         * @return {@code this}
         */
        public Builder snowflakeVpcConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfiguration snowflakeVpcConfiguration) {
            this.snowflakeVpcConfiguration = snowflakeVpcConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration#getUser}
         * @param user Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#user KinesisFirehoseDeliveryStream#user}.
         * @return {@code this}
         */
        public Builder user(java.lang.String user) {
            this.user = user;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamSnowflakeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamSnowflakeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamSnowflakeConfiguration {
        private final java.lang.String accountUrl;
        private final java.lang.String database;
        private final java.lang.String roleArn;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3Configuration s3Configuration;
        private final java.lang.String schema;
        private final java.lang.String table;
        private final java.lang.Number bufferingInterval;
        private final java.lang.Number bufferingSize;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationCloudwatchLoggingOptions cloudwatchLoggingOptions;
        private final java.lang.String contentColumnName;
        private final java.lang.String dataLoadingOption;
        private final java.lang.String keyPassphrase;
        private final java.lang.String metadataColumnName;
        private final java.lang.String privateKey;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationProcessingConfiguration processingConfiguration;
        private final java.lang.Number retryDuration;
        private final java.lang.String s3BackupMode;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSecretsManagerConfiguration secretsManagerConfiguration;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeRoleConfiguration snowflakeRoleConfiguration;
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfiguration snowflakeVpcConfiguration;
        private final java.lang.String user;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accountUrl = software.amazon.jsii.Kernel.get(this, "accountUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.database = software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Configuration = software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3Configuration.class));
            this.schema = software.amazon.jsii.Kernel.get(this, "schema", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.table = software.amazon.jsii.Kernel.get(this, "table", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bufferingInterval = software.amazon.jsii.Kernel.get(this, "bufferingInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.bufferingSize = software.amazon.jsii.Kernel.get(this, "bufferingSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cloudwatchLoggingOptions = software.amazon.jsii.Kernel.get(this, "cloudwatchLoggingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationCloudwatchLoggingOptions.class));
            this.contentColumnName = software.amazon.jsii.Kernel.get(this, "contentColumnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataLoadingOption = software.amazon.jsii.Kernel.get(this, "dataLoadingOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyPassphrase = software.amazon.jsii.Kernel.get(this, "keyPassphrase", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metadataColumnName = software.amazon.jsii.Kernel.get(this, "metadataColumnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.privateKey = software.amazon.jsii.Kernel.get(this, "privateKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.processingConfiguration = software.amazon.jsii.Kernel.get(this, "processingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationProcessingConfiguration.class));
            this.retryDuration = software.amazon.jsii.Kernel.get(this, "retryDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.s3BackupMode = software.amazon.jsii.Kernel.get(this, "s3BackupMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretsManagerConfiguration = software.amazon.jsii.Kernel.get(this, "secretsManagerConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSecretsManagerConfiguration.class));
            this.snowflakeRoleConfiguration = software.amazon.jsii.Kernel.get(this, "snowflakeRoleConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeRoleConfiguration.class));
            this.snowflakeVpcConfiguration = software.amazon.jsii.Kernel.get(this, "snowflakeVpcConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfiguration.class));
            this.user = software.amazon.jsii.Kernel.get(this, "user", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accountUrl = java.util.Objects.requireNonNull(builder.accountUrl, "accountUrl is required");
            this.database = java.util.Objects.requireNonNull(builder.database, "database is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.s3Configuration = java.util.Objects.requireNonNull(builder.s3Configuration, "s3Configuration is required");
            this.schema = java.util.Objects.requireNonNull(builder.schema, "schema is required");
            this.table = java.util.Objects.requireNonNull(builder.table, "table is required");
            this.bufferingInterval = builder.bufferingInterval;
            this.bufferingSize = builder.bufferingSize;
            this.cloudwatchLoggingOptions = builder.cloudwatchLoggingOptions;
            this.contentColumnName = builder.contentColumnName;
            this.dataLoadingOption = builder.dataLoadingOption;
            this.keyPassphrase = builder.keyPassphrase;
            this.metadataColumnName = builder.metadataColumnName;
            this.privateKey = builder.privateKey;
            this.processingConfiguration = builder.processingConfiguration;
            this.retryDuration = builder.retryDuration;
            this.s3BackupMode = builder.s3BackupMode;
            this.secretsManagerConfiguration = builder.secretsManagerConfiguration;
            this.snowflakeRoleConfiguration = builder.snowflakeRoleConfiguration;
            this.snowflakeVpcConfiguration = builder.snowflakeVpcConfiguration;
            this.user = builder.user;
        }

        @Override
        public final java.lang.String getAccountUrl() {
            return this.accountUrl;
        }

        @Override
        public final java.lang.String getDatabase() {
            return this.database;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3Configuration getS3Configuration() {
            return this.s3Configuration;
        }

        @Override
        public final java.lang.String getSchema() {
            return this.schema;
        }

        @Override
        public final java.lang.String getTable() {
            return this.table;
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
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationCloudwatchLoggingOptions getCloudwatchLoggingOptions() {
            return this.cloudwatchLoggingOptions;
        }

        @Override
        public final java.lang.String getContentColumnName() {
            return this.contentColumnName;
        }

        @Override
        public final java.lang.String getDataLoadingOption() {
            return this.dataLoadingOption;
        }

        @Override
        public final java.lang.String getKeyPassphrase() {
            return this.keyPassphrase;
        }

        @Override
        public final java.lang.String getMetadataColumnName() {
            return this.metadataColumnName;
        }

        @Override
        public final java.lang.String getPrivateKey() {
            return this.privateKey;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationProcessingConfiguration getProcessingConfiguration() {
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
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSecretsManagerConfiguration getSecretsManagerConfiguration() {
            return this.secretsManagerConfiguration;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeRoleConfiguration getSnowflakeRoleConfiguration() {
            return this.snowflakeRoleConfiguration;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfiguration getSnowflakeVpcConfiguration() {
            return this.snowflakeVpcConfiguration;
        }

        @Override
        public final java.lang.String getUser() {
            return this.user;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("accountUrl", om.valueToTree(this.getAccountUrl()));
            data.set("database", om.valueToTree(this.getDatabase()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("s3Configuration", om.valueToTree(this.getS3Configuration()));
            data.set("schema", om.valueToTree(this.getSchema()));
            data.set("table", om.valueToTree(this.getTable()));
            if (this.getBufferingInterval() != null) {
                data.set("bufferingInterval", om.valueToTree(this.getBufferingInterval()));
            }
            if (this.getBufferingSize() != null) {
                data.set("bufferingSize", om.valueToTree(this.getBufferingSize()));
            }
            if (this.getCloudwatchLoggingOptions() != null) {
                data.set("cloudwatchLoggingOptions", om.valueToTree(this.getCloudwatchLoggingOptions()));
            }
            if (this.getContentColumnName() != null) {
                data.set("contentColumnName", om.valueToTree(this.getContentColumnName()));
            }
            if (this.getDataLoadingOption() != null) {
                data.set("dataLoadingOption", om.valueToTree(this.getDataLoadingOption()));
            }
            if (this.getKeyPassphrase() != null) {
                data.set("keyPassphrase", om.valueToTree(this.getKeyPassphrase()));
            }
            if (this.getMetadataColumnName() != null) {
                data.set("metadataColumnName", om.valueToTree(this.getMetadataColumnName()));
            }
            if (this.getPrivateKey() != null) {
                data.set("privateKey", om.valueToTree(this.getPrivateKey()));
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
            if (this.getSnowflakeRoleConfiguration() != null) {
                data.set("snowflakeRoleConfiguration", om.valueToTree(this.getSnowflakeRoleConfiguration()));
            }
            if (this.getSnowflakeVpcConfiguration() != null) {
                data.set("snowflakeVpcConfiguration", om.valueToTree(this.getSnowflakeVpcConfiguration()));
            }
            if (this.getUser() != null) {
                data.set("user", om.valueToTree(this.getUser()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamSnowflakeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamSnowflakeConfiguration.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamSnowflakeConfiguration.Jsii$Proxy) o;

            if (!accountUrl.equals(that.accountUrl)) return false;
            if (!database.equals(that.database)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (!s3Configuration.equals(that.s3Configuration)) return false;
            if (!schema.equals(that.schema)) return false;
            if (!table.equals(that.table)) return false;
            if (this.bufferingInterval != null ? !this.bufferingInterval.equals(that.bufferingInterval) : that.bufferingInterval != null) return false;
            if (this.bufferingSize != null ? !this.bufferingSize.equals(that.bufferingSize) : that.bufferingSize != null) return false;
            if (this.cloudwatchLoggingOptions != null ? !this.cloudwatchLoggingOptions.equals(that.cloudwatchLoggingOptions) : that.cloudwatchLoggingOptions != null) return false;
            if (this.contentColumnName != null ? !this.contentColumnName.equals(that.contentColumnName) : that.contentColumnName != null) return false;
            if (this.dataLoadingOption != null ? !this.dataLoadingOption.equals(that.dataLoadingOption) : that.dataLoadingOption != null) return false;
            if (this.keyPassphrase != null ? !this.keyPassphrase.equals(that.keyPassphrase) : that.keyPassphrase != null) return false;
            if (this.metadataColumnName != null ? !this.metadataColumnName.equals(that.metadataColumnName) : that.metadataColumnName != null) return false;
            if (this.privateKey != null ? !this.privateKey.equals(that.privateKey) : that.privateKey != null) return false;
            if (this.processingConfiguration != null ? !this.processingConfiguration.equals(that.processingConfiguration) : that.processingConfiguration != null) return false;
            if (this.retryDuration != null ? !this.retryDuration.equals(that.retryDuration) : that.retryDuration != null) return false;
            if (this.s3BackupMode != null ? !this.s3BackupMode.equals(that.s3BackupMode) : that.s3BackupMode != null) return false;
            if (this.secretsManagerConfiguration != null ? !this.secretsManagerConfiguration.equals(that.secretsManagerConfiguration) : that.secretsManagerConfiguration != null) return false;
            if (this.snowflakeRoleConfiguration != null ? !this.snowflakeRoleConfiguration.equals(that.snowflakeRoleConfiguration) : that.snowflakeRoleConfiguration != null) return false;
            if (this.snowflakeVpcConfiguration != null ? !this.snowflakeVpcConfiguration.equals(that.snowflakeVpcConfiguration) : that.snowflakeVpcConfiguration != null) return false;
            return this.user != null ? this.user.equals(that.user) : that.user == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accountUrl.hashCode();
            result = 31 * result + (this.database.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.s3Configuration.hashCode());
            result = 31 * result + (this.schema.hashCode());
            result = 31 * result + (this.table.hashCode());
            result = 31 * result + (this.bufferingInterval != null ? this.bufferingInterval.hashCode() : 0);
            result = 31 * result + (this.bufferingSize != null ? this.bufferingSize.hashCode() : 0);
            result = 31 * result + (this.cloudwatchLoggingOptions != null ? this.cloudwatchLoggingOptions.hashCode() : 0);
            result = 31 * result + (this.contentColumnName != null ? this.contentColumnName.hashCode() : 0);
            result = 31 * result + (this.dataLoadingOption != null ? this.dataLoadingOption.hashCode() : 0);
            result = 31 * result + (this.keyPassphrase != null ? this.keyPassphrase.hashCode() : 0);
            result = 31 * result + (this.metadataColumnName != null ? this.metadataColumnName.hashCode() : 0);
            result = 31 * result + (this.privateKey != null ? this.privateKey.hashCode() : 0);
            result = 31 * result + (this.processingConfiguration != null ? this.processingConfiguration.hashCode() : 0);
            result = 31 * result + (this.retryDuration != null ? this.retryDuration.hashCode() : 0);
            result = 31 * result + (this.s3BackupMode != null ? this.s3BackupMode.hashCode() : 0);
            result = 31 * result + (this.secretsManagerConfiguration != null ? this.secretsManagerConfiguration.hashCode() : 0);
            result = 31 * result + (this.snowflakeRoleConfiguration != null ? this.snowflakeRoleConfiguration.hashCode() : 0);
            result = 31 * result + (this.snowflakeVpcConfiguration != null ? this.snowflakeVpcConfiguration.hashCode() : 0);
            result = 31 * result + (this.user != null ? this.user.hashCode() : 0);
            return result;
        }
    }
}
