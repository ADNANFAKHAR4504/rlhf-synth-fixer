package imports.aws.elasticache_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.167Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticacheCluster.ElasticacheClusterConfig")
@software.amazon.jsii.Jsii.Proxy(ElasticacheClusterConfig.Jsii$Proxy.class)
public interface ElasticacheClusterConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#cluster_id ElasticacheCluster#cluster_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#apply_immediately ElasticacheCluster#apply_immediately}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediately() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#auto_minor_version_upgrade ElasticacheCluster#auto_minor_version_upgrade}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAutoMinorVersionUpgrade() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#availability_zone ElasticacheCluster#availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#az_mode ElasticacheCluster#az_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAzMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#engine ElasticacheCluster#engine}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngine() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#engine_version ElasticacheCluster#engine_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngineVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#final_snapshot_identifier ElasticacheCluster#final_snapshot_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFinalSnapshotIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#id ElasticacheCluster#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#ip_discovery ElasticacheCluster#ip_discovery}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpDiscovery() {
        return null;
    }

    /**
     * log_delivery_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#log_delivery_configuration ElasticacheCluster#log_delivery_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLogDeliveryConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#maintenance_window ElasticacheCluster#maintenance_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaintenanceWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#network_type ElasticacheCluster#network_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetworkType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#node_type ElasticacheCluster#node_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNodeType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#notification_topic_arn ElasticacheCluster#notification_topic_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNotificationTopicArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#num_cache_nodes ElasticacheCluster#num_cache_nodes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumCacheNodes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#outpost_mode ElasticacheCluster#outpost_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutpostMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#parameter_group_name ElasticacheCluster#parameter_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParameterGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#port ElasticacheCluster#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#preferred_availability_zones ElasticacheCluster#preferred_availability_zones}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredAvailabilityZones() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#preferred_outpost_arn ElasticacheCluster#preferred_outpost_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredOutpostArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#replication_group_id ElasticacheCluster#replication_group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplicationGroupId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#security_group_ids ElasticacheCluster#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#snapshot_arns ElasticacheCluster#snapshot_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSnapshotArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#snapshot_name ElasticacheCluster#snapshot_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#snapshot_retention_limit ElasticacheCluster#snapshot_retention_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSnapshotRetentionLimit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#snapshot_window ElasticacheCluster#snapshot_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#subnet_group_name ElasticacheCluster#subnet_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#tags ElasticacheCluster#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#tags_all ElasticacheCluster#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#timeouts ElasticacheCluster#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticache_cluster.ElasticacheClusterTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#transit_encryption_enabled ElasticacheCluster#transit_encryption_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTransitEncryptionEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticacheClusterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticacheClusterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticacheClusterConfig> {
        java.lang.String clusterId;
        java.lang.Object applyImmediately;
        java.lang.String autoMinorVersionUpgrade;
        java.lang.String availabilityZone;
        java.lang.String azMode;
        java.lang.String engine;
        java.lang.String engineVersion;
        java.lang.String finalSnapshotIdentifier;
        java.lang.String id;
        java.lang.String ipDiscovery;
        java.lang.Object logDeliveryConfiguration;
        java.lang.String maintenanceWindow;
        java.lang.String networkType;
        java.lang.String nodeType;
        java.lang.String notificationTopicArn;
        java.lang.Number numCacheNodes;
        java.lang.String outpostMode;
        java.lang.String parameterGroupName;
        java.lang.Number port;
        java.util.List<java.lang.String> preferredAvailabilityZones;
        java.lang.String preferredOutpostArn;
        java.lang.String replicationGroupId;
        java.util.List<java.lang.String> securityGroupIds;
        java.util.List<java.lang.String> snapshotArns;
        java.lang.String snapshotName;
        java.lang.Number snapshotRetentionLimit;
        java.lang.String snapshotWindow;
        java.lang.String subnetGroupName;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.elasticache_cluster.ElasticacheClusterTimeouts timeouts;
        java.lang.Object transitEncryptionEnabled;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getClusterId}
         * @param clusterId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#cluster_id ElasticacheCluster#cluster_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterId(java.lang.String clusterId) {
            this.clusterId = clusterId;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#apply_immediately ElasticacheCluster#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(java.lang.Boolean applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#apply_immediately ElasticacheCluster#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getAutoMinorVersionUpgrade}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#auto_minor_version_upgrade ElasticacheCluster#auto_minor_version_upgrade}.
         * @return {@code this}
         */
        public Builder autoMinorVersionUpgrade(java.lang.String autoMinorVersionUpgrade) {
            this.autoMinorVersionUpgrade = autoMinorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#availability_zone ElasticacheCluster#availability_zone}.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getAzMode}
         * @param azMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#az_mode ElasticacheCluster#az_mode}.
         * @return {@code this}
         */
        public Builder azMode(java.lang.String azMode) {
            this.azMode = azMode;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getEngine}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#engine ElasticacheCluster#engine}.
         * @return {@code this}
         */
        public Builder engine(java.lang.String engine) {
            this.engine = engine;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getEngineVersion}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#engine_version ElasticacheCluster#engine_version}.
         * @return {@code this}
         */
        public Builder engineVersion(java.lang.String engineVersion) {
            this.engineVersion = engineVersion;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getFinalSnapshotIdentifier}
         * @param finalSnapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#final_snapshot_identifier ElasticacheCluster#final_snapshot_identifier}.
         * @return {@code this}
         */
        public Builder finalSnapshotIdentifier(java.lang.String finalSnapshotIdentifier) {
            this.finalSnapshotIdentifier = finalSnapshotIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#id ElasticacheCluster#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getIpDiscovery}
         * @param ipDiscovery Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#ip_discovery ElasticacheCluster#ip_discovery}.
         * @return {@code this}
         */
        public Builder ipDiscovery(java.lang.String ipDiscovery) {
            this.ipDiscovery = ipDiscovery;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getLogDeliveryConfiguration}
         * @param logDeliveryConfiguration log_delivery_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#log_delivery_configuration ElasticacheCluster#log_delivery_configuration}
         * @return {@code this}
         */
        public Builder logDeliveryConfiguration(com.hashicorp.cdktf.IResolvable logDeliveryConfiguration) {
            this.logDeliveryConfiguration = logDeliveryConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getLogDeliveryConfiguration}
         * @param logDeliveryConfiguration log_delivery_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#log_delivery_configuration ElasticacheCluster#log_delivery_configuration}
         * @return {@code this}
         */
        public Builder logDeliveryConfiguration(java.util.List<? extends imports.aws.elasticache_cluster.ElasticacheClusterLogDeliveryConfiguration> logDeliveryConfiguration) {
            this.logDeliveryConfiguration = logDeliveryConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getMaintenanceWindow}
         * @param maintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#maintenance_window ElasticacheCluster#maintenance_window}.
         * @return {@code this}
         */
        public Builder maintenanceWindow(java.lang.String maintenanceWindow) {
            this.maintenanceWindow = maintenanceWindow;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getNetworkType}
         * @param networkType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#network_type ElasticacheCluster#network_type}.
         * @return {@code this}
         */
        public Builder networkType(java.lang.String networkType) {
            this.networkType = networkType;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getNodeType}
         * @param nodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#node_type ElasticacheCluster#node_type}.
         * @return {@code this}
         */
        public Builder nodeType(java.lang.String nodeType) {
            this.nodeType = nodeType;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getNotificationTopicArn}
         * @param notificationTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#notification_topic_arn ElasticacheCluster#notification_topic_arn}.
         * @return {@code this}
         */
        public Builder notificationTopicArn(java.lang.String notificationTopicArn) {
            this.notificationTopicArn = notificationTopicArn;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getNumCacheNodes}
         * @param numCacheNodes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#num_cache_nodes ElasticacheCluster#num_cache_nodes}.
         * @return {@code this}
         */
        public Builder numCacheNodes(java.lang.Number numCacheNodes) {
            this.numCacheNodes = numCacheNodes;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getOutpostMode}
         * @param outpostMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#outpost_mode ElasticacheCluster#outpost_mode}.
         * @return {@code this}
         */
        public Builder outpostMode(java.lang.String outpostMode) {
            this.outpostMode = outpostMode;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getParameterGroupName}
         * @param parameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#parameter_group_name ElasticacheCluster#parameter_group_name}.
         * @return {@code this}
         */
        public Builder parameterGroupName(java.lang.String parameterGroupName) {
            this.parameterGroupName = parameterGroupName;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#port ElasticacheCluster#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getPreferredAvailabilityZones}
         * @param preferredAvailabilityZones Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#preferred_availability_zones ElasticacheCluster#preferred_availability_zones}.
         * @return {@code this}
         */
        public Builder preferredAvailabilityZones(java.util.List<java.lang.String> preferredAvailabilityZones) {
            this.preferredAvailabilityZones = preferredAvailabilityZones;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getPreferredOutpostArn}
         * @param preferredOutpostArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#preferred_outpost_arn ElasticacheCluster#preferred_outpost_arn}.
         * @return {@code this}
         */
        public Builder preferredOutpostArn(java.lang.String preferredOutpostArn) {
            this.preferredOutpostArn = preferredOutpostArn;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getReplicationGroupId}
         * @param replicationGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#replication_group_id ElasticacheCluster#replication_group_id}.
         * @return {@code this}
         */
        public Builder replicationGroupId(java.lang.String replicationGroupId) {
            this.replicationGroupId = replicationGroupId;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#security_group_ids ElasticacheCluster#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getSnapshotArns}
         * @param snapshotArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#snapshot_arns ElasticacheCluster#snapshot_arns}.
         * @return {@code this}
         */
        public Builder snapshotArns(java.util.List<java.lang.String> snapshotArns) {
            this.snapshotArns = snapshotArns;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getSnapshotName}
         * @param snapshotName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#snapshot_name ElasticacheCluster#snapshot_name}.
         * @return {@code this}
         */
        public Builder snapshotName(java.lang.String snapshotName) {
            this.snapshotName = snapshotName;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getSnapshotRetentionLimit}
         * @param snapshotRetentionLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#snapshot_retention_limit ElasticacheCluster#snapshot_retention_limit}.
         * @return {@code this}
         */
        public Builder snapshotRetentionLimit(java.lang.Number snapshotRetentionLimit) {
            this.snapshotRetentionLimit = snapshotRetentionLimit;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getSnapshotWindow}
         * @param snapshotWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#snapshot_window ElasticacheCluster#snapshot_window}.
         * @return {@code this}
         */
        public Builder snapshotWindow(java.lang.String snapshotWindow) {
            this.snapshotWindow = snapshotWindow;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getSubnetGroupName}
         * @param subnetGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#subnet_group_name ElasticacheCluster#subnet_group_name}.
         * @return {@code this}
         */
        public Builder subnetGroupName(java.lang.String subnetGroupName) {
            this.subnetGroupName = subnetGroupName;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#tags ElasticacheCluster#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#tags_all ElasticacheCluster#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#timeouts ElasticacheCluster#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.elasticache_cluster.ElasticacheClusterTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getTransitEncryptionEnabled}
         * @param transitEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#transit_encryption_enabled ElasticacheCluster#transit_encryption_enabled}.
         * @return {@code this}
         */
        public Builder transitEncryptionEnabled(java.lang.Boolean transitEncryptionEnabled) {
            this.transitEncryptionEnabled = transitEncryptionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getTransitEncryptionEnabled}
         * @param transitEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_cluster#transit_encryption_enabled ElasticacheCluster#transit_encryption_enabled}.
         * @return {@code this}
         */
        public Builder transitEncryptionEnabled(com.hashicorp.cdktf.IResolvable transitEncryptionEnabled) {
            this.transitEncryptionEnabled = transitEncryptionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getDependsOn}
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
         * Sets the value of {@link ElasticacheClusterConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheClusterConfig#getProvisioners}
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
         * @return a new instance of {@link ElasticacheClusterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticacheClusterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticacheClusterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticacheClusterConfig {
        private final java.lang.String clusterId;
        private final java.lang.Object applyImmediately;
        private final java.lang.String autoMinorVersionUpgrade;
        private final java.lang.String availabilityZone;
        private final java.lang.String azMode;
        private final java.lang.String engine;
        private final java.lang.String engineVersion;
        private final java.lang.String finalSnapshotIdentifier;
        private final java.lang.String id;
        private final java.lang.String ipDiscovery;
        private final java.lang.Object logDeliveryConfiguration;
        private final java.lang.String maintenanceWindow;
        private final java.lang.String networkType;
        private final java.lang.String nodeType;
        private final java.lang.String notificationTopicArn;
        private final java.lang.Number numCacheNodes;
        private final java.lang.String outpostMode;
        private final java.lang.String parameterGroupName;
        private final java.lang.Number port;
        private final java.util.List<java.lang.String> preferredAvailabilityZones;
        private final java.lang.String preferredOutpostArn;
        private final java.lang.String replicationGroupId;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.util.List<java.lang.String> snapshotArns;
        private final java.lang.String snapshotName;
        private final java.lang.Number snapshotRetentionLimit;
        private final java.lang.String snapshotWindow;
        private final java.lang.String subnetGroupName;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.elasticache_cluster.ElasticacheClusterTimeouts timeouts;
        private final java.lang.Object transitEncryptionEnabled;
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
            this.clusterId = software.amazon.jsii.Kernel.get(this, "clusterId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applyImmediately = software.amazon.jsii.Kernel.get(this, "applyImmediately", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.autoMinorVersionUpgrade = software.amazon.jsii.Kernel.get(this, "autoMinorVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.azMode = software.amazon.jsii.Kernel.get(this, "azMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engine = software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineVersion = software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.finalSnapshotIdentifier = software.amazon.jsii.Kernel.get(this, "finalSnapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipDiscovery = software.amazon.jsii.Kernel.get(this, "ipDiscovery", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logDeliveryConfiguration = software.amazon.jsii.Kernel.get(this, "logDeliveryConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.maintenanceWindow = software.amazon.jsii.Kernel.get(this, "maintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkType = software.amazon.jsii.Kernel.get(this, "networkType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nodeType = software.amazon.jsii.Kernel.get(this, "nodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notificationTopicArn = software.amazon.jsii.Kernel.get(this, "notificationTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.numCacheNodes = software.amazon.jsii.Kernel.get(this, "numCacheNodes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.outpostMode = software.amazon.jsii.Kernel.get(this, "outpostMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameterGroupName = software.amazon.jsii.Kernel.get(this, "parameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.preferredAvailabilityZones = software.amazon.jsii.Kernel.get(this, "preferredAvailabilityZones", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.preferredOutpostArn = software.amazon.jsii.Kernel.get(this, "preferredOutpostArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicationGroupId = software.amazon.jsii.Kernel.get(this, "replicationGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.snapshotArns = software.amazon.jsii.Kernel.get(this, "snapshotArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.snapshotName = software.amazon.jsii.Kernel.get(this, "snapshotName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snapshotRetentionLimit = software.amazon.jsii.Kernel.get(this, "snapshotRetentionLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.snapshotWindow = software.amazon.jsii.Kernel.get(this, "snapshotWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetGroupName = software.amazon.jsii.Kernel.get(this, "subnetGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.elasticache_cluster.ElasticacheClusterTimeouts.class));
            this.transitEncryptionEnabled = software.amazon.jsii.Kernel.get(this, "transitEncryptionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.clusterId = java.util.Objects.requireNonNull(builder.clusterId, "clusterId is required");
            this.applyImmediately = builder.applyImmediately;
            this.autoMinorVersionUpgrade = builder.autoMinorVersionUpgrade;
            this.availabilityZone = builder.availabilityZone;
            this.azMode = builder.azMode;
            this.engine = builder.engine;
            this.engineVersion = builder.engineVersion;
            this.finalSnapshotIdentifier = builder.finalSnapshotIdentifier;
            this.id = builder.id;
            this.ipDiscovery = builder.ipDiscovery;
            this.logDeliveryConfiguration = builder.logDeliveryConfiguration;
            this.maintenanceWindow = builder.maintenanceWindow;
            this.networkType = builder.networkType;
            this.nodeType = builder.nodeType;
            this.notificationTopicArn = builder.notificationTopicArn;
            this.numCacheNodes = builder.numCacheNodes;
            this.outpostMode = builder.outpostMode;
            this.parameterGroupName = builder.parameterGroupName;
            this.port = builder.port;
            this.preferredAvailabilityZones = builder.preferredAvailabilityZones;
            this.preferredOutpostArn = builder.preferredOutpostArn;
            this.replicationGroupId = builder.replicationGroupId;
            this.securityGroupIds = builder.securityGroupIds;
            this.snapshotArns = builder.snapshotArns;
            this.snapshotName = builder.snapshotName;
            this.snapshotRetentionLimit = builder.snapshotRetentionLimit;
            this.snapshotWindow = builder.snapshotWindow;
            this.subnetGroupName = builder.subnetGroupName;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.transitEncryptionEnabled = builder.transitEncryptionEnabled;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getClusterId() {
            return this.clusterId;
        }

        @Override
        public final java.lang.Object getApplyImmediately() {
            return this.applyImmediately;
        }

        @Override
        public final java.lang.String getAutoMinorVersionUpgrade() {
            return this.autoMinorVersionUpgrade;
        }

        @Override
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final java.lang.String getAzMode() {
            return this.azMode;
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
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIpDiscovery() {
            return this.ipDiscovery;
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
        public final java.lang.Number getNumCacheNodes() {
            return this.numCacheNodes;
        }

        @Override
        public final java.lang.String getOutpostMode() {
            return this.outpostMode;
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
        public final java.util.List<java.lang.String> getPreferredAvailabilityZones() {
            return this.preferredAvailabilityZones;
        }

        @Override
        public final java.lang.String getPreferredOutpostArn() {
            return this.preferredOutpostArn;
        }

        @Override
        public final java.lang.String getReplicationGroupId() {
            return this.replicationGroupId;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
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
        public final imports.aws.elasticache_cluster.ElasticacheClusterTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getTransitEncryptionEnabled() {
            return this.transitEncryptionEnabled;
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

            data.set("clusterId", om.valueToTree(this.getClusterId()));
            if (this.getApplyImmediately() != null) {
                data.set("applyImmediately", om.valueToTree(this.getApplyImmediately()));
            }
            if (this.getAutoMinorVersionUpgrade() != null) {
                data.set("autoMinorVersionUpgrade", om.valueToTree(this.getAutoMinorVersionUpgrade()));
            }
            if (this.getAvailabilityZone() != null) {
                data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            }
            if (this.getAzMode() != null) {
                data.set("azMode", om.valueToTree(this.getAzMode()));
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
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpDiscovery() != null) {
                data.set("ipDiscovery", om.valueToTree(this.getIpDiscovery()));
            }
            if (this.getLogDeliveryConfiguration() != null) {
                data.set("logDeliveryConfiguration", om.valueToTree(this.getLogDeliveryConfiguration()));
            }
            if (this.getMaintenanceWindow() != null) {
                data.set("maintenanceWindow", om.valueToTree(this.getMaintenanceWindow()));
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
            if (this.getNumCacheNodes() != null) {
                data.set("numCacheNodes", om.valueToTree(this.getNumCacheNodes()));
            }
            if (this.getOutpostMode() != null) {
                data.set("outpostMode", om.valueToTree(this.getOutpostMode()));
            }
            if (this.getParameterGroupName() != null) {
                data.set("parameterGroupName", om.valueToTree(this.getParameterGroupName()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getPreferredAvailabilityZones() != null) {
                data.set("preferredAvailabilityZones", om.valueToTree(this.getPreferredAvailabilityZones()));
            }
            if (this.getPreferredOutpostArn() != null) {
                data.set("preferredOutpostArn", om.valueToTree(this.getPreferredOutpostArn()));
            }
            if (this.getReplicationGroupId() != null) {
                data.set("replicationGroupId", om.valueToTree(this.getReplicationGroupId()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
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
            struct.set("fqn", om.valueToTree("aws.elasticacheCluster.ElasticacheClusterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticacheClusterConfig.Jsii$Proxy that = (ElasticacheClusterConfig.Jsii$Proxy) o;

            if (!clusterId.equals(that.clusterId)) return false;
            if (this.applyImmediately != null ? !this.applyImmediately.equals(that.applyImmediately) : that.applyImmediately != null) return false;
            if (this.autoMinorVersionUpgrade != null ? !this.autoMinorVersionUpgrade.equals(that.autoMinorVersionUpgrade) : that.autoMinorVersionUpgrade != null) return false;
            if (this.availabilityZone != null ? !this.availabilityZone.equals(that.availabilityZone) : that.availabilityZone != null) return false;
            if (this.azMode != null ? !this.azMode.equals(that.azMode) : that.azMode != null) return false;
            if (this.engine != null ? !this.engine.equals(that.engine) : that.engine != null) return false;
            if (this.engineVersion != null ? !this.engineVersion.equals(that.engineVersion) : that.engineVersion != null) return false;
            if (this.finalSnapshotIdentifier != null ? !this.finalSnapshotIdentifier.equals(that.finalSnapshotIdentifier) : that.finalSnapshotIdentifier != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipDiscovery != null ? !this.ipDiscovery.equals(that.ipDiscovery) : that.ipDiscovery != null) return false;
            if (this.logDeliveryConfiguration != null ? !this.logDeliveryConfiguration.equals(that.logDeliveryConfiguration) : that.logDeliveryConfiguration != null) return false;
            if (this.maintenanceWindow != null ? !this.maintenanceWindow.equals(that.maintenanceWindow) : that.maintenanceWindow != null) return false;
            if (this.networkType != null ? !this.networkType.equals(that.networkType) : that.networkType != null) return false;
            if (this.nodeType != null ? !this.nodeType.equals(that.nodeType) : that.nodeType != null) return false;
            if (this.notificationTopicArn != null ? !this.notificationTopicArn.equals(that.notificationTopicArn) : that.notificationTopicArn != null) return false;
            if (this.numCacheNodes != null ? !this.numCacheNodes.equals(that.numCacheNodes) : that.numCacheNodes != null) return false;
            if (this.outpostMode != null ? !this.outpostMode.equals(that.outpostMode) : that.outpostMode != null) return false;
            if (this.parameterGroupName != null ? !this.parameterGroupName.equals(that.parameterGroupName) : that.parameterGroupName != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.preferredAvailabilityZones != null ? !this.preferredAvailabilityZones.equals(that.preferredAvailabilityZones) : that.preferredAvailabilityZones != null) return false;
            if (this.preferredOutpostArn != null ? !this.preferredOutpostArn.equals(that.preferredOutpostArn) : that.preferredOutpostArn != null) return false;
            if (this.replicationGroupId != null ? !this.replicationGroupId.equals(that.replicationGroupId) : that.replicationGroupId != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.snapshotArns != null ? !this.snapshotArns.equals(that.snapshotArns) : that.snapshotArns != null) return false;
            if (this.snapshotName != null ? !this.snapshotName.equals(that.snapshotName) : that.snapshotName != null) return false;
            if (this.snapshotRetentionLimit != null ? !this.snapshotRetentionLimit.equals(that.snapshotRetentionLimit) : that.snapshotRetentionLimit != null) return false;
            if (this.snapshotWindow != null ? !this.snapshotWindow.equals(that.snapshotWindow) : that.snapshotWindow != null) return false;
            if (this.subnetGroupName != null ? !this.subnetGroupName.equals(that.subnetGroupName) : that.subnetGroupName != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.transitEncryptionEnabled != null ? !this.transitEncryptionEnabled.equals(that.transitEncryptionEnabled) : that.transitEncryptionEnabled != null) return false;
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
            int result = this.clusterId.hashCode();
            result = 31 * result + (this.applyImmediately != null ? this.applyImmediately.hashCode() : 0);
            result = 31 * result + (this.autoMinorVersionUpgrade != null ? this.autoMinorVersionUpgrade.hashCode() : 0);
            result = 31 * result + (this.availabilityZone != null ? this.availabilityZone.hashCode() : 0);
            result = 31 * result + (this.azMode != null ? this.azMode.hashCode() : 0);
            result = 31 * result + (this.engine != null ? this.engine.hashCode() : 0);
            result = 31 * result + (this.engineVersion != null ? this.engineVersion.hashCode() : 0);
            result = 31 * result + (this.finalSnapshotIdentifier != null ? this.finalSnapshotIdentifier.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipDiscovery != null ? this.ipDiscovery.hashCode() : 0);
            result = 31 * result + (this.logDeliveryConfiguration != null ? this.logDeliveryConfiguration.hashCode() : 0);
            result = 31 * result + (this.maintenanceWindow != null ? this.maintenanceWindow.hashCode() : 0);
            result = 31 * result + (this.networkType != null ? this.networkType.hashCode() : 0);
            result = 31 * result + (this.nodeType != null ? this.nodeType.hashCode() : 0);
            result = 31 * result + (this.notificationTopicArn != null ? this.notificationTopicArn.hashCode() : 0);
            result = 31 * result + (this.numCacheNodes != null ? this.numCacheNodes.hashCode() : 0);
            result = 31 * result + (this.outpostMode != null ? this.outpostMode.hashCode() : 0);
            result = 31 * result + (this.parameterGroupName != null ? this.parameterGroupName.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.preferredAvailabilityZones != null ? this.preferredAvailabilityZones.hashCode() : 0);
            result = 31 * result + (this.preferredOutpostArn != null ? this.preferredOutpostArn.hashCode() : 0);
            result = 31 * result + (this.replicationGroupId != null ? this.replicationGroupId.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.snapshotArns != null ? this.snapshotArns.hashCode() : 0);
            result = 31 * result + (this.snapshotName != null ? this.snapshotName.hashCode() : 0);
            result = 31 * result + (this.snapshotRetentionLimit != null ? this.snapshotRetentionLimit.hashCode() : 0);
            result = 31 * result + (this.snapshotWindow != null ? this.snapshotWindow.hashCode() : 0);
            result = 31 * result + (this.subnetGroupName != null ? this.subnetGroupName.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.transitEncryptionEnabled != null ? this.transitEncryptionEnabled.hashCode() : 0);
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
