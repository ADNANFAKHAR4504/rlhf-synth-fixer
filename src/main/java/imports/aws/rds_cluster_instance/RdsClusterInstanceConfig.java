package imports.aws.rds_cluster_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.142Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rdsClusterInstance.RdsClusterInstanceConfig")
@software.amazon.jsii.Jsii.Proxy(RdsClusterInstanceConfig.Jsii$Proxy.class)
public interface RdsClusterInstanceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#cluster_identifier RdsClusterInstance#cluster_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#engine RdsClusterInstance#engine}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEngine();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#instance_class RdsClusterInstance#instance_class}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceClass();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#apply_immediately RdsClusterInstance#apply_immediately}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediately() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#auto_minor_version_upgrade RdsClusterInstance#auto_minor_version_upgrade}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoMinorVersionUpgrade() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#availability_zone RdsClusterInstance#availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#ca_cert_identifier RdsClusterInstance#ca_cert_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCaCertIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#copy_tags_to_snapshot RdsClusterInstance#copy_tags_to_snapshot}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToSnapshot() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#custom_iam_instance_profile RdsClusterInstance#custom_iam_instance_profile}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomIamInstanceProfile() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#db_parameter_group_name RdsClusterInstance#db_parameter_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbParameterGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#db_subnet_group_name RdsClusterInstance#db_subnet_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbSubnetGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#engine_version RdsClusterInstance#engine_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngineVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#force_destroy RdsClusterInstance#force_destroy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceDestroy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#id RdsClusterInstance#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#identifier RdsClusterInstance#identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#identifier_prefix RdsClusterInstance#identifier_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdentifierPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#monitoring_interval RdsClusterInstance#monitoring_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMonitoringInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#monitoring_role_arn RdsClusterInstance#monitoring_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMonitoringRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_enabled RdsClusterInstance#performance_insights_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPerformanceInsightsEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_kms_key_id RdsClusterInstance#performance_insights_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPerformanceInsightsKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_retention_period RdsClusterInstance#performance_insights_retention_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPerformanceInsightsRetentionPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#preferred_backup_window RdsClusterInstance#preferred_backup_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredBackupWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#preferred_maintenance_window RdsClusterInstance#preferred_maintenance_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredMaintenanceWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#promotion_tier RdsClusterInstance#promotion_tier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPromotionTier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#publicly_accessible RdsClusterInstance#publicly_accessible}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAccessible() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#tags RdsClusterInstance#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#tags_all RdsClusterInstance#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#timeouts RdsClusterInstance#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.rds_cluster_instance.RdsClusterInstanceTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RdsClusterInstanceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RdsClusterInstanceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RdsClusterInstanceConfig> {
        java.lang.String clusterIdentifier;
        java.lang.String engine;
        java.lang.String instanceClass;
        java.lang.Object applyImmediately;
        java.lang.Object autoMinorVersionUpgrade;
        java.lang.String availabilityZone;
        java.lang.String caCertIdentifier;
        java.lang.Object copyTagsToSnapshot;
        java.lang.String customIamInstanceProfile;
        java.lang.String dbParameterGroupName;
        java.lang.String dbSubnetGroupName;
        java.lang.String engineVersion;
        java.lang.Object forceDestroy;
        java.lang.String id;
        java.lang.String identifier;
        java.lang.String identifierPrefix;
        java.lang.Number monitoringInterval;
        java.lang.String monitoringRoleArn;
        java.lang.Object performanceInsightsEnabled;
        java.lang.String performanceInsightsKmsKeyId;
        java.lang.Number performanceInsightsRetentionPeriod;
        java.lang.String preferredBackupWindow;
        java.lang.String preferredMaintenanceWindow;
        java.lang.Number promotionTier;
        java.lang.Object publiclyAccessible;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.rds_cluster_instance.RdsClusterInstanceTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getClusterIdentifier}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#cluster_identifier RdsClusterInstance#cluster_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterIdentifier(java.lang.String clusterIdentifier) {
            this.clusterIdentifier = clusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getEngine}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#engine RdsClusterInstance#engine}. This parameter is required.
         * @return {@code this}
         */
        public Builder engine(java.lang.String engine) {
            this.engine = engine;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getInstanceClass}
         * @param instanceClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#instance_class RdsClusterInstance#instance_class}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceClass(java.lang.String instanceClass) {
            this.instanceClass = instanceClass;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#apply_immediately RdsClusterInstance#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(java.lang.Boolean applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#apply_immediately RdsClusterInstance#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getAutoMinorVersionUpgrade}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#auto_minor_version_upgrade RdsClusterInstance#auto_minor_version_upgrade}.
         * @return {@code this}
         */
        public Builder autoMinorVersionUpgrade(java.lang.Boolean autoMinorVersionUpgrade) {
            this.autoMinorVersionUpgrade = autoMinorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getAutoMinorVersionUpgrade}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#auto_minor_version_upgrade RdsClusterInstance#auto_minor_version_upgrade}.
         * @return {@code this}
         */
        public Builder autoMinorVersionUpgrade(com.hashicorp.cdktf.IResolvable autoMinorVersionUpgrade) {
            this.autoMinorVersionUpgrade = autoMinorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#availability_zone RdsClusterInstance#availability_zone}.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getCaCertIdentifier}
         * @param caCertIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#ca_cert_identifier RdsClusterInstance#ca_cert_identifier}.
         * @return {@code this}
         */
        public Builder caCertIdentifier(java.lang.String caCertIdentifier) {
            this.caCertIdentifier = caCertIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getCopyTagsToSnapshot}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#copy_tags_to_snapshot RdsClusterInstance#copy_tags_to_snapshot}.
         * @return {@code this}
         */
        public Builder copyTagsToSnapshot(java.lang.Boolean copyTagsToSnapshot) {
            this.copyTagsToSnapshot = copyTagsToSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getCopyTagsToSnapshot}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#copy_tags_to_snapshot RdsClusterInstance#copy_tags_to_snapshot}.
         * @return {@code this}
         */
        public Builder copyTagsToSnapshot(com.hashicorp.cdktf.IResolvable copyTagsToSnapshot) {
            this.copyTagsToSnapshot = copyTagsToSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getCustomIamInstanceProfile}
         * @param customIamInstanceProfile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#custom_iam_instance_profile RdsClusterInstance#custom_iam_instance_profile}.
         * @return {@code this}
         */
        public Builder customIamInstanceProfile(java.lang.String customIamInstanceProfile) {
            this.customIamInstanceProfile = customIamInstanceProfile;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getDbParameterGroupName}
         * @param dbParameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#db_parameter_group_name RdsClusterInstance#db_parameter_group_name}.
         * @return {@code this}
         */
        public Builder dbParameterGroupName(java.lang.String dbParameterGroupName) {
            this.dbParameterGroupName = dbParameterGroupName;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getDbSubnetGroupName}
         * @param dbSubnetGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#db_subnet_group_name RdsClusterInstance#db_subnet_group_name}.
         * @return {@code this}
         */
        public Builder dbSubnetGroupName(java.lang.String dbSubnetGroupName) {
            this.dbSubnetGroupName = dbSubnetGroupName;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getEngineVersion}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#engine_version RdsClusterInstance#engine_version}.
         * @return {@code this}
         */
        public Builder engineVersion(java.lang.String engineVersion) {
            this.engineVersion = engineVersion;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#force_destroy RdsClusterInstance#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(java.lang.Boolean forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#force_destroy RdsClusterInstance#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(com.hashicorp.cdktf.IResolvable forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#id RdsClusterInstance#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getIdentifier}
         * @param identifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#identifier RdsClusterInstance#identifier}.
         * @return {@code this}
         */
        public Builder identifier(java.lang.String identifier) {
            this.identifier = identifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getIdentifierPrefix}
         * @param identifierPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#identifier_prefix RdsClusterInstance#identifier_prefix}.
         * @return {@code this}
         */
        public Builder identifierPrefix(java.lang.String identifierPrefix) {
            this.identifierPrefix = identifierPrefix;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getMonitoringInterval}
         * @param monitoringInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#monitoring_interval RdsClusterInstance#monitoring_interval}.
         * @return {@code this}
         */
        public Builder monitoringInterval(java.lang.Number monitoringInterval) {
            this.monitoringInterval = monitoringInterval;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getMonitoringRoleArn}
         * @param monitoringRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#monitoring_role_arn RdsClusterInstance#monitoring_role_arn}.
         * @return {@code this}
         */
        public Builder monitoringRoleArn(java.lang.String monitoringRoleArn) {
            this.monitoringRoleArn = monitoringRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getPerformanceInsightsEnabled}
         * @param performanceInsightsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_enabled RdsClusterInstance#performance_insights_enabled}.
         * @return {@code this}
         */
        public Builder performanceInsightsEnabled(java.lang.Boolean performanceInsightsEnabled) {
            this.performanceInsightsEnabled = performanceInsightsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getPerformanceInsightsEnabled}
         * @param performanceInsightsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_enabled RdsClusterInstance#performance_insights_enabled}.
         * @return {@code this}
         */
        public Builder performanceInsightsEnabled(com.hashicorp.cdktf.IResolvable performanceInsightsEnabled) {
            this.performanceInsightsEnabled = performanceInsightsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getPerformanceInsightsKmsKeyId}
         * @param performanceInsightsKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_kms_key_id RdsClusterInstance#performance_insights_kms_key_id}.
         * @return {@code this}
         */
        public Builder performanceInsightsKmsKeyId(java.lang.String performanceInsightsKmsKeyId) {
            this.performanceInsightsKmsKeyId = performanceInsightsKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getPerformanceInsightsRetentionPeriod}
         * @param performanceInsightsRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_retention_period RdsClusterInstance#performance_insights_retention_period}.
         * @return {@code this}
         */
        public Builder performanceInsightsRetentionPeriod(java.lang.Number performanceInsightsRetentionPeriod) {
            this.performanceInsightsRetentionPeriod = performanceInsightsRetentionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getPreferredBackupWindow}
         * @param preferredBackupWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#preferred_backup_window RdsClusterInstance#preferred_backup_window}.
         * @return {@code this}
         */
        public Builder preferredBackupWindow(java.lang.String preferredBackupWindow) {
            this.preferredBackupWindow = preferredBackupWindow;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getPreferredMaintenanceWindow}
         * @param preferredMaintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#preferred_maintenance_window RdsClusterInstance#preferred_maintenance_window}.
         * @return {@code this}
         */
        public Builder preferredMaintenanceWindow(java.lang.String preferredMaintenanceWindow) {
            this.preferredMaintenanceWindow = preferredMaintenanceWindow;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getPromotionTier}
         * @param promotionTier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#promotion_tier RdsClusterInstance#promotion_tier}.
         * @return {@code this}
         */
        public Builder promotionTier(java.lang.Number promotionTier) {
            this.promotionTier = promotionTier;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#publicly_accessible RdsClusterInstance#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(java.lang.Boolean publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#publicly_accessible RdsClusterInstance#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(com.hashicorp.cdktf.IResolvable publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#tags RdsClusterInstance#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#tags_all RdsClusterInstance#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#timeouts RdsClusterInstance#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.rds_cluster_instance.RdsClusterInstanceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getDependsOn}
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
         * Sets the value of {@link RdsClusterInstanceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterInstanceConfig#getProvisioners}
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
         * @return a new instance of {@link RdsClusterInstanceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RdsClusterInstanceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RdsClusterInstanceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RdsClusterInstanceConfig {
        private final java.lang.String clusterIdentifier;
        private final java.lang.String engine;
        private final java.lang.String instanceClass;
        private final java.lang.Object applyImmediately;
        private final java.lang.Object autoMinorVersionUpgrade;
        private final java.lang.String availabilityZone;
        private final java.lang.String caCertIdentifier;
        private final java.lang.Object copyTagsToSnapshot;
        private final java.lang.String customIamInstanceProfile;
        private final java.lang.String dbParameterGroupName;
        private final java.lang.String dbSubnetGroupName;
        private final java.lang.String engineVersion;
        private final java.lang.Object forceDestroy;
        private final java.lang.String id;
        private final java.lang.String identifier;
        private final java.lang.String identifierPrefix;
        private final java.lang.Number monitoringInterval;
        private final java.lang.String monitoringRoleArn;
        private final java.lang.Object performanceInsightsEnabled;
        private final java.lang.String performanceInsightsKmsKeyId;
        private final java.lang.Number performanceInsightsRetentionPeriod;
        private final java.lang.String preferredBackupWindow;
        private final java.lang.String preferredMaintenanceWindow;
        private final java.lang.Number promotionTier;
        private final java.lang.Object publiclyAccessible;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.rds_cluster_instance.RdsClusterInstanceTimeouts timeouts;
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
            this.engine = software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceClass = software.amazon.jsii.Kernel.get(this, "instanceClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applyImmediately = software.amazon.jsii.Kernel.get(this, "applyImmediately", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.autoMinorVersionUpgrade = software.amazon.jsii.Kernel.get(this, "autoMinorVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.caCertIdentifier = software.amazon.jsii.Kernel.get(this, "caCertIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyTagsToSnapshot = software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.customIamInstanceProfile = software.amazon.jsii.Kernel.get(this, "customIamInstanceProfile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbParameterGroupName = software.amazon.jsii.Kernel.get(this, "dbParameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbSubnetGroupName = software.amazon.jsii.Kernel.get(this, "dbSubnetGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineVersion = software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.forceDestroy = software.amazon.jsii.Kernel.get(this, "forceDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identifier = software.amazon.jsii.Kernel.get(this, "identifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identifierPrefix = software.amazon.jsii.Kernel.get(this, "identifierPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.monitoringInterval = software.amazon.jsii.Kernel.get(this, "monitoringInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.monitoringRoleArn = software.amazon.jsii.Kernel.get(this, "monitoringRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.performanceInsightsEnabled = software.amazon.jsii.Kernel.get(this, "performanceInsightsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.performanceInsightsKmsKeyId = software.amazon.jsii.Kernel.get(this, "performanceInsightsKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.performanceInsightsRetentionPeriod = software.amazon.jsii.Kernel.get(this, "performanceInsightsRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.preferredBackupWindow = software.amazon.jsii.Kernel.get(this, "preferredBackupWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preferredMaintenanceWindow = software.amazon.jsii.Kernel.get(this, "preferredMaintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.promotionTier = software.amazon.jsii.Kernel.get(this, "promotionTier", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.publiclyAccessible = software.amazon.jsii.Kernel.get(this, "publiclyAccessible", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster_instance.RdsClusterInstanceTimeouts.class));
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
            this.engine = java.util.Objects.requireNonNull(builder.engine, "engine is required");
            this.instanceClass = java.util.Objects.requireNonNull(builder.instanceClass, "instanceClass is required");
            this.applyImmediately = builder.applyImmediately;
            this.autoMinorVersionUpgrade = builder.autoMinorVersionUpgrade;
            this.availabilityZone = builder.availabilityZone;
            this.caCertIdentifier = builder.caCertIdentifier;
            this.copyTagsToSnapshot = builder.copyTagsToSnapshot;
            this.customIamInstanceProfile = builder.customIamInstanceProfile;
            this.dbParameterGroupName = builder.dbParameterGroupName;
            this.dbSubnetGroupName = builder.dbSubnetGroupName;
            this.engineVersion = builder.engineVersion;
            this.forceDestroy = builder.forceDestroy;
            this.id = builder.id;
            this.identifier = builder.identifier;
            this.identifierPrefix = builder.identifierPrefix;
            this.monitoringInterval = builder.monitoringInterval;
            this.monitoringRoleArn = builder.monitoringRoleArn;
            this.performanceInsightsEnabled = builder.performanceInsightsEnabled;
            this.performanceInsightsKmsKeyId = builder.performanceInsightsKmsKeyId;
            this.performanceInsightsRetentionPeriod = builder.performanceInsightsRetentionPeriod;
            this.preferredBackupWindow = builder.preferredBackupWindow;
            this.preferredMaintenanceWindow = builder.preferredMaintenanceWindow;
            this.promotionTier = builder.promotionTier;
            this.publiclyAccessible = builder.publiclyAccessible;
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
        public final java.lang.String getClusterIdentifier() {
            return this.clusterIdentifier;
        }

        @Override
        public final java.lang.String getEngine() {
            return this.engine;
        }

        @Override
        public final java.lang.String getInstanceClass() {
            return this.instanceClass;
        }

        @Override
        public final java.lang.Object getApplyImmediately() {
            return this.applyImmediately;
        }

        @Override
        public final java.lang.Object getAutoMinorVersionUpgrade() {
            return this.autoMinorVersionUpgrade;
        }

        @Override
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final java.lang.String getCaCertIdentifier() {
            return this.caCertIdentifier;
        }

        @Override
        public final java.lang.Object getCopyTagsToSnapshot() {
            return this.copyTagsToSnapshot;
        }

        @Override
        public final java.lang.String getCustomIamInstanceProfile() {
            return this.customIamInstanceProfile;
        }

        @Override
        public final java.lang.String getDbParameterGroupName() {
            return this.dbParameterGroupName;
        }

        @Override
        public final java.lang.String getDbSubnetGroupName() {
            return this.dbSubnetGroupName;
        }

        @Override
        public final java.lang.String getEngineVersion() {
            return this.engineVersion;
        }

        @Override
        public final java.lang.Object getForceDestroy() {
            return this.forceDestroy;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIdentifier() {
            return this.identifier;
        }

        @Override
        public final java.lang.String getIdentifierPrefix() {
            return this.identifierPrefix;
        }

        @Override
        public final java.lang.Number getMonitoringInterval() {
            return this.monitoringInterval;
        }

        @Override
        public final java.lang.String getMonitoringRoleArn() {
            return this.monitoringRoleArn;
        }

        @Override
        public final java.lang.Object getPerformanceInsightsEnabled() {
            return this.performanceInsightsEnabled;
        }

        @Override
        public final java.lang.String getPerformanceInsightsKmsKeyId() {
            return this.performanceInsightsKmsKeyId;
        }

        @Override
        public final java.lang.Number getPerformanceInsightsRetentionPeriod() {
            return this.performanceInsightsRetentionPeriod;
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
        public final java.lang.Number getPromotionTier() {
            return this.promotionTier;
        }

        @Override
        public final java.lang.Object getPubliclyAccessible() {
            return this.publiclyAccessible;
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
        public final imports.aws.rds_cluster_instance.RdsClusterInstanceTimeouts getTimeouts() {
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

            data.set("clusterIdentifier", om.valueToTree(this.getClusterIdentifier()));
            data.set("engine", om.valueToTree(this.getEngine()));
            data.set("instanceClass", om.valueToTree(this.getInstanceClass()));
            if (this.getApplyImmediately() != null) {
                data.set("applyImmediately", om.valueToTree(this.getApplyImmediately()));
            }
            if (this.getAutoMinorVersionUpgrade() != null) {
                data.set("autoMinorVersionUpgrade", om.valueToTree(this.getAutoMinorVersionUpgrade()));
            }
            if (this.getAvailabilityZone() != null) {
                data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            }
            if (this.getCaCertIdentifier() != null) {
                data.set("caCertIdentifier", om.valueToTree(this.getCaCertIdentifier()));
            }
            if (this.getCopyTagsToSnapshot() != null) {
                data.set("copyTagsToSnapshot", om.valueToTree(this.getCopyTagsToSnapshot()));
            }
            if (this.getCustomIamInstanceProfile() != null) {
                data.set("customIamInstanceProfile", om.valueToTree(this.getCustomIamInstanceProfile()));
            }
            if (this.getDbParameterGroupName() != null) {
                data.set("dbParameterGroupName", om.valueToTree(this.getDbParameterGroupName()));
            }
            if (this.getDbSubnetGroupName() != null) {
                data.set("dbSubnetGroupName", om.valueToTree(this.getDbSubnetGroupName()));
            }
            if (this.getEngineVersion() != null) {
                data.set("engineVersion", om.valueToTree(this.getEngineVersion()));
            }
            if (this.getForceDestroy() != null) {
                data.set("forceDestroy", om.valueToTree(this.getForceDestroy()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIdentifier() != null) {
                data.set("identifier", om.valueToTree(this.getIdentifier()));
            }
            if (this.getIdentifierPrefix() != null) {
                data.set("identifierPrefix", om.valueToTree(this.getIdentifierPrefix()));
            }
            if (this.getMonitoringInterval() != null) {
                data.set("monitoringInterval", om.valueToTree(this.getMonitoringInterval()));
            }
            if (this.getMonitoringRoleArn() != null) {
                data.set("monitoringRoleArn", om.valueToTree(this.getMonitoringRoleArn()));
            }
            if (this.getPerformanceInsightsEnabled() != null) {
                data.set("performanceInsightsEnabled", om.valueToTree(this.getPerformanceInsightsEnabled()));
            }
            if (this.getPerformanceInsightsKmsKeyId() != null) {
                data.set("performanceInsightsKmsKeyId", om.valueToTree(this.getPerformanceInsightsKmsKeyId()));
            }
            if (this.getPerformanceInsightsRetentionPeriod() != null) {
                data.set("performanceInsightsRetentionPeriod", om.valueToTree(this.getPerformanceInsightsRetentionPeriod()));
            }
            if (this.getPreferredBackupWindow() != null) {
                data.set("preferredBackupWindow", om.valueToTree(this.getPreferredBackupWindow()));
            }
            if (this.getPreferredMaintenanceWindow() != null) {
                data.set("preferredMaintenanceWindow", om.valueToTree(this.getPreferredMaintenanceWindow()));
            }
            if (this.getPromotionTier() != null) {
                data.set("promotionTier", om.valueToTree(this.getPromotionTier()));
            }
            if (this.getPubliclyAccessible() != null) {
                data.set("publiclyAccessible", om.valueToTree(this.getPubliclyAccessible()));
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
            struct.set("fqn", om.valueToTree("aws.rdsClusterInstance.RdsClusterInstanceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RdsClusterInstanceConfig.Jsii$Proxy that = (RdsClusterInstanceConfig.Jsii$Proxy) o;

            if (!clusterIdentifier.equals(that.clusterIdentifier)) return false;
            if (!engine.equals(that.engine)) return false;
            if (!instanceClass.equals(that.instanceClass)) return false;
            if (this.applyImmediately != null ? !this.applyImmediately.equals(that.applyImmediately) : that.applyImmediately != null) return false;
            if (this.autoMinorVersionUpgrade != null ? !this.autoMinorVersionUpgrade.equals(that.autoMinorVersionUpgrade) : that.autoMinorVersionUpgrade != null) return false;
            if (this.availabilityZone != null ? !this.availabilityZone.equals(that.availabilityZone) : that.availabilityZone != null) return false;
            if (this.caCertIdentifier != null ? !this.caCertIdentifier.equals(that.caCertIdentifier) : that.caCertIdentifier != null) return false;
            if (this.copyTagsToSnapshot != null ? !this.copyTagsToSnapshot.equals(that.copyTagsToSnapshot) : that.copyTagsToSnapshot != null) return false;
            if (this.customIamInstanceProfile != null ? !this.customIamInstanceProfile.equals(that.customIamInstanceProfile) : that.customIamInstanceProfile != null) return false;
            if (this.dbParameterGroupName != null ? !this.dbParameterGroupName.equals(that.dbParameterGroupName) : that.dbParameterGroupName != null) return false;
            if (this.dbSubnetGroupName != null ? !this.dbSubnetGroupName.equals(that.dbSubnetGroupName) : that.dbSubnetGroupName != null) return false;
            if (this.engineVersion != null ? !this.engineVersion.equals(that.engineVersion) : that.engineVersion != null) return false;
            if (this.forceDestroy != null ? !this.forceDestroy.equals(that.forceDestroy) : that.forceDestroy != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.identifier != null ? !this.identifier.equals(that.identifier) : that.identifier != null) return false;
            if (this.identifierPrefix != null ? !this.identifierPrefix.equals(that.identifierPrefix) : that.identifierPrefix != null) return false;
            if (this.monitoringInterval != null ? !this.monitoringInterval.equals(that.monitoringInterval) : that.monitoringInterval != null) return false;
            if (this.monitoringRoleArn != null ? !this.monitoringRoleArn.equals(that.monitoringRoleArn) : that.monitoringRoleArn != null) return false;
            if (this.performanceInsightsEnabled != null ? !this.performanceInsightsEnabled.equals(that.performanceInsightsEnabled) : that.performanceInsightsEnabled != null) return false;
            if (this.performanceInsightsKmsKeyId != null ? !this.performanceInsightsKmsKeyId.equals(that.performanceInsightsKmsKeyId) : that.performanceInsightsKmsKeyId != null) return false;
            if (this.performanceInsightsRetentionPeriod != null ? !this.performanceInsightsRetentionPeriod.equals(that.performanceInsightsRetentionPeriod) : that.performanceInsightsRetentionPeriod != null) return false;
            if (this.preferredBackupWindow != null ? !this.preferredBackupWindow.equals(that.preferredBackupWindow) : that.preferredBackupWindow != null) return false;
            if (this.preferredMaintenanceWindow != null ? !this.preferredMaintenanceWindow.equals(that.preferredMaintenanceWindow) : that.preferredMaintenanceWindow != null) return false;
            if (this.promotionTier != null ? !this.promotionTier.equals(that.promotionTier) : that.promotionTier != null) return false;
            if (this.publiclyAccessible != null ? !this.publiclyAccessible.equals(that.publiclyAccessible) : that.publiclyAccessible != null) return false;
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
            int result = this.clusterIdentifier.hashCode();
            result = 31 * result + (this.engine.hashCode());
            result = 31 * result + (this.instanceClass.hashCode());
            result = 31 * result + (this.applyImmediately != null ? this.applyImmediately.hashCode() : 0);
            result = 31 * result + (this.autoMinorVersionUpgrade != null ? this.autoMinorVersionUpgrade.hashCode() : 0);
            result = 31 * result + (this.availabilityZone != null ? this.availabilityZone.hashCode() : 0);
            result = 31 * result + (this.caCertIdentifier != null ? this.caCertIdentifier.hashCode() : 0);
            result = 31 * result + (this.copyTagsToSnapshot != null ? this.copyTagsToSnapshot.hashCode() : 0);
            result = 31 * result + (this.customIamInstanceProfile != null ? this.customIamInstanceProfile.hashCode() : 0);
            result = 31 * result + (this.dbParameterGroupName != null ? this.dbParameterGroupName.hashCode() : 0);
            result = 31 * result + (this.dbSubnetGroupName != null ? this.dbSubnetGroupName.hashCode() : 0);
            result = 31 * result + (this.engineVersion != null ? this.engineVersion.hashCode() : 0);
            result = 31 * result + (this.forceDestroy != null ? this.forceDestroy.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.identifier != null ? this.identifier.hashCode() : 0);
            result = 31 * result + (this.identifierPrefix != null ? this.identifierPrefix.hashCode() : 0);
            result = 31 * result + (this.monitoringInterval != null ? this.monitoringInterval.hashCode() : 0);
            result = 31 * result + (this.monitoringRoleArn != null ? this.monitoringRoleArn.hashCode() : 0);
            result = 31 * result + (this.performanceInsightsEnabled != null ? this.performanceInsightsEnabled.hashCode() : 0);
            result = 31 * result + (this.performanceInsightsKmsKeyId != null ? this.performanceInsightsKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.performanceInsightsRetentionPeriod != null ? this.performanceInsightsRetentionPeriod.hashCode() : 0);
            result = 31 * result + (this.preferredBackupWindow != null ? this.preferredBackupWindow.hashCode() : 0);
            result = 31 * result + (this.preferredMaintenanceWindow != null ? this.preferredMaintenanceWindow.hashCode() : 0);
            result = 31 * result + (this.promotionTier != null ? this.promotionTier.hashCode() : 0);
            result = 31 * result + (this.publiclyAccessible != null ? this.publiclyAccessible.hashCode() : 0);
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
