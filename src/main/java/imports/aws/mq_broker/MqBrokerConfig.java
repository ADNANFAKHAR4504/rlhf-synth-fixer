package imports.aws.mq_broker;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.902Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mqBroker.MqBrokerConfig")
@software.amazon.jsii.Jsii.Proxy(MqBrokerConfig.Jsii$Proxy.class)
public interface MqBrokerConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#broker_name MqBroker#broker_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBrokerName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#engine_type MqBroker#engine_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEngineType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#engine_version MqBroker#engine_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEngineVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#host_instance_type MqBroker#host_instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHostInstanceType();

    /**
     * user block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user MqBroker#user}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getUser();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#apply_immediately MqBroker#apply_immediately}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediately() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#authentication_strategy MqBroker#authentication_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthenticationStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#auto_minor_version_upgrade MqBroker#auto_minor_version_upgrade}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoMinorVersionUpgrade() {
        return null;
    }

    /**
     * configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#configuration MqBroker#configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerConfiguration getConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#data_replication_mode MqBroker#data_replication_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataReplicationMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#data_replication_primary_broker_arn MqBroker#data_replication_primary_broker_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataReplicationPrimaryBrokerArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#deployment_mode MqBroker#deployment_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeploymentMode() {
        return null;
    }

    /**
     * encryption_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#encryption_options MqBroker#encryption_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerEncryptionOptions getEncryptionOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#id MqBroker#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * ldap_server_metadata block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#ldap_server_metadata MqBroker#ldap_server_metadata}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerLdapServerMetadata getLdapServerMetadata() {
        return null;
    }

    /**
     * logs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#logs MqBroker#logs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerLogs getLogs() {
        return null;
    }

    /**
     * maintenance_window_start_time block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#maintenance_window_start_time MqBroker#maintenance_window_start_time}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerMaintenanceWindowStartTime getMaintenanceWindowStartTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#publicly_accessible MqBroker#publicly_accessible}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAccessible() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#security_groups MqBroker#security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#storage_type MqBroker#storage_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#subnet_ids MqBroker#subnet_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#tags MqBroker#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#tags_all MqBroker#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#timeouts MqBroker#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MqBrokerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MqBrokerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MqBrokerConfig> {
        java.lang.String brokerName;
        java.lang.String engineType;
        java.lang.String engineVersion;
        java.lang.String hostInstanceType;
        java.lang.Object user;
        java.lang.Object applyImmediately;
        java.lang.String authenticationStrategy;
        java.lang.Object autoMinorVersionUpgrade;
        imports.aws.mq_broker.MqBrokerConfiguration configuration;
        java.lang.String dataReplicationMode;
        java.lang.String dataReplicationPrimaryBrokerArn;
        java.lang.String deploymentMode;
        imports.aws.mq_broker.MqBrokerEncryptionOptions encryptionOptions;
        java.lang.String id;
        imports.aws.mq_broker.MqBrokerLdapServerMetadata ldapServerMetadata;
        imports.aws.mq_broker.MqBrokerLogs logs;
        imports.aws.mq_broker.MqBrokerMaintenanceWindowStartTime maintenanceWindowStartTime;
        java.lang.Object publiclyAccessible;
        java.util.List<java.lang.String> securityGroups;
        java.lang.String storageType;
        java.util.List<java.lang.String> subnetIds;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.mq_broker.MqBrokerTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link MqBrokerConfig#getBrokerName}
         * @param brokerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#broker_name MqBroker#broker_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder brokerName(java.lang.String brokerName) {
            this.brokerName = brokerName;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getEngineType}
         * @param engineType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#engine_type MqBroker#engine_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder engineType(java.lang.String engineType) {
            this.engineType = engineType;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getEngineVersion}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#engine_version MqBroker#engine_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder engineVersion(java.lang.String engineVersion) {
            this.engineVersion = engineVersion;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getHostInstanceType}
         * @param hostInstanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#host_instance_type MqBroker#host_instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder hostInstanceType(java.lang.String hostInstanceType) {
            this.hostInstanceType = hostInstanceType;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getUser}
         * @param user user block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user MqBroker#user}
         * @return {@code this}
         */
        public Builder user(com.hashicorp.cdktf.IResolvable user) {
            this.user = user;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getUser}
         * @param user user block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user MqBroker#user}
         * @return {@code this}
         */
        public Builder user(java.util.List<? extends imports.aws.mq_broker.MqBrokerUser> user) {
            this.user = user;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#apply_immediately MqBroker#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(java.lang.Boolean applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#apply_immediately MqBroker#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getAuthenticationStrategy}
         * @param authenticationStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#authentication_strategy MqBroker#authentication_strategy}.
         * @return {@code this}
         */
        public Builder authenticationStrategy(java.lang.String authenticationStrategy) {
            this.authenticationStrategy = authenticationStrategy;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getAutoMinorVersionUpgrade}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#auto_minor_version_upgrade MqBroker#auto_minor_version_upgrade}.
         * @return {@code this}
         */
        public Builder autoMinorVersionUpgrade(java.lang.Boolean autoMinorVersionUpgrade) {
            this.autoMinorVersionUpgrade = autoMinorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getAutoMinorVersionUpgrade}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#auto_minor_version_upgrade MqBroker#auto_minor_version_upgrade}.
         * @return {@code this}
         */
        public Builder autoMinorVersionUpgrade(com.hashicorp.cdktf.IResolvable autoMinorVersionUpgrade) {
            this.autoMinorVersionUpgrade = autoMinorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getConfiguration}
         * @param configuration configuration block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#configuration MqBroker#configuration}
         * @return {@code this}
         */
        public Builder configuration(imports.aws.mq_broker.MqBrokerConfiguration configuration) {
            this.configuration = configuration;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getDataReplicationMode}
         * @param dataReplicationMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#data_replication_mode MqBroker#data_replication_mode}.
         * @return {@code this}
         */
        public Builder dataReplicationMode(java.lang.String dataReplicationMode) {
            this.dataReplicationMode = dataReplicationMode;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getDataReplicationPrimaryBrokerArn}
         * @param dataReplicationPrimaryBrokerArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#data_replication_primary_broker_arn MqBroker#data_replication_primary_broker_arn}.
         * @return {@code this}
         */
        public Builder dataReplicationPrimaryBrokerArn(java.lang.String dataReplicationPrimaryBrokerArn) {
            this.dataReplicationPrimaryBrokerArn = dataReplicationPrimaryBrokerArn;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getDeploymentMode}
         * @param deploymentMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#deployment_mode MqBroker#deployment_mode}.
         * @return {@code this}
         */
        public Builder deploymentMode(java.lang.String deploymentMode) {
            this.deploymentMode = deploymentMode;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getEncryptionOptions}
         * @param encryptionOptions encryption_options block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#encryption_options MqBroker#encryption_options}
         * @return {@code this}
         */
        public Builder encryptionOptions(imports.aws.mq_broker.MqBrokerEncryptionOptions encryptionOptions) {
            this.encryptionOptions = encryptionOptions;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#id MqBroker#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getLdapServerMetadata}
         * @param ldapServerMetadata ldap_server_metadata block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#ldap_server_metadata MqBroker#ldap_server_metadata}
         * @return {@code this}
         */
        public Builder ldapServerMetadata(imports.aws.mq_broker.MqBrokerLdapServerMetadata ldapServerMetadata) {
            this.ldapServerMetadata = ldapServerMetadata;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getLogs}
         * @param logs logs block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#logs MqBroker#logs}
         * @return {@code this}
         */
        public Builder logs(imports.aws.mq_broker.MqBrokerLogs logs) {
            this.logs = logs;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getMaintenanceWindowStartTime}
         * @param maintenanceWindowStartTime maintenance_window_start_time block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#maintenance_window_start_time MqBroker#maintenance_window_start_time}
         * @return {@code this}
         */
        public Builder maintenanceWindowStartTime(imports.aws.mq_broker.MqBrokerMaintenanceWindowStartTime maintenanceWindowStartTime) {
            this.maintenanceWindowStartTime = maintenanceWindowStartTime;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#publicly_accessible MqBroker#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(java.lang.Boolean publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#publicly_accessible MqBroker#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(com.hashicorp.cdktf.IResolvable publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getSecurityGroups}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#security_groups MqBroker#security_groups}.
         * @return {@code this}
         */
        public Builder securityGroups(java.util.List<java.lang.String> securityGroups) {
            this.securityGroups = securityGroups;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getStorageType}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#storage_type MqBroker#storage_type}.
         * @return {@code this}
         */
        public Builder storageType(java.lang.String storageType) {
            this.storageType = storageType;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#subnet_ids MqBroker#subnet_ids}.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#tags MqBroker#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#tags_all MqBroker#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#timeouts MqBroker#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.mq_broker.MqBrokerTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getDependsOn}
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
         * Sets the value of {@link MqBrokerConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerConfig#getProvisioners}
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
         * @return a new instance of {@link MqBrokerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MqBrokerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MqBrokerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MqBrokerConfig {
        private final java.lang.String brokerName;
        private final java.lang.String engineType;
        private final java.lang.String engineVersion;
        private final java.lang.String hostInstanceType;
        private final java.lang.Object user;
        private final java.lang.Object applyImmediately;
        private final java.lang.String authenticationStrategy;
        private final java.lang.Object autoMinorVersionUpgrade;
        private final imports.aws.mq_broker.MqBrokerConfiguration configuration;
        private final java.lang.String dataReplicationMode;
        private final java.lang.String dataReplicationPrimaryBrokerArn;
        private final java.lang.String deploymentMode;
        private final imports.aws.mq_broker.MqBrokerEncryptionOptions encryptionOptions;
        private final java.lang.String id;
        private final imports.aws.mq_broker.MqBrokerLdapServerMetadata ldapServerMetadata;
        private final imports.aws.mq_broker.MqBrokerLogs logs;
        private final imports.aws.mq_broker.MqBrokerMaintenanceWindowStartTime maintenanceWindowStartTime;
        private final java.lang.Object publiclyAccessible;
        private final java.util.List<java.lang.String> securityGroups;
        private final java.lang.String storageType;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.mq_broker.MqBrokerTimeouts timeouts;
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
            this.brokerName = software.amazon.jsii.Kernel.get(this, "brokerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineType = software.amazon.jsii.Kernel.get(this, "engineType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineVersion = software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostInstanceType = software.amazon.jsii.Kernel.get(this, "hostInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.user = software.amazon.jsii.Kernel.get(this, "user", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.applyImmediately = software.amazon.jsii.Kernel.get(this, "applyImmediately", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.authenticationStrategy = software.amazon.jsii.Kernel.get(this, "authenticationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.autoMinorVersionUpgrade = software.amazon.jsii.Kernel.get(this, "autoMinorVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.configuration = software.amazon.jsii.Kernel.get(this, "configuration", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerConfiguration.class));
            this.dataReplicationMode = software.amazon.jsii.Kernel.get(this, "dataReplicationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataReplicationPrimaryBrokerArn = software.amazon.jsii.Kernel.get(this, "dataReplicationPrimaryBrokerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deploymentMode = software.amazon.jsii.Kernel.get(this, "deploymentMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionOptions = software.amazon.jsii.Kernel.get(this, "encryptionOptions", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerEncryptionOptions.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ldapServerMetadata = software.amazon.jsii.Kernel.get(this, "ldapServerMetadata", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerLdapServerMetadata.class));
            this.logs = software.amazon.jsii.Kernel.get(this, "logs", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerLogs.class));
            this.maintenanceWindowStartTime = software.amazon.jsii.Kernel.get(this, "maintenanceWindowStartTime", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerMaintenanceWindowStartTime.class));
            this.publiclyAccessible = software.amazon.jsii.Kernel.get(this, "publiclyAccessible", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.securityGroups = software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.storageType = software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerTimeouts.class));
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
            this.brokerName = java.util.Objects.requireNonNull(builder.brokerName, "brokerName is required");
            this.engineType = java.util.Objects.requireNonNull(builder.engineType, "engineType is required");
            this.engineVersion = java.util.Objects.requireNonNull(builder.engineVersion, "engineVersion is required");
            this.hostInstanceType = java.util.Objects.requireNonNull(builder.hostInstanceType, "hostInstanceType is required");
            this.user = java.util.Objects.requireNonNull(builder.user, "user is required");
            this.applyImmediately = builder.applyImmediately;
            this.authenticationStrategy = builder.authenticationStrategy;
            this.autoMinorVersionUpgrade = builder.autoMinorVersionUpgrade;
            this.configuration = builder.configuration;
            this.dataReplicationMode = builder.dataReplicationMode;
            this.dataReplicationPrimaryBrokerArn = builder.dataReplicationPrimaryBrokerArn;
            this.deploymentMode = builder.deploymentMode;
            this.encryptionOptions = builder.encryptionOptions;
            this.id = builder.id;
            this.ldapServerMetadata = builder.ldapServerMetadata;
            this.logs = builder.logs;
            this.maintenanceWindowStartTime = builder.maintenanceWindowStartTime;
            this.publiclyAccessible = builder.publiclyAccessible;
            this.securityGroups = builder.securityGroups;
            this.storageType = builder.storageType;
            this.subnetIds = builder.subnetIds;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getBrokerName() {
            return this.brokerName;
        }

        @Override
        public final java.lang.String getEngineType() {
            return this.engineType;
        }

        @Override
        public final java.lang.String getEngineVersion() {
            return this.engineVersion;
        }

        @Override
        public final java.lang.String getHostInstanceType() {
            return this.hostInstanceType;
        }

        @Override
        public final java.lang.Object getUser() {
            return this.user;
        }

        @Override
        public final java.lang.Object getApplyImmediately() {
            return this.applyImmediately;
        }

        @Override
        public final java.lang.String getAuthenticationStrategy() {
            return this.authenticationStrategy;
        }

        @Override
        public final java.lang.Object getAutoMinorVersionUpgrade() {
            return this.autoMinorVersionUpgrade;
        }

        @Override
        public final imports.aws.mq_broker.MqBrokerConfiguration getConfiguration() {
            return this.configuration;
        }

        @Override
        public final java.lang.String getDataReplicationMode() {
            return this.dataReplicationMode;
        }

        @Override
        public final java.lang.String getDataReplicationPrimaryBrokerArn() {
            return this.dataReplicationPrimaryBrokerArn;
        }

        @Override
        public final java.lang.String getDeploymentMode() {
            return this.deploymentMode;
        }

        @Override
        public final imports.aws.mq_broker.MqBrokerEncryptionOptions getEncryptionOptions() {
            return this.encryptionOptions;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.mq_broker.MqBrokerLdapServerMetadata getLdapServerMetadata() {
            return this.ldapServerMetadata;
        }

        @Override
        public final imports.aws.mq_broker.MqBrokerLogs getLogs() {
            return this.logs;
        }

        @Override
        public final imports.aws.mq_broker.MqBrokerMaintenanceWindowStartTime getMaintenanceWindowStartTime() {
            return this.maintenanceWindowStartTime;
        }

        @Override
        public final java.lang.Object getPubliclyAccessible() {
            return this.publiclyAccessible;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroups() {
            return this.securityGroups;
        }

        @Override
        public final java.lang.String getStorageType() {
            return this.storageType;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
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
        public final imports.aws.mq_broker.MqBrokerTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("brokerName", om.valueToTree(this.getBrokerName()));
            data.set("engineType", om.valueToTree(this.getEngineType()));
            data.set("engineVersion", om.valueToTree(this.getEngineVersion()));
            data.set("hostInstanceType", om.valueToTree(this.getHostInstanceType()));
            data.set("user", om.valueToTree(this.getUser()));
            if (this.getApplyImmediately() != null) {
                data.set("applyImmediately", om.valueToTree(this.getApplyImmediately()));
            }
            if (this.getAuthenticationStrategy() != null) {
                data.set("authenticationStrategy", om.valueToTree(this.getAuthenticationStrategy()));
            }
            if (this.getAutoMinorVersionUpgrade() != null) {
                data.set("autoMinorVersionUpgrade", om.valueToTree(this.getAutoMinorVersionUpgrade()));
            }
            if (this.getConfiguration() != null) {
                data.set("configuration", om.valueToTree(this.getConfiguration()));
            }
            if (this.getDataReplicationMode() != null) {
                data.set("dataReplicationMode", om.valueToTree(this.getDataReplicationMode()));
            }
            if (this.getDataReplicationPrimaryBrokerArn() != null) {
                data.set("dataReplicationPrimaryBrokerArn", om.valueToTree(this.getDataReplicationPrimaryBrokerArn()));
            }
            if (this.getDeploymentMode() != null) {
                data.set("deploymentMode", om.valueToTree(this.getDeploymentMode()));
            }
            if (this.getEncryptionOptions() != null) {
                data.set("encryptionOptions", om.valueToTree(this.getEncryptionOptions()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLdapServerMetadata() != null) {
                data.set("ldapServerMetadata", om.valueToTree(this.getLdapServerMetadata()));
            }
            if (this.getLogs() != null) {
                data.set("logs", om.valueToTree(this.getLogs()));
            }
            if (this.getMaintenanceWindowStartTime() != null) {
                data.set("maintenanceWindowStartTime", om.valueToTree(this.getMaintenanceWindowStartTime()));
            }
            if (this.getPubliclyAccessible() != null) {
                data.set("publiclyAccessible", om.valueToTree(this.getPubliclyAccessible()));
            }
            if (this.getSecurityGroups() != null) {
                data.set("securityGroups", om.valueToTree(this.getSecurityGroups()));
            }
            if (this.getStorageType() != null) {
                data.set("storageType", om.valueToTree(this.getStorageType()));
            }
            if (this.getSubnetIds() != null) {
                data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
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
            struct.set("fqn", om.valueToTree("aws.mqBroker.MqBrokerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MqBrokerConfig.Jsii$Proxy that = (MqBrokerConfig.Jsii$Proxy) o;

            if (!brokerName.equals(that.brokerName)) return false;
            if (!engineType.equals(that.engineType)) return false;
            if (!engineVersion.equals(that.engineVersion)) return false;
            if (!hostInstanceType.equals(that.hostInstanceType)) return false;
            if (!user.equals(that.user)) return false;
            if (this.applyImmediately != null ? !this.applyImmediately.equals(that.applyImmediately) : that.applyImmediately != null) return false;
            if (this.authenticationStrategy != null ? !this.authenticationStrategy.equals(that.authenticationStrategy) : that.authenticationStrategy != null) return false;
            if (this.autoMinorVersionUpgrade != null ? !this.autoMinorVersionUpgrade.equals(that.autoMinorVersionUpgrade) : that.autoMinorVersionUpgrade != null) return false;
            if (this.configuration != null ? !this.configuration.equals(that.configuration) : that.configuration != null) return false;
            if (this.dataReplicationMode != null ? !this.dataReplicationMode.equals(that.dataReplicationMode) : that.dataReplicationMode != null) return false;
            if (this.dataReplicationPrimaryBrokerArn != null ? !this.dataReplicationPrimaryBrokerArn.equals(that.dataReplicationPrimaryBrokerArn) : that.dataReplicationPrimaryBrokerArn != null) return false;
            if (this.deploymentMode != null ? !this.deploymentMode.equals(that.deploymentMode) : that.deploymentMode != null) return false;
            if (this.encryptionOptions != null ? !this.encryptionOptions.equals(that.encryptionOptions) : that.encryptionOptions != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ldapServerMetadata != null ? !this.ldapServerMetadata.equals(that.ldapServerMetadata) : that.ldapServerMetadata != null) return false;
            if (this.logs != null ? !this.logs.equals(that.logs) : that.logs != null) return false;
            if (this.maintenanceWindowStartTime != null ? !this.maintenanceWindowStartTime.equals(that.maintenanceWindowStartTime) : that.maintenanceWindowStartTime != null) return false;
            if (this.publiclyAccessible != null ? !this.publiclyAccessible.equals(that.publiclyAccessible) : that.publiclyAccessible != null) return false;
            if (this.securityGroups != null ? !this.securityGroups.equals(that.securityGroups) : that.securityGroups != null) return false;
            if (this.storageType != null ? !this.storageType.equals(that.storageType) : that.storageType != null) return false;
            if (this.subnetIds != null ? !this.subnetIds.equals(that.subnetIds) : that.subnetIds != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.brokerName.hashCode();
            result = 31 * result + (this.engineType.hashCode());
            result = 31 * result + (this.engineVersion.hashCode());
            result = 31 * result + (this.hostInstanceType.hashCode());
            result = 31 * result + (this.user.hashCode());
            result = 31 * result + (this.applyImmediately != null ? this.applyImmediately.hashCode() : 0);
            result = 31 * result + (this.authenticationStrategy != null ? this.authenticationStrategy.hashCode() : 0);
            result = 31 * result + (this.autoMinorVersionUpgrade != null ? this.autoMinorVersionUpgrade.hashCode() : 0);
            result = 31 * result + (this.configuration != null ? this.configuration.hashCode() : 0);
            result = 31 * result + (this.dataReplicationMode != null ? this.dataReplicationMode.hashCode() : 0);
            result = 31 * result + (this.dataReplicationPrimaryBrokerArn != null ? this.dataReplicationPrimaryBrokerArn.hashCode() : 0);
            result = 31 * result + (this.deploymentMode != null ? this.deploymentMode.hashCode() : 0);
            result = 31 * result + (this.encryptionOptions != null ? this.encryptionOptions.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ldapServerMetadata != null ? this.ldapServerMetadata.hashCode() : 0);
            result = 31 * result + (this.logs != null ? this.logs.hashCode() : 0);
            result = 31 * result + (this.maintenanceWindowStartTime != null ? this.maintenanceWindowStartTime.hashCode() : 0);
            result = 31 * result + (this.publiclyAccessible != null ? this.publiclyAccessible.hashCode() : 0);
            result = 31 * result + (this.securityGroups != null ? this.securityGroups.hashCode() : 0);
            result = 31 * result + (this.storageType != null ? this.storageType.hashCode() : 0);
            result = 31 * result + (this.subnetIds != null ? this.subnetIds.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
