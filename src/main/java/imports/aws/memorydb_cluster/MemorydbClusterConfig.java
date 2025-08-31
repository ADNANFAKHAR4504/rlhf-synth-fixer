package imports.aws.memorydb_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.898Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.memorydbCluster.MemorydbClusterConfig")
@software.amazon.jsii.Jsii.Proxy(MemorydbClusterConfig.Jsii$Proxy.class)
public interface MemorydbClusterConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#acl_name MemorydbCluster#acl_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAclName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#node_type MemorydbCluster#node_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNodeType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#auto_minor_version_upgrade MemorydbCluster#auto_minor_version_upgrade}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoMinorVersionUpgrade() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#data_tiering MemorydbCluster#data_tiering}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDataTiering() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#description MemorydbCluster#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#engine MemorydbCluster#engine}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngine() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#engine_version MemorydbCluster#engine_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngineVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#final_snapshot_name MemorydbCluster#final_snapshot_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFinalSnapshotName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#id MemorydbCluster#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#kms_key_arn MemorydbCluster#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#maintenance_window MemorydbCluster#maintenance_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaintenanceWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#multi_region_cluster_name MemorydbCluster#multi_region_cluster_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMultiRegionClusterName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#name MemorydbCluster#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#name_prefix MemorydbCluster#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#num_replicas_per_shard MemorydbCluster#num_replicas_per_shard}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumReplicasPerShard() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#num_shards MemorydbCluster#num_shards}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumShards() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#parameter_group_name MemorydbCluster#parameter_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParameterGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#port MemorydbCluster#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#security_group_ids MemorydbCluster#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#snapshot_arns MemorydbCluster#snapshot_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSnapshotArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#snapshot_name MemorydbCluster#snapshot_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#snapshot_retention_limit MemorydbCluster#snapshot_retention_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSnapshotRetentionLimit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#snapshot_window MemorydbCluster#snapshot_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#sns_topic_arn MemorydbCluster#sns_topic_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnsTopicArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#subnet_group_name MemorydbCluster#subnet_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#tags MemorydbCluster#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#tags_all MemorydbCluster#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#timeouts MemorydbCluster#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.memorydb_cluster.MemorydbClusterTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#tls_enabled MemorydbCluster#tls_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTlsEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MemorydbClusterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MemorydbClusterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MemorydbClusterConfig> {
        java.lang.String aclName;
        java.lang.String nodeType;
        java.lang.Object autoMinorVersionUpgrade;
        java.lang.Object dataTiering;
        java.lang.String description;
        java.lang.String engine;
        java.lang.String engineVersion;
        java.lang.String finalSnapshotName;
        java.lang.String id;
        java.lang.String kmsKeyArn;
        java.lang.String maintenanceWindow;
        java.lang.String multiRegionClusterName;
        java.lang.String name;
        java.lang.String namePrefix;
        java.lang.Number numReplicasPerShard;
        java.lang.Number numShards;
        java.lang.String parameterGroupName;
        java.lang.Number port;
        java.util.List<java.lang.String> securityGroupIds;
        java.util.List<java.lang.String> snapshotArns;
        java.lang.String snapshotName;
        java.lang.Number snapshotRetentionLimit;
        java.lang.String snapshotWindow;
        java.lang.String snsTopicArn;
        java.lang.String subnetGroupName;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.memorydb_cluster.MemorydbClusterTimeouts timeouts;
        java.lang.Object tlsEnabled;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link MemorydbClusterConfig#getAclName}
         * @param aclName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#acl_name MemorydbCluster#acl_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder aclName(java.lang.String aclName) {
            this.aclName = aclName;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getNodeType}
         * @param nodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#node_type MemorydbCluster#node_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder nodeType(java.lang.String nodeType) {
            this.nodeType = nodeType;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getAutoMinorVersionUpgrade}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#auto_minor_version_upgrade MemorydbCluster#auto_minor_version_upgrade}.
         * @return {@code this}
         */
        public Builder autoMinorVersionUpgrade(java.lang.Boolean autoMinorVersionUpgrade) {
            this.autoMinorVersionUpgrade = autoMinorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getAutoMinorVersionUpgrade}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#auto_minor_version_upgrade MemorydbCluster#auto_minor_version_upgrade}.
         * @return {@code this}
         */
        public Builder autoMinorVersionUpgrade(com.hashicorp.cdktf.IResolvable autoMinorVersionUpgrade) {
            this.autoMinorVersionUpgrade = autoMinorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getDataTiering}
         * @param dataTiering Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#data_tiering MemorydbCluster#data_tiering}.
         * @return {@code this}
         */
        public Builder dataTiering(java.lang.Boolean dataTiering) {
            this.dataTiering = dataTiering;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getDataTiering}
         * @param dataTiering Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#data_tiering MemorydbCluster#data_tiering}.
         * @return {@code this}
         */
        public Builder dataTiering(com.hashicorp.cdktf.IResolvable dataTiering) {
            this.dataTiering = dataTiering;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#description MemorydbCluster#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getEngine}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#engine MemorydbCluster#engine}.
         * @return {@code this}
         */
        public Builder engine(java.lang.String engine) {
            this.engine = engine;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getEngineVersion}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#engine_version MemorydbCluster#engine_version}.
         * @return {@code this}
         */
        public Builder engineVersion(java.lang.String engineVersion) {
            this.engineVersion = engineVersion;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getFinalSnapshotName}
         * @param finalSnapshotName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#final_snapshot_name MemorydbCluster#final_snapshot_name}.
         * @return {@code this}
         */
        public Builder finalSnapshotName(java.lang.String finalSnapshotName) {
            this.finalSnapshotName = finalSnapshotName;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#id MemorydbCluster#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#kms_key_arn MemorydbCluster#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getMaintenanceWindow}
         * @param maintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#maintenance_window MemorydbCluster#maintenance_window}.
         * @return {@code this}
         */
        public Builder maintenanceWindow(java.lang.String maintenanceWindow) {
            this.maintenanceWindow = maintenanceWindow;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getMultiRegionClusterName}
         * @param multiRegionClusterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#multi_region_cluster_name MemorydbCluster#multi_region_cluster_name}.
         * @return {@code this}
         */
        public Builder multiRegionClusterName(java.lang.String multiRegionClusterName) {
            this.multiRegionClusterName = multiRegionClusterName;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#name MemorydbCluster#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#name_prefix MemorydbCluster#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getNumReplicasPerShard}
         * @param numReplicasPerShard Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#num_replicas_per_shard MemorydbCluster#num_replicas_per_shard}.
         * @return {@code this}
         */
        public Builder numReplicasPerShard(java.lang.Number numReplicasPerShard) {
            this.numReplicasPerShard = numReplicasPerShard;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getNumShards}
         * @param numShards Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#num_shards MemorydbCluster#num_shards}.
         * @return {@code this}
         */
        public Builder numShards(java.lang.Number numShards) {
            this.numShards = numShards;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getParameterGroupName}
         * @param parameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#parameter_group_name MemorydbCluster#parameter_group_name}.
         * @return {@code this}
         */
        public Builder parameterGroupName(java.lang.String parameterGroupName) {
            this.parameterGroupName = parameterGroupName;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#port MemorydbCluster#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#security_group_ids MemorydbCluster#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getSnapshotArns}
         * @param snapshotArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#snapshot_arns MemorydbCluster#snapshot_arns}.
         * @return {@code this}
         */
        public Builder snapshotArns(java.util.List<java.lang.String> snapshotArns) {
            this.snapshotArns = snapshotArns;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getSnapshotName}
         * @param snapshotName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#snapshot_name MemorydbCluster#snapshot_name}.
         * @return {@code this}
         */
        public Builder snapshotName(java.lang.String snapshotName) {
            this.snapshotName = snapshotName;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getSnapshotRetentionLimit}
         * @param snapshotRetentionLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#snapshot_retention_limit MemorydbCluster#snapshot_retention_limit}.
         * @return {@code this}
         */
        public Builder snapshotRetentionLimit(java.lang.Number snapshotRetentionLimit) {
            this.snapshotRetentionLimit = snapshotRetentionLimit;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getSnapshotWindow}
         * @param snapshotWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#snapshot_window MemorydbCluster#snapshot_window}.
         * @return {@code this}
         */
        public Builder snapshotWindow(java.lang.String snapshotWindow) {
            this.snapshotWindow = snapshotWindow;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getSnsTopicArn}
         * @param snsTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#sns_topic_arn MemorydbCluster#sns_topic_arn}.
         * @return {@code this}
         */
        public Builder snsTopicArn(java.lang.String snsTopicArn) {
            this.snsTopicArn = snsTopicArn;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getSubnetGroupName}
         * @param subnetGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#subnet_group_name MemorydbCluster#subnet_group_name}.
         * @return {@code this}
         */
        public Builder subnetGroupName(java.lang.String subnetGroupName) {
            this.subnetGroupName = subnetGroupName;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#tags MemorydbCluster#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#tags_all MemorydbCluster#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#timeouts MemorydbCluster#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.memorydb_cluster.MemorydbClusterTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getTlsEnabled}
         * @param tlsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#tls_enabled MemorydbCluster#tls_enabled}.
         * @return {@code this}
         */
        public Builder tlsEnabled(java.lang.Boolean tlsEnabled) {
            this.tlsEnabled = tlsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getTlsEnabled}
         * @param tlsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_cluster#tls_enabled MemorydbCluster#tls_enabled}.
         * @return {@code this}
         */
        public Builder tlsEnabled(com.hashicorp.cdktf.IResolvable tlsEnabled) {
            this.tlsEnabled = tlsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getDependsOn}
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
         * Sets the value of {@link MemorydbClusterConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbClusterConfig#getProvisioners}
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
         * @return a new instance of {@link MemorydbClusterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MemorydbClusterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MemorydbClusterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MemorydbClusterConfig {
        private final java.lang.String aclName;
        private final java.lang.String nodeType;
        private final java.lang.Object autoMinorVersionUpgrade;
        private final java.lang.Object dataTiering;
        private final java.lang.String description;
        private final java.lang.String engine;
        private final java.lang.String engineVersion;
        private final java.lang.String finalSnapshotName;
        private final java.lang.String id;
        private final java.lang.String kmsKeyArn;
        private final java.lang.String maintenanceWindow;
        private final java.lang.String multiRegionClusterName;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final java.lang.Number numReplicasPerShard;
        private final java.lang.Number numShards;
        private final java.lang.String parameterGroupName;
        private final java.lang.Number port;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.util.List<java.lang.String> snapshotArns;
        private final java.lang.String snapshotName;
        private final java.lang.Number snapshotRetentionLimit;
        private final java.lang.String snapshotWindow;
        private final java.lang.String snsTopicArn;
        private final java.lang.String subnetGroupName;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.memorydb_cluster.MemorydbClusterTimeouts timeouts;
        private final java.lang.Object tlsEnabled;
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
            this.aclName = software.amazon.jsii.Kernel.get(this, "aclName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nodeType = software.amazon.jsii.Kernel.get(this, "nodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.autoMinorVersionUpgrade = software.amazon.jsii.Kernel.get(this, "autoMinorVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dataTiering = software.amazon.jsii.Kernel.get(this, "dataTiering", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engine = software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineVersion = software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.finalSnapshotName = software.amazon.jsii.Kernel.get(this, "finalSnapshotName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maintenanceWindow = software.amazon.jsii.Kernel.get(this, "maintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.multiRegionClusterName = software.amazon.jsii.Kernel.get(this, "multiRegionClusterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.numReplicasPerShard = software.amazon.jsii.Kernel.get(this, "numReplicasPerShard", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.numShards = software.amazon.jsii.Kernel.get(this, "numShards", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.parameterGroupName = software.amazon.jsii.Kernel.get(this, "parameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.snapshotArns = software.amazon.jsii.Kernel.get(this, "snapshotArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.snapshotName = software.amazon.jsii.Kernel.get(this, "snapshotName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snapshotRetentionLimit = software.amazon.jsii.Kernel.get(this, "snapshotRetentionLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.snapshotWindow = software.amazon.jsii.Kernel.get(this, "snapshotWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snsTopicArn = software.amazon.jsii.Kernel.get(this, "snsTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetGroupName = software.amazon.jsii.Kernel.get(this, "subnetGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.memorydb_cluster.MemorydbClusterTimeouts.class));
            this.tlsEnabled = software.amazon.jsii.Kernel.get(this, "tlsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.aclName = java.util.Objects.requireNonNull(builder.aclName, "aclName is required");
            this.nodeType = java.util.Objects.requireNonNull(builder.nodeType, "nodeType is required");
            this.autoMinorVersionUpgrade = builder.autoMinorVersionUpgrade;
            this.dataTiering = builder.dataTiering;
            this.description = builder.description;
            this.engine = builder.engine;
            this.engineVersion = builder.engineVersion;
            this.finalSnapshotName = builder.finalSnapshotName;
            this.id = builder.id;
            this.kmsKeyArn = builder.kmsKeyArn;
            this.maintenanceWindow = builder.maintenanceWindow;
            this.multiRegionClusterName = builder.multiRegionClusterName;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.numReplicasPerShard = builder.numReplicasPerShard;
            this.numShards = builder.numShards;
            this.parameterGroupName = builder.parameterGroupName;
            this.port = builder.port;
            this.securityGroupIds = builder.securityGroupIds;
            this.snapshotArns = builder.snapshotArns;
            this.snapshotName = builder.snapshotName;
            this.snapshotRetentionLimit = builder.snapshotRetentionLimit;
            this.snapshotWindow = builder.snapshotWindow;
            this.snsTopicArn = builder.snsTopicArn;
            this.subnetGroupName = builder.subnetGroupName;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.tlsEnabled = builder.tlsEnabled;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAclName() {
            return this.aclName;
        }

        @Override
        public final java.lang.String getNodeType() {
            return this.nodeType;
        }

        @Override
        public final java.lang.Object getAutoMinorVersionUpgrade() {
            return this.autoMinorVersionUpgrade;
        }

        @Override
        public final java.lang.Object getDataTiering() {
            return this.dataTiering;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
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
        public final java.lang.String getFinalSnapshotName() {
            return this.finalSnapshotName;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final java.lang.String getMaintenanceWindow() {
            return this.maintenanceWindow;
        }

        @Override
        public final java.lang.String getMultiRegionClusterName() {
            return this.multiRegionClusterName;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final java.lang.Number getNumReplicasPerShard() {
            return this.numReplicasPerShard;
        }

        @Override
        public final java.lang.Number getNumShards() {
            return this.numShards;
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
        public final java.lang.String getSnsTopicArn() {
            return this.snsTopicArn;
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
        public final imports.aws.memorydb_cluster.MemorydbClusterTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getTlsEnabled() {
            return this.tlsEnabled;
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

            data.set("aclName", om.valueToTree(this.getAclName()));
            data.set("nodeType", om.valueToTree(this.getNodeType()));
            if (this.getAutoMinorVersionUpgrade() != null) {
                data.set("autoMinorVersionUpgrade", om.valueToTree(this.getAutoMinorVersionUpgrade()));
            }
            if (this.getDataTiering() != null) {
                data.set("dataTiering", om.valueToTree(this.getDataTiering()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEngine() != null) {
                data.set("engine", om.valueToTree(this.getEngine()));
            }
            if (this.getEngineVersion() != null) {
                data.set("engineVersion", om.valueToTree(this.getEngineVersion()));
            }
            if (this.getFinalSnapshotName() != null) {
                data.set("finalSnapshotName", om.valueToTree(this.getFinalSnapshotName()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }
            if (this.getMaintenanceWindow() != null) {
                data.set("maintenanceWindow", om.valueToTree(this.getMaintenanceWindow()));
            }
            if (this.getMultiRegionClusterName() != null) {
                data.set("multiRegionClusterName", om.valueToTree(this.getMultiRegionClusterName()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getNumReplicasPerShard() != null) {
                data.set("numReplicasPerShard", om.valueToTree(this.getNumReplicasPerShard()));
            }
            if (this.getNumShards() != null) {
                data.set("numShards", om.valueToTree(this.getNumShards()));
            }
            if (this.getParameterGroupName() != null) {
                data.set("parameterGroupName", om.valueToTree(this.getParameterGroupName()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
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
            if (this.getSnsTopicArn() != null) {
                data.set("snsTopicArn", om.valueToTree(this.getSnsTopicArn()));
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
            if (this.getTlsEnabled() != null) {
                data.set("tlsEnabled", om.valueToTree(this.getTlsEnabled()));
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
            struct.set("fqn", om.valueToTree("aws.memorydbCluster.MemorydbClusterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MemorydbClusterConfig.Jsii$Proxy that = (MemorydbClusterConfig.Jsii$Proxy) o;

            if (!aclName.equals(that.aclName)) return false;
            if (!nodeType.equals(that.nodeType)) return false;
            if (this.autoMinorVersionUpgrade != null ? !this.autoMinorVersionUpgrade.equals(that.autoMinorVersionUpgrade) : that.autoMinorVersionUpgrade != null) return false;
            if (this.dataTiering != null ? !this.dataTiering.equals(that.dataTiering) : that.dataTiering != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.engine != null ? !this.engine.equals(that.engine) : that.engine != null) return false;
            if (this.engineVersion != null ? !this.engineVersion.equals(that.engineVersion) : that.engineVersion != null) return false;
            if (this.finalSnapshotName != null ? !this.finalSnapshotName.equals(that.finalSnapshotName) : that.finalSnapshotName != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyArn != null ? !this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn != null) return false;
            if (this.maintenanceWindow != null ? !this.maintenanceWindow.equals(that.maintenanceWindow) : that.maintenanceWindow != null) return false;
            if (this.multiRegionClusterName != null ? !this.multiRegionClusterName.equals(that.multiRegionClusterName) : that.multiRegionClusterName != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.numReplicasPerShard != null ? !this.numReplicasPerShard.equals(that.numReplicasPerShard) : that.numReplicasPerShard != null) return false;
            if (this.numShards != null ? !this.numShards.equals(that.numShards) : that.numShards != null) return false;
            if (this.parameterGroupName != null ? !this.parameterGroupName.equals(that.parameterGroupName) : that.parameterGroupName != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.snapshotArns != null ? !this.snapshotArns.equals(that.snapshotArns) : that.snapshotArns != null) return false;
            if (this.snapshotName != null ? !this.snapshotName.equals(that.snapshotName) : that.snapshotName != null) return false;
            if (this.snapshotRetentionLimit != null ? !this.snapshotRetentionLimit.equals(that.snapshotRetentionLimit) : that.snapshotRetentionLimit != null) return false;
            if (this.snapshotWindow != null ? !this.snapshotWindow.equals(that.snapshotWindow) : that.snapshotWindow != null) return false;
            if (this.snsTopicArn != null ? !this.snsTopicArn.equals(that.snsTopicArn) : that.snsTopicArn != null) return false;
            if (this.subnetGroupName != null ? !this.subnetGroupName.equals(that.subnetGroupName) : that.subnetGroupName != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.tlsEnabled != null ? !this.tlsEnabled.equals(that.tlsEnabled) : that.tlsEnabled != null) return false;
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
            int result = this.aclName.hashCode();
            result = 31 * result + (this.nodeType.hashCode());
            result = 31 * result + (this.autoMinorVersionUpgrade != null ? this.autoMinorVersionUpgrade.hashCode() : 0);
            result = 31 * result + (this.dataTiering != null ? this.dataTiering.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.engine != null ? this.engine.hashCode() : 0);
            result = 31 * result + (this.engineVersion != null ? this.engineVersion.hashCode() : 0);
            result = 31 * result + (this.finalSnapshotName != null ? this.finalSnapshotName.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            result = 31 * result + (this.maintenanceWindow != null ? this.maintenanceWindow.hashCode() : 0);
            result = 31 * result + (this.multiRegionClusterName != null ? this.multiRegionClusterName.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.numReplicasPerShard != null ? this.numReplicasPerShard.hashCode() : 0);
            result = 31 * result + (this.numShards != null ? this.numShards.hashCode() : 0);
            result = 31 * result + (this.parameterGroupName != null ? this.parameterGroupName.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.snapshotArns != null ? this.snapshotArns.hashCode() : 0);
            result = 31 * result + (this.snapshotName != null ? this.snapshotName.hashCode() : 0);
            result = 31 * result + (this.snapshotRetentionLimit != null ? this.snapshotRetentionLimit.hashCode() : 0);
            result = 31 * result + (this.snapshotWindow != null ? this.snapshotWindow.hashCode() : 0);
            result = 31 * result + (this.snsTopicArn != null ? this.snsTopicArn.hashCode() : 0);
            result = 31 * result + (this.subnetGroupName != null ? this.subnetGroupName.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.tlsEnabled != null ? this.tlsEnabled.hashCode() : 0);
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
