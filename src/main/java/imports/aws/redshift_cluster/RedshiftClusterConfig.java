package imports.aws.redshift_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.154Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftCluster.RedshiftClusterConfig")
@software.amazon.jsii.Jsii.Proxy(RedshiftClusterConfig.Jsii$Proxy.class)
public interface RedshiftClusterConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_identifier RedshiftCluster#cluster_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#node_type RedshiftCluster#node_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNodeType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#allow_version_upgrade RedshiftCluster#allow_version_upgrade}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowVersionUpgrade() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#apply_immediately RedshiftCluster#apply_immediately}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediately() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#aqua_configuration_status RedshiftCluster#aqua_configuration_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAquaConfigurationStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#automated_snapshot_retention_period RedshiftCluster#automated_snapshot_retention_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAutomatedSnapshotRetentionPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#availability_zone RedshiftCluster#availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#availability_zone_relocation_enabled RedshiftCluster#availability_zone_relocation_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAvailabilityZoneRelocationEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_parameter_group_name RedshiftCluster#cluster_parameter_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterParameterGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_public_key RedshiftCluster#cluster_public_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterPublicKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_revision_number RedshiftCluster#cluster_revision_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterRevisionNumber() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_subnet_group_name RedshiftCluster#cluster_subnet_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterSubnetGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_type RedshiftCluster#cluster_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_version RedshiftCluster#cluster_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#database_name RedshiftCluster#database_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatabaseName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#default_iam_role_arn RedshiftCluster#default_iam_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultIamRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#elastic_ip RedshiftCluster#elastic_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getElasticIp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#encrypted RedshiftCluster#encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncrypted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#endpoint RedshiftCluster#endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#enhanced_vpc_routing RedshiftCluster#enhanced_vpc_routing}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnhancedVpcRouting() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#final_snapshot_identifier RedshiftCluster#final_snapshot_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFinalSnapshotIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#iam_roles RedshiftCluster#iam_roles}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIamRoles() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#id RedshiftCluster#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#kms_key_id RedshiftCluster#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * logging block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#logging RedshiftCluster#logging}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.redshift_cluster.RedshiftClusterLogging getLogging() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#maintenance_track_name RedshiftCluster#maintenance_track_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaintenanceTrackName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#manage_master_password RedshiftCluster#manage_master_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getManageMasterPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#manual_snapshot_retention_period RedshiftCluster#manual_snapshot_retention_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getManualSnapshotRetentionPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password RedshiftCluster#master_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMasterPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password_secret_kms_key_id RedshiftCluster#master_password_secret_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMasterPasswordSecretKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password_wo RedshiftCluster#master_password_wo}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMasterPasswordWo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password_wo_version RedshiftCluster#master_password_wo_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMasterPasswordWoVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_username RedshiftCluster#master_username}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMasterUsername() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#multi_az RedshiftCluster#multi_az}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMultiAz() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#number_of_nodes RedshiftCluster#number_of_nodes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumberOfNodes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#owner_account RedshiftCluster#owner_account}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOwnerAccount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#port RedshiftCluster#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#preferred_maintenance_window RedshiftCluster#preferred_maintenance_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredMaintenanceWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#publicly_accessible RedshiftCluster#publicly_accessible}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAccessible() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#skip_final_snapshot RedshiftCluster#skip_final_snapshot}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalSnapshot() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_arn RedshiftCluster#snapshot_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_cluster_identifier RedshiftCluster#snapshot_cluster_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotClusterIdentifier() {
        return null;
    }

    /**
     * snapshot_copy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_copy RedshiftCluster#snapshot_copy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.redshift_cluster.RedshiftClusterSnapshotCopy getSnapshotCopy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_identifier RedshiftCluster#snapshot_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#tags RedshiftCluster#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#tags_all RedshiftCluster#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#timeouts RedshiftCluster#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.redshift_cluster.RedshiftClusterTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#vpc_security_group_ids RedshiftCluster#vpc_security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RedshiftClusterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RedshiftClusterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RedshiftClusterConfig> {
        java.lang.String clusterIdentifier;
        java.lang.String nodeType;
        java.lang.Object allowVersionUpgrade;
        java.lang.Object applyImmediately;
        java.lang.String aquaConfigurationStatus;
        java.lang.Number automatedSnapshotRetentionPeriod;
        java.lang.String availabilityZone;
        java.lang.Object availabilityZoneRelocationEnabled;
        java.lang.String clusterParameterGroupName;
        java.lang.String clusterPublicKey;
        java.lang.String clusterRevisionNumber;
        java.lang.String clusterSubnetGroupName;
        java.lang.String clusterType;
        java.lang.String clusterVersion;
        java.lang.String databaseName;
        java.lang.String defaultIamRoleArn;
        java.lang.String elasticIp;
        java.lang.Object encrypted;
        java.lang.String endpoint;
        java.lang.Object enhancedVpcRouting;
        java.lang.String finalSnapshotIdentifier;
        java.util.List<java.lang.String> iamRoles;
        java.lang.String id;
        java.lang.String kmsKeyId;
        imports.aws.redshift_cluster.RedshiftClusterLogging logging;
        java.lang.String maintenanceTrackName;
        java.lang.Object manageMasterPassword;
        java.lang.Number manualSnapshotRetentionPeriod;
        java.lang.String masterPassword;
        java.lang.String masterPasswordSecretKmsKeyId;
        java.lang.String masterPasswordWo;
        java.lang.Number masterPasswordWoVersion;
        java.lang.String masterUsername;
        java.lang.Object multiAz;
        java.lang.Number numberOfNodes;
        java.lang.String ownerAccount;
        java.lang.Number port;
        java.lang.String preferredMaintenanceWindow;
        java.lang.Object publiclyAccessible;
        java.lang.Object skipFinalSnapshot;
        java.lang.String snapshotArn;
        java.lang.String snapshotClusterIdentifier;
        imports.aws.redshift_cluster.RedshiftClusterSnapshotCopy snapshotCopy;
        java.lang.String snapshotIdentifier;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.redshift_cluster.RedshiftClusterTimeouts timeouts;
        java.util.List<java.lang.String> vpcSecurityGroupIds;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RedshiftClusterConfig#getClusterIdentifier}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_identifier RedshiftCluster#cluster_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterIdentifier(java.lang.String clusterIdentifier) {
            this.clusterIdentifier = clusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getNodeType}
         * @param nodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#node_type RedshiftCluster#node_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder nodeType(java.lang.String nodeType) {
            this.nodeType = nodeType;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getAllowVersionUpgrade}
         * @param allowVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#allow_version_upgrade RedshiftCluster#allow_version_upgrade}.
         * @return {@code this}
         */
        public Builder allowVersionUpgrade(java.lang.Boolean allowVersionUpgrade) {
            this.allowVersionUpgrade = allowVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getAllowVersionUpgrade}
         * @param allowVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#allow_version_upgrade RedshiftCluster#allow_version_upgrade}.
         * @return {@code this}
         */
        public Builder allowVersionUpgrade(com.hashicorp.cdktf.IResolvable allowVersionUpgrade) {
            this.allowVersionUpgrade = allowVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#apply_immediately RedshiftCluster#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(java.lang.Boolean applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#apply_immediately RedshiftCluster#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getAquaConfigurationStatus}
         * @param aquaConfigurationStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#aqua_configuration_status RedshiftCluster#aqua_configuration_status}.
         * @return {@code this}
         */
        public Builder aquaConfigurationStatus(java.lang.String aquaConfigurationStatus) {
            this.aquaConfigurationStatus = aquaConfigurationStatus;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getAutomatedSnapshotRetentionPeriod}
         * @param automatedSnapshotRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#automated_snapshot_retention_period RedshiftCluster#automated_snapshot_retention_period}.
         * @return {@code this}
         */
        public Builder automatedSnapshotRetentionPeriod(java.lang.Number automatedSnapshotRetentionPeriod) {
            this.automatedSnapshotRetentionPeriod = automatedSnapshotRetentionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#availability_zone RedshiftCluster#availability_zone}.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getAvailabilityZoneRelocationEnabled}
         * @param availabilityZoneRelocationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#availability_zone_relocation_enabled RedshiftCluster#availability_zone_relocation_enabled}.
         * @return {@code this}
         */
        public Builder availabilityZoneRelocationEnabled(java.lang.Boolean availabilityZoneRelocationEnabled) {
            this.availabilityZoneRelocationEnabled = availabilityZoneRelocationEnabled;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getAvailabilityZoneRelocationEnabled}
         * @param availabilityZoneRelocationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#availability_zone_relocation_enabled RedshiftCluster#availability_zone_relocation_enabled}.
         * @return {@code this}
         */
        public Builder availabilityZoneRelocationEnabled(com.hashicorp.cdktf.IResolvable availabilityZoneRelocationEnabled) {
            this.availabilityZoneRelocationEnabled = availabilityZoneRelocationEnabled;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getClusterParameterGroupName}
         * @param clusterParameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_parameter_group_name RedshiftCluster#cluster_parameter_group_name}.
         * @return {@code this}
         */
        public Builder clusterParameterGroupName(java.lang.String clusterParameterGroupName) {
            this.clusterParameterGroupName = clusterParameterGroupName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getClusterPublicKey}
         * @param clusterPublicKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_public_key RedshiftCluster#cluster_public_key}.
         * @return {@code this}
         */
        public Builder clusterPublicKey(java.lang.String clusterPublicKey) {
            this.clusterPublicKey = clusterPublicKey;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getClusterRevisionNumber}
         * @param clusterRevisionNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_revision_number RedshiftCluster#cluster_revision_number}.
         * @return {@code this}
         */
        public Builder clusterRevisionNumber(java.lang.String clusterRevisionNumber) {
            this.clusterRevisionNumber = clusterRevisionNumber;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getClusterSubnetGroupName}
         * @param clusterSubnetGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_subnet_group_name RedshiftCluster#cluster_subnet_group_name}.
         * @return {@code this}
         */
        public Builder clusterSubnetGroupName(java.lang.String clusterSubnetGroupName) {
            this.clusterSubnetGroupName = clusterSubnetGroupName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getClusterType}
         * @param clusterType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_type RedshiftCluster#cluster_type}.
         * @return {@code this}
         */
        public Builder clusterType(java.lang.String clusterType) {
            this.clusterType = clusterType;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getClusterVersion}
         * @param clusterVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_version RedshiftCluster#cluster_version}.
         * @return {@code this}
         */
        public Builder clusterVersion(java.lang.String clusterVersion) {
            this.clusterVersion = clusterVersion;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#database_name RedshiftCluster#database_name}.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getDefaultIamRoleArn}
         * @param defaultIamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#default_iam_role_arn RedshiftCluster#default_iam_role_arn}.
         * @return {@code this}
         */
        public Builder defaultIamRoleArn(java.lang.String defaultIamRoleArn) {
            this.defaultIamRoleArn = defaultIamRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getElasticIp}
         * @param elasticIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#elastic_ip RedshiftCluster#elastic_ip}.
         * @return {@code this}
         */
        public Builder elasticIp(java.lang.String elasticIp) {
            this.elasticIp = elasticIp;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#encrypted RedshiftCluster#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(java.lang.Boolean encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#encrypted RedshiftCluster#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(com.hashicorp.cdktf.IResolvable encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getEndpoint}
         * @param endpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#endpoint RedshiftCluster#endpoint}.
         * @return {@code this}
         */
        public Builder endpoint(java.lang.String endpoint) {
            this.endpoint = endpoint;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getEnhancedVpcRouting}
         * @param enhancedVpcRouting Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#enhanced_vpc_routing RedshiftCluster#enhanced_vpc_routing}.
         * @return {@code this}
         */
        public Builder enhancedVpcRouting(java.lang.Boolean enhancedVpcRouting) {
            this.enhancedVpcRouting = enhancedVpcRouting;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getEnhancedVpcRouting}
         * @param enhancedVpcRouting Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#enhanced_vpc_routing RedshiftCluster#enhanced_vpc_routing}.
         * @return {@code this}
         */
        public Builder enhancedVpcRouting(com.hashicorp.cdktf.IResolvable enhancedVpcRouting) {
            this.enhancedVpcRouting = enhancedVpcRouting;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getFinalSnapshotIdentifier}
         * @param finalSnapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#final_snapshot_identifier RedshiftCluster#final_snapshot_identifier}.
         * @return {@code this}
         */
        public Builder finalSnapshotIdentifier(java.lang.String finalSnapshotIdentifier) {
            this.finalSnapshotIdentifier = finalSnapshotIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getIamRoles}
         * @param iamRoles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#iam_roles RedshiftCluster#iam_roles}.
         * @return {@code this}
         */
        public Builder iamRoles(java.util.List<java.lang.String> iamRoles) {
            this.iamRoles = iamRoles;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#id RedshiftCluster#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#kms_key_id RedshiftCluster#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getLogging}
         * @param logging logging block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#logging RedshiftCluster#logging}
         * @return {@code this}
         */
        public Builder logging(imports.aws.redshift_cluster.RedshiftClusterLogging logging) {
            this.logging = logging;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getMaintenanceTrackName}
         * @param maintenanceTrackName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#maintenance_track_name RedshiftCluster#maintenance_track_name}.
         * @return {@code this}
         */
        public Builder maintenanceTrackName(java.lang.String maintenanceTrackName) {
            this.maintenanceTrackName = maintenanceTrackName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getManageMasterPassword}
         * @param manageMasterPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#manage_master_password RedshiftCluster#manage_master_password}.
         * @return {@code this}
         */
        public Builder manageMasterPassword(java.lang.Boolean manageMasterPassword) {
            this.manageMasterPassword = manageMasterPassword;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getManageMasterPassword}
         * @param manageMasterPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#manage_master_password RedshiftCluster#manage_master_password}.
         * @return {@code this}
         */
        public Builder manageMasterPassword(com.hashicorp.cdktf.IResolvable manageMasterPassword) {
            this.manageMasterPassword = manageMasterPassword;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getManualSnapshotRetentionPeriod}
         * @param manualSnapshotRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#manual_snapshot_retention_period RedshiftCluster#manual_snapshot_retention_period}.
         * @return {@code this}
         */
        public Builder manualSnapshotRetentionPeriod(java.lang.Number manualSnapshotRetentionPeriod) {
            this.manualSnapshotRetentionPeriod = manualSnapshotRetentionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getMasterPassword}
         * @param masterPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password RedshiftCluster#master_password}.
         * @return {@code this}
         */
        public Builder masterPassword(java.lang.String masterPassword) {
            this.masterPassword = masterPassword;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getMasterPasswordSecretKmsKeyId}
         * @param masterPasswordSecretKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password_secret_kms_key_id RedshiftCluster#master_password_secret_kms_key_id}.
         * @return {@code this}
         */
        public Builder masterPasswordSecretKmsKeyId(java.lang.String masterPasswordSecretKmsKeyId) {
            this.masterPasswordSecretKmsKeyId = masterPasswordSecretKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getMasterPasswordWo}
         * @param masterPasswordWo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password_wo RedshiftCluster#master_password_wo}.
         * @return {@code this}
         */
        public Builder masterPasswordWo(java.lang.String masterPasswordWo) {
            this.masterPasswordWo = masterPasswordWo;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getMasterPasswordWoVersion}
         * @param masterPasswordWoVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password_wo_version RedshiftCluster#master_password_wo_version}.
         * @return {@code this}
         */
        public Builder masterPasswordWoVersion(java.lang.Number masterPasswordWoVersion) {
            this.masterPasswordWoVersion = masterPasswordWoVersion;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getMasterUsername}
         * @param masterUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_username RedshiftCluster#master_username}.
         * @return {@code this}
         */
        public Builder masterUsername(java.lang.String masterUsername) {
            this.masterUsername = masterUsername;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getMultiAz}
         * @param multiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#multi_az RedshiftCluster#multi_az}.
         * @return {@code this}
         */
        public Builder multiAz(java.lang.Boolean multiAz) {
            this.multiAz = multiAz;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getMultiAz}
         * @param multiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#multi_az RedshiftCluster#multi_az}.
         * @return {@code this}
         */
        public Builder multiAz(com.hashicorp.cdktf.IResolvable multiAz) {
            this.multiAz = multiAz;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getNumberOfNodes}
         * @param numberOfNodes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#number_of_nodes RedshiftCluster#number_of_nodes}.
         * @return {@code this}
         */
        public Builder numberOfNodes(java.lang.Number numberOfNodes) {
            this.numberOfNodes = numberOfNodes;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getOwnerAccount}
         * @param ownerAccount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#owner_account RedshiftCluster#owner_account}.
         * @return {@code this}
         */
        public Builder ownerAccount(java.lang.String ownerAccount) {
            this.ownerAccount = ownerAccount;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#port RedshiftCluster#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getPreferredMaintenanceWindow}
         * @param preferredMaintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#preferred_maintenance_window RedshiftCluster#preferred_maintenance_window}.
         * @return {@code this}
         */
        public Builder preferredMaintenanceWindow(java.lang.String preferredMaintenanceWindow) {
            this.preferredMaintenanceWindow = preferredMaintenanceWindow;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#publicly_accessible RedshiftCluster#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(java.lang.Boolean publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#publicly_accessible RedshiftCluster#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(com.hashicorp.cdktf.IResolvable publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getSkipFinalSnapshot}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#skip_final_snapshot RedshiftCluster#skip_final_snapshot}.
         * @return {@code this}
         */
        public Builder skipFinalSnapshot(java.lang.Boolean skipFinalSnapshot) {
            this.skipFinalSnapshot = skipFinalSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getSkipFinalSnapshot}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#skip_final_snapshot RedshiftCluster#skip_final_snapshot}.
         * @return {@code this}
         */
        public Builder skipFinalSnapshot(com.hashicorp.cdktf.IResolvable skipFinalSnapshot) {
            this.skipFinalSnapshot = skipFinalSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getSnapshotArn}
         * @param snapshotArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_arn RedshiftCluster#snapshot_arn}.
         * @return {@code this}
         */
        public Builder snapshotArn(java.lang.String snapshotArn) {
            this.snapshotArn = snapshotArn;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getSnapshotClusterIdentifier}
         * @param snapshotClusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_cluster_identifier RedshiftCluster#snapshot_cluster_identifier}.
         * @return {@code this}
         */
        public Builder snapshotClusterIdentifier(java.lang.String snapshotClusterIdentifier) {
            this.snapshotClusterIdentifier = snapshotClusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getSnapshotCopy}
         * @param snapshotCopy snapshot_copy block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_copy RedshiftCluster#snapshot_copy}
         * @return {@code this}
         */
        public Builder snapshotCopy(imports.aws.redshift_cluster.RedshiftClusterSnapshotCopy snapshotCopy) {
            this.snapshotCopy = snapshotCopy;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getSnapshotIdentifier}
         * @param snapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_identifier RedshiftCluster#snapshot_identifier}.
         * @return {@code this}
         */
        public Builder snapshotIdentifier(java.lang.String snapshotIdentifier) {
            this.snapshotIdentifier = snapshotIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#tags RedshiftCluster#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#tags_all RedshiftCluster#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#timeouts RedshiftCluster#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.redshift_cluster.RedshiftClusterTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getVpcSecurityGroupIds}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#vpc_security_group_ids RedshiftCluster#vpc_security_group_ids}.
         * @return {@code this}
         */
        public Builder vpcSecurityGroupIds(java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.vpcSecurityGroupIds = vpcSecurityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getDependsOn}
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
         * Sets the value of {@link RedshiftClusterConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterConfig#getProvisioners}
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
         * @return a new instance of {@link RedshiftClusterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RedshiftClusterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RedshiftClusterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RedshiftClusterConfig {
        private final java.lang.String clusterIdentifier;
        private final java.lang.String nodeType;
        private final java.lang.Object allowVersionUpgrade;
        private final java.lang.Object applyImmediately;
        private final java.lang.String aquaConfigurationStatus;
        private final java.lang.Number automatedSnapshotRetentionPeriod;
        private final java.lang.String availabilityZone;
        private final java.lang.Object availabilityZoneRelocationEnabled;
        private final java.lang.String clusterParameterGroupName;
        private final java.lang.String clusterPublicKey;
        private final java.lang.String clusterRevisionNumber;
        private final java.lang.String clusterSubnetGroupName;
        private final java.lang.String clusterType;
        private final java.lang.String clusterVersion;
        private final java.lang.String databaseName;
        private final java.lang.String defaultIamRoleArn;
        private final java.lang.String elasticIp;
        private final java.lang.Object encrypted;
        private final java.lang.String endpoint;
        private final java.lang.Object enhancedVpcRouting;
        private final java.lang.String finalSnapshotIdentifier;
        private final java.util.List<java.lang.String> iamRoles;
        private final java.lang.String id;
        private final java.lang.String kmsKeyId;
        private final imports.aws.redshift_cluster.RedshiftClusterLogging logging;
        private final java.lang.String maintenanceTrackName;
        private final java.lang.Object manageMasterPassword;
        private final java.lang.Number manualSnapshotRetentionPeriod;
        private final java.lang.String masterPassword;
        private final java.lang.String masterPasswordSecretKmsKeyId;
        private final java.lang.String masterPasswordWo;
        private final java.lang.Number masterPasswordWoVersion;
        private final java.lang.String masterUsername;
        private final java.lang.Object multiAz;
        private final java.lang.Number numberOfNodes;
        private final java.lang.String ownerAccount;
        private final java.lang.Number port;
        private final java.lang.String preferredMaintenanceWindow;
        private final java.lang.Object publiclyAccessible;
        private final java.lang.Object skipFinalSnapshot;
        private final java.lang.String snapshotArn;
        private final java.lang.String snapshotClusterIdentifier;
        private final imports.aws.redshift_cluster.RedshiftClusterSnapshotCopy snapshotCopy;
        private final java.lang.String snapshotIdentifier;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.redshift_cluster.RedshiftClusterTimeouts timeouts;
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
            this.clusterIdentifier = software.amazon.jsii.Kernel.get(this, "clusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nodeType = software.amazon.jsii.Kernel.get(this, "nodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allowVersionUpgrade = software.amazon.jsii.Kernel.get(this, "allowVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.applyImmediately = software.amazon.jsii.Kernel.get(this, "applyImmediately", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.aquaConfigurationStatus = software.amazon.jsii.Kernel.get(this, "aquaConfigurationStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.automatedSnapshotRetentionPeriod = software.amazon.jsii.Kernel.get(this, "automatedSnapshotRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.availabilityZoneRelocationEnabled = software.amazon.jsii.Kernel.get(this, "availabilityZoneRelocationEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.clusterParameterGroupName = software.amazon.jsii.Kernel.get(this, "clusterParameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterPublicKey = software.amazon.jsii.Kernel.get(this, "clusterPublicKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterRevisionNumber = software.amazon.jsii.Kernel.get(this, "clusterRevisionNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterSubnetGroupName = software.amazon.jsii.Kernel.get(this, "clusterSubnetGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterType = software.amazon.jsii.Kernel.get(this, "clusterType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterVersion = software.amazon.jsii.Kernel.get(this, "clusterVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultIamRoleArn = software.amazon.jsii.Kernel.get(this, "defaultIamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.elasticIp = software.amazon.jsii.Kernel.get(this, "elasticIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encrypted = software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.endpoint = software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enhancedVpcRouting = software.amazon.jsii.Kernel.get(this, "enhancedVpcRouting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.finalSnapshotIdentifier = software.amazon.jsii.Kernel.get(this, "finalSnapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamRoles = software.amazon.jsii.Kernel.get(this, "iamRoles", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logging = software.amazon.jsii.Kernel.get(this, "logging", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_cluster.RedshiftClusterLogging.class));
            this.maintenanceTrackName = software.amazon.jsii.Kernel.get(this, "maintenanceTrackName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.manageMasterPassword = software.amazon.jsii.Kernel.get(this, "manageMasterPassword", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.manualSnapshotRetentionPeriod = software.amazon.jsii.Kernel.get(this, "manualSnapshotRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.masterPassword = software.amazon.jsii.Kernel.get(this, "masterPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.masterPasswordSecretKmsKeyId = software.amazon.jsii.Kernel.get(this, "masterPasswordSecretKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.masterPasswordWo = software.amazon.jsii.Kernel.get(this, "masterPasswordWo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.masterPasswordWoVersion = software.amazon.jsii.Kernel.get(this, "masterPasswordWoVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.masterUsername = software.amazon.jsii.Kernel.get(this, "masterUsername", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.multiAz = software.amazon.jsii.Kernel.get(this, "multiAz", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.numberOfNodes = software.amazon.jsii.Kernel.get(this, "numberOfNodes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ownerAccount = software.amazon.jsii.Kernel.get(this, "ownerAccount", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.preferredMaintenanceWindow = software.amazon.jsii.Kernel.get(this, "preferredMaintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.publiclyAccessible = software.amazon.jsii.Kernel.get(this, "publiclyAccessible", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.skipFinalSnapshot = software.amazon.jsii.Kernel.get(this, "skipFinalSnapshot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.snapshotArn = software.amazon.jsii.Kernel.get(this, "snapshotArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snapshotClusterIdentifier = software.amazon.jsii.Kernel.get(this, "snapshotClusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snapshotCopy = software.amazon.jsii.Kernel.get(this, "snapshotCopy", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_cluster.RedshiftClusterSnapshotCopy.class));
            this.snapshotIdentifier = software.amazon.jsii.Kernel.get(this, "snapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_cluster.RedshiftClusterTimeouts.class));
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
            this.clusterIdentifier = java.util.Objects.requireNonNull(builder.clusterIdentifier, "clusterIdentifier is required");
            this.nodeType = java.util.Objects.requireNonNull(builder.nodeType, "nodeType is required");
            this.allowVersionUpgrade = builder.allowVersionUpgrade;
            this.applyImmediately = builder.applyImmediately;
            this.aquaConfigurationStatus = builder.aquaConfigurationStatus;
            this.automatedSnapshotRetentionPeriod = builder.automatedSnapshotRetentionPeriod;
            this.availabilityZone = builder.availabilityZone;
            this.availabilityZoneRelocationEnabled = builder.availabilityZoneRelocationEnabled;
            this.clusterParameterGroupName = builder.clusterParameterGroupName;
            this.clusterPublicKey = builder.clusterPublicKey;
            this.clusterRevisionNumber = builder.clusterRevisionNumber;
            this.clusterSubnetGroupName = builder.clusterSubnetGroupName;
            this.clusterType = builder.clusterType;
            this.clusterVersion = builder.clusterVersion;
            this.databaseName = builder.databaseName;
            this.defaultIamRoleArn = builder.defaultIamRoleArn;
            this.elasticIp = builder.elasticIp;
            this.encrypted = builder.encrypted;
            this.endpoint = builder.endpoint;
            this.enhancedVpcRouting = builder.enhancedVpcRouting;
            this.finalSnapshotIdentifier = builder.finalSnapshotIdentifier;
            this.iamRoles = builder.iamRoles;
            this.id = builder.id;
            this.kmsKeyId = builder.kmsKeyId;
            this.logging = builder.logging;
            this.maintenanceTrackName = builder.maintenanceTrackName;
            this.manageMasterPassword = builder.manageMasterPassword;
            this.manualSnapshotRetentionPeriod = builder.manualSnapshotRetentionPeriod;
            this.masterPassword = builder.masterPassword;
            this.masterPasswordSecretKmsKeyId = builder.masterPasswordSecretKmsKeyId;
            this.masterPasswordWo = builder.masterPasswordWo;
            this.masterPasswordWoVersion = builder.masterPasswordWoVersion;
            this.masterUsername = builder.masterUsername;
            this.multiAz = builder.multiAz;
            this.numberOfNodes = builder.numberOfNodes;
            this.ownerAccount = builder.ownerAccount;
            this.port = builder.port;
            this.preferredMaintenanceWindow = builder.preferredMaintenanceWindow;
            this.publiclyAccessible = builder.publiclyAccessible;
            this.skipFinalSnapshot = builder.skipFinalSnapshot;
            this.snapshotArn = builder.snapshotArn;
            this.snapshotClusterIdentifier = builder.snapshotClusterIdentifier;
            this.snapshotCopy = builder.snapshotCopy;
            this.snapshotIdentifier = builder.snapshotIdentifier;
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
        public final java.lang.String getClusterIdentifier() {
            return this.clusterIdentifier;
        }

        @Override
        public final java.lang.String getNodeType() {
            return this.nodeType;
        }

        @Override
        public final java.lang.Object getAllowVersionUpgrade() {
            return this.allowVersionUpgrade;
        }

        @Override
        public final java.lang.Object getApplyImmediately() {
            return this.applyImmediately;
        }

        @Override
        public final java.lang.String getAquaConfigurationStatus() {
            return this.aquaConfigurationStatus;
        }

        @Override
        public final java.lang.Number getAutomatedSnapshotRetentionPeriod() {
            return this.automatedSnapshotRetentionPeriod;
        }

        @Override
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final java.lang.Object getAvailabilityZoneRelocationEnabled() {
            return this.availabilityZoneRelocationEnabled;
        }

        @Override
        public final java.lang.String getClusterParameterGroupName() {
            return this.clusterParameterGroupName;
        }

        @Override
        public final java.lang.String getClusterPublicKey() {
            return this.clusterPublicKey;
        }

        @Override
        public final java.lang.String getClusterRevisionNumber() {
            return this.clusterRevisionNumber;
        }

        @Override
        public final java.lang.String getClusterSubnetGroupName() {
            return this.clusterSubnetGroupName;
        }

        @Override
        public final java.lang.String getClusterType() {
            return this.clusterType;
        }

        @Override
        public final java.lang.String getClusterVersion() {
            return this.clusterVersion;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getDefaultIamRoleArn() {
            return this.defaultIamRoleArn;
        }

        @Override
        public final java.lang.String getElasticIp() {
            return this.elasticIp;
        }

        @Override
        public final java.lang.Object getEncrypted() {
            return this.encrypted;
        }

        @Override
        public final java.lang.String getEndpoint() {
            return this.endpoint;
        }

        @Override
        public final java.lang.Object getEnhancedVpcRouting() {
            return this.enhancedVpcRouting;
        }

        @Override
        public final java.lang.String getFinalSnapshotIdentifier() {
            return this.finalSnapshotIdentifier;
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
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final imports.aws.redshift_cluster.RedshiftClusterLogging getLogging() {
            return this.logging;
        }

        @Override
        public final java.lang.String getMaintenanceTrackName() {
            return this.maintenanceTrackName;
        }

        @Override
        public final java.lang.Object getManageMasterPassword() {
            return this.manageMasterPassword;
        }

        @Override
        public final java.lang.Number getManualSnapshotRetentionPeriod() {
            return this.manualSnapshotRetentionPeriod;
        }

        @Override
        public final java.lang.String getMasterPassword() {
            return this.masterPassword;
        }

        @Override
        public final java.lang.String getMasterPasswordSecretKmsKeyId() {
            return this.masterPasswordSecretKmsKeyId;
        }

        @Override
        public final java.lang.String getMasterPasswordWo() {
            return this.masterPasswordWo;
        }

        @Override
        public final java.lang.Number getMasterPasswordWoVersion() {
            return this.masterPasswordWoVersion;
        }

        @Override
        public final java.lang.String getMasterUsername() {
            return this.masterUsername;
        }

        @Override
        public final java.lang.Object getMultiAz() {
            return this.multiAz;
        }

        @Override
        public final java.lang.Number getNumberOfNodes() {
            return this.numberOfNodes;
        }

        @Override
        public final java.lang.String getOwnerAccount() {
            return this.ownerAccount;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getPreferredMaintenanceWindow() {
            return this.preferredMaintenanceWindow;
        }

        @Override
        public final java.lang.Object getPubliclyAccessible() {
            return this.publiclyAccessible;
        }

        @Override
        public final java.lang.Object getSkipFinalSnapshot() {
            return this.skipFinalSnapshot;
        }

        @Override
        public final java.lang.String getSnapshotArn() {
            return this.snapshotArn;
        }

        @Override
        public final java.lang.String getSnapshotClusterIdentifier() {
            return this.snapshotClusterIdentifier;
        }

        @Override
        public final imports.aws.redshift_cluster.RedshiftClusterSnapshotCopy getSnapshotCopy() {
            return this.snapshotCopy;
        }

        @Override
        public final java.lang.String getSnapshotIdentifier() {
            return this.snapshotIdentifier;
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
        public final imports.aws.redshift_cluster.RedshiftClusterTimeouts getTimeouts() {
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

            data.set("clusterIdentifier", om.valueToTree(this.getClusterIdentifier()));
            data.set("nodeType", om.valueToTree(this.getNodeType()));
            if (this.getAllowVersionUpgrade() != null) {
                data.set("allowVersionUpgrade", om.valueToTree(this.getAllowVersionUpgrade()));
            }
            if (this.getApplyImmediately() != null) {
                data.set("applyImmediately", om.valueToTree(this.getApplyImmediately()));
            }
            if (this.getAquaConfigurationStatus() != null) {
                data.set("aquaConfigurationStatus", om.valueToTree(this.getAquaConfigurationStatus()));
            }
            if (this.getAutomatedSnapshotRetentionPeriod() != null) {
                data.set("automatedSnapshotRetentionPeriod", om.valueToTree(this.getAutomatedSnapshotRetentionPeriod()));
            }
            if (this.getAvailabilityZone() != null) {
                data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            }
            if (this.getAvailabilityZoneRelocationEnabled() != null) {
                data.set("availabilityZoneRelocationEnabled", om.valueToTree(this.getAvailabilityZoneRelocationEnabled()));
            }
            if (this.getClusterParameterGroupName() != null) {
                data.set("clusterParameterGroupName", om.valueToTree(this.getClusterParameterGroupName()));
            }
            if (this.getClusterPublicKey() != null) {
                data.set("clusterPublicKey", om.valueToTree(this.getClusterPublicKey()));
            }
            if (this.getClusterRevisionNumber() != null) {
                data.set("clusterRevisionNumber", om.valueToTree(this.getClusterRevisionNumber()));
            }
            if (this.getClusterSubnetGroupName() != null) {
                data.set("clusterSubnetGroupName", om.valueToTree(this.getClusterSubnetGroupName()));
            }
            if (this.getClusterType() != null) {
                data.set("clusterType", om.valueToTree(this.getClusterType()));
            }
            if (this.getClusterVersion() != null) {
                data.set("clusterVersion", om.valueToTree(this.getClusterVersion()));
            }
            if (this.getDatabaseName() != null) {
                data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            }
            if (this.getDefaultIamRoleArn() != null) {
                data.set("defaultIamRoleArn", om.valueToTree(this.getDefaultIamRoleArn()));
            }
            if (this.getElasticIp() != null) {
                data.set("elasticIp", om.valueToTree(this.getElasticIp()));
            }
            if (this.getEncrypted() != null) {
                data.set("encrypted", om.valueToTree(this.getEncrypted()));
            }
            if (this.getEndpoint() != null) {
                data.set("endpoint", om.valueToTree(this.getEndpoint()));
            }
            if (this.getEnhancedVpcRouting() != null) {
                data.set("enhancedVpcRouting", om.valueToTree(this.getEnhancedVpcRouting()));
            }
            if (this.getFinalSnapshotIdentifier() != null) {
                data.set("finalSnapshotIdentifier", om.valueToTree(this.getFinalSnapshotIdentifier()));
            }
            if (this.getIamRoles() != null) {
                data.set("iamRoles", om.valueToTree(this.getIamRoles()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getLogging() != null) {
                data.set("logging", om.valueToTree(this.getLogging()));
            }
            if (this.getMaintenanceTrackName() != null) {
                data.set("maintenanceTrackName", om.valueToTree(this.getMaintenanceTrackName()));
            }
            if (this.getManageMasterPassword() != null) {
                data.set("manageMasterPassword", om.valueToTree(this.getManageMasterPassword()));
            }
            if (this.getManualSnapshotRetentionPeriod() != null) {
                data.set("manualSnapshotRetentionPeriod", om.valueToTree(this.getManualSnapshotRetentionPeriod()));
            }
            if (this.getMasterPassword() != null) {
                data.set("masterPassword", om.valueToTree(this.getMasterPassword()));
            }
            if (this.getMasterPasswordSecretKmsKeyId() != null) {
                data.set("masterPasswordSecretKmsKeyId", om.valueToTree(this.getMasterPasswordSecretKmsKeyId()));
            }
            if (this.getMasterPasswordWo() != null) {
                data.set("masterPasswordWo", om.valueToTree(this.getMasterPasswordWo()));
            }
            if (this.getMasterPasswordWoVersion() != null) {
                data.set("masterPasswordWoVersion", om.valueToTree(this.getMasterPasswordWoVersion()));
            }
            if (this.getMasterUsername() != null) {
                data.set("masterUsername", om.valueToTree(this.getMasterUsername()));
            }
            if (this.getMultiAz() != null) {
                data.set("multiAz", om.valueToTree(this.getMultiAz()));
            }
            if (this.getNumberOfNodes() != null) {
                data.set("numberOfNodes", om.valueToTree(this.getNumberOfNodes()));
            }
            if (this.getOwnerAccount() != null) {
                data.set("ownerAccount", om.valueToTree(this.getOwnerAccount()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getPreferredMaintenanceWindow() != null) {
                data.set("preferredMaintenanceWindow", om.valueToTree(this.getPreferredMaintenanceWindow()));
            }
            if (this.getPubliclyAccessible() != null) {
                data.set("publiclyAccessible", om.valueToTree(this.getPubliclyAccessible()));
            }
            if (this.getSkipFinalSnapshot() != null) {
                data.set("skipFinalSnapshot", om.valueToTree(this.getSkipFinalSnapshot()));
            }
            if (this.getSnapshotArn() != null) {
                data.set("snapshotArn", om.valueToTree(this.getSnapshotArn()));
            }
            if (this.getSnapshotClusterIdentifier() != null) {
                data.set("snapshotClusterIdentifier", om.valueToTree(this.getSnapshotClusterIdentifier()));
            }
            if (this.getSnapshotCopy() != null) {
                data.set("snapshotCopy", om.valueToTree(this.getSnapshotCopy()));
            }
            if (this.getSnapshotIdentifier() != null) {
                data.set("snapshotIdentifier", om.valueToTree(this.getSnapshotIdentifier()));
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
            struct.set("fqn", om.valueToTree("aws.redshiftCluster.RedshiftClusterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RedshiftClusterConfig.Jsii$Proxy that = (RedshiftClusterConfig.Jsii$Proxy) o;

            if (!clusterIdentifier.equals(that.clusterIdentifier)) return false;
            if (!nodeType.equals(that.nodeType)) return false;
            if (this.allowVersionUpgrade != null ? !this.allowVersionUpgrade.equals(that.allowVersionUpgrade) : that.allowVersionUpgrade != null) return false;
            if (this.applyImmediately != null ? !this.applyImmediately.equals(that.applyImmediately) : that.applyImmediately != null) return false;
            if (this.aquaConfigurationStatus != null ? !this.aquaConfigurationStatus.equals(that.aquaConfigurationStatus) : that.aquaConfigurationStatus != null) return false;
            if (this.automatedSnapshotRetentionPeriod != null ? !this.automatedSnapshotRetentionPeriod.equals(that.automatedSnapshotRetentionPeriod) : that.automatedSnapshotRetentionPeriod != null) return false;
            if (this.availabilityZone != null ? !this.availabilityZone.equals(that.availabilityZone) : that.availabilityZone != null) return false;
            if (this.availabilityZoneRelocationEnabled != null ? !this.availabilityZoneRelocationEnabled.equals(that.availabilityZoneRelocationEnabled) : that.availabilityZoneRelocationEnabled != null) return false;
            if (this.clusterParameterGroupName != null ? !this.clusterParameterGroupName.equals(that.clusterParameterGroupName) : that.clusterParameterGroupName != null) return false;
            if (this.clusterPublicKey != null ? !this.clusterPublicKey.equals(that.clusterPublicKey) : that.clusterPublicKey != null) return false;
            if (this.clusterRevisionNumber != null ? !this.clusterRevisionNumber.equals(that.clusterRevisionNumber) : that.clusterRevisionNumber != null) return false;
            if (this.clusterSubnetGroupName != null ? !this.clusterSubnetGroupName.equals(that.clusterSubnetGroupName) : that.clusterSubnetGroupName != null) return false;
            if (this.clusterType != null ? !this.clusterType.equals(that.clusterType) : that.clusterType != null) return false;
            if (this.clusterVersion != null ? !this.clusterVersion.equals(that.clusterVersion) : that.clusterVersion != null) return false;
            if (this.databaseName != null ? !this.databaseName.equals(that.databaseName) : that.databaseName != null) return false;
            if (this.defaultIamRoleArn != null ? !this.defaultIamRoleArn.equals(that.defaultIamRoleArn) : that.defaultIamRoleArn != null) return false;
            if (this.elasticIp != null ? !this.elasticIp.equals(that.elasticIp) : that.elasticIp != null) return false;
            if (this.encrypted != null ? !this.encrypted.equals(that.encrypted) : that.encrypted != null) return false;
            if (this.endpoint != null ? !this.endpoint.equals(that.endpoint) : that.endpoint != null) return false;
            if (this.enhancedVpcRouting != null ? !this.enhancedVpcRouting.equals(that.enhancedVpcRouting) : that.enhancedVpcRouting != null) return false;
            if (this.finalSnapshotIdentifier != null ? !this.finalSnapshotIdentifier.equals(that.finalSnapshotIdentifier) : that.finalSnapshotIdentifier != null) return false;
            if (this.iamRoles != null ? !this.iamRoles.equals(that.iamRoles) : that.iamRoles != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.logging != null ? !this.logging.equals(that.logging) : that.logging != null) return false;
            if (this.maintenanceTrackName != null ? !this.maintenanceTrackName.equals(that.maintenanceTrackName) : that.maintenanceTrackName != null) return false;
            if (this.manageMasterPassword != null ? !this.manageMasterPassword.equals(that.manageMasterPassword) : that.manageMasterPassword != null) return false;
            if (this.manualSnapshotRetentionPeriod != null ? !this.manualSnapshotRetentionPeriod.equals(that.manualSnapshotRetentionPeriod) : that.manualSnapshotRetentionPeriod != null) return false;
            if (this.masterPassword != null ? !this.masterPassword.equals(that.masterPassword) : that.masterPassword != null) return false;
            if (this.masterPasswordSecretKmsKeyId != null ? !this.masterPasswordSecretKmsKeyId.equals(that.masterPasswordSecretKmsKeyId) : that.masterPasswordSecretKmsKeyId != null) return false;
            if (this.masterPasswordWo != null ? !this.masterPasswordWo.equals(that.masterPasswordWo) : that.masterPasswordWo != null) return false;
            if (this.masterPasswordWoVersion != null ? !this.masterPasswordWoVersion.equals(that.masterPasswordWoVersion) : that.masterPasswordWoVersion != null) return false;
            if (this.masterUsername != null ? !this.masterUsername.equals(that.masterUsername) : that.masterUsername != null) return false;
            if (this.multiAz != null ? !this.multiAz.equals(that.multiAz) : that.multiAz != null) return false;
            if (this.numberOfNodes != null ? !this.numberOfNodes.equals(that.numberOfNodes) : that.numberOfNodes != null) return false;
            if (this.ownerAccount != null ? !this.ownerAccount.equals(that.ownerAccount) : that.ownerAccount != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.preferredMaintenanceWindow != null ? !this.preferredMaintenanceWindow.equals(that.preferredMaintenanceWindow) : that.preferredMaintenanceWindow != null) return false;
            if (this.publiclyAccessible != null ? !this.publiclyAccessible.equals(that.publiclyAccessible) : that.publiclyAccessible != null) return false;
            if (this.skipFinalSnapshot != null ? !this.skipFinalSnapshot.equals(that.skipFinalSnapshot) : that.skipFinalSnapshot != null) return false;
            if (this.snapshotArn != null ? !this.snapshotArn.equals(that.snapshotArn) : that.snapshotArn != null) return false;
            if (this.snapshotClusterIdentifier != null ? !this.snapshotClusterIdentifier.equals(that.snapshotClusterIdentifier) : that.snapshotClusterIdentifier != null) return false;
            if (this.snapshotCopy != null ? !this.snapshotCopy.equals(that.snapshotCopy) : that.snapshotCopy != null) return false;
            if (this.snapshotIdentifier != null ? !this.snapshotIdentifier.equals(that.snapshotIdentifier) : that.snapshotIdentifier != null) return false;
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
            int result = this.clusterIdentifier.hashCode();
            result = 31 * result + (this.nodeType.hashCode());
            result = 31 * result + (this.allowVersionUpgrade != null ? this.allowVersionUpgrade.hashCode() : 0);
            result = 31 * result + (this.applyImmediately != null ? this.applyImmediately.hashCode() : 0);
            result = 31 * result + (this.aquaConfigurationStatus != null ? this.aquaConfigurationStatus.hashCode() : 0);
            result = 31 * result + (this.automatedSnapshotRetentionPeriod != null ? this.automatedSnapshotRetentionPeriod.hashCode() : 0);
            result = 31 * result + (this.availabilityZone != null ? this.availabilityZone.hashCode() : 0);
            result = 31 * result + (this.availabilityZoneRelocationEnabled != null ? this.availabilityZoneRelocationEnabled.hashCode() : 0);
            result = 31 * result + (this.clusterParameterGroupName != null ? this.clusterParameterGroupName.hashCode() : 0);
            result = 31 * result + (this.clusterPublicKey != null ? this.clusterPublicKey.hashCode() : 0);
            result = 31 * result + (this.clusterRevisionNumber != null ? this.clusterRevisionNumber.hashCode() : 0);
            result = 31 * result + (this.clusterSubnetGroupName != null ? this.clusterSubnetGroupName.hashCode() : 0);
            result = 31 * result + (this.clusterType != null ? this.clusterType.hashCode() : 0);
            result = 31 * result + (this.clusterVersion != null ? this.clusterVersion.hashCode() : 0);
            result = 31 * result + (this.databaseName != null ? this.databaseName.hashCode() : 0);
            result = 31 * result + (this.defaultIamRoleArn != null ? this.defaultIamRoleArn.hashCode() : 0);
            result = 31 * result + (this.elasticIp != null ? this.elasticIp.hashCode() : 0);
            result = 31 * result + (this.encrypted != null ? this.encrypted.hashCode() : 0);
            result = 31 * result + (this.endpoint != null ? this.endpoint.hashCode() : 0);
            result = 31 * result + (this.enhancedVpcRouting != null ? this.enhancedVpcRouting.hashCode() : 0);
            result = 31 * result + (this.finalSnapshotIdentifier != null ? this.finalSnapshotIdentifier.hashCode() : 0);
            result = 31 * result + (this.iamRoles != null ? this.iamRoles.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.logging != null ? this.logging.hashCode() : 0);
            result = 31 * result + (this.maintenanceTrackName != null ? this.maintenanceTrackName.hashCode() : 0);
            result = 31 * result + (this.manageMasterPassword != null ? this.manageMasterPassword.hashCode() : 0);
            result = 31 * result + (this.manualSnapshotRetentionPeriod != null ? this.manualSnapshotRetentionPeriod.hashCode() : 0);
            result = 31 * result + (this.masterPassword != null ? this.masterPassword.hashCode() : 0);
            result = 31 * result + (this.masterPasswordSecretKmsKeyId != null ? this.masterPasswordSecretKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.masterPasswordWo != null ? this.masterPasswordWo.hashCode() : 0);
            result = 31 * result + (this.masterPasswordWoVersion != null ? this.masterPasswordWoVersion.hashCode() : 0);
            result = 31 * result + (this.masterUsername != null ? this.masterUsername.hashCode() : 0);
            result = 31 * result + (this.multiAz != null ? this.multiAz.hashCode() : 0);
            result = 31 * result + (this.numberOfNodes != null ? this.numberOfNodes.hashCode() : 0);
            result = 31 * result + (this.ownerAccount != null ? this.ownerAccount.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.preferredMaintenanceWindow != null ? this.preferredMaintenanceWindow.hashCode() : 0);
            result = 31 * result + (this.publiclyAccessible != null ? this.publiclyAccessible.hashCode() : 0);
            result = 31 * result + (this.skipFinalSnapshot != null ? this.skipFinalSnapshot.hashCode() : 0);
            result = 31 * result + (this.snapshotArn != null ? this.snapshotArn.hashCode() : 0);
            result = 31 * result + (this.snapshotClusterIdentifier != null ? this.snapshotClusterIdentifier.hashCode() : 0);
            result = 31 * result + (this.snapshotCopy != null ? this.snapshotCopy.hashCode() : 0);
            result = 31 * result + (this.snapshotIdentifier != null ? this.snapshotIdentifier.hashCode() : 0);
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
