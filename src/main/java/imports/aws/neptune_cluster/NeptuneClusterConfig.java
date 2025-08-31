package imports.aws.neptune_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.929Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.neptuneCluster.NeptuneClusterConfig")
@software.amazon.jsii.Jsii.Proxy(NeptuneClusterConfig.Jsii$Proxy.class)
public interface NeptuneClusterConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#allow_major_version_upgrade NeptuneCluster#allow_major_version_upgrade}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowMajorVersionUpgrade() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#apply_immediately NeptuneCluster#apply_immediately}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediately() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#availability_zones NeptuneCluster#availability_zones}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAvailabilityZones() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#backup_retention_period NeptuneCluster#backup_retention_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBackupRetentionPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#cluster_identifier NeptuneCluster#cluster_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#cluster_identifier_prefix NeptuneCluster#cluster_identifier_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterIdentifierPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#copy_tags_to_snapshot NeptuneCluster#copy_tags_to_snapshot}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToSnapshot() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#deletion_protection NeptuneCluster#deletion_protection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeletionProtection() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#enable_cloudwatch_logs_exports NeptuneCluster#enable_cloudwatch_logs_exports}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnableCloudwatchLogsExports() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#engine NeptuneCluster#engine}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngine() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#engine_version NeptuneCluster#engine_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngineVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#final_snapshot_identifier NeptuneCluster#final_snapshot_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFinalSnapshotIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#global_cluster_identifier NeptuneCluster#global_cluster_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGlobalClusterIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#iam_database_authentication_enabled NeptuneCluster#iam_database_authentication_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIamDatabaseAuthenticationEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#iam_roles NeptuneCluster#iam_roles}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIamRoles() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#id NeptuneCluster#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#kms_key_arn NeptuneCluster#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#neptune_cluster_parameter_group_name NeptuneCluster#neptune_cluster_parameter_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNeptuneClusterParameterGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#neptune_instance_parameter_group_name NeptuneCluster#neptune_instance_parameter_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNeptuneInstanceParameterGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#neptune_subnet_group_name NeptuneCluster#neptune_subnet_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNeptuneSubnetGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#port NeptuneCluster#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#preferred_backup_window NeptuneCluster#preferred_backup_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredBackupWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#preferred_maintenance_window NeptuneCluster#preferred_maintenance_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredMaintenanceWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#replication_source_identifier NeptuneCluster#replication_source_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplicationSourceIdentifier() {
        return null;
    }

    /**
     * serverless_v2_scaling_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#serverless_v2_scaling_configuration NeptuneCluster#serverless_v2_scaling_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfiguration getServerlessV2ScalingConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#skip_final_snapshot NeptuneCluster#skip_final_snapshot}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalSnapshot() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#snapshot_identifier NeptuneCluster#snapshot_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#storage_encrypted NeptuneCluster#storage_encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStorageEncrypted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#storage_type NeptuneCluster#storage_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#tags NeptuneCluster#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#tags_all NeptuneCluster#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#timeouts NeptuneCluster#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.neptune_cluster.NeptuneClusterTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#vpc_security_group_ids NeptuneCluster#vpc_security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NeptuneClusterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NeptuneClusterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NeptuneClusterConfig> {
        java.lang.Object allowMajorVersionUpgrade;
        java.lang.Object applyImmediately;
        java.util.List<java.lang.String> availabilityZones;
        java.lang.Number backupRetentionPeriod;
        java.lang.String clusterIdentifier;
        java.lang.String clusterIdentifierPrefix;
        java.lang.Object copyTagsToSnapshot;
        java.lang.Object deletionProtection;
        java.util.List<java.lang.String> enableCloudwatchLogsExports;
        java.lang.String engine;
        java.lang.String engineVersion;
        java.lang.String finalSnapshotIdentifier;
        java.lang.String globalClusterIdentifier;
        java.lang.Object iamDatabaseAuthenticationEnabled;
        java.util.List<java.lang.String> iamRoles;
        java.lang.String id;
        java.lang.String kmsKeyArn;
        java.lang.String neptuneClusterParameterGroupName;
        java.lang.String neptuneInstanceParameterGroupName;
        java.lang.String neptuneSubnetGroupName;
        java.lang.Number port;
        java.lang.String preferredBackupWindow;
        java.lang.String preferredMaintenanceWindow;
        java.lang.String replicationSourceIdentifier;
        imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfiguration serverlessV2ScalingConfiguration;
        java.lang.Object skipFinalSnapshot;
        java.lang.String snapshotIdentifier;
        java.lang.Object storageEncrypted;
        java.lang.String storageType;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.neptune_cluster.NeptuneClusterTimeouts timeouts;
        java.util.List<java.lang.String> vpcSecurityGroupIds;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link NeptuneClusterConfig#getAllowMajorVersionUpgrade}
         * @param allowMajorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#allow_major_version_upgrade NeptuneCluster#allow_major_version_upgrade}.
         * @return {@code this}
         */
        public Builder allowMajorVersionUpgrade(java.lang.Boolean allowMajorVersionUpgrade) {
            this.allowMajorVersionUpgrade = allowMajorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getAllowMajorVersionUpgrade}
         * @param allowMajorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#allow_major_version_upgrade NeptuneCluster#allow_major_version_upgrade}.
         * @return {@code this}
         */
        public Builder allowMajorVersionUpgrade(com.hashicorp.cdktf.IResolvable allowMajorVersionUpgrade) {
            this.allowMajorVersionUpgrade = allowMajorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#apply_immediately NeptuneCluster#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(java.lang.Boolean applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#apply_immediately NeptuneCluster#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getAvailabilityZones}
         * @param availabilityZones Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#availability_zones NeptuneCluster#availability_zones}.
         * @return {@code this}
         */
        public Builder availabilityZones(java.util.List<java.lang.String> availabilityZones) {
            this.availabilityZones = availabilityZones;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getBackupRetentionPeriod}
         * @param backupRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#backup_retention_period NeptuneCluster#backup_retention_period}.
         * @return {@code this}
         */
        public Builder backupRetentionPeriod(java.lang.Number backupRetentionPeriod) {
            this.backupRetentionPeriod = backupRetentionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getClusterIdentifier}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#cluster_identifier NeptuneCluster#cluster_identifier}.
         * @return {@code this}
         */
        public Builder clusterIdentifier(java.lang.String clusterIdentifier) {
            this.clusterIdentifier = clusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getClusterIdentifierPrefix}
         * @param clusterIdentifierPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#cluster_identifier_prefix NeptuneCluster#cluster_identifier_prefix}.
         * @return {@code this}
         */
        public Builder clusterIdentifierPrefix(java.lang.String clusterIdentifierPrefix) {
            this.clusterIdentifierPrefix = clusterIdentifierPrefix;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getCopyTagsToSnapshot}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#copy_tags_to_snapshot NeptuneCluster#copy_tags_to_snapshot}.
         * @return {@code this}
         */
        public Builder copyTagsToSnapshot(java.lang.Boolean copyTagsToSnapshot) {
            this.copyTagsToSnapshot = copyTagsToSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getCopyTagsToSnapshot}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#copy_tags_to_snapshot NeptuneCluster#copy_tags_to_snapshot}.
         * @return {@code this}
         */
        public Builder copyTagsToSnapshot(com.hashicorp.cdktf.IResolvable copyTagsToSnapshot) {
            this.copyTagsToSnapshot = copyTagsToSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getDeletionProtection}
         * @param deletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#deletion_protection NeptuneCluster#deletion_protection}.
         * @return {@code this}
         */
        public Builder deletionProtection(java.lang.Boolean deletionProtection) {
            this.deletionProtection = deletionProtection;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getDeletionProtection}
         * @param deletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#deletion_protection NeptuneCluster#deletion_protection}.
         * @return {@code this}
         */
        public Builder deletionProtection(com.hashicorp.cdktf.IResolvable deletionProtection) {
            this.deletionProtection = deletionProtection;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getEnableCloudwatchLogsExports}
         * @param enableCloudwatchLogsExports Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#enable_cloudwatch_logs_exports NeptuneCluster#enable_cloudwatch_logs_exports}.
         * @return {@code this}
         */
        public Builder enableCloudwatchLogsExports(java.util.List<java.lang.String> enableCloudwatchLogsExports) {
            this.enableCloudwatchLogsExports = enableCloudwatchLogsExports;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getEngine}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#engine NeptuneCluster#engine}.
         * @return {@code this}
         */
        public Builder engine(java.lang.String engine) {
            this.engine = engine;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getEngineVersion}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#engine_version NeptuneCluster#engine_version}.
         * @return {@code this}
         */
        public Builder engineVersion(java.lang.String engineVersion) {
            this.engineVersion = engineVersion;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getFinalSnapshotIdentifier}
         * @param finalSnapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#final_snapshot_identifier NeptuneCluster#final_snapshot_identifier}.
         * @return {@code this}
         */
        public Builder finalSnapshotIdentifier(java.lang.String finalSnapshotIdentifier) {
            this.finalSnapshotIdentifier = finalSnapshotIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getGlobalClusterIdentifier}
         * @param globalClusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#global_cluster_identifier NeptuneCluster#global_cluster_identifier}.
         * @return {@code this}
         */
        public Builder globalClusterIdentifier(java.lang.String globalClusterIdentifier) {
            this.globalClusterIdentifier = globalClusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getIamDatabaseAuthenticationEnabled}
         * @param iamDatabaseAuthenticationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#iam_database_authentication_enabled NeptuneCluster#iam_database_authentication_enabled}.
         * @return {@code this}
         */
        public Builder iamDatabaseAuthenticationEnabled(java.lang.Boolean iamDatabaseAuthenticationEnabled) {
            this.iamDatabaseAuthenticationEnabled = iamDatabaseAuthenticationEnabled;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getIamDatabaseAuthenticationEnabled}
         * @param iamDatabaseAuthenticationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#iam_database_authentication_enabled NeptuneCluster#iam_database_authentication_enabled}.
         * @return {@code this}
         */
        public Builder iamDatabaseAuthenticationEnabled(com.hashicorp.cdktf.IResolvable iamDatabaseAuthenticationEnabled) {
            this.iamDatabaseAuthenticationEnabled = iamDatabaseAuthenticationEnabled;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getIamRoles}
         * @param iamRoles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#iam_roles NeptuneCluster#iam_roles}.
         * @return {@code this}
         */
        public Builder iamRoles(java.util.List<java.lang.String> iamRoles) {
            this.iamRoles = iamRoles;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#id NeptuneCluster#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#kms_key_arn NeptuneCluster#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getNeptuneClusterParameterGroupName}
         * @param neptuneClusterParameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#neptune_cluster_parameter_group_name NeptuneCluster#neptune_cluster_parameter_group_name}.
         * @return {@code this}
         */
        public Builder neptuneClusterParameterGroupName(java.lang.String neptuneClusterParameterGroupName) {
            this.neptuneClusterParameterGroupName = neptuneClusterParameterGroupName;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getNeptuneInstanceParameterGroupName}
         * @param neptuneInstanceParameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#neptune_instance_parameter_group_name NeptuneCluster#neptune_instance_parameter_group_name}.
         * @return {@code this}
         */
        public Builder neptuneInstanceParameterGroupName(java.lang.String neptuneInstanceParameterGroupName) {
            this.neptuneInstanceParameterGroupName = neptuneInstanceParameterGroupName;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getNeptuneSubnetGroupName}
         * @param neptuneSubnetGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#neptune_subnet_group_name NeptuneCluster#neptune_subnet_group_name}.
         * @return {@code this}
         */
        public Builder neptuneSubnetGroupName(java.lang.String neptuneSubnetGroupName) {
            this.neptuneSubnetGroupName = neptuneSubnetGroupName;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#port NeptuneCluster#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getPreferredBackupWindow}
         * @param preferredBackupWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#preferred_backup_window NeptuneCluster#preferred_backup_window}.
         * @return {@code this}
         */
        public Builder preferredBackupWindow(java.lang.String preferredBackupWindow) {
            this.preferredBackupWindow = preferredBackupWindow;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getPreferredMaintenanceWindow}
         * @param preferredMaintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#preferred_maintenance_window NeptuneCluster#preferred_maintenance_window}.
         * @return {@code this}
         */
        public Builder preferredMaintenanceWindow(java.lang.String preferredMaintenanceWindow) {
            this.preferredMaintenanceWindow = preferredMaintenanceWindow;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getReplicationSourceIdentifier}
         * @param replicationSourceIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#replication_source_identifier NeptuneCluster#replication_source_identifier}.
         * @return {@code this}
         */
        public Builder replicationSourceIdentifier(java.lang.String replicationSourceIdentifier) {
            this.replicationSourceIdentifier = replicationSourceIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getServerlessV2ScalingConfiguration}
         * @param serverlessV2ScalingConfiguration serverless_v2_scaling_configuration block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#serverless_v2_scaling_configuration NeptuneCluster#serverless_v2_scaling_configuration}
         * @return {@code this}
         */
        public Builder serverlessV2ScalingConfiguration(imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfiguration serverlessV2ScalingConfiguration) {
            this.serverlessV2ScalingConfiguration = serverlessV2ScalingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getSkipFinalSnapshot}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#skip_final_snapshot NeptuneCluster#skip_final_snapshot}.
         * @return {@code this}
         */
        public Builder skipFinalSnapshot(java.lang.Boolean skipFinalSnapshot) {
            this.skipFinalSnapshot = skipFinalSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getSkipFinalSnapshot}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#skip_final_snapshot NeptuneCluster#skip_final_snapshot}.
         * @return {@code this}
         */
        public Builder skipFinalSnapshot(com.hashicorp.cdktf.IResolvable skipFinalSnapshot) {
            this.skipFinalSnapshot = skipFinalSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getSnapshotIdentifier}
         * @param snapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#snapshot_identifier NeptuneCluster#snapshot_identifier}.
         * @return {@code this}
         */
        public Builder snapshotIdentifier(java.lang.String snapshotIdentifier) {
            this.snapshotIdentifier = snapshotIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getStorageEncrypted}
         * @param storageEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#storage_encrypted NeptuneCluster#storage_encrypted}.
         * @return {@code this}
         */
        public Builder storageEncrypted(java.lang.Boolean storageEncrypted) {
            this.storageEncrypted = storageEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getStorageEncrypted}
         * @param storageEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#storage_encrypted NeptuneCluster#storage_encrypted}.
         * @return {@code this}
         */
        public Builder storageEncrypted(com.hashicorp.cdktf.IResolvable storageEncrypted) {
            this.storageEncrypted = storageEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getStorageType}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#storage_type NeptuneCluster#storage_type}.
         * @return {@code this}
         */
        public Builder storageType(java.lang.String storageType) {
            this.storageType = storageType;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#tags NeptuneCluster#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#tags_all NeptuneCluster#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#timeouts NeptuneCluster#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.neptune_cluster.NeptuneClusterTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getVpcSecurityGroupIds}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#vpc_security_group_ids NeptuneCluster#vpc_security_group_ids}.
         * @return {@code this}
         */
        public Builder vpcSecurityGroupIds(java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.vpcSecurityGroupIds = vpcSecurityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getDependsOn}
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
         * Sets the value of {@link NeptuneClusterConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterConfig#getProvisioners}
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
         * @return a new instance of {@link NeptuneClusterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NeptuneClusterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NeptuneClusterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NeptuneClusterConfig {
        private final java.lang.Object allowMajorVersionUpgrade;
        private final java.lang.Object applyImmediately;
        private final java.util.List<java.lang.String> availabilityZones;
        private final java.lang.Number backupRetentionPeriod;
        private final java.lang.String clusterIdentifier;
        private final java.lang.String clusterIdentifierPrefix;
        private final java.lang.Object copyTagsToSnapshot;
        private final java.lang.Object deletionProtection;
        private final java.util.List<java.lang.String> enableCloudwatchLogsExports;
        private final java.lang.String engine;
        private final java.lang.String engineVersion;
        private final java.lang.String finalSnapshotIdentifier;
        private final java.lang.String globalClusterIdentifier;
        private final java.lang.Object iamDatabaseAuthenticationEnabled;
        private final java.util.List<java.lang.String> iamRoles;
        private final java.lang.String id;
        private final java.lang.String kmsKeyArn;
        private final java.lang.String neptuneClusterParameterGroupName;
        private final java.lang.String neptuneInstanceParameterGroupName;
        private final java.lang.String neptuneSubnetGroupName;
        private final java.lang.Number port;
        private final java.lang.String preferredBackupWindow;
        private final java.lang.String preferredMaintenanceWindow;
        private final java.lang.String replicationSourceIdentifier;
        private final imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfiguration serverlessV2ScalingConfiguration;
        private final java.lang.Object skipFinalSnapshot;
        private final java.lang.String snapshotIdentifier;
        private final java.lang.Object storageEncrypted;
        private final java.lang.String storageType;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.neptune_cluster.NeptuneClusterTimeouts timeouts;
        private final java.util.List<java.lang.String> vpcSecurityGroupIds;
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
            this.allowMajorVersionUpgrade = software.amazon.jsii.Kernel.get(this, "allowMajorVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.applyImmediately = software.amazon.jsii.Kernel.get(this, "applyImmediately", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.availabilityZones = software.amazon.jsii.Kernel.get(this, "availabilityZones", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.backupRetentionPeriod = software.amazon.jsii.Kernel.get(this, "backupRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.clusterIdentifier = software.amazon.jsii.Kernel.get(this, "clusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterIdentifierPrefix = software.amazon.jsii.Kernel.get(this, "clusterIdentifierPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyTagsToSnapshot = software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deletionProtection = software.amazon.jsii.Kernel.get(this, "deletionProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableCloudwatchLogsExports = software.amazon.jsii.Kernel.get(this, "enableCloudwatchLogsExports", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.engine = software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineVersion = software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.finalSnapshotIdentifier = software.amazon.jsii.Kernel.get(this, "finalSnapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.globalClusterIdentifier = software.amazon.jsii.Kernel.get(this, "globalClusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamDatabaseAuthenticationEnabled = software.amazon.jsii.Kernel.get(this, "iamDatabaseAuthenticationEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.iamRoles = software.amazon.jsii.Kernel.get(this, "iamRoles", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.neptuneClusterParameterGroupName = software.amazon.jsii.Kernel.get(this, "neptuneClusterParameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.neptuneInstanceParameterGroupName = software.amazon.jsii.Kernel.get(this, "neptuneInstanceParameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.neptuneSubnetGroupName = software.amazon.jsii.Kernel.get(this, "neptuneSubnetGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.preferredBackupWindow = software.amazon.jsii.Kernel.get(this, "preferredBackupWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preferredMaintenanceWindow = software.amazon.jsii.Kernel.get(this, "preferredMaintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicationSourceIdentifier = software.amazon.jsii.Kernel.get(this, "replicationSourceIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverlessV2ScalingConfiguration = software.amazon.jsii.Kernel.get(this, "serverlessV2ScalingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfiguration.class));
            this.skipFinalSnapshot = software.amazon.jsii.Kernel.get(this, "skipFinalSnapshot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.snapshotIdentifier = software.amazon.jsii.Kernel.get(this, "snapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.storageEncrypted = software.amazon.jsii.Kernel.get(this, "storageEncrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.storageType = software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.neptune_cluster.NeptuneClusterTimeouts.class));
            this.vpcSecurityGroupIds = software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.allowMajorVersionUpgrade = builder.allowMajorVersionUpgrade;
            this.applyImmediately = builder.applyImmediately;
            this.availabilityZones = builder.availabilityZones;
            this.backupRetentionPeriod = builder.backupRetentionPeriod;
            this.clusterIdentifier = builder.clusterIdentifier;
            this.clusterIdentifierPrefix = builder.clusterIdentifierPrefix;
            this.copyTagsToSnapshot = builder.copyTagsToSnapshot;
            this.deletionProtection = builder.deletionProtection;
            this.enableCloudwatchLogsExports = builder.enableCloudwatchLogsExports;
            this.engine = builder.engine;
            this.engineVersion = builder.engineVersion;
            this.finalSnapshotIdentifier = builder.finalSnapshotIdentifier;
            this.globalClusterIdentifier = builder.globalClusterIdentifier;
            this.iamDatabaseAuthenticationEnabled = builder.iamDatabaseAuthenticationEnabled;
            this.iamRoles = builder.iamRoles;
            this.id = builder.id;
            this.kmsKeyArn = builder.kmsKeyArn;
            this.neptuneClusterParameterGroupName = builder.neptuneClusterParameterGroupName;
            this.neptuneInstanceParameterGroupName = builder.neptuneInstanceParameterGroupName;
            this.neptuneSubnetGroupName = builder.neptuneSubnetGroupName;
            this.port = builder.port;
            this.preferredBackupWindow = builder.preferredBackupWindow;
            this.preferredMaintenanceWindow = builder.preferredMaintenanceWindow;
            this.replicationSourceIdentifier = builder.replicationSourceIdentifier;
            this.serverlessV2ScalingConfiguration = builder.serverlessV2ScalingConfiguration;
            this.skipFinalSnapshot = builder.skipFinalSnapshot;
            this.snapshotIdentifier = builder.snapshotIdentifier;
            this.storageEncrypted = builder.storageEncrypted;
            this.storageType = builder.storageType;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.vpcSecurityGroupIds = builder.vpcSecurityGroupIds;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getAllowMajorVersionUpgrade() {
            return this.allowMajorVersionUpgrade;
        }

        @Override
        public final java.lang.Object getApplyImmediately() {
            return this.applyImmediately;
        }

        @Override
        public final java.util.List<java.lang.String> getAvailabilityZones() {
            return this.availabilityZones;
        }

        @Override
        public final java.lang.Number getBackupRetentionPeriod() {
            return this.backupRetentionPeriod;
        }

        @Override
        public final java.lang.String getClusterIdentifier() {
            return this.clusterIdentifier;
        }

        @Override
        public final java.lang.String getClusterIdentifierPrefix() {
            return this.clusterIdentifierPrefix;
        }

        @Override
        public final java.lang.Object getCopyTagsToSnapshot() {
            return this.copyTagsToSnapshot;
        }

        @Override
        public final java.lang.Object getDeletionProtection() {
            return this.deletionProtection;
        }

        @Override
        public final java.util.List<java.lang.String> getEnableCloudwatchLogsExports() {
            return this.enableCloudwatchLogsExports;
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
        public final java.lang.String getGlobalClusterIdentifier() {
            return this.globalClusterIdentifier;
        }

        @Override
        public final java.lang.Object getIamDatabaseAuthenticationEnabled() {
            return this.iamDatabaseAuthenticationEnabled;
        }

        @Override
        public final java.util.List<java.lang.String> getIamRoles() {
            return this.iamRoles;
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
        public final java.lang.String getNeptuneClusterParameterGroupName() {
            return this.neptuneClusterParameterGroupName;
        }

        @Override
        public final java.lang.String getNeptuneInstanceParameterGroupName() {
            return this.neptuneInstanceParameterGroupName;
        }

        @Override
        public final java.lang.String getNeptuneSubnetGroupName() {
            return this.neptuneSubnetGroupName;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getPreferredBackupWindow() {
            return this.preferredBackupWindow;
        }

        @Override
        public final java.lang.String getPreferredMaintenanceWindow() {
            return this.preferredMaintenanceWindow;
        }

        @Override
        public final java.lang.String getReplicationSourceIdentifier() {
            return this.replicationSourceIdentifier;
        }

        @Override
        public final imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfiguration getServerlessV2ScalingConfiguration() {
            return this.serverlessV2ScalingConfiguration;
        }

        @Override
        public final java.lang.Object getSkipFinalSnapshot() {
            return this.skipFinalSnapshot;
        }

        @Override
        public final java.lang.String getSnapshotIdentifier() {
            return this.snapshotIdentifier;
        }

        @Override
        public final java.lang.Object getStorageEncrypted() {
            return this.storageEncrypted;
        }

        @Override
        public final java.lang.String getStorageType() {
            return this.storageType;
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
        public final imports.aws.neptune_cluster.NeptuneClusterTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.util.List<java.lang.String> getVpcSecurityGroupIds() {
            return this.vpcSecurityGroupIds;
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

            if (this.getAllowMajorVersionUpgrade() != null) {
                data.set("allowMajorVersionUpgrade", om.valueToTree(this.getAllowMajorVersionUpgrade()));
            }
            if (this.getApplyImmediately() != null) {
                data.set("applyImmediately", om.valueToTree(this.getApplyImmediately()));
            }
            if (this.getAvailabilityZones() != null) {
                data.set("availabilityZones", om.valueToTree(this.getAvailabilityZones()));
            }
            if (this.getBackupRetentionPeriod() != null) {
                data.set("backupRetentionPeriod", om.valueToTree(this.getBackupRetentionPeriod()));
            }
            if (this.getClusterIdentifier() != null) {
                data.set("clusterIdentifier", om.valueToTree(this.getClusterIdentifier()));
            }
            if (this.getClusterIdentifierPrefix() != null) {
                data.set("clusterIdentifierPrefix", om.valueToTree(this.getClusterIdentifierPrefix()));
            }
            if (this.getCopyTagsToSnapshot() != null) {
                data.set("copyTagsToSnapshot", om.valueToTree(this.getCopyTagsToSnapshot()));
            }
            if (this.getDeletionProtection() != null) {
                data.set("deletionProtection", om.valueToTree(this.getDeletionProtection()));
            }
            if (this.getEnableCloudwatchLogsExports() != null) {
                data.set("enableCloudwatchLogsExports", om.valueToTree(this.getEnableCloudwatchLogsExports()));
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
            if (this.getGlobalClusterIdentifier() != null) {
                data.set("globalClusterIdentifier", om.valueToTree(this.getGlobalClusterIdentifier()));
            }
            if (this.getIamDatabaseAuthenticationEnabled() != null) {
                data.set("iamDatabaseAuthenticationEnabled", om.valueToTree(this.getIamDatabaseAuthenticationEnabled()));
            }
            if (this.getIamRoles() != null) {
                data.set("iamRoles", om.valueToTree(this.getIamRoles()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }
            if (this.getNeptuneClusterParameterGroupName() != null) {
                data.set("neptuneClusterParameterGroupName", om.valueToTree(this.getNeptuneClusterParameterGroupName()));
            }
            if (this.getNeptuneInstanceParameterGroupName() != null) {
                data.set("neptuneInstanceParameterGroupName", om.valueToTree(this.getNeptuneInstanceParameterGroupName()));
            }
            if (this.getNeptuneSubnetGroupName() != null) {
                data.set("neptuneSubnetGroupName", om.valueToTree(this.getNeptuneSubnetGroupName()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getPreferredBackupWindow() != null) {
                data.set("preferredBackupWindow", om.valueToTree(this.getPreferredBackupWindow()));
            }
            if (this.getPreferredMaintenanceWindow() != null) {
                data.set("preferredMaintenanceWindow", om.valueToTree(this.getPreferredMaintenanceWindow()));
            }
            if (this.getReplicationSourceIdentifier() != null) {
                data.set("replicationSourceIdentifier", om.valueToTree(this.getReplicationSourceIdentifier()));
            }
            if (this.getServerlessV2ScalingConfiguration() != null) {
                data.set("serverlessV2ScalingConfiguration", om.valueToTree(this.getServerlessV2ScalingConfiguration()));
            }
            if (this.getSkipFinalSnapshot() != null) {
                data.set("skipFinalSnapshot", om.valueToTree(this.getSkipFinalSnapshot()));
            }
            if (this.getSnapshotIdentifier() != null) {
                data.set("snapshotIdentifier", om.valueToTree(this.getSnapshotIdentifier()));
            }
            if (this.getStorageEncrypted() != null) {
                data.set("storageEncrypted", om.valueToTree(this.getStorageEncrypted()));
            }
            if (this.getStorageType() != null) {
                data.set("storageType", om.valueToTree(this.getStorageType()));
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
            if (this.getVpcSecurityGroupIds() != null) {
                data.set("vpcSecurityGroupIds", om.valueToTree(this.getVpcSecurityGroupIds()));
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
            struct.set("fqn", om.valueToTree("aws.neptuneCluster.NeptuneClusterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NeptuneClusterConfig.Jsii$Proxy that = (NeptuneClusterConfig.Jsii$Proxy) o;

            if (this.allowMajorVersionUpgrade != null ? !this.allowMajorVersionUpgrade.equals(that.allowMajorVersionUpgrade) : that.allowMajorVersionUpgrade != null) return false;
            if (this.applyImmediately != null ? !this.applyImmediately.equals(that.applyImmediately) : that.applyImmediately != null) return false;
            if (this.availabilityZones != null ? !this.availabilityZones.equals(that.availabilityZones) : that.availabilityZones != null) return false;
            if (this.backupRetentionPeriod != null ? !this.backupRetentionPeriod.equals(that.backupRetentionPeriod) : that.backupRetentionPeriod != null) return false;
            if (this.clusterIdentifier != null ? !this.clusterIdentifier.equals(that.clusterIdentifier) : that.clusterIdentifier != null) return false;
            if (this.clusterIdentifierPrefix != null ? !this.clusterIdentifierPrefix.equals(that.clusterIdentifierPrefix) : that.clusterIdentifierPrefix != null) return false;
            if (this.copyTagsToSnapshot != null ? !this.copyTagsToSnapshot.equals(that.copyTagsToSnapshot) : that.copyTagsToSnapshot != null) return false;
            if (this.deletionProtection != null ? !this.deletionProtection.equals(that.deletionProtection) : that.deletionProtection != null) return false;
            if (this.enableCloudwatchLogsExports != null ? !this.enableCloudwatchLogsExports.equals(that.enableCloudwatchLogsExports) : that.enableCloudwatchLogsExports != null) return false;
            if (this.engine != null ? !this.engine.equals(that.engine) : that.engine != null) return false;
            if (this.engineVersion != null ? !this.engineVersion.equals(that.engineVersion) : that.engineVersion != null) return false;
            if (this.finalSnapshotIdentifier != null ? !this.finalSnapshotIdentifier.equals(that.finalSnapshotIdentifier) : that.finalSnapshotIdentifier != null) return false;
            if (this.globalClusterIdentifier != null ? !this.globalClusterIdentifier.equals(that.globalClusterIdentifier) : that.globalClusterIdentifier != null) return false;
            if (this.iamDatabaseAuthenticationEnabled != null ? !this.iamDatabaseAuthenticationEnabled.equals(that.iamDatabaseAuthenticationEnabled) : that.iamDatabaseAuthenticationEnabled != null) return false;
            if (this.iamRoles != null ? !this.iamRoles.equals(that.iamRoles) : that.iamRoles != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyArn != null ? !this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn != null) return false;
            if (this.neptuneClusterParameterGroupName != null ? !this.neptuneClusterParameterGroupName.equals(that.neptuneClusterParameterGroupName) : that.neptuneClusterParameterGroupName != null) return false;
            if (this.neptuneInstanceParameterGroupName != null ? !this.neptuneInstanceParameterGroupName.equals(that.neptuneInstanceParameterGroupName) : that.neptuneInstanceParameterGroupName != null) return false;
            if (this.neptuneSubnetGroupName != null ? !this.neptuneSubnetGroupName.equals(that.neptuneSubnetGroupName) : that.neptuneSubnetGroupName != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.preferredBackupWindow != null ? !this.preferredBackupWindow.equals(that.preferredBackupWindow) : that.preferredBackupWindow != null) return false;
            if (this.preferredMaintenanceWindow != null ? !this.preferredMaintenanceWindow.equals(that.preferredMaintenanceWindow) : that.preferredMaintenanceWindow != null) return false;
            if (this.replicationSourceIdentifier != null ? !this.replicationSourceIdentifier.equals(that.replicationSourceIdentifier) : that.replicationSourceIdentifier != null) return false;
            if (this.serverlessV2ScalingConfiguration != null ? !this.serverlessV2ScalingConfiguration.equals(that.serverlessV2ScalingConfiguration) : that.serverlessV2ScalingConfiguration != null) return false;
            if (this.skipFinalSnapshot != null ? !this.skipFinalSnapshot.equals(that.skipFinalSnapshot) : that.skipFinalSnapshot != null) return false;
            if (this.snapshotIdentifier != null ? !this.snapshotIdentifier.equals(that.snapshotIdentifier) : that.snapshotIdentifier != null) return false;
            if (this.storageEncrypted != null ? !this.storageEncrypted.equals(that.storageEncrypted) : that.storageEncrypted != null) return false;
            if (this.storageType != null ? !this.storageType.equals(that.storageType) : that.storageType != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.vpcSecurityGroupIds != null ? !this.vpcSecurityGroupIds.equals(that.vpcSecurityGroupIds) : that.vpcSecurityGroupIds != null) return false;
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
            int result = this.allowMajorVersionUpgrade != null ? this.allowMajorVersionUpgrade.hashCode() : 0;
            result = 31 * result + (this.applyImmediately != null ? this.applyImmediately.hashCode() : 0);
            result = 31 * result + (this.availabilityZones != null ? this.availabilityZones.hashCode() : 0);
            result = 31 * result + (this.backupRetentionPeriod != null ? this.backupRetentionPeriod.hashCode() : 0);
            result = 31 * result + (this.clusterIdentifier != null ? this.clusterIdentifier.hashCode() : 0);
            result = 31 * result + (this.clusterIdentifierPrefix != null ? this.clusterIdentifierPrefix.hashCode() : 0);
            result = 31 * result + (this.copyTagsToSnapshot != null ? this.copyTagsToSnapshot.hashCode() : 0);
            result = 31 * result + (this.deletionProtection != null ? this.deletionProtection.hashCode() : 0);
            result = 31 * result + (this.enableCloudwatchLogsExports != null ? this.enableCloudwatchLogsExports.hashCode() : 0);
            result = 31 * result + (this.engine != null ? this.engine.hashCode() : 0);
            result = 31 * result + (this.engineVersion != null ? this.engineVersion.hashCode() : 0);
            result = 31 * result + (this.finalSnapshotIdentifier != null ? this.finalSnapshotIdentifier.hashCode() : 0);
            result = 31 * result + (this.globalClusterIdentifier != null ? this.globalClusterIdentifier.hashCode() : 0);
            result = 31 * result + (this.iamDatabaseAuthenticationEnabled != null ? this.iamDatabaseAuthenticationEnabled.hashCode() : 0);
            result = 31 * result + (this.iamRoles != null ? this.iamRoles.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            result = 31 * result + (this.neptuneClusterParameterGroupName != null ? this.neptuneClusterParameterGroupName.hashCode() : 0);
            result = 31 * result + (this.neptuneInstanceParameterGroupName != null ? this.neptuneInstanceParameterGroupName.hashCode() : 0);
            result = 31 * result + (this.neptuneSubnetGroupName != null ? this.neptuneSubnetGroupName.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.preferredBackupWindow != null ? this.preferredBackupWindow.hashCode() : 0);
            result = 31 * result + (this.preferredMaintenanceWindow != null ? this.preferredMaintenanceWindow.hashCode() : 0);
            result = 31 * result + (this.replicationSourceIdentifier != null ? this.replicationSourceIdentifier.hashCode() : 0);
            result = 31 * result + (this.serverlessV2ScalingConfiguration != null ? this.serverlessV2ScalingConfiguration.hashCode() : 0);
            result = 31 * result + (this.skipFinalSnapshot != null ? this.skipFinalSnapshot.hashCode() : 0);
            result = 31 * result + (this.snapshotIdentifier != null ? this.snapshotIdentifier.hashCode() : 0);
            result = 31 * result + (this.storageEncrypted != null ? this.storageEncrypted.hashCode() : 0);
            result = 31 * result + (this.storageType != null ? this.storageType.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.vpcSecurityGroupIds != null ? this.vpcSecurityGroupIds.hashCode() : 0);
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
