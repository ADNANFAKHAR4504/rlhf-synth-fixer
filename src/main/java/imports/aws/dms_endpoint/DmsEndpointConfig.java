package imports.aws.dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.012Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsEndpoint.DmsEndpointConfig")
@software.amazon.jsii.Jsii.Proxy(DmsEndpointConfig.Jsii$Proxy.class)
public interface DmsEndpointConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#endpoint_id DmsEndpoint#endpoint_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEndpointId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#endpoint_type DmsEndpoint#endpoint_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEndpointType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#engine_name DmsEndpoint#engine_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEngineName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#certificate_arn DmsEndpoint#certificate_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#database_name DmsEndpoint#database_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatabaseName() {
        return null;
    }

    /**
     * elasticsearch_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#elasticsearch_settings DmsEndpoint#elasticsearch_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointElasticsearchSettings getElasticsearchSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#extra_connection_attributes DmsEndpoint#extra_connection_attributes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExtraConnectionAttributes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#id DmsEndpoint#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * kafka_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#kafka_settings DmsEndpoint#kafka_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointKafkaSettings getKafkaSettings() {
        return null;
    }

    /**
     * kinesis_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#kinesis_settings DmsEndpoint#kinesis_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointKinesisSettings getKinesisSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#kms_key_arn DmsEndpoint#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * mongodb_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#mongodb_settings DmsEndpoint#mongodb_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointMongodbSettings getMongodbSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#password DmsEndpoint#password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#pause_replication_tasks DmsEndpoint#pause_replication_tasks}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPauseReplicationTasks() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#port DmsEndpoint#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * postgres_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#postgres_settings DmsEndpoint#postgres_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointPostgresSettings getPostgresSettings() {
        return null;
    }

    /**
     * redis_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#redis_settings DmsEndpoint#redis_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointRedisSettings getRedisSettings() {
        return null;
    }

    /**
     * redshift_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#redshift_settings DmsEndpoint#redshift_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointRedshiftSettings getRedshiftSettings() {
        return null;
    }

    /**
     * s3_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#s3_settings DmsEndpoint#s3_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointS3Settings getS3Settings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#secrets_manager_access_role_arn DmsEndpoint#secrets_manager_access_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecretsManagerAccessRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#secrets_manager_arn DmsEndpoint#secrets_manager_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecretsManagerArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#server_name DmsEndpoint#server_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServerName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#service_access_role DmsEndpoint#service_access_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceAccessRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#ssl_mode DmsEndpoint#ssl_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSslMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#tags DmsEndpoint#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#tags_all DmsEndpoint#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#timeouts DmsEndpoint#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#username DmsEndpoint#username}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUsername() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DmsEndpointConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DmsEndpointConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DmsEndpointConfig> {
        java.lang.String endpointId;
        java.lang.String endpointType;
        java.lang.String engineName;
        java.lang.String certificateArn;
        java.lang.String databaseName;
        imports.aws.dms_endpoint.DmsEndpointElasticsearchSettings elasticsearchSettings;
        java.lang.String extraConnectionAttributes;
        java.lang.String id;
        imports.aws.dms_endpoint.DmsEndpointKafkaSettings kafkaSettings;
        imports.aws.dms_endpoint.DmsEndpointKinesisSettings kinesisSettings;
        java.lang.String kmsKeyArn;
        imports.aws.dms_endpoint.DmsEndpointMongodbSettings mongodbSettings;
        java.lang.String password;
        java.lang.Object pauseReplicationTasks;
        java.lang.Number port;
        imports.aws.dms_endpoint.DmsEndpointPostgresSettings postgresSettings;
        imports.aws.dms_endpoint.DmsEndpointRedisSettings redisSettings;
        imports.aws.dms_endpoint.DmsEndpointRedshiftSettings redshiftSettings;
        imports.aws.dms_endpoint.DmsEndpointS3Settings s3Settings;
        java.lang.String secretsManagerAccessRoleArn;
        java.lang.String secretsManagerArn;
        java.lang.String serverName;
        java.lang.String serviceAccessRole;
        java.lang.String sslMode;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.dms_endpoint.DmsEndpointTimeouts timeouts;
        java.lang.String username;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DmsEndpointConfig#getEndpointId}
         * @param endpointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#endpoint_id DmsEndpoint#endpoint_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder endpointId(java.lang.String endpointId) {
            this.endpointId = endpointId;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getEndpointType}
         * @param endpointType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#endpoint_type DmsEndpoint#endpoint_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder endpointType(java.lang.String endpointType) {
            this.endpointType = endpointType;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getEngineName}
         * @param engineName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#engine_name DmsEndpoint#engine_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder engineName(java.lang.String engineName) {
            this.engineName = engineName;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getCertificateArn}
         * @param certificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#certificate_arn DmsEndpoint#certificate_arn}.
         * @return {@code this}
         */
        public Builder certificateArn(java.lang.String certificateArn) {
            this.certificateArn = certificateArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#database_name DmsEndpoint#database_name}.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getElasticsearchSettings}
         * @param elasticsearchSettings elasticsearch_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#elasticsearch_settings DmsEndpoint#elasticsearch_settings}
         * @return {@code this}
         */
        public Builder elasticsearchSettings(imports.aws.dms_endpoint.DmsEndpointElasticsearchSettings elasticsearchSettings) {
            this.elasticsearchSettings = elasticsearchSettings;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getExtraConnectionAttributes}
         * @param extraConnectionAttributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#extra_connection_attributes DmsEndpoint#extra_connection_attributes}.
         * @return {@code this}
         */
        public Builder extraConnectionAttributes(java.lang.String extraConnectionAttributes) {
            this.extraConnectionAttributes = extraConnectionAttributes;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#id DmsEndpoint#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getKafkaSettings}
         * @param kafkaSettings kafka_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#kafka_settings DmsEndpoint#kafka_settings}
         * @return {@code this}
         */
        public Builder kafkaSettings(imports.aws.dms_endpoint.DmsEndpointKafkaSettings kafkaSettings) {
            this.kafkaSettings = kafkaSettings;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getKinesisSettings}
         * @param kinesisSettings kinesis_settings block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#kinesis_settings DmsEndpoint#kinesis_settings}
         * @return {@code this}
         */
        public Builder kinesisSettings(imports.aws.dms_endpoint.DmsEndpointKinesisSettings kinesisSettings) {
            this.kinesisSettings = kinesisSettings;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#kms_key_arn DmsEndpoint#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getMongodbSettings}
         * @param mongodbSettings mongodb_settings block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#mongodb_settings DmsEndpoint#mongodb_settings}
         * @return {@code this}
         */
        public Builder mongodbSettings(imports.aws.dms_endpoint.DmsEndpointMongodbSettings mongodbSettings) {
            this.mongodbSettings = mongodbSettings;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getPassword}
         * @param password Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#password DmsEndpoint#password}.
         * @return {@code this}
         */
        public Builder password(java.lang.String password) {
            this.password = password;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getPauseReplicationTasks}
         * @param pauseReplicationTasks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#pause_replication_tasks DmsEndpoint#pause_replication_tasks}.
         * @return {@code this}
         */
        public Builder pauseReplicationTasks(java.lang.Boolean pauseReplicationTasks) {
            this.pauseReplicationTasks = pauseReplicationTasks;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getPauseReplicationTasks}
         * @param pauseReplicationTasks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#pause_replication_tasks DmsEndpoint#pause_replication_tasks}.
         * @return {@code this}
         */
        public Builder pauseReplicationTasks(com.hashicorp.cdktf.IResolvable pauseReplicationTasks) {
            this.pauseReplicationTasks = pauseReplicationTasks;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#port DmsEndpoint#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getPostgresSettings}
         * @param postgresSettings postgres_settings block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#postgres_settings DmsEndpoint#postgres_settings}
         * @return {@code this}
         */
        public Builder postgresSettings(imports.aws.dms_endpoint.DmsEndpointPostgresSettings postgresSettings) {
            this.postgresSettings = postgresSettings;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getRedisSettings}
         * @param redisSettings redis_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#redis_settings DmsEndpoint#redis_settings}
         * @return {@code this}
         */
        public Builder redisSettings(imports.aws.dms_endpoint.DmsEndpointRedisSettings redisSettings) {
            this.redisSettings = redisSettings;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getRedshiftSettings}
         * @param redshiftSettings redshift_settings block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#redshift_settings DmsEndpoint#redshift_settings}
         * @return {@code this}
         */
        public Builder redshiftSettings(imports.aws.dms_endpoint.DmsEndpointRedshiftSettings redshiftSettings) {
            this.redshiftSettings = redshiftSettings;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getS3Settings}
         * @param s3Settings s3_settings block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#s3_settings DmsEndpoint#s3_settings}
         * @return {@code this}
         */
        public Builder s3Settings(imports.aws.dms_endpoint.DmsEndpointS3Settings s3Settings) {
            this.s3Settings = s3Settings;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getSecretsManagerAccessRoleArn}
         * @param secretsManagerAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#secrets_manager_access_role_arn DmsEndpoint#secrets_manager_access_role_arn}.
         * @return {@code this}
         */
        public Builder secretsManagerAccessRoleArn(java.lang.String secretsManagerAccessRoleArn) {
            this.secretsManagerAccessRoleArn = secretsManagerAccessRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getSecretsManagerArn}
         * @param secretsManagerArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#secrets_manager_arn DmsEndpoint#secrets_manager_arn}.
         * @return {@code this}
         */
        public Builder secretsManagerArn(java.lang.String secretsManagerArn) {
            this.secretsManagerArn = secretsManagerArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getServerName}
         * @param serverName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#server_name DmsEndpoint#server_name}.
         * @return {@code this}
         */
        public Builder serverName(java.lang.String serverName) {
            this.serverName = serverName;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getServiceAccessRole}
         * @param serviceAccessRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#service_access_role DmsEndpoint#service_access_role}.
         * @return {@code this}
         */
        public Builder serviceAccessRole(java.lang.String serviceAccessRole) {
            this.serviceAccessRole = serviceAccessRole;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getSslMode}
         * @param sslMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#ssl_mode DmsEndpoint#ssl_mode}.
         * @return {@code this}
         */
        public Builder sslMode(java.lang.String sslMode) {
            this.sslMode = sslMode;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#tags DmsEndpoint#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#tags_all DmsEndpoint#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#timeouts DmsEndpoint#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.dms_endpoint.DmsEndpointTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getUsername}
         * @param username Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#username DmsEndpoint#username}.
         * @return {@code this}
         */
        public Builder username(java.lang.String username) {
            this.username = username;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DmsEndpointConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DmsEndpointConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DmsEndpointConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DmsEndpointConfig {
        private final java.lang.String endpointId;
        private final java.lang.String endpointType;
        private final java.lang.String engineName;
        private final java.lang.String certificateArn;
        private final java.lang.String databaseName;
        private final imports.aws.dms_endpoint.DmsEndpointElasticsearchSettings elasticsearchSettings;
        private final java.lang.String extraConnectionAttributes;
        private final java.lang.String id;
        private final imports.aws.dms_endpoint.DmsEndpointKafkaSettings kafkaSettings;
        private final imports.aws.dms_endpoint.DmsEndpointKinesisSettings kinesisSettings;
        private final java.lang.String kmsKeyArn;
        private final imports.aws.dms_endpoint.DmsEndpointMongodbSettings mongodbSettings;
        private final java.lang.String password;
        private final java.lang.Object pauseReplicationTasks;
        private final java.lang.Number port;
        private final imports.aws.dms_endpoint.DmsEndpointPostgresSettings postgresSettings;
        private final imports.aws.dms_endpoint.DmsEndpointRedisSettings redisSettings;
        private final imports.aws.dms_endpoint.DmsEndpointRedshiftSettings redshiftSettings;
        private final imports.aws.dms_endpoint.DmsEndpointS3Settings s3Settings;
        private final java.lang.String secretsManagerAccessRoleArn;
        private final java.lang.String secretsManagerArn;
        private final java.lang.String serverName;
        private final java.lang.String serviceAccessRole;
        private final java.lang.String sslMode;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.dms_endpoint.DmsEndpointTimeouts timeouts;
        private final java.lang.String username;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.endpointId = software.amazon.jsii.Kernel.get(this, "endpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointType = software.amazon.jsii.Kernel.get(this, "endpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineName = software.amazon.jsii.Kernel.get(this, "engineName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.certificateArn = software.amazon.jsii.Kernel.get(this, "certificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.elasticsearchSettings = software.amazon.jsii.Kernel.get(this, "elasticsearchSettings", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointElasticsearchSettings.class));
            this.extraConnectionAttributes = software.amazon.jsii.Kernel.get(this, "extraConnectionAttributes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kafkaSettings = software.amazon.jsii.Kernel.get(this, "kafkaSettings", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointKafkaSettings.class));
            this.kinesisSettings = software.amazon.jsii.Kernel.get(this, "kinesisSettings", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointKinesisSettings.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mongodbSettings = software.amazon.jsii.Kernel.get(this, "mongodbSettings", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointMongodbSettings.class));
            this.password = software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pauseReplicationTasks = software.amazon.jsii.Kernel.get(this, "pauseReplicationTasks", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.postgresSettings = software.amazon.jsii.Kernel.get(this, "postgresSettings", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointPostgresSettings.class));
            this.redisSettings = software.amazon.jsii.Kernel.get(this, "redisSettings", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointRedisSettings.class));
            this.redshiftSettings = software.amazon.jsii.Kernel.get(this, "redshiftSettings", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointRedshiftSettings.class));
            this.s3Settings = software.amazon.jsii.Kernel.get(this, "s3Settings", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointS3Settings.class));
            this.secretsManagerAccessRoleArn = software.amazon.jsii.Kernel.get(this, "secretsManagerAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretsManagerArn = software.amazon.jsii.Kernel.get(this, "secretsManagerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverName = software.amazon.jsii.Kernel.get(this, "serverName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceAccessRole = software.amazon.jsii.Kernel.get(this, "serviceAccessRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sslMode = software.amazon.jsii.Kernel.get(this, "sslMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointTimeouts.class));
            this.username = software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.endpointId = java.util.Objects.requireNonNull(builder.endpointId, "endpointId is required");
            this.endpointType = java.util.Objects.requireNonNull(builder.endpointType, "endpointType is required");
            this.engineName = java.util.Objects.requireNonNull(builder.engineName, "engineName is required");
            this.certificateArn = builder.certificateArn;
            this.databaseName = builder.databaseName;
            this.elasticsearchSettings = builder.elasticsearchSettings;
            this.extraConnectionAttributes = builder.extraConnectionAttributes;
            this.id = builder.id;
            this.kafkaSettings = builder.kafkaSettings;
            this.kinesisSettings = builder.kinesisSettings;
            this.kmsKeyArn = builder.kmsKeyArn;
            this.mongodbSettings = builder.mongodbSettings;
            this.password = builder.password;
            this.pauseReplicationTasks = builder.pauseReplicationTasks;
            this.port = builder.port;
            this.postgresSettings = builder.postgresSettings;
            this.redisSettings = builder.redisSettings;
            this.redshiftSettings = builder.redshiftSettings;
            this.s3Settings = builder.s3Settings;
            this.secretsManagerAccessRoleArn = builder.secretsManagerAccessRoleArn;
            this.secretsManagerArn = builder.secretsManagerArn;
            this.serverName = builder.serverName;
            this.serviceAccessRole = builder.serviceAccessRole;
            this.sslMode = builder.sslMode;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.username = builder.username;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getEndpointId() {
            return this.endpointId;
        }

        @Override
        public final java.lang.String getEndpointType() {
            return this.endpointType;
        }

        @Override
        public final java.lang.String getEngineName() {
            return this.engineName;
        }

        @Override
        public final java.lang.String getCertificateArn() {
            return this.certificateArn;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final imports.aws.dms_endpoint.DmsEndpointElasticsearchSettings getElasticsearchSettings() {
            return this.elasticsearchSettings;
        }

        @Override
        public final java.lang.String getExtraConnectionAttributes() {
            return this.extraConnectionAttributes;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.dms_endpoint.DmsEndpointKafkaSettings getKafkaSettings() {
            return this.kafkaSettings;
        }

        @Override
        public final imports.aws.dms_endpoint.DmsEndpointKinesisSettings getKinesisSettings() {
            return this.kinesisSettings;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final imports.aws.dms_endpoint.DmsEndpointMongodbSettings getMongodbSettings() {
            return this.mongodbSettings;
        }

        @Override
        public final java.lang.String getPassword() {
            return this.password;
        }

        @Override
        public final java.lang.Object getPauseReplicationTasks() {
            return this.pauseReplicationTasks;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final imports.aws.dms_endpoint.DmsEndpointPostgresSettings getPostgresSettings() {
            return this.postgresSettings;
        }

        @Override
        public final imports.aws.dms_endpoint.DmsEndpointRedisSettings getRedisSettings() {
            return this.redisSettings;
        }

        @Override
        public final imports.aws.dms_endpoint.DmsEndpointRedshiftSettings getRedshiftSettings() {
            return this.redshiftSettings;
        }

        @Override
        public final imports.aws.dms_endpoint.DmsEndpointS3Settings getS3Settings() {
            return this.s3Settings;
        }

        @Override
        public final java.lang.String getSecretsManagerAccessRoleArn() {
            return this.secretsManagerAccessRoleArn;
        }

        @Override
        public final java.lang.String getSecretsManagerArn() {
            return this.secretsManagerArn;
        }

        @Override
        public final java.lang.String getServerName() {
            return this.serverName;
        }

        @Override
        public final java.lang.String getServiceAccessRole() {
            return this.serviceAccessRole;
        }

        @Override
        public final java.lang.String getSslMode() {
            return this.sslMode;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final imports.aws.dms_endpoint.DmsEndpointTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getUsername() {
            return this.username;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("endpointId", om.valueToTree(this.getEndpointId()));
            data.set("endpointType", om.valueToTree(this.getEndpointType()));
            data.set("engineName", om.valueToTree(this.getEngineName()));
            if (this.getCertificateArn() != null) {
                data.set("certificateArn", om.valueToTree(this.getCertificateArn()));
            }
            if (this.getDatabaseName() != null) {
                data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            }
            if (this.getElasticsearchSettings() != null) {
                data.set("elasticsearchSettings", om.valueToTree(this.getElasticsearchSettings()));
            }
            if (this.getExtraConnectionAttributes() != null) {
                data.set("extraConnectionAttributes", om.valueToTree(this.getExtraConnectionAttributes()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKafkaSettings() != null) {
                data.set("kafkaSettings", om.valueToTree(this.getKafkaSettings()));
            }
            if (this.getKinesisSettings() != null) {
                data.set("kinesisSettings", om.valueToTree(this.getKinesisSettings()));
            }
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }
            if (this.getMongodbSettings() != null) {
                data.set("mongodbSettings", om.valueToTree(this.getMongodbSettings()));
            }
            if (this.getPassword() != null) {
                data.set("password", om.valueToTree(this.getPassword()));
            }
            if (this.getPauseReplicationTasks() != null) {
                data.set("pauseReplicationTasks", om.valueToTree(this.getPauseReplicationTasks()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getPostgresSettings() != null) {
                data.set("postgresSettings", om.valueToTree(this.getPostgresSettings()));
            }
            if (this.getRedisSettings() != null) {
                data.set("redisSettings", om.valueToTree(this.getRedisSettings()));
            }
            if (this.getRedshiftSettings() != null) {
                data.set("redshiftSettings", om.valueToTree(this.getRedshiftSettings()));
            }
            if (this.getS3Settings() != null) {
                data.set("s3Settings", om.valueToTree(this.getS3Settings()));
            }
            if (this.getSecretsManagerAccessRoleArn() != null) {
                data.set("secretsManagerAccessRoleArn", om.valueToTree(this.getSecretsManagerAccessRoleArn()));
            }
            if (this.getSecretsManagerArn() != null) {
                data.set("secretsManagerArn", om.valueToTree(this.getSecretsManagerArn()));
            }
            if (this.getServerName() != null) {
                data.set("serverName", om.valueToTree(this.getServerName()));
            }
            if (this.getServiceAccessRole() != null) {
                data.set("serviceAccessRole", om.valueToTree(this.getServiceAccessRole()));
            }
            if (this.getSslMode() != null) {
                data.set("sslMode", om.valueToTree(this.getSslMode()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getUsername() != null) {
                data.set("username", om.valueToTree(this.getUsername()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dmsEndpoint.DmsEndpointConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DmsEndpointConfig.Jsii$Proxy that = (DmsEndpointConfig.Jsii$Proxy) o;

            if (!endpointId.equals(that.endpointId)) return false;
            if (!endpointType.equals(that.endpointType)) return false;
            if (!engineName.equals(that.engineName)) return false;
            if (this.certificateArn != null ? !this.certificateArn.equals(that.certificateArn) : that.certificateArn != null) return false;
            if (this.databaseName != null ? !this.databaseName.equals(that.databaseName) : that.databaseName != null) return false;
            if (this.elasticsearchSettings != null ? !this.elasticsearchSettings.equals(that.elasticsearchSettings) : that.elasticsearchSettings != null) return false;
            if (this.extraConnectionAttributes != null ? !this.extraConnectionAttributes.equals(that.extraConnectionAttributes) : that.extraConnectionAttributes != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kafkaSettings != null ? !this.kafkaSettings.equals(that.kafkaSettings) : that.kafkaSettings != null) return false;
            if (this.kinesisSettings != null ? !this.kinesisSettings.equals(that.kinesisSettings) : that.kinesisSettings != null) return false;
            if (this.kmsKeyArn != null ? !this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn != null) return false;
            if (this.mongodbSettings != null ? !this.mongodbSettings.equals(that.mongodbSettings) : that.mongodbSettings != null) return false;
            if (this.password != null ? !this.password.equals(that.password) : that.password != null) return false;
            if (this.pauseReplicationTasks != null ? !this.pauseReplicationTasks.equals(that.pauseReplicationTasks) : that.pauseReplicationTasks != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.postgresSettings != null ? !this.postgresSettings.equals(that.postgresSettings) : that.postgresSettings != null) return false;
            if (this.redisSettings != null ? !this.redisSettings.equals(that.redisSettings) : that.redisSettings != null) return false;
            if (this.redshiftSettings != null ? !this.redshiftSettings.equals(that.redshiftSettings) : that.redshiftSettings != null) return false;
            if (this.s3Settings != null ? !this.s3Settings.equals(that.s3Settings) : that.s3Settings != null) return false;
            if (this.secretsManagerAccessRoleArn != null ? !this.secretsManagerAccessRoleArn.equals(that.secretsManagerAccessRoleArn) : that.secretsManagerAccessRoleArn != null) return false;
            if (this.secretsManagerArn != null ? !this.secretsManagerArn.equals(that.secretsManagerArn) : that.secretsManagerArn != null) return false;
            if (this.serverName != null ? !this.serverName.equals(that.serverName) : that.serverName != null) return false;
            if (this.serviceAccessRole != null ? !this.serviceAccessRole.equals(that.serviceAccessRole) : that.serviceAccessRole != null) return false;
            if (this.sslMode != null ? !this.sslMode.equals(that.sslMode) : that.sslMode != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.username != null ? !this.username.equals(that.username) : that.username != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.endpointId.hashCode();
            result = 31 * result + (this.endpointType.hashCode());
            result = 31 * result + (this.engineName.hashCode());
            result = 31 * result + (this.certificateArn != null ? this.certificateArn.hashCode() : 0);
            result = 31 * result + (this.databaseName != null ? this.databaseName.hashCode() : 0);
            result = 31 * result + (this.elasticsearchSettings != null ? this.elasticsearchSettings.hashCode() : 0);
            result = 31 * result + (this.extraConnectionAttributes != null ? this.extraConnectionAttributes.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kafkaSettings != null ? this.kafkaSettings.hashCode() : 0);
            result = 31 * result + (this.kinesisSettings != null ? this.kinesisSettings.hashCode() : 0);
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            result = 31 * result + (this.mongodbSettings != null ? this.mongodbSettings.hashCode() : 0);
            result = 31 * result + (this.password != null ? this.password.hashCode() : 0);
            result = 31 * result + (this.pauseReplicationTasks != null ? this.pauseReplicationTasks.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.postgresSettings != null ? this.postgresSettings.hashCode() : 0);
            result = 31 * result + (this.redisSettings != null ? this.redisSettings.hashCode() : 0);
            result = 31 * result + (this.redshiftSettings != null ? this.redshiftSettings.hashCode() : 0);
            result = 31 * result + (this.s3Settings != null ? this.s3Settings.hashCode() : 0);
            result = 31 * result + (this.secretsManagerAccessRoleArn != null ? this.secretsManagerAccessRoleArn.hashCode() : 0);
            result = 31 * result + (this.secretsManagerArn != null ? this.secretsManagerArn.hashCode() : 0);
            result = 31 * result + (this.serverName != null ? this.serverName.hashCode() : 0);
            result = 31 * result + (this.serviceAccessRole != null ? this.serviceAccessRole.hashCode() : 0);
            result = 31 * result + (this.sslMode != null ? this.sslMode.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.username != null ? this.username.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
