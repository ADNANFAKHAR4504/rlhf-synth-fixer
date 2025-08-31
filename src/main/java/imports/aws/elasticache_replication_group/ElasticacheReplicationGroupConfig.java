package imports.aws.elasticache_replication_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.170Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticacheReplicationGroup.ElasticacheReplicationGroupConfig")
@software.amazon.jsii.Jsii.Proxy(ElasticacheReplicationGroupConfig.Jsii$Proxy.class)
public interface ElasticacheReplicationGroupConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#description ElasticacheReplicationGroup#description}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDescription();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#replication_group_id ElasticacheReplicationGroup#replication_group_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReplicationGroupId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#apply_immediately ElasticacheReplicationGroup#apply_immediately}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediately() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#at_rest_encryption_enabled ElasticacheReplicationGroup#at_rest_encryption_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAtRestEncryptionEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#auth_token ElasticacheReplicationGroup#auth_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthToken() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#auth_token_update_strategy ElasticacheReplicationGroup#auth_token_update_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthTokenUpdateStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#automatic_failover_enabled ElasticacheReplicationGroup#automatic_failover_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutomaticFailoverEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#auto_minor_version_upgrade ElasticacheReplicationGroup#auto_minor_version_upgrade}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAutoMinorVersionUpgrade() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#cluster_mode ElasticacheReplicationGroup#cluster_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#data_tiering_enabled ElasticacheReplicationGroup#data_tiering_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDataTieringEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#engine ElasticacheReplicationGroup#engine}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngine() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#engine_version ElasticacheReplicationGroup#engine_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngineVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#final_snapshot_identifier ElasticacheReplicationGroup#final_snapshot_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFinalSnapshotIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#global_replication_group_id ElasticacheReplicationGroup#global_replication_group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGlobalReplicationGroupId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#id ElasticacheReplicationGroup#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#ip_discovery ElasticacheReplicationGroup#ip_discovery}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpDiscovery() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#kms_key_id ElasticacheReplicationGroup#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * log_delivery_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#log_delivery_configuration ElasticacheReplicationGroup#log_delivery_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLogDeliveryConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#maintenance_window ElasticacheReplicationGroup#maintenance_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaintenanceWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#multi_az_enabled ElasticacheReplicationGroup#multi_az_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMultiAzEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#network_type ElasticacheReplicationGroup#network_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetworkType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#node_type ElasticacheReplicationGroup#node_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNodeType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#notification_topic_arn ElasticacheReplicationGroup#notification_topic_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNotificationTopicArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#num_cache_clusters ElasticacheReplicationGroup#num_cache_clusters}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumCacheClusters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#num_node_groups ElasticacheReplicationGroup#num_node_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumNodeGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#parameter_group_name ElasticacheReplicationGroup#parameter_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParameterGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#port ElasticacheReplicationGroup#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#preferred_cache_cluster_azs ElasticacheReplicationGroup#preferred_cache_cluster_azs}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredCacheClusterAzs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#replicas_per_node_group ElasticacheReplicationGroup#replicas_per_node_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getReplicasPerNodeGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#security_group_ids ElasticacheReplicationGroup#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#security_group_names ElasticacheReplicationGroup#security_group_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupNames() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_arns ElasticacheReplicationGroup#snapshot_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSnapshotArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_name ElasticacheReplicationGroup#snapshot_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_retention_limit ElasticacheReplicationGroup#snapshot_retention_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSnapshotRetentionLimit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_window ElasticacheReplicationGroup#snapshot_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#subnet_group_name ElasticacheReplicationGroup#subnet_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#tags ElasticacheReplicationGroup#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#tags_all ElasticacheReplicationGroup#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#timeouts ElasticacheReplicationGroup#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticache_replication_group.ElasticacheReplicationGroupTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#transit_encryption_enabled ElasticacheReplicationGroup#transit_encryption_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTransitEncryptionEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#transit_encryption_mode ElasticacheReplicationGroup#transit_encryption_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransitEncryptionMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#user_group_ids ElasticacheReplicationGroup#user_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getUserGroupIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticacheReplicationGroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticacheReplicationGroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticacheReplicationGroupConfig> {
        java.lang.String description;
        java.lang.String replicationGroupId;
        java.lang.Object applyImmediately;
        java.lang.String atRestEncryptionEnabled;
        java.lang.String authToken;
        java.lang.String authTokenUpdateStrategy;
        java.lang.Object automaticFailoverEnabled;
        java.lang.String autoMinorVersionUpgrade;
        java.lang.String clusterMode;
        java.lang.Object dataTieringEnabled;
        java.lang.String engine;
        java.lang.String engineVersion;
        java.lang.String finalSnapshotIdentifier;
        java.lang.String globalReplicationGroupId;
        java.lang.String id;
        java.lang.String ipDiscovery;
        java.lang.String kmsKeyId;
        java.lang.Object logDeliveryConfiguration;
        java.lang.String maintenanceWindow;
        java.lang.Object multiAzEnabled;
        java.lang.String networkType;
        java.lang.String nodeType;
        java.lang.String notificationTopicArn;
        java.lang.Number numCacheClusters;
        java.lang.Number numNodeGroups;
        java.lang.String parameterGroupName;
        java.lang.Number port;
        java.util.List<java.lang.String> preferredCacheClusterAzs;
        java.lang.Number replicasPerNodeGroup;
        java.util.List<java.lang.String> securityGroupIds;
        java.util.List<java.lang.String> securityGroupNames;
        java.util.List<java.lang.String> snapshotArns;
        java.lang.String snapshotName;
        java.lang.Number snapshotRetentionLimit;
        java.lang.String snapshotWindow;
        java.lang.String subnetGroupName;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.elasticache_replication_group.ElasticacheReplicationGroupTimeouts timeouts;
        java.lang.Object transitEncryptionEnabled;
        java.lang.String transitEncryptionMode;
        java.util.List<java.lang.String> userGroupIds;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#description ElasticacheReplicationGroup#description}. This parameter is required.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getReplicationGroupId}
         * @param replicationGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#replication_group_id ElasticacheReplicationGroup#replication_group_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder replicationGroupId(java.lang.String replicationGroupId) {
            this.replicationGroupId = replicationGroupId;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#apply_immediately ElasticacheReplicationGroup#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(java.lang.Boolean applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#apply_immediately ElasticacheReplicationGroup#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getAtRestEncryptionEnabled}
         * @param atRestEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#at_rest_encryption_enabled ElasticacheReplicationGroup#at_rest_encryption_enabled}.
         * @return {@code this}
         */
        public Builder atRestEncryptionEnabled(java.lang.String atRestEncryptionEnabled) {
            this.atRestEncryptionEnabled = atRestEncryptionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getAuthToken}
         * @param authToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#auth_token ElasticacheReplicationGroup#auth_token}.
         * @return {@code this}
         */
        public Builder authToken(java.lang.String authToken) {
            this.authToken = authToken;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getAuthTokenUpdateStrategy}
         * @param authTokenUpdateStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#auth_token_update_strategy ElasticacheReplicationGroup#auth_token_update_strategy}.
         * @return {@code this}
         */
        public Builder authTokenUpdateStrategy(java.lang.String authTokenUpdateStrategy) {
            this.authTokenUpdateStrategy = authTokenUpdateStrategy;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getAutomaticFailoverEnabled}
         * @param automaticFailoverEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#automatic_failover_enabled ElasticacheReplicationGroup#automatic_failover_enabled}.
         * @return {@code this}
         */
        public Builder automaticFailoverEnabled(java.lang.Boolean automaticFailoverEnabled) {
            this.automaticFailoverEnabled = automaticFailoverEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getAutomaticFailoverEnabled}
         * @param automaticFailoverEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#automatic_failover_enabled ElasticacheReplicationGroup#automatic_failover_enabled}.
         * @return {@code this}
         */
        public Builder automaticFailoverEnabled(com.hashicorp.cdktf.IResolvable automaticFailoverEnabled) {
            this.automaticFailoverEnabled = automaticFailoverEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getAutoMinorVersionUpgrade}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#auto_minor_version_upgrade ElasticacheReplicationGroup#auto_minor_version_upgrade}.
         * @return {@code this}
         */
        public Builder autoMinorVersionUpgrade(java.lang.String autoMinorVersionUpgrade) {
            this.autoMinorVersionUpgrade = autoMinorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getClusterMode}
         * @param clusterMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#cluster_mode ElasticacheReplicationGroup#cluster_mode}.
         * @return {@code this}
         */
        public Builder clusterMode(java.lang.String clusterMode) {
            this.clusterMode = clusterMode;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getDataTieringEnabled}
         * @param dataTieringEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#data_tiering_enabled ElasticacheReplicationGroup#data_tiering_enabled}.
         * @return {@code this}
         */
        public Builder dataTieringEnabled(java.lang.Boolean dataTieringEnabled) {
            this.dataTieringEnabled = dataTieringEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getDataTieringEnabled}
         * @param dataTieringEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#data_tiering_enabled ElasticacheReplicationGroup#data_tiering_enabled}.
         * @return {@code this}
         */
        public Builder dataTieringEnabled(com.hashicorp.cdktf.IResolvable dataTieringEnabled) {
            this.dataTieringEnabled = dataTieringEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getEngine}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#engine ElasticacheReplicationGroup#engine}.
         * @return {@code this}
         */
        public Builder engine(java.lang.String engine) {
            this.engine = engine;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getEngineVersion}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#engine_version ElasticacheReplicationGroup#engine_version}.
         * @return {@code this}
         */
        public Builder engineVersion(java.lang.String engineVersion) {
            this.engineVersion = engineVersion;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getFinalSnapshotIdentifier}
         * @param finalSnapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#final_snapshot_identifier ElasticacheReplicationGroup#final_snapshot_identifier}.
         * @return {@code this}
         */
        public Builder finalSnapshotIdentifier(java.lang.String finalSnapshotIdentifier) {
            this.finalSnapshotIdentifier = finalSnapshotIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getGlobalReplicationGroupId}
         * @param globalReplicationGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#global_replication_group_id ElasticacheReplicationGroup#global_replication_group_id}.
         * @return {@code this}
         */
        public Builder globalReplicationGroupId(java.lang.String globalReplicationGroupId) {
            this.globalReplicationGroupId = globalReplicationGroupId;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#id ElasticacheReplicationGroup#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getIpDiscovery}
         * @param ipDiscovery Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#ip_discovery ElasticacheReplicationGroup#ip_discovery}.
         * @return {@code this}
         */
        public Builder ipDiscovery(java.lang.String ipDiscovery) {
            this.ipDiscovery = ipDiscovery;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#kms_key_id ElasticacheReplicationGroup#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getLogDeliveryConfiguration}
         * @param logDeliveryConfiguration log_delivery_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#log_delivery_configuration ElasticacheReplicationGroup#log_delivery_configuration}
         * @return {@code this}
         */
        public Builder logDeliveryConfiguration(com.hashicorp.cdktf.IResolvable logDeliveryConfiguration) {
            this.logDeliveryConfiguration = logDeliveryConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getLogDeliveryConfiguration}
         * @param logDeliveryConfiguration log_delivery_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#log_delivery_configuration ElasticacheReplicationGroup#log_delivery_configuration}
         * @return {@code this}
         */
        public Builder logDeliveryConfiguration(java.util.List<? extends imports.aws.elasticache_replication_group.ElasticacheReplicationGroupLogDeliveryConfiguration> logDeliveryConfiguration) {
            this.logDeliveryConfiguration = logDeliveryConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getMaintenanceWindow}
         * @param maintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#maintenance_window ElasticacheReplicationGroup#maintenance_window}.
         * @return {@code this}
         */
        public Builder maintenanceWindow(java.lang.String maintenanceWindow) {
            this.maintenanceWindow = maintenanceWindow;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getMultiAzEnabled}
         * @param multiAzEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#multi_az_enabled ElasticacheReplicationGroup#multi_az_enabled}.
         * @return {@code this}
         */
        public Builder multiAzEnabled(java.lang.Boolean multiAzEnabled) {
            this.multiAzEnabled = multiAzEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getMultiAzEnabled}
         * @param multiAzEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#multi_az_enabled ElasticacheReplicationGroup#multi_az_enabled}.
         * @return {@code this}
         */
        public Builder multiAzEnabled(com.hashicorp.cdktf.IResolvable multiAzEnabled) {
            this.multiAzEnabled = multiAzEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getNetworkType}
         * @param networkType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#network_type ElasticacheReplicationGroup#network_type}.
         * @return {@code this}
         */
        public Builder networkType(java.lang.String networkType) {
            this.networkType = networkType;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getNodeType}
         * @param nodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#node_type ElasticacheReplicationGroup#node_type}.
         * @return {@code this}
         */
        public Builder nodeType(java.lang.String nodeType) {
            this.nodeType = nodeType;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getNotificationTopicArn}
         * @param notificationTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#notification_topic_arn ElasticacheReplicationGroup#notification_topic_arn}.
         * @return {@code this}
         */
        public Builder notificationTopicArn(java.lang.String notificationTopicArn) {
            this.notificationTopicArn = notificationTopicArn;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getNumCacheClusters}
         * @param numCacheClusters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#num_cache_clusters ElasticacheReplicationGroup#num_cache_clusters}.
         * @return {@code this}
         */
        public Builder numCacheClusters(java.lang.Number numCacheClusters) {
            this.numCacheClusters = numCacheClusters;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getNumNodeGroups}
         * @param numNodeGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#num_node_groups ElasticacheReplicationGroup#num_node_groups}.
         * @return {@code this}
         */
        public Builder numNodeGroups(java.lang.Number numNodeGroups) {
            this.numNodeGroups = numNodeGroups;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getParameterGroupName}
         * @param parameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#parameter_group_name ElasticacheReplicationGroup#parameter_group_name}.
         * @return {@code this}
         */
        public Builder parameterGroupName(java.lang.String parameterGroupName) {
            this.parameterGroupName = parameterGroupName;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#port ElasticacheReplicationGroup#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getPreferredCacheClusterAzs}
         * @param preferredCacheClusterAzs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#preferred_cache_cluster_azs ElasticacheReplicationGroup#preferred_cache_cluster_azs}.
         * @return {@code this}
         */
        public Builder preferredCacheClusterAzs(java.util.List<java.lang.String> preferredCacheClusterAzs) {
            this.preferredCacheClusterAzs = preferredCacheClusterAzs;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getReplicasPerNodeGroup}
         * @param replicasPerNodeGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#replicas_per_node_group ElasticacheReplicationGroup#replicas_per_node_group}.
         * @return {@code this}
         */
        public Builder replicasPerNodeGroup(java.lang.Number replicasPerNodeGroup) {
            this.replicasPerNodeGroup = replicasPerNodeGroup;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#security_group_ids ElasticacheReplicationGroup#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getSecurityGroupNames}
         * @param securityGroupNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#security_group_names ElasticacheReplicationGroup#security_group_names}.
         * @return {@code this}
         */
        public Builder securityGroupNames(java.util.List<java.lang.String> securityGroupNames) {
            this.securityGroupNames = securityGroupNames;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getSnapshotArns}
         * @param snapshotArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_arns ElasticacheReplicationGroup#snapshot_arns}.
         * @return {@code this}
         */
        public Builder snapshotArns(java.util.List<java.lang.String> snapshotArns) {
            this.snapshotArns = snapshotArns;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getSnapshotName}
         * @param snapshotName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_name ElasticacheReplicationGroup#snapshot_name}.
         * @return {@code this}
         */
        public Builder snapshotName(java.lang.String snapshotName) {
            this.snapshotName = snapshotName;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getSnapshotRetentionLimit}
         * @param snapshotRetentionLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_retention_limit ElasticacheReplicationGroup#snapshot_retention_limit}.
         * @return {@code this}
         */
        public Builder snapshotRetentionLimit(java.lang.Number snapshotRetentionLimit) {
            this.snapshotRetentionLimit = snapshotRetentionLimit;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getSnapshotWindow}
         * @param snapshotWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_window ElasticacheReplicationGroup#snapshot_window}.
         * @return {@code this}
         */
        public Builder snapshotWindow(java.lang.String snapshotWindow) {
            this.snapshotWindow = snapshotWindow;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getSubnetGroupName}
         * @param subnetGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#subnet_group_name ElasticacheReplicationGroup#subnet_group_name}.
         * @return {@code this}
         */
        public Builder subnetGroupName(java.lang.String subnetGroupName) {
            this.subnetGroupName = subnetGroupName;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#tags ElasticacheReplicationGroup#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#tags_all ElasticacheReplicationGroup#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#timeouts ElasticacheReplicationGroup#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.elasticache_replication_group.ElasticacheReplicationGroupTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getTransitEncryptionEnabled}
         * @param transitEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#transit_encryption_enabled ElasticacheReplicationGroup#transit_encryption_enabled}.
         * @return {@code this}
         */
        public Builder transitEncryptionEnabled(java.lang.Boolean transitEncryptionEnabled) {
            this.transitEncryptionEnabled = transitEncryptionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getTransitEncryptionEnabled}
         * @param transitEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#transit_encryption_enabled ElasticacheReplicationGroup#transit_encryption_enabled}.
         * @return {@code this}
         */
        public Builder transitEncryptionEnabled(com.hashicorp.cdktf.IResolvable transitEncryptionEnabled) {
            this.transitEncryptionEnabled = transitEncryptionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getTransitEncryptionMode}
         * @param transitEncryptionMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#transit_encryption_mode ElasticacheReplicationGroup#transit_encryption_mode}.
         * @return {@code this}
         */
        public Builder transitEncryptionMode(java.lang.String transitEncryptionMode) {
            this.transitEncryptionMode = transitEncryptionMode;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getUserGroupIds}
         * @param userGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#user_group_ids ElasticacheReplicationGroup#user_group_ids}.
         * @return {@code this}
         */
        public Builder userGroupIds(java.util.List<java.lang.String> userGroupIds) {
            this.userGroupIds = userGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getDependsOn}
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
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheReplicationGroupConfig#getProvisioners}
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
         * @return a new instance of {@link ElasticacheReplicationGroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticacheReplicationGroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticacheReplicationGroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticacheReplicationGroupConfig {
        private final java.lang.String description;
        private final java.lang.String replicationGroupId;
        private final java.lang.Object applyImmediately;
        private final java.lang.String atRestEncryptionEnabled;
        private final java.lang.String authToken;
        private final java.lang.String authTokenUpdateStrategy;
        private final java.lang.Object automaticFailoverEnabled;
        private final java.lang.String autoMinorVersionUpgrade;
        private final java.lang.String clusterMode;
        private final java.lang.Object dataTieringEnabled;
        private final java.lang.String engine;
        private final java.lang.String engineVersion;
        private final java.lang.String finalSnapshotIdentifier;
        private final java.lang.String globalReplicationGroupId;
        private final java.lang.String id;
        private final java.lang.String ipDiscovery;
        private final java.lang.String kmsKeyId;
        private final java.lang.Object logDeliveryConfiguration;
        private final java.lang.String maintenanceWindow;
        private final java.lang.Object multiAzEnabled;
        private final java.lang.String networkType;
        private final java.lang.String nodeType;
        private final java.lang.String notificationTopicArn;
        private final java.lang.Number numCacheClusters;
        private final java.lang.Number numNodeGroups;
        private final java.lang.String parameterGroupName;
        private final java.lang.Number port;
        private final java.util.List<java.lang.String> preferredCacheClusterAzs;
        private final java.lang.Number replicasPerNodeGroup;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.util.List<java.lang.String> securityGroupNames;
        private final java.util.List<java.lang.String> snapshotArns;
        private final java.lang.String snapshotName;
        private final java.lang.Number snapshotRetentionLimit;
        private final java.lang.String snapshotWindow;
        private final java.lang.String subnetGroupName;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.elasticache_replication_group.ElasticacheReplicationGroupTimeouts timeouts;
        private final java.lang.Object transitEncryptionEnabled;
        private final java.lang.String transitEncryptionMode;
        private final java.util.List<java.lang.String> userGroupIds;
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
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicationGroupId = software.amazon.jsii.Kernel.get(this, "replicationGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applyImmediately = software.amazon.jsii.Kernel.get(this, "applyImmediately", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.atRestEncryptionEnabled = software.amazon.jsii.Kernel.get(this, "atRestEncryptionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authToken = software.amazon.jsii.Kernel.get(this, "authToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authTokenUpdateStrategy = software.amazon.jsii.Kernel.get(this, "authTokenUpdateStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.automaticFailoverEnabled = software.amazon.jsii.Kernel.get(this, "automaticFailoverEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.autoMinorVersionUpgrade = software.amazon.jsii.Kernel.get(this, "autoMinorVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterMode = software.amazon.jsii.Kernel.get(this, "clusterMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataTieringEnabled = software.amazon.jsii.Kernel.get(this, "dataTieringEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.engine = software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineVersion = software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.finalSnapshotIdentifier = software.amazon.jsii.Kernel.get(this, "finalSnapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.globalReplicationGroupId = software.amazon.jsii.Kernel.get(this, "globalReplicationGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipDiscovery = software.amazon.jsii.Kernel.get(this, "ipDiscovery", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logDeliveryConfiguration = software.amazon.jsii.Kernel.get(this, "logDeliveryConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.maintenanceWindow = software.amazon.jsii.Kernel.get(this, "maintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.multiAzEnabled = software.amazon.jsii.Kernel.get(this, "multiAzEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.networkType = software.amazon.jsii.Kernel.get(this, "networkType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nodeType = software.amazon.jsii.Kernel.get(this, "nodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notificationTopicArn = software.amazon.jsii.Kernel.get(this, "notificationTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.numCacheClusters = software.amazon.jsii.Kernel.get(this, "numCacheClusters", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.numNodeGroups = software.amazon.jsii.Kernel.get(this, "numNodeGroups", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.parameterGroupName = software.amazon.jsii.Kernel.get(this, "parameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.preferredCacheClusterAzs = software.amazon.jsii.Kernel.get(this, "preferredCacheClusterAzs", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.replicasPerNodeGroup = software.amazon.jsii.Kernel.get(this, "replicasPerNodeGroup", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.securityGroupNames = software.amazon.jsii.Kernel.get(this, "securityGroupNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.snapshotArns = software.amazon.jsii.Kernel.get(this, "snapshotArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.snapshotName = software.amazon.jsii.Kernel.get(this, "snapshotName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snapshotRetentionLimit = software.amazon.jsii.Kernel.get(this, "snapshotRetentionLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.snapshotWindow = software.amazon.jsii.Kernel.get(this, "snapshotWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetGroupName = software.amazon.jsii.Kernel.get(this, "subnetGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.elasticache_replication_group.ElasticacheReplicationGroupTimeouts.class));
            this.transitEncryptionEnabled = software.amazon.jsii.Kernel.get(this, "transitEncryptionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.transitEncryptionMode = software.amazon.jsii.Kernel.get(this, "transitEncryptionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userGroupIds = software.amazon.jsii.Kernel.get(this, "userGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.description = java.util.Objects.requireNonNull(builder.description, "description is required");
            this.replicationGroupId = java.util.Objects.requireNonNull(builder.replicationGroupId, "replicationGroupId is required");
            this.applyImmediately = builder.applyImmediately;
            this.atRestEncryptionEnabled = builder.atRestEncryptionEnabled;
            this.authToken = builder.authToken;
            this.authTokenUpdateStrategy = builder.authTokenUpdateStrategy;
            this.automaticFailoverEnabled = builder.automaticFailoverEnabled;
            this.autoMinorVersionUpgrade = builder.autoMinorVersionUpgrade;
            this.clusterMode = builder.clusterMode;
            this.dataTieringEnabled = builder.dataTieringEnabled;
            this.engine = builder.engine;
            this.engineVersion = builder.engineVersion;
            this.finalSnapshotIdentifier = builder.finalSnapshotIdentifier;
            this.globalReplicationGroupId = builder.globalReplicationGroupId;
            this.id = builder.id;
            this.ipDiscovery = builder.ipDiscovery;
            this.kmsKeyId = builder.kmsKeyId;
            this.logDeliveryConfiguration = builder.logDeliveryConfiguration;
            this.maintenanceWindow = builder.maintenanceWindow;
            this.multiAzEnabled = builder.multiAzEnabled;
            this.networkType = builder.networkType;
            this.nodeType = builder.nodeType;
            this.notificationTopicArn = builder.notificationTopicArn;
            this.numCacheClusters = builder.numCacheClusters;
            this.numNodeGroups = builder.numNodeGroups;
            this.parameterGroupName = builder.parameterGroupName;
            this.port = builder.port;
            this.preferredCacheClusterAzs = builder.preferredCacheClusterAzs;
            this.replicasPerNodeGroup = builder.replicasPerNodeGroup;
            this.securityGroupIds = builder.securityGroupIds;
            this.securityGroupNames = builder.securityGroupNames;
            this.snapshotArns = builder.snapshotArns;
            this.snapshotName = builder.snapshotName;
            this.snapshotRetentionLimit = builder.snapshotRetentionLimit;
            this.snapshotWindow = builder.snapshotWindow;
            this.subnetGroupName = builder.subnetGroupName;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.transitEncryptionEnabled = builder.transitEncryptionEnabled;
            this.transitEncryptionMode = builder.transitEncryptionMode;
            this.userGroupIds = builder.userGroupIds;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getReplicationGroupId() {
            return this.replicationGroupId;
        }

        @Override
        public final java.lang.Object getApplyImmediately() {
            return this.applyImmediately;
        }

        @Override
        public final java.lang.String getAtRestEncryptionEnabled() {
            return this.atRestEncryptionEnabled;
        }

        @Override
        public final java.lang.String getAuthToken() {
            return this.authToken;
        }

        @Override
        public final java.lang.String getAuthTokenUpdateStrategy() {
            return this.authTokenUpdateStrategy;
        }

        @Override
        public final java.lang.Object getAutomaticFailoverEnabled() {
            return this.automaticFailoverEnabled;
        }

        @Override
        public final java.lang.String getAutoMinorVersionUpgrade() {
            return this.autoMinorVersionUpgrade;
        }

        @Override
        public final java.lang.String getClusterMode() {
            return this.clusterMode;
        }

        @Override
        public final java.lang.Object getDataTieringEnabled() {
            return this.dataTieringEnabled;
        }

        @Override
        public final java.lang.String getEngine() {
            return this.engine;
        }

        @Override
        public final java.lang.String getEngineVersion() {
            return this.engineVersion;
        }

        @Override
        public final java.lang.String getFinalSnapshotIdentifier() {
            return this.finalSnapshotIdentifier;
        }

        @Override
        public final java.lang.String getGlobalReplicationGroupId() {
            return this.globalReplicationGroupId;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIpDiscovery() {
            return this.ipDiscovery;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.Object getLogDeliveryConfiguration() {
            return this.logDeliveryConfiguration;
        }

        @Override
        public final java.lang.String getMaintenanceWindow() {
            return this.maintenanceWindow;
        }

        @Override
        public final java.lang.Object getMultiAzEnabled() {
            return this.multiAzEnabled;
        }

        @Override
        public final java.lang.String getNetworkType() {
            return this.networkType;
        }

        @Override
        public final java.lang.String getNodeType() {
            return this.nodeType;
        }

        @Override
        public final java.lang.String getNotificationTopicArn() {
            return this.notificationTopicArn;
        }

        @Override
        public final java.lang.Number getNumCacheClusters() {
            return this.numCacheClusters;
        }

        @Override
        public final java.lang.Number getNumNodeGroups() {
            return this.numNodeGroups;
        }

        @Override
        public final java.lang.String getParameterGroupName() {
            return this.parameterGroupName;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.util.List<java.lang.String> getPreferredCacheClusterAzs() {
            return this.preferredCacheClusterAzs;
        }

        @Override
        public final java.lang.Number getReplicasPerNodeGroup() {
            return this.replicasPerNodeGroup;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupNames() {
            return this.securityGroupNames;
        }

        @Override
        public final java.util.List<java.lang.String> getSnapshotArns() {
            return this.snapshotArns;
        }

        @Override
        public final java.lang.String getSnapshotName() {
            return this.snapshotName;
        }

        @Override
        public final java.lang.Number getSnapshotRetentionLimit() {
            return this.snapshotRetentionLimit;
        }

        @Override
        public final java.lang.String getSnapshotWindow() {
            return this.snapshotWindow;
        }

        @Override
        public final java.lang.String getSubnetGroupName() {
            return this.subnetGroupName;
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
        public final imports.aws.elasticache_replication_group.ElasticacheReplicationGroupTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getTransitEncryptionEnabled() {
            return this.transitEncryptionEnabled;
        }

        @Override
        public final java.lang.String getTransitEncryptionMode() {
            return this.transitEncryptionMode;
        }

        @Override
        public final java.util.List<java.lang.String> getUserGroupIds() {
            return this.userGroupIds;
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

            data.set("description", om.valueToTree(this.getDescription()));
            data.set("replicationGroupId", om.valueToTree(this.getReplicationGroupId()));
            if (this.getApplyImmediately() != null) {
                data.set("applyImmediately", om.valueToTree(this.getApplyImmediately()));
            }
            if (this.getAtRestEncryptionEnabled() != null) {
                data.set("atRestEncryptionEnabled", om.valueToTree(this.getAtRestEncryptionEnabled()));
            }
            if (this.getAuthToken() != null) {
                data.set("authToken", om.valueToTree(this.getAuthToken()));
            }
            if (this.getAuthTokenUpdateStrategy() != null) {
                data.set("authTokenUpdateStrategy", om.valueToTree(this.getAuthTokenUpdateStrategy()));
            }
            if (this.getAutomaticFailoverEnabled() != null) {
                data.set("automaticFailoverEnabled", om.valueToTree(this.getAutomaticFailoverEnabled()));
            }
            if (this.getAutoMinorVersionUpgrade() != null) {
                data.set("autoMinorVersionUpgrade", om.valueToTree(this.getAutoMinorVersionUpgrade()));
            }
            if (this.getClusterMode() != null) {
                data.set("clusterMode", om.valueToTree(this.getClusterMode()));
            }
            if (this.getDataTieringEnabled() != null) {
                data.set("dataTieringEnabled", om.valueToTree(this.getDataTieringEnabled()));
            }
            if (this.getEngine() != null) {
                data.set("engine", om.valueToTree(this.getEngine()));
            }
            if (this.getEngineVersion() != null) {
                data.set("engineVersion", om.valueToTree(this.getEngineVersion()));
            }
            if (this.getFinalSnapshotIdentifier() != null) {
                data.set("finalSnapshotIdentifier", om.valueToTree(this.getFinalSnapshotIdentifier()));
            }
            if (this.getGlobalReplicationGroupId() != null) {
                data.set("globalReplicationGroupId", om.valueToTree(this.getGlobalReplicationGroupId()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpDiscovery() != null) {
                data.set("ipDiscovery", om.valueToTree(this.getIpDiscovery()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getLogDeliveryConfiguration() != null) {
                data.set("logDeliveryConfiguration", om.valueToTree(this.getLogDeliveryConfiguration()));
            }
            if (this.getMaintenanceWindow() != null) {
                data.set("maintenanceWindow", om.valueToTree(this.getMaintenanceWindow()));
            }
            if (this.getMultiAzEnabled() != null) {
                data.set("multiAzEnabled", om.valueToTree(this.getMultiAzEnabled()));
            }
            if (this.getNetworkType() != null) {
                data.set("networkType", om.valueToTree(this.getNetworkType()));
            }
            if (this.getNodeType() != null) {
                data.set("nodeType", om.valueToTree(this.getNodeType()));
            }
            if (this.getNotificationTopicArn() != null) {
                data.set("notificationTopicArn", om.valueToTree(this.getNotificationTopicArn()));
            }
            if (this.getNumCacheClusters() != null) {
                data.set("numCacheClusters", om.valueToTree(this.getNumCacheClusters()));
            }
            if (this.getNumNodeGroups() != null) {
                data.set("numNodeGroups", om.valueToTree(this.getNumNodeGroups()));
            }
            if (this.getParameterGroupName() != null) {
                data.set("parameterGroupName", om.valueToTree(this.getParameterGroupName()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getPreferredCacheClusterAzs() != null) {
                data.set("preferredCacheClusterAzs", om.valueToTree(this.getPreferredCacheClusterAzs()));
            }
            if (this.getReplicasPerNodeGroup() != null) {
                data.set("replicasPerNodeGroup", om.valueToTree(this.getReplicasPerNodeGroup()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }
            if (this.getSecurityGroupNames() != null) {
                data.set("securityGroupNames", om.valueToTree(this.getSecurityGroupNames()));
            }
            if (this.getSnapshotArns() != null) {
                data.set("snapshotArns", om.valueToTree(this.getSnapshotArns()));
            }
            if (this.getSnapshotName() != null) {
                data.set("snapshotName", om.valueToTree(this.getSnapshotName()));
            }
            if (this.getSnapshotRetentionLimit() != null) {
                data.set("snapshotRetentionLimit", om.valueToTree(this.getSnapshotRetentionLimit()));
            }
            if (this.getSnapshotWindow() != null) {
                data.set("snapshotWindow", om.valueToTree(this.getSnapshotWindow()));
            }
            if (this.getSubnetGroupName() != null) {
                data.set("subnetGroupName", om.valueToTree(this.getSubnetGroupName()));
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
            if (this.getTransitEncryptionEnabled() != null) {
                data.set("transitEncryptionEnabled", om.valueToTree(this.getTransitEncryptionEnabled()));
            }
            if (this.getTransitEncryptionMode() != null) {
                data.set("transitEncryptionMode", om.valueToTree(this.getTransitEncryptionMode()));
            }
            if (this.getUserGroupIds() != null) {
                data.set("userGroupIds", om.valueToTree(this.getUserGroupIds()));
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
            struct.set("fqn", om.valueToTree("aws.elasticacheReplicationGroup.ElasticacheReplicationGroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticacheReplicationGroupConfig.Jsii$Proxy that = (ElasticacheReplicationGroupConfig.Jsii$Proxy) o;

            if (!description.equals(that.description)) return false;
            if (!replicationGroupId.equals(that.replicationGroupId)) return false;
            if (this.applyImmediately != null ? !this.applyImmediately.equals(that.applyImmediately) : that.applyImmediately != null) return false;
            if (this.atRestEncryptionEnabled != null ? !this.atRestEncryptionEnabled.equals(that.atRestEncryptionEnabled) : that.atRestEncryptionEnabled != null) return false;
            if (this.authToken != null ? !this.authToken.equals(that.authToken) : that.authToken != null) return false;
            if (this.authTokenUpdateStrategy != null ? !this.authTokenUpdateStrategy.equals(that.authTokenUpdateStrategy) : that.authTokenUpdateStrategy != null) return false;
            if (this.automaticFailoverEnabled != null ? !this.automaticFailoverEnabled.equals(that.automaticFailoverEnabled) : that.automaticFailoverEnabled != null) return false;
            if (this.autoMinorVersionUpgrade != null ? !this.autoMinorVersionUpgrade.equals(that.autoMinorVersionUpgrade) : that.autoMinorVersionUpgrade != null) return false;
            if (this.clusterMode != null ? !this.clusterMode.equals(that.clusterMode) : that.clusterMode != null) return false;
            if (this.dataTieringEnabled != null ? !this.dataTieringEnabled.equals(that.dataTieringEnabled) : that.dataTieringEnabled != null) return false;
            if (this.engine != null ? !this.engine.equals(that.engine) : that.engine != null) return false;
            if (this.engineVersion != null ? !this.engineVersion.equals(that.engineVersion) : that.engineVersion != null) return false;
            if (this.finalSnapshotIdentifier != null ? !this.finalSnapshotIdentifier.equals(that.finalSnapshotIdentifier) : that.finalSnapshotIdentifier != null) return false;
            if (this.globalReplicationGroupId != null ? !this.globalReplicationGroupId.equals(that.globalReplicationGroupId) : that.globalReplicationGroupId != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipDiscovery != null ? !this.ipDiscovery.equals(that.ipDiscovery) : that.ipDiscovery != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.logDeliveryConfiguration != null ? !this.logDeliveryConfiguration.equals(that.logDeliveryConfiguration) : that.logDeliveryConfiguration != null) return false;
            if (this.maintenanceWindow != null ? !this.maintenanceWindow.equals(that.maintenanceWindow) : that.maintenanceWindow != null) return false;
            if (this.multiAzEnabled != null ? !this.multiAzEnabled.equals(that.multiAzEnabled) : that.multiAzEnabled != null) return false;
            if (this.networkType != null ? !this.networkType.equals(that.networkType) : that.networkType != null) return false;
            if (this.nodeType != null ? !this.nodeType.equals(that.nodeType) : that.nodeType != null) return false;
            if (this.notificationTopicArn != null ? !this.notificationTopicArn.equals(that.notificationTopicArn) : that.notificationTopicArn != null) return false;
            if (this.numCacheClusters != null ? !this.numCacheClusters.equals(that.numCacheClusters) : that.numCacheClusters != null) return false;
            if (this.numNodeGroups != null ? !this.numNodeGroups.equals(that.numNodeGroups) : that.numNodeGroups != null) return false;
            if (this.parameterGroupName != null ? !this.parameterGroupName.equals(that.parameterGroupName) : that.parameterGroupName != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.preferredCacheClusterAzs != null ? !this.preferredCacheClusterAzs.equals(that.preferredCacheClusterAzs) : that.preferredCacheClusterAzs != null) return false;
            if (this.replicasPerNodeGroup != null ? !this.replicasPerNodeGroup.equals(that.replicasPerNodeGroup) : that.replicasPerNodeGroup != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.securityGroupNames != null ? !this.securityGroupNames.equals(that.securityGroupNames) : that.securityGroupNames != null) return false;
            if (this.snapshotArns != null ? !this.snapshotArns.equals(that.snapshotArns) : that.snapshotArns != null) return false;
            if (this.snapshotName != null ? !this.snapshotName.equals(that.snapshotName) : that.snapshotName != null) return false;
            if (this.snapshotRetentionLimit != null ? !this.snapshotRetentionLimit.equals(that.snapshotRetentionLimit) : that.snapshotRetentionLimit != null) return false;
            if (this.snapshotWindow != null ? !this.snapshotWindow.equals(that.snapshotWindow) : that.snapshotWindow != null) return false;
            if (this.subnetGroupName != null ? !this.subnetGroupName.equals(that.subnetGroupName) : that.subnetGroupName != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.transitEncryptionEnabled != null ? !this.transitEncryptionEnabled.equals(that.transitEncryptionEnabled) : that.transitEncryptionEnabled != null) return false;
            if (this.transitEncryptionMode != null ? !this.transitEncryptionMode.equals(that.transitEncryptionMode) : that.transitEncryptionMode != null) return false;
            if (this.userGroupIds != null ? !this.userGroupIds.equals(that.userGroupIds) : that.userGroupIds != null) return false;
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
            int result = this.description.hashCode();
            result = 31 * result + (this.replicationGroupId.hashCode());
            result = 31 * result + (this.applyImmediately != null ? this.applyImmediately.hashCode() : 0);
            result = 31 * result + (this.atRestEncryptionEnabled != null ? this.atRestEncryptionEnabled.hashCode() : 0);
            result = 31 * result + (this.authToken != null ? this.authToken.hashCode() : 0);
            result = 31 * result + (this.authTokenUpdateStrategy != null ? this.authTokenUpdateStrategy.hashCode() : 0);
            result = 31 * result + (this.automaticFailoverEnabled != null ? this.automaticFailoverEnabled.hashCode() : 0);
            result = 31 * result + (this.autoMinorVersionUpgrade != null ? this.autoMinorVersionUpgrade.hashCode() : 0);
            result = 31 * result + (this.clusterMode != null ? this.clusterMode.hashCode() : 0);
            result = 31 * result + (this.dataTieringEnabled != null ? this.dataTieringEnabled.hashCode() : 0);
            result = 31 * result + (this.engine != null ? this.engine.hashCode() : 0);
            result = 31 * result + (this.engineVersion != null ? this.engineVersion.hashCode() : 0);
            result = 31 * result + (this.finalSnapshotIdentifier != null ? this.finalSnapshotIdentifier.hashCode() : 0);
            result = 31 * result + (this.globalReplicationGroupId != null ? this.globalReplicationGroupId.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipDiscovery != null ? this.ipDiscovery.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.logDeliveryConfiguration != null ? this.logDeliveryConfiguration.hashCode() : 0);
            result = 31 * result + (this.maintenanceWindow != null ? this.maintenanceWindow.hashCode() : 0);
            result = 31 * result + (this.multiAzEnabled != null ? this.multiAzEnabled.hashCode() : 0);
            result = 31 * result + (this.networkType != null ? this.networkType.hashCode() : 0);
            result = 31 * result + (this.nodeType != null ? this.nodeType.hashCode() : 0);
            result = 31 * result + (this.notificationTopicArn != null ? this.notificationTopicArn.hashCode() : 0);
            result = 31 * result + (this.numCacheClusters != null ? this.numCacheClusters.hashCode() : 0);
            result = 31 * result + (this.numNodeGroups != null ? this.numNodeGroups.hashCode() : 0);
            result = 31 * result + (this.parameterGroupName != null ? this.parameterGroupName.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.preferredCacheClusterAzs != null ? this.preferredCacheClusterAzs.hashCode() : 0);
            result = 31 * result + (this.replicasPerNodeGroup != null ? this.replicasPerNodeGroup.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.securityGroupNames != null ? this.securityGroupNames.hashCode() : 0);
            result = 31 * result + (this.snapshotArns != null ? this.snapshotArns.hashCode() : 0);
            result = 31 * result + (this.snapshotName != null ? this.snapshotName.hashCode() : 0);
            result = 31 * result + (this.snapshotRetentionLimit != null ? this.snapshotRetentionLimit.hashCode() : 0);
            result = 31 * result + (this.snapshotWindow != null ? this.snapshotWindow.hashCode() : 0);
            result = 31 * result + (this.subnetGroupName != null ? this.subnetGroupName.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.transitEncryptionEnabled != null ? this.transitEncryptionEnabled.hashCode() : 0);
            result = 31 * result + (this.transitEncryptionMode != null ? this.transitEncryptionMode.hashCode() : 0);
            result = 31 * result + (this.userGroupIds != null ? this.userGroupIds.hashCode() : 0);
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
