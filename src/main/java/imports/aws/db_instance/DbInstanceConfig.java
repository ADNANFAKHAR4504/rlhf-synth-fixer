package imports.aws.db_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.967Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dbInstance.DbInstanceConfig")
@software.amazon.jsii.Jsii.Proxy(DbInstanceConfig.Jsii$Proxy.class)
public interface DbInstanceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#instance_class DbInstance#instance_class}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceClass();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#allocated_storage DbInstance#allocated_storage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAllocatedStorage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#allow_major_version_upgrade DbInstance#allow_major_version_upgrade}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowMajorVersionUpgrade() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#apply_immediately DbInstance#apply_immediately}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediately() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#auto_minor_version_upgrade DbInstance#auto_minor_version_upgrade}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoMinorVersionUpgrade() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#availability_zone DbInstance#availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#backup_retention_period DbInstance#backup_retention_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBackupRetentionPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#backup_target DbInstance#backup_target}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBackupTarget() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#backup_window DbInstance#backup_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBackupWindow() {
        return null;
    }

    /**
     * blue_green_update block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#blue_green_update DbInstance#blue_green_update}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.db_instance.DbInstanceBlueGreenUpdate getBlueGreenUpdate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#ca_cert_identifier DbInstance#ca_cert_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCaCertIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#character_set_name DbInstance#character_set_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCharacterSetName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#copy_tags_to_snapshot DbInstance#copy_tags_to_snapshot}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToSnapshot() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#customer_owned_ip_enabled DbInstance#customer_owned_ip_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomerOwnedIpEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#custom_iam_instance_profile DbInstance#custom_iam_instance_profile}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomIamInstanceProfile() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#database_insights_mode DbInstance#database_insights_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatabaseInsightsMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#db_name DbInstance#db_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#db_subnet_group_name DbInstance#db_subnet_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbSubnetGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#dedicated_log_volume DbInstance#dedicated_log_volume}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDedicatedLogVolume() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#delete_automated_backups DbInstance#delete_automated_backups}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeleteAutomatedBackups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#deletion_protection DbInstance#deletion_protection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeletionProtection() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#domain DbInstance#domain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomain() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#domain_auth_secret_arn DbInstance#domain_auth_secret_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainAuthSecretArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#domain_dns_ips DbInstance#domain_dns_ips}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDomainDnsIps() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#domain_fqdn DbInstance#domain_fqdn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainFqdn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#domain_iam_role_name DbInstance#domain_iam_role_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainIamRoleName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#domain_ou DbInstance#domain_ou}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainOu() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#enabled_cloudwatch_logs_exports DbInstance#enabled_cloudwatch_logs_exports}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledCloudwatchLogsExports() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#engine DbInstance#engine}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngine() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#engine_lifecycle_support DbInstance#engine_lifecycle_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngineLifecycleSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#engine_version DbInstance#engine_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngineVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#final_snapshot_identifier DbInstance#final_snapshot_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFinalSnapshotIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#iam_database_authentication_enabled DbInstance#iam_database_authentication_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIamDatabaseAuthenticationEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#id DbInstance#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#identifier DbInstance#identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#identifier_prefix DbInstance#identifier_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdentifierPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#iops DbInstance#iops}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIops() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#kms_key_id DbInstance#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#license_model DbInstance#license_model}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLicenseModel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#maintenance_window DbInstance#maintenance_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaintenanceWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#manage_master_user_password DbInstance#manage_master_user_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getManageMasterUserPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#master_user_secret_kms_key_id DbInstance#master_user_secret_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMasterUserSecretKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#max_allocated_storage DbInstance#max_allocated_storage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxAllocatedStorage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#monitoring_interval DbInstance#monitoring_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMonitoringInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#monitoring_role_arn DbInstance#monitoring_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMonitoringRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#multi_az DbInstance#multi_az}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMultiAz() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#nchar_character_set_name DbInstance#nchar_character_set_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNcharCharacterSetName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#network_type DbInstance#network_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetworkType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#option_group_name DbInstance#option_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOptionGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#parameter_group_name DbInstance#parameter_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParameterGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#password DbInstance#password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#password_wo DbInstance#password_wo}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPasswordWo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#password_wo_version DbInstance#password_wo_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPasswordWoVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#performance_insights_enabled DbInstance#performance_insights_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPerformanceInsightsEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#performance_insights_kms_key_id DbInstance#performance_insights_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPerformanceInsightsKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#performance_insights_retention_period DbInstance#performance_insights_retention_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPerformanceInsightsRetentionPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#port DbInstance#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#publicly_accessible DbInstance#publicly_accessible}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAccessible() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#replica_mode DbInstance#replica_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplicaMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#replicate_source_db DbInstance#replicate_source_db}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplicateSourceDb() {
        return null;
    }

    /**
     * restore_to_point_in_time block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#restore_to_point_in_time DbInstance#restore_to_point_in_time}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.db_instance.DbInstanceRestoreToPointInTime getRestoreToPointInTime() {
        return null;
    }

    /**
     * s3_import block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#s3_import DbInstance#s3_import}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.db_instance.DbInstanceS3Import getS3Import() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#skip_final_snapshot DbInstance#skip_final_snapshot}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalSnapshot() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#snapshot_identifier DbInstance#snapshot_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#storage_encrypted DbInstance#storage_encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStorageEncrypted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#storage_throughput DbInstance#storage_throughput}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getStorageThroughput() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#storage_type DbInstance#storage_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#tags DbInstance#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#tags_all DbInstance#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#timeouts DbInstance#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.db_instance.DbInstanceTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#timezone DbInstance#timezone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimezone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#upgrade_storage_config DbInstance#upgrade_storage_config}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUpgradeStorageConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#username DbInstance#username}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUsername() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#vpc_security_group_ids DbInstance#vpc_security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DbInstanceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DbInstanceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DbInstanceConfig> {
        java.lang.String instanceClass;
        java.lang.Number allocatedStorage;
        java.lang.Object allowMajorVersionUpgrade;
        java.lang.Object applyImmediately;
        java.lang.Object autoMinorVersionUpgrade;
        java.lang.String availabilityZone;
        java.lang.Number backupRetentionPeriod;
        java.lang.String backupTarget;
        java.lang.String backupWindow;
        imports.aws.db_instance.DbInstanceBlueGreenUpdate blueGreenUpdate;
        java.lang.String caCertIdentifier;
        java.lang.String characterSetName;
        java.lang.Object copyTagsToSnapshot;
        java.lang.Object customerOwnedIpEnabled;
        java.lang.String customIamInstanceProfile;
        java.lang.String databaseInsightsMode;
        java.lang.String dbName;
        java.lang.String dbSubnetGroupName;
        java.lang.Object dedicatedLogVolume;
        java.lang.Object deleteAutomatedBackups;
        java.lang.Object deletionProtection;
        java.lang.String domain;
        java.lang.String domainAuthSecretArn;
        java.util.List<java.lang.String> domainDnsIps;
        java.lang.String domainFqdn;
        java.lang.String domainIamRoleName;
        java.lang.String domainOu;
        java.util.List<java.lang.String> enabledCloudwatchLogsExports;
        java.lang.String engine;
        java.lang.String engineLifecycleSupport;
        java.lang.String engineVersion;
        java.lang.String finalSnapshotIdentifier;
        java.lang.Object iamDatabaseAuthenticationEnabled;
        java.lang.String id;
        java.lang.String identifier;
        java.lang.String identifierPrefix;
        java.lang.Number iops;
        java.lang.String kmsKeyId;
        java.lang.String licenseModel;
        java.lang.String maintenanceWindow;
        java.lang.Object manageMasterUserPassword;
        java.lang.String masterUserSecretKmsKeyId;
        java.lang.Number maxAllocatedStorage;
        java.lang.Number monitoringInterval;
        java.lang.String monitoringRoleArn;
        java.lang.Object multiAz;
        java.lang.String ncharCharacterSetName;
        java.lang.String networkType;
        java.lang.String optionGroupName;
        java.lang.String parameterGroupName;
        java.lang.String password;
        java.lang.String passwordWo;
        java.lang.Number passwordWoVersion;
        java.lang.Object performanceInsightsEnabled;
        java.lang.String performanceInsightsKmsKeyId;
        java.lang.Number performanceInsightsRetentionPeriod;
        java.lang.Number port;
        java.lang.Object publiclyAccessible;
        java.lang.String replicaMode;
        java.lang.String replicateSourceDb;
        imports.aws.db_instance.DbInstanceRestoreToPointInTime restoreToPointInTime;
        imports.aws.db_instance.DbInstanceS3Import s3Import;
        java.lang.Object skipFinalSnapshot;
        java.lang.String snapshotIdentifier;
        java.lang.Object storageEncrypted;
        java.lang.Number storageThroughput;
        java.lang.String storageType;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.db_instance.DbInstanceTimeouts timeouts;
        java.lang.String timezone;
        java.lang.Object upgradeStorageConfig;
        java.lang.String username;
        java.util.List<java.lang.String> vpcSecurityGroupIds;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DbInstanceConfig#getInstanceClass}
         * @param instanceClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#instance_class DbInstance#instance_class}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceClass(java.lang.String instanceClass) {
            this.instanceClass = instanceClass;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getAllocatedStorage}
         * @param allocatedStorage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#allocated_storage DbInstance#allocated_storage}.
         * @return {@code this}
         */
        public Builder allocatedStorage(java.lang.Number allocatedStorage) {
            this.allocatedStorage = allocatedStorage;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getAllowMajorVersionUpgrade}
         * @param allowMajorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#allow_major_version_upgrade DbInstance#allow_major_version_upgrade}.
         * @return {@code this}
         */
        public Builder allowMajorVersionUpgrade(java.lang.Boolean allowMajorVersionUpgrade) {
            this.allowMajorVersionUpgrade = allowMajorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getAllowMajorVersionUpgrade}
         * @param allowMajorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#allow_major_version_upgrade DbInstance#allow_major_version_upgrade}.
         * @return {@code this}
         */
        public Builder allowMajorVersionUpgrade(com.hashicorp.cdktf.IResolvable allowMajorVersionUpgrade) {
            this.allowMajorVersionUpgrade = allowMajorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#apply_immediately DbInstance#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(java.lang.Boolean applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#apply_immediately DbInstance#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getAutoMinorVersionUpgrade}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#auto_minor_version_upgrade DbInstance#auto_minor_version_upgrade}.
         * @return {@code this}
         */
        public Builder autoMinorVersionUpgrade(java.lang.Boolean autoMinorVersionUpgrade) {
            this.autoMinorVersionUpgrade = autoMinorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getAutoMinorVersionUpgrade}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#auto_minor_version_upgrade DbInstance#auto_minor_version_upgrade}.
         * @return {@code this}
         */
        public Builder autoMinorVersionUpgrade(com.hashicorp.cdktf.IResolvable autoMinorVersionUpgrade) {
            this.autoMinorVersionUpgrade = autoMinorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#availability_zone DbInstance#availability_zone}.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getBackupRetentionPeriod}
         * @param backupRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#backup_retention_period DbInstance#backup_retention_period}.
         * @return {@code this}
         */
        public Builder backupRetentionPeriod(java.lang.Number backupRetentionPeriod) {
            this.backupRetentionPeriod = backupRetentionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getBackupTarget}
         * @param backupTarget Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#backup_target DbInstance#backup_target}.
         * @return {@code this}
         */
        public Builder backupTarget(java.lang.String backupTarget) {
            this.backupTarget = backupTarget;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getBackupWindow}
         * @param backupWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#backup_window DbInstance#backup_window}.
         * @return {@code this}
         */
        public Builder backupWindow(java.lang.String backupWindow) {
            this.backupWindow = backupWindow;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getBlueGreenUpdate}
         * @param blueGreenUpdate blue_green_update block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#blue_green_update DbInstance#blue_green_update}
         * @return {@code this}
         */
        public Builder blueGreenUpdate(imports.aws.db_instance.DbInstanceBlueGreenUpdate blueGreenUpdate) {
            this.blueGreenUpdate = blueGreenUpdate;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getCaCertIdentifier}
         * @param caCertIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#ca_cert_identifier DbInstance#ca_cert_identifier}.
         * @return {@code this}
         */
        public Builder caCertIdentifier(java.lang.String caCertIdentifier) {
            this.caCertIdentifier = caCertIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getCharacterSetName}
         * @param characterSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#character_set_name DbInstance#character_set_name}.
         * @return {@code this}
         */
        public Builder characterSetName(java.lang.String characterSetName) {
            this.characterSetName = characterSetName;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getCopyTagsToSnapshot}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#copy_tags_to_snapshot DbInstance#copy_tags_to_snapshot}.
         * @return {@code this}
         */
        public Builder copyTagsToSnapshot(java.lang.Boolean copyTagsToSnapshot) {
            this.copyTagsToSnapshot = copyTagsToSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getCopyTagsToSnapshot}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#copy_tags_to_snapshot DbInstance#copy_tags_to_snapshot}.
         * @return {@code this}
         */
        public Builder copyTagsToSnapshot(com.hashicorp.cdktf.IResolvable copyTagsToSnapshot) {
            this.copyTagsToSnapshot = copyTagsToSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getCustomerOwnedIpEnabled}
         * @param customerOwnedIpEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#customer_owned_ip_enabled DbInstance#customer_owned_ip_enabled}.
         * @return {@code this}
         */
        public Builder customerOwnedIpEnabled(java.lang.Boolean customerOwnedIpEnabled) {
            this.customerOwnedIpEnabled = customerOwnedIpEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getCustomerOwnedIpEnabled}
         * @param customerOwnedIpEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#customer_owned_ip_enabled DbInstance#customer_owned_ip_enabled}.
         * @return {@code this}
         */
        public Builder customerOwnedIpEnabled(com.hashicorp.cdktf.IResolvable customerOwnedIpEnabled) {
            this.customerOwnedIpEnabled = customerOwnedIpEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getCustomIamInstanceProfile}
         * @param customIamInstanceProfile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#custom_iam_instance_profile DbInstance#custom_iam_instance_profile}.
         * @return {@code this}
         */
        public Builder customIamInstanceProfile(java.lang.String customIamInstanceProfile) {
            this.customIamInstanceProfile = customIamInstanceProfile;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDatabaseInsightsMode}
         * @param databaseInsightsMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#database_insights_mode DbInstance#database_insights_mode}.
         * @return {@code this}
         */
        public Builder databaseInsightsMode(java.lang.String databaseInsightsMode) {
            this.databaseInsightsMode = databaseInsightsMode;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDbName}
         * @param dbName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#db_name DbInstance#db_name}.
         * @return {@code this}
         */
        public Builder dbName(java.lang.String dbName) {
            this.dbName = dbName;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDbSubnetGroupName}
         * @param dbSubnetGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#db_subnet_group_name DbInstance#db_subnet_group_name}.
         * @return {@code this}
         */
        public Builder dbSubnetGroupName(java.lang.String dbSubnetGroupName) {
            this.dbSubnetGroupName = dbSubnetGroupName;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDedicatedLogVolume}
         * @param dedicatedLogVolume Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#dedicated_log_volume DbInstance#dedicated_log_volume}.
         * @return {@code this}
         */
        public Builder dedicatedLogVolume(java.lang.Boolean dedicatedLogVolume) {
            this.dedicatedLogVolume = dedicatedLogVolume;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDedicatedLogVolume}
         * @param dedicatedLogVolume Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#dedicated_log_volume DbInstance#dedicated_log_volume}.
         * @return {@code this}
         */
        public Builder dedicatedLogVolume(com.hashicorp.cdktf.IResolvable dedicatedLogVolume) {
            this.dedicatedLogVolume = dedicatedLogVolume;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDeleteAutomatedBackups}
         * @param deleteAutomatedBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#delete_automated_backups DbInstance#delete_automated_backups}.
         * @return {@code this}
         */
        public Builder deleteAutomatedBackups(java.lang.Boolean deleteAutomatedBackups) {
            this.deleteAutomatedBackups = deleteAutomatedBackups;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDeleteAutomatedBackups}
         * @param deleteAutomatedBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#delete_automated_backups DbInstance#delete_automated_backups}.
         * @return {@code this}
         */
        public Builder deleteAutomatedBackups(com.hashicorp.cdktf.IResolvable deleteAutomatedBackups) {
            this.deleteAutomatedBackups = deleteAutomatedBackups;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDeletionProtection}
         * @param deletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#deletion_protection DbInstance#deletion_protection}.
         * @return {@code this}
         */
        public Builder deletionProtection(java.lang.Boolean deletionProtection) {
            this.deletionProtection = deletionProtection;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDeletionProtection}
         * @param deletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#deletion_protection DbInstance#deletion_protection}.
         * @return {@code this}
         */
        public Builder deletionProtection(com.hashicorp.cdktf.IResolvable deletionProtection) {
            this.deletionProtection = deletionProtection;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDomain}
         * @param domain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#domain DbInstance#domain}.
         * @return {@code this}
         */
        public Builder domain(java.lang.String domain) {
            this.domain = domain;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDomainAuthSecretArn}
         * @param domainAuthSecretArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#domain_auth_secret_arn DbInstance#domain_auth_secret_arn}.
         * @return {@code this}
         */
        public Builder domainAuthSecretArn(java.lang.String domainAuthSecretArn) {
            this.domainAuthSecretArn = domainAuthSecretArn;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDomainDnsIps}
         * @param domainDnsIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#domain_dns_ips DbInstance#domain_dns_ips}.
         * @return {@code this}
         */
        public Builder domainDnsIps(java.util.List<java.lang.String> domainDnsIps) {
            this.domainDnsIps = domainDnsIps;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDomainFqdn}
         * @param domainFqdn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#domain_fqdn DbInstance#domain_fqdn}.
         * @return {@code this}
         */
        public Builder domainFqdn(java.lang.String domainFqdn) {
            this.domainFqdn = domainFqdn;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDomainIamRoleName}
         * @param domainIamRoleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#domain_iam_role_name DbInstance#domain_iam_role_name}.
         * @return {@code this}
         */
        public Builder domainIamRoleName(java.lang.String domainIamRoleName) {
            this.domainIamRoleName = domainIamRoleName;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDomainOu}
         * @param domainOu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#domain_ou DbInstance#domain_ou}.
         * @return {@code this}
         */
        public Builder domainOu(java.lang.String domainOu) {
            this.domainOu = domainOu;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getEnabledCloudwatchLogsExports}
         * @param enabledCloudwatchLogsExports Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#enabled_cloudwatch_logs_exports DbInstance#enabled_cloudwatch_logs_exports}.
         * @return {@code this}
         */
        public Builder enabledCloudwatchLogsExports(java.util.List<java.lang.String> enabledCloudwatchLogsExports) {
            this.enabledCloudwatchLogsExports = enabledCloudwatchLogsExports;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getEngine}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#engine DbInstance#engine}.
         * @return {@code this}
         */
        public Builder engine(java.lang.String engine) {
            this.engine = engine;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getEngineLifecycleSupport}
         * @param engineLifecycleSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#engine_lifecycle_support DbInstance#engine_lifecycle_support}.
         * @return {@code this}
         */
        public Builder engineLifecycleSupport(java.lang.String engineLifecycleSupport) {
            this.engineLifecycleSupport = engineLifecycleSupport;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getEngineVersion}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#engine_version DbInstance#engine_version}.
         * @return {@code this}
         */
        public Builder engineVersion(java.lang.String engineVersion) {
            this.engineVersion = engineVersion;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getFinalSnapshotIdentifier}
         * @param finalSnapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#final_snapshot_identifier DbInstance#final_snapshot_identifier}.
         * @return {@code this}
         */
        public Builder finalSnapshotIdentifier(java.lang.String finalSnapshotIdentifier) {
            this.finalSnapshotIdentifier = finalSnapshotIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getIamDatabaseAuthenticationEnabled}
         * @param iamDatabaseAuthenticationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#iam_database_authentication_enabled DbInstance#iam_database_authentication_enabled}.
         * @return {@code this}
         */
        public Builder iamDatabaseAuthenticationEnabled(java.lang.Boolean iamDatabaseAuthenticationEnabled) {
            this.iamDatabaseAuthenticationEnabled = iamDatabaseAuthenticationEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getIamDatabaseAuthenticationEnabled}
         * @param iamDatabaseAuthenticationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#iam_database_authentication_enabled DbInstance#iam_database_authentication_enabled}.
         * @return {@code this}
         */
        public Builder iamDatabaseAuthenticationEnabled(com.hashicorp.cdktf.IResolvable iamDatabaseAuthenticationEnabled) {
            this.iamDatabaseAuthenticationEnabled = iamDatabaseAuthenticationEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#id DbInstance#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getIdentifier}
         * @param identifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#identifier DbInstance#identifier}.
         * @return {@code this}
         */
        public Builder identifier(java.lang.String identifier) {
            this.identifier = identifier;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getIdentifierPrefix}
         * @param identifierPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#identifier_prefix DbInstance#identifier_prefix}.
         * @return {@code this}
         */
        public Builder identifierPrefix(java.lang.String identifierPrefix) {
            this.identifierPrefix = identifierPrefix;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getIops}
         * @param iops Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#iops DbInstance#iops}.
         * @return {@code this}
         */
        public Builder iops(java.lang.Number iops) {
            this.iops = iops;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#kms_key_id DbInstance#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getLicenseModel}
         * @param licenseModel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#license_model DbInstance#license_model}.
         * @return {@code this}
         */
        public Builder licenseModel(java.lang.String licenseModel) {
            this.licenseModel = licenseModel;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getMaintenanceWindow}
         * @param maintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#maintenance_window DbInstance#maintenance_window}.
         * @return {@code this}
         */
        public Builder maintenanceWindow(java.lang.String maintenanceWindow) {
            this.maintenanceWindow = maintenanceWindow;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getManageMasterUserPassword}
         * @param manageMasterUserPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#manage_master_user_password DbInstance#manage_master_user_password}.
         * @return {@code this}
         */
        public Builder manageMasterUserPassword(java.lang.Boolean manageMasterUserPassword) {
            this.manageMasterUserPassword = manageMasterUserPassword;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getManageMasterUserPassword}
         * @param manageMasterUserPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#manage_master_user_password DbInstance#manage_master_user_password}.
         * @return {@code this}
         */
        public Builder manageMasterUserPassword(com.hashicorp.cdktf.IResolvable manageMasterUserPassword) {
            this.manageMasterUserPassword = manageMasterUserPassword;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getMasterUserSecretKmsKeyId}
         * @param masterUserSecretKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#master_user_secret_kms_key_id DbInstance#master_user_secret_kms_key_id}.
         * @return {@code this}
         */
        public Builder masterUserSecretKmsKeyId(java.lang.String masterUserSecretKmsKeyId) {
            this.masterUserSecretKmsKeyId = masterUserSecretKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getMaxAllocatedStorage}
         * @param maxAllocatedStorage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#max_allocated_storage DbInstance#max_allocated_storage}.
         * @return {@code this}
         */
        public Builder maxAllocatedStorage(java.lang.Number maxAllocatedStorage) {
            this.maxAllocatedStorage = maxAllocatedStorage;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getMonitoringInterval}
         * @param monitoringInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#monitoring_interval DbInstance#monitoring_interval}.
         * @return {@code this}
         */
        public Builder monitoringInterval(java.lang.Number monitoringInterval) {
            this.monitoringInterval = monitoringInterval;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getMonitoringRoleArn}
         * @param monitoringRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#monitoring_role_arn DbInstance#monitoring_role_arn}.
         * @return {@code this}
         */
        public Builder monitoringRoleArn(java.lang.String monitoringRoleArn) {
            this.monitoringRoleArn = monitoringRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getMultiAz}
         * @param multiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#multi_az DbInstance#multi_az}.
         * @return {@code this}
         */
        public Builder multiAz(java.lang.Boolean multiAz) {
            this.multiAz = multiAz;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getMultiAz}
         * @param multiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#multi_az DbInstance#multi_az}.
         * @return {@code this}
         */
        public Builder multiAz(com.hashicorp.cdktf.IResolvable multiAz) {
            this.multiAz = multiAz;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getNcharCharacterSetName}
         * @param ncharCharacterSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#nchar_character_set_name DbInstance#nchar_character_set_name}.
         * @return {@code this}
         */
        public Builder ncharCharacterSetName(java.lang.String ncharCharacterSetName) {
            this.ncharCharacterSetName = ncharCharacterSetName;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getNetworkType}
         * @param networkType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#network_type DbInstance#network_type}.
         * @return {@code this}
         */
        public Builder networkType(java.lang.String networkType) {
            this.networkType = networkType;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getOptionGroupName}
         * @param optionGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#option_group_name DbInstance#option_group_name}.
         * @return {@code this}
         */
        public Builder optionGroupName(java.lang.String optionGroupName) {
            this.optionGroupName = optionGroupName;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getParameterGroupName}
         * @param parameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#parameter_group_name DbInstance#parameter_group_name}.
         * @return {@code this}
         */
        public Builder parameterGroupName(java.lang.String parameterGroupName) {
            this.parameterGroupName = parameterGroupName;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getPassword}
         * @param password Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#password DbInstance#password}.
         * @return {@code this}
         */
        public Builder password(java.lang.String password) {
            this.password = password;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getPasswordWo}
         * @param passwordWo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#password_wo DbInstance#password_wo}.
         * @return {@code this}
         */
        public Builder passwordWo(java.lang.String passwordWo) {
            this.passwordWo = passwordWo;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getPasswordWoVersion}
         * @param passwordWoVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#password_wo_version DbInstance#password_wo_version}.
         * @return {@code this}
         */
        public Builder passwordWoVersion(java.lang.Number passwordWoVersion) {
            this.passwordWoVersion = passwordWoVersion;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getPerformanceInsightsEnabled}
         * @param performanceInsightsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#performance_insights_enabled DbInstance#performance_insights_enabled}.
         * @return {@code this}
         */
        public Builder performanceInsightsEnabled(java.lang.Boolean performanceInsightsEnabled) {
            this.performanceInsightsEnabled = performanceInsightsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getPerformanceInsightsEnabled}
         * @param performanceInsightsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#performance_insights_enabled DbInstance#performance_insights_enabled}.
         * @return {@code this}
         */
        public Builder performanceInsightsEnabled(com.hashicorp.cdktf.IResolvable performanceInsightsEnabled) {
            this.performanceInsightsEnabled = performanceInsightsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getPerformanceInsightsKmsKeyId}
         * @param performanceInsightsKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#performance_insights_kms_key_id DbInstance#performance_insights_kms_key_id}.
         * @return {@code this}
         */
        public Builder performanceInsightsKmsKeyId(java.lang.String performanceInsightsKmsKeyId) {
            this.performanceInsightsKmsKeyId = performanceInsightsKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getPerformanceInsightsRetentionPeriod}
         * @param performanceInsightsRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#performance_insights_retention_period DbInstance#performance_insights_retention_period}.
         * @return {@code this}
         */
        public Builder performanceInsightsRetentionPeriod(java.lang.Number performanceInsightsRetentionPeriod) {
            this.performanceInsightsRetentionPeriod = performanceInsightsRetentionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#port DbInstance#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#publicly_accessible DbInstance#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(java.lang.Boolean publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#publicly_accessible DbInstance#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(com.hashicorp.cdktf.IResolvable publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getReplicaMode}
         * @param replicaMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#replica_mode DbInstance#replica_mode}.
         * @return {@code this}
         */
        public Builder replicaMode(java.lang.String replicaMode) {
            this.replicaMode = replicaMode;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getReplicateSourceDb}
         * @param replicateSourceDb Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#replicate_source_db DbInstance#replicate_source_db}.
         * @return {@code this}
         */
        public Builder replicateSourceDb(java.lang.String replicateSourceDb) {
            this.replicateSourceDb = replicateSourceDb;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getRestoreToPointInTime}
         * @param restoreToPointInTime restore_to_point_in_time block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#restore_to_point_in_time DbInstance#restore_to_point_in_time}
         * @return {@code this}
         */
        public Builder restoreToPointInTime(imports.aws.db_instance.DbInstanceRestoreToPointInTime restoreToPointInTime) {
            this.restoreToPointInTime = restoreToPointInTime;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getS3Import}
         * @param s3Import s3_import block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#s3_import DbInstance#s3_import}
         * @return {@code this}
         */
        public Builder s3Import(imports.aws.db_instance.DbInstanceS3Import s3Import) {
            this.s3Import = s3Import;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getSkipFinalSnapshot}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#skip_final_snapshot DbInstance#skip_final_snapshot}.
         * @return {@code this}
         */
        public Builder skipFinalSnapshot(java.lang.Boolean skipFinalSnapshot) {
            this.skipFinalSnapshot = skipFinalSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getSkipFinalSnapshot}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#skip_final_snapshot DbInstance#skip_final_snapshot}.
         * @return {@code this}
         */
        public Builder skipFinalSnapshot(com.hashicorp.cdktf.IResolvable skipFinalSnapshot) {
            this.skipFinalSnapshot = skipFinalSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getSnapshotIdentifier}
         * @param snapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#snapshot_identifier DbInstance#snapshot_identifier}.
         * @return {@code this}
         */
        public Builder snapshotIdentifier(java.lang.String snapshotIdentifier) {
            this.snapshotIdentifier = snapshotIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getStorageEncrypted}
         * @param storageEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#storage_encrypted DbInstance#storage_encrypted}.
         * @return {@code this}
         */
        public Builder storageEncrypted(java.lang.Boolean storageEncrypted) {
            this.storageEncrypted = storageEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getStorageEncrypted}
         * @param storageEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#storage_encrypted DbInstance#storage_encrypted}.
         * @return {@code this}
         */
        public Builder storageEncrypted(com.hashicorp.cdktf.IResolvable storageEncrypted) {
            this.storageEncrypted = storageEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getStorageThroughput}
         * @param storageThroughput Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#storage_throughput DbInstance#storage_throughput}.
         * @return {@code this}
         */
        public Builder storageThroughput(java.lang.Number storageThroughput) {
            this.storageThroughput = storageThroughput;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getStorageType}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#storage_type DbInstance#storage_type}.
         * @return {@code this}
         */
        public Builder storageType(java.lang.String storageType) {
            this.storageType = storageType;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#tags DbInstance#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#tags_all DbInstance#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#timeouts DbInstance#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.db_instance.DbInstanceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getTimezone}
         * @param timezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#timezone DbInstance#timezone}.
         * @return {@code this}
         */
        public Builder timezone(java.lang.String timezone) {
            this.timezone = timezone;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getUpgradeStorageConfig}
         * @param upgradeStorageConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#upgrade_storage_config DbInstance#upgrade_storage_config}.
         * @return {@code this}
         */
        public Builder upgradeStorageConfig(java.lang.Boolean upgradeStorageConfig) {
            this.upgradeStorageConfig = upgradeStorageConfig;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getUpgradeStorageConfig}
         * @param upgradeStorageConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#upgrade_storage_config DbInstance#upgrade_storage_config}.
         * @return {@code this}
         */
        public Builder upgradeStorageConfig(com.hashicorp.cdktf.IResolvable upgradeStorageConfig) {
            this.upgradeStorageConfig = upgradeStorageConfig;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getUsername}
         * @param username Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#username DbInstance#username}.
         * @return {@code this}
         */
        public Builder username(java.lang.String username) {
            this.username = username;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getVpcSecurityGroupIds}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#vpc_security_group_ids DbInstance#vpc_security_group_ids}.
         * @return {@code this}
         */
        public Builder vpcSecurityGroupIds(java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.vpcSecurityGroupIds = vpcSecurityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getDependsOn}
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
         * Sets the value of {@link DbInstanceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceConfig#getProvisioners}
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
         * @return a new instance of {@link DbInstanceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DbInstanceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DbInstanceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DbInstanceConfig {
        private final java.lang.String instanceClass;
        private final java.lang.Number allocatedStorage;
        private final java.lang.Object allowMajorVersionUpgrade;
        private final java.lang.Object applyImmediately;
        private final java.lang.Object autoMinorVersionUpgrade;
        private final java.lang.String availabilityZone;
        private final java.lang.Number backupRetentionPeriod;
        private final java.lang.String backupTarget;
        private final java.lang.String backupWindow;
        private final imports.aws.db_instance.DbInstanceBlueGreenUpdate blueGreenUpdate;
        private final java.lang.String caCertIdentifier;
        private final java.lang.String characterSetName;
        private final java.lang.Object copyTagsToSnapshot;
        private final java.lang.Object customerOwnedIpEnabled;
        private final java.lang.String customIamInstanceProfile;
        private final java.lang.String databaseInsightsMode;
        private final java.lang.String dbName;
        private final java.lang.String dbSubnetGroupName;
        private final java.lang.Object dedicatedLogVolume;
        private final java.lang.Object deleteAutomatedBackups;
        private final java.lang.Object deletionProtection;
        private final java.lang.String domain;
        private final java.lang.String domainAuthSecretArn;
        private final java.util.List<java.lang.String> domainDnsIps;
        private final java.lang.String domainFqdn;
        private final java.lang.String domainIamRoleName;
        private final java.lang.String domainOu;
        private final java.util.List<java.lang.String> enabledCloudwatchLogsExports;
        private final java.lang.String engine;
        private final java.lang.String engineLifecycleSupport;
        private final java.lang.String engineVersion;
        private final java.lang.String finalSnapshotIdentifier;
        private final java.lang.Object iamDatabaseAuthenticationEnabled;
        private final java.lang.String id;
        private final java.lang.String identifier;
        private final java.lang.String identifierPrefix;
        private final java.lang.Number iops;
        private final java.lang.String kmsKeyId;
        private final java.lang.String licenseModel;
        private final java.lang.String maintenanceWindow;
        private final java.lang.Object manageMasterUserPassword;
        private final java.lang.String masterUserSecretKmsKeyId;
        private final java.lang.Number maxAllocatedStorage;
        private final java.lang.Number monitoringInterval;
        private final java.lang.String monitoringRoleArn;
        private final java.lang.Object multiAz;
        private final java.lang.String ncharCharacterSetName;
        private final java.lang.String networkType;
        private final java.lang.String optionGroupName;
        private final java.lang.String parameterGroupName;
        private final java.lang.String password;
        private final java.lang.String passwordWo;
        private final java.lang.Number passwordWoVersion;
        private final java.lang.Object performanceInsightsEnabled;
        private final java.lang.String performanceInsightsKmsKeyId;
        private final java.lang.Number performanceInsightsRetentionPeriod;
        private final java.lang.Number port;
        private final java.lang.Object publiclyAccessible;
        private final java.lang.String replicaMode;
        private final java.lang.String replicateSourceDb;
        private final imports.aws.db_instance.DbInstanceRestoreToPointInTime restoreToPointInTime;
        private final imports.aws.db_instance.DbInstanceS3Import s3Import;
        private final java.lang.Object skipFinalSnapshot;
        private final java.lang.String snapshotIdentifier;
        private final java.lang.Object storageEncrypted;
        private final java.lang.Number storageThroughput;
        private final java.lang.String storageType;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.db_instance.DbInstanceTimeouts timeouts;
        private final java.lang.String timezone;
        private final java.lang.Object upgradeStorageConfig;
        private final java.lang.String username;
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
            this.instanceClass = software.amazon.jsii.Kernel.get(this, "instanceClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allocatedStorage = software.amazon.jsii.Kernel.get(this, "allocatedStorage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.allowMajorVersionUpgrade = software.amazon.jsii.Kernel.get(this, "allowMajorVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.applyImmediately = software.amazon.jsii.Kernel.get(this, "applyImmediately", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.autoMinorVersionUpgrade = software.amazon.jsii.Kernel.get(this, "autoMinorVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.backupRetentionPeriod = software.amazon.jsii.Kernel.get(this, "backupRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.backupTarget = software.amazon.jsii.Kernel.get(this, "backupTarget", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.backupWindow = software.amazon.jsii.Kernel.get(this, "backupWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.blueGreenUpdate = software.amazon.jsii.Kernel.get(this, "blueGreenUpdate", software.amazon.jsii.NativeType.forClass(imports.aws.db_instance.DbInstanceBlueGreenUpdate.class));
            this.caCertIdentifier = software.amazon.jsii.Kernel.get(this, "caCertIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.characterSetName = software.amazon.jsii.Kernel.get(this, "characterSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyTagsToSnapshot = software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.customerOwnedIpEnabled = software.amazon.jsii.Kernel.get(this, "customerOwnedIpEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.customIamInstanceProfile = software.amazon.jsii.Kernel.get(this, "customIamInstanceProfile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.databaseInsightsMode = software.amazon.jsii.Kernel.get(this, "databaseInsightsMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbName = software.amazon.jsii.Kernel.get(this, "dbName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbSubnetGroupName = software.amazon.jsii.Kernel.get(this, "dbSubnetGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dedicatedLogVolume = software.amazon.jsii.Kernel.get(this, "dedicatedLogVolume", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deleteAutomatedBackups = software.amazon.jsii.Kernel.get(this, "deleteAutomatedBackups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deletionProtection = software.amazon.jsii.Kernel.get(this, "deletionProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.domain = software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainAuthSecretArn = software.amazon.jsii.Kernel.get(this, "domainAuthSecretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainDnsIps = software.amazon.jsii.Kernel.get(this, "domainDnsIps", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.domainFqdn = software.amazon.jsii.Kernel.get(this, "domainFqdn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainIamRoleName = software.amazon.jsii.Kernel.get(this, "domainIamRoleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainOu = software.amazon.jsii.Kernel.get(this, "domainOu", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabledCloudwatchLogsExports = software.amazon.jsii.Kernel.get(this, "enabledCloudwatchLogsExports", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.engine = software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineLifecycleSupport = software.amazon.jsii.Kernel.get(this, "engineLifecycleSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineVersion = software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.finalSnapshotIdentifier = software.amazon.jsii.Kernel.get(this, "finalSnapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamDatabaseAuthenticationEnabled = software.amazon.jsii.Kernel.get(this, "iamDatabaseAuthenticationEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identifier = software.amazon.jsii.Kernel.get(this, "identifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identifierPrefix = software.amazon.jsii.Kernel.get(this, "identifierPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iops = software.amazon.jsii.Kernel.get(this, "iops", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.licenseModel = software.amazon.jsii.Kernel.get(this, "licenseModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maintenanceWindow = software.amazon.jsii.Kernel.get(this, "maintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.manageMasterUserPassword = software.amazon.jsii.Kernel.get(this, "manageMasterUserPassword", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.masterUserSecretKmsKeyId = software.amazon.jsii.Kernel.get(this, "masterUserSecretKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxAllocatedStorage = software.amazon.jsii.Kernel.get(this, "maxAllocatedStorage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.monitoringInterval = software.amazon.jsii.Kernel.get(this, "monitoringInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.monitoringRoleArn = software.amazon.jsii.Kernel.get(this, "monitoringRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.multiAz = software.amazon.jsii.Kernel.get(this, "multiAz", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ncharCharacterSetName = software.amazon.jsii.Kernel.get(this, "ncharCharacterSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkType = software.amazon.jsii.Kernel.get(this, "networkType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.optionGroupName = software.amazon.jsii.Kernel.get(this, "optionGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameterGroupName = software.amazon.jsii.Kernel.get(this, "parameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.password = software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.passwordWo = software.amazon.jsii.Kernel.get(this, "passwordWo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.passwordWoVersion = software.amazon.jsii.Kernel.get(this, "passwordWoVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.performanceInsightsEnabled = software.amazon.jsii.Kernel.get(this, "performanceInsightsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.performanceInsightsKmsKeyId = software.amazon.jsii.Kernel.get(this, "performanceInsightsKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.performanceInsightsRetentionPeriod = software.amazon.jsii.Kernel.get(this, "performanceInsightsRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.publiclyAccessible = software.amazon.jsii.Kernel.get(this, "publiclyAccessible", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.replicaMode = software.amazon.jsii.Kernel.get(this, "replicaMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicateSourceDb = software.amazon.jsii.Kernel.get(this, "replicateSourceDb", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.restoreToPointInTime = software.amazon.jsii.Kernel.get(this, "restoreToPointInTime", software.amazon.jsii.NativeType.forClass(imports.aws.db_instance.DbInstanceRestoreToPointInTime.class));
            this.s3Import = software.amazon.jsii.Kernel.get(this, "s3Import", software.amazon.jsii.NativeType.forClass(imports.aws.db_instance.DbInstanceS3Import.class));
            this.skipFinalSnapshot = software.amazon.jsii.Kernel.get(this, "skipFinalSnapshot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.snapshotIdentifier = software.amazon.jsii.Kernel.get(this, "snapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.storageEncrypted = software.amazon.jsii.Kernel.get(this, "storageEncrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.storageThroughput = software.amazon.jsii.Kernel.get(this, "storageThroughput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.storageType = software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.db_instance.DbInstanceTimeouts.class));
            this.timezone = software.amazon.jsii.Kernel.get(this, "timezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.upgradeStorageConfig = software.amazon.jsii.Kernel.get(this, "upgradeStorageConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.username = software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.instanceClass = java.util.Objects.requireNonNull(builder.instanceClass, "instanceClass is required");
            this.allocatedStorage = builder.allocatedStorage;
            this.allowMajorVersionUpgrade = builder.allowMajorVersionUpgrade;
            this.applyImmediately = builder.applyImmediately;
            this.autoMinorVersionUpgrade = builder.autoMinorVersionUpgrade;
            this.availabilityZone = builder.availabilityZone;
            this.backupRetentionPeriod = builder.backupRetentionPeriod;
            this.backupTarget = builder.backupTarget;
            this.backupWindow = builder.backupWindow;
            this.blueGreenUpdate = builder.blueGreenUpdate;
            this.caCertIdentifier = builder.caCertIdentifier;
            this.characterSetName = builder.characterSetName;
            this.copyTagsToSnapshot = builder.copyTagsToSnapshot;
            this.customerOwnedIpEnabled = builder.customerOwnedIpEnabled;
            this.customIamInstanceProfile = builder.customIamInstanceProfile;
            this.databaseInsightsMode = builder.databaseInsightsMode;
            this.dbName = builder.dbName;
            this.dbSubnetGroupName = builder.dbSubnetGroupName;
            this.dedicatedLogVolume = builder.dedicatedLogVolume;
            this.deleteAutomatedBackups = builder.deleteAutomatedBackups;
            this.deletionProtection = builder.deletionProtection;
            this.domain = builder.domain;
            this.domainAuthSecretArn = builder.domainAuthSecretArn;
            this.domainDnsIps = builder.domainDnsIps;
            this.domainFqdn = builder.domainFqdn;
            this.domainIamRoleName = builder.domainIamRoleName;
            this.domainOu = builder.domainOu;
            this.enabledCloudwatchLogsExports = builder.enabledCloudwatchLogsExports;
            this.engine = builder.engine;
            this.engineLifecycleSupport = builder.engineLifecycleSupport;
            this.engineVersion = builder.engineVersion;
            this.finalSnapshotIdentifier = builder.finalSnapshotIdentifier;
            this.iamDatabaseAuthenticationEnabled = builder.iamDatabaseAuthenticationEnabled;
            this.id = builder.id;
            this.identifier = builder.identifier;
            this.identifierPrefix = builder.identifierPrefix;
            this.iops = builder.iops;
            this.kmsKeyId = builder.kmsKeyId;
            this.licenseModel = builder.licenseModel;
            this.maintenanceWindow = builder.maintenanceWindow;
            this.manageMasterUserPassword = builder.manageMasterUserPassword;
            this.masterUserSecretKmsKeyId = builder.masterUserSecretKmsKeyId;
            this.maxAllocatedStorage = builder.maxAllocatedStorage;
            this.monitoringInterval = builder.monitoringInterval;
            this.monitoringRoleArn = builder.monitoringRoleArn;
            this.multiAz = builder.multiAz;
            this.ncharCharacterSetName = builder.ncharCharacterSetName;
            this.networkType = builder.networkType;
            this.optionGroupName = builder.optionGroupName;
            this.parameterGroupName = builder.parameterGroupName;
            this.password = builder.password;
            this.passwordWo = builder.passwordWo;
            this.passwordWoVersion = builder.passwordWoVersion;
            this.performanceInsightsEnabled = builder.performanceInsightsEnabled;
            this.performanceInsightsKmsKeyId = builder.performanceInsightsKmsKeyId;
            this.performanceInsightsRetentionPeriod = builder.performanceInsightsRetentionPeriod;
            this.port = builder.port;
            this.publiclyAccessible = builder.publiclyAccessible;
            this.replicaMode = builder.replicaMode;
            this.replicateSourceDb = builder.replicateSourceDb;
            this.restoreToPointInTime = builder.restoreToPointInTime;
            this.s3Import = builder.s3Import;
            this.skipFinalSnapshot = builder.skipFinalSnapshot;
            this.snapshotIdentifier = builder.snapshotIdentifier;
            this.storageEncrypted = builder.storageEncrypted;
            this.storageThroughput = builder.storageThroughput;
            this.storageType = builder.storageType;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.timezone = builder.timezone;
            this.upgradeStorageConfig = builder.upgradeStorageConfig;
            this.username = builder.username;
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
        public final java.lang.String getInstanceClass() {
            return this.instanceClass;
        }

        @Override
        public final java.lang.Number getAllocatedStorage() {
            return this.allocatedStorage;
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
        public final java.lang.Object getAutoMinorVersionUpgrade() {
            return this.autoMinorVersionUpgrade;
        }

        @Override
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final java.lang.Number getBackupRetentionPeriod() {
            return this.backupRetentionPeriod;
        }

        @Override
        public final java.lang.String getBackupTarget() {
            return this.backupTarget;
        }

        @Override
        public final java.lang.String getBackupWindow() {
            return this.backupWindow;
        }

        @Override
        public final imports.aws.db_instance.DbInstanceBlueGreenUpdate getBlueGreenUpdate() {
            return this.blueGreenUpdate;
        }

        @Override
        public final java.lang.String getCaCertIdentifier() {
            return this.caCertIdentifier;
        }

        @Override
        public final java.lang.String getCharacterSetName() {
            return this.characterSetName;
        }

        @Override
        public final java.lang.Object getCopyTagsToSnapshot() {
            return this.copyTagsToSnapshot;
        }

        @Override
        public final java.lang.Object getCustomerOwnedIpEnabled() {
            return this.customerOwnedIpEnabled;
        }

        @Override
        public final java.lang.String getCustomIamInstanceProfile() {
            return this.customIamInstanceProfile;
        }

        @Override
        public final java.lang.String getDatabaseInsightsMode() {
            return this.databaseInsightsMode;
        }

        @Override
        public final java.lang.String getDbName() {
            return this.dbName;
        }

        @Override
        public final java.lang.String getDbSubnetGroupName() {
            return this.dbSubnetGroupName;
        }

        @Override
        public final java.lang.Object getDedicatedLogVolume() {
            return this.dedicatedLogVolume;
        }

        @Override
        public final java.lang.Object getDeleteAutomatedBackups() {
            return this.deleteAutomatedBackups;
        }

        @Override
        public final java.lang.Object getDeletionProtection() {
            return this.deletionProtection;
        }

        @Override
        public final java.lang.String getDomain() {
            return this.domain;
        }

        @Override
        public final java.lang.String getDomainAuthSecretArn() {
            return this.domainAuthSecretArn;
        }

        @Override
        public final java.util.List<java.lang.String> getDomainDnsIps() {
            return this.domainDnsIps;
        }

        @Override
        public final java.lang.String getDomainFqdn() {
            return this.domainFqdn;
        }

        @Override
        public final java.lang.String getDomainIamRoleName() {
            return this.domainIamRoleName;
        }

        @Override
        public final java.lang.String getDomainOu() {
            return this.domainOu;
        }

        @Override
        public final java.util.List<java.lang.String> getEnabledCloudwatchLogsExports() {
            return this.enabledCloudwatchLogsExports;
        }

        @Override
        public final java.lang.String getEngine() {
            return this.engine;
        }

        @Override
        public final java.lang.String getEngineLifecycleSupport() {
            return this.engineLifecycleSupport;
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
        public final java.lang.Object getIamDatabaseAuthenticationEnabled() {
            return this.iamDatabaseAuthenticationEnabled;
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
        public final java.lang.Number getIops() {
            return this.iops;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.String getLicenseModel() {
            return this.licenseModel;
        }

        @Override
        public final java.lang.String getMaintenanceWindow() {
            return this.maintenanceWindow;
        }

        @Override
        public final java.lang.Object getManageMasterUserPassword() {
            return this.manageMasterUserPassword;
        }

        @Override
        public final java.lang.String getMasterUserSecretKmsKeyId() {
            return this.masterUserSecretKmsKeyId;
        }

        @Override
        public final java.lang.Number getMaxAllocatedStorage() {
            return this.maxAllocatedStorage;
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
        public final java.lang.Object getMultiAz() {
            return this.multiAz;
        }

        @Override
        public final java.lang.String getNcharCharacterSetName() {
            return this.ncharCharacterSetName;
        }

        @Override
        public final java.lang.String getNetworkType() {
            return this.networkType;
        }

        @Override
        public final java.lang.String getOptionGroupName() {
            return this.optionGroupName;
        }

        @Override
        public final java.lang.String getParameterGroupName() {
            return this.parameterGroupName;
        }

        @Override
        public final java.lang.String getPassword() {
            return this.password;
        }

        @Override
        public final java.lang.String getPasswordWo() {
            return this.passwordWo;
        }

        @Override
        public final java.lang.Number getPasswordWoVersion() {
            return this.passwordWoVersion;
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
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.Object getPubliclyAccessible() {
            return this.publiclyAccessible;
        }

        @Override
        public final java.lang.String getReplicaMode() {
            return this.replicaMode;
        }

        @Override
        public final java.lang.String getReplicateSourceDb() {
            return this.replicateSourceDb;
        }

        @Override
        public final imports.aws.db_instance.DbInstanceRestoreToPointInTime getRestoreToPointInTime() {
            return this.restoreToPointInTime;
        }

        @Override
        public final imports.aws.db_instance.DbInstanceS3Import getS3Import() {
            return this.s3Import;
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
        public final java.lang.Number getStorageThroughput() {
            return this.storageThroughput;
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
        public final imports.aws.db_instance.DbInstanceTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getTimezone() {
            return this.timezone;
        }

        @Override
        public final java.lang.Object getUpgradeStorageConfig() {
            return this.upgradeStorageConfig;
        }

        @Override
        public final java.lang.String getUsername() {
            return this.username;
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

            data.set("instanceClass", om.valueToTree(this.getInstanceClass()));
            if (this.getAllocatedStorage() != null) {
                data.set("allocatedStorage", om.valueToTree(this.getAllocatedStorage()));
            }
            if (this.getAllowMajorVersionUpgrade() != null) {
                data.set("allowMajorVersionUpgrade", om.valueToTree(this.getAllowMajorVersionUpgrade()));
            }
            if (this.getApplyImmediately() != null) {
                data.set("applyImmediately", om.valueToTree(this.getApplyImmediately()));
            }
            if (this.getAutoMinorVersionUpgrade() != null) {
                data.set("autoMinorVersionUpgrade", om.valueToTree(this.getAutoMinorVersionUpgrade()));
            }
            if (this.getAvailabilityZone() != null) {
                data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            }
            if (this.getBackupRetentionPeriod() != null) {
                data.set("backupRetentionPeriod", om.valueToTree(this.getBackupRetentionPeriod()));
            }
            if (this.getBackupTarget() != null) {
                data.set("backupTarget", om.valueToTree(this.getBackupTarget()));
            }
            if (this.getBackupWindow() != null) {
                data.set("backupWindow", om.valueToTree(this.getBackupWindow()));
            }
            if (this.getBlueGreenUpdate() != null) {
                data.set("blueGreenUpdate", om.valueToTree(this.getBlueGreenUpdate()));
            }
            if (this.getCaCertIdentifier() != null) {
                data.set("caCertIdentifier", om.valueToTree(this.getCaCertIdentifier()));
            }
            if (this.getCharacterSetName() != null) {
                data.set("characterSetName", om.valueToTree(this.getCharacterSetName()));
            }
            if (this.getCopyTagsToSnapshot() != null) {
                data.set("copyTagsToSnapshot", om.valueToTree(this.getCopyTagsToSnapshot()));
            }
            if (this.getCustomerOwnedIpEnabled() != null) {
                data.set("customerOwnedIpEnabled", om.valueToTree(this.getCustomerOwnedIpEnabled()));
            }
            if (this.getCustomIamInstanceProfile() != null) {
                data.set("customIamInstanceProfile", om.valueToTree(this.getCustomIamInstanceProfile()));
            }
            if (this.getDatabaseInsightsMode() != null) {
                data.set("databaseInsightsMode", om.valueToTree(this.getDatabaseInsightsMode()));
            }
            if (this.getDbName() != null) {
                data.set("dbName", om.valueToTree(this.getDbName()));
            }
            if (this.getDbSubnetGroupName() != null) {
                data.set("dbSubnetGroupName", om.valueToTree(this.getDbSubnetGroupName()));
            }
            if (this.getDedicatedLogVolume() != null) {
                data.set("dedicatedLogVolume", om.valueToTree(this.getDedicatedLogVolume()));
            }
            if (this.getDeleteAutomatedBackups() != null) {
                data.set("deleteAutomatedBackups", om.valueToTree(this.getDeleteAutomatedBackups()));
            }
            if (this.getDeletionProtection() != null) {
                data.set("deletionProtection", om.valueToTree(this.getDeletionProtection()));
            }
            if (this.getDomain() != null) {
                data.set("domain", om.valueToTree(this.getDomain()));
            }
            if (this.getDomainAuthSecretArn() != null) {
                data.set("domainAuthSecretArn", om.valueToTree(this.getDomainAuthSecretArn()));
            }
            if (this.getDomainDnsIps() != null) {
                data.set("domainDnsIps", om.valueToTree(this.getDomainDnsIps()));
            }
            if (this.getDomainFqdn() != null) {
                data.set("domainFqdn", om.valueToTree(this.getDomainFqdn()));
            }
            if (this.getDomainIamRoleName() != null) {
                data.set("domainIamRoleName", om.valueToTree(this.getDomainIamRoleName()));
            }
            if (this.getDomainOu() != null) {
                data.set("domainOu", om.valueToTree(this.getDomainOu()));
            }
            if (this.getEnabledCloudwatchLogsExports() != null) {
                data.set("enabledCloudwatchLogsExports", om.valueToTree(this.getEnabledCloudwatchLogsExports()));
            }
            if (this.getEngine() != null) {
                data.set("engine", om.valueToTree(this.getEngine()));
            }
            if (this.getEngineLifecycleSupport() != null) {
                data.set("engineLifecycleSupport", om.valueToTree(this.getEngineLifecycleSupport()));
            }
            if (this.getEngineVersion() != null) {
                data.set("engineVersion", om.valueToTree(this.getEngineVersion()));
            }
            if (this.getFinalSnapshotIdentifier() != null) {
                data.set("finalSnapshotIdentifier", om.valueToTree(this.getFinalSnapshotIdentifier()));
            }
            if (this.getIamDatabaseAuthenticationEnabled() != null) {
                data.set("iamDatabaseAuthenticationEnabled", om.valueToTree(this.getIamDatabaseAuthenticationEnabled()));
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
            if (this.getIops() != null) {
                data.set("iops", om.valueToTree(this.getIops()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getLicenseModel() != null) {
                data.set("licenseModel", om.valueToTree(this.getLicenseModel()));
            }
            if (this.getMaintenanceWindow() != null) {
                data.set("maintenanceWindow", om.valueToTree(this.getMaintenanceWindow()));
            }
            if (this.getManageMasterUserPassword() != null) {
                data.set("manageMasterUserPassword", om.valueToTree(this.getManageMasterUserPassword()));
            }
            if (this.getMasterUserSecretKmsKeyId() != null) {
                data.set("masterUserSecretKmsKeyId", om.valueToTree(this.getMasterUserSecretKmsKeyId()));
            }
            if (this.getMaxAllocatedStorage() != null) {
                data.set("maxAllocatedStorage", om.valueToTree(this.getMaxAllocatedStorage()));
            }
            if (this.getMonitoringInterval() != null) {
                data.set("monitoringInterval", om.valueToTree(this.getMonitoringInterval()));
            }
            if (this.getMonitoringRoleArn() != null) {
                data.set("monitoringRoleArn", om.valueToTree(this.getMonitoringRoleArn()));
            }
            if (this.getMultiAz() != null) {
                data.set("multiAz", om.valueToTree(this.getMultiAz()));
            }
            if (this.getNcharCharacterSetName() != null) {
                data.set("ncharCharacterSetName", om.valueToTree(this.getNcharCharacterSetName()));
            }
            if (this.getNetworkType() != null) {
                data.set("networkType", om.valueToTree(this.getNetworkType()));
            }
            if (this.getOptionGroupName() != null) {
                data.set("optionGroupName", om.valueToTree(this.getOptionGroupName()));
            }
            if (this.getParameterGroupName() != null) {
                data.set("parameterGroupName", om.valueToTree(this.getParameterGroupName()));
            }
            if (this.getPassword() != null) {
                data.set("password", om.valueToTree(this.getPassword()));
            }
            if (this.getPasswordWo() != null) {
                data.set("passwordWo", om.valueToTree(this.getPasswordWo()));
            }
            if (this.getPasswordWoVersion() != null) {
                data.set("passwordWoVersion", om.valueToTree(this.getPasswordWoVersion()));
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
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getPubliclyAccessible() != null) {
                data.set("publiclyAccessible", om.valueToTree(this.getPubliclyAccessible()));
            }
            if (this.getReplicaMode() != null) {
                data.set("replicaMode", om.valueToTree(this.getReplicaMode()));
            }
            if (this.getReplicateSourceDb() != null) {
                data.set("replicateSourceDb", om.valueToTree(this.getReplicateSourceDb()));
            }
            if (this.getRestoreToPointInTime() != null) {
                data.set("restoreToPointInTime", om.valueToTree(this.getRestoreToPointInTime()));
            }
            if (this.getS3Import() != null) {
                data.set("s3Import", om.valueToTree(this.getS3Import()));
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
            if (this.getStorageThroughput() != null) {
                data.set("storageThroughput", om.valueToTree(this.getStorageThroughput()));
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
            if (this.getTimezone() != null) {
                data.set("timezone", om.valueToTree(this.getTimezone()));
            }
            if (this.getUpgradeStorageConfig() != null) {
                data.set("upgradeStorageConfig", om.valueToTree(this.getUpgradeStorageConfig()));
            }
            if (this.getUsername() != null) {
                data.set("username", om.valueToTree(this.getUsername()));
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
            struct.set("fqn", om.valueToTree("aws.dbInstance.DbInstanceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DbInstanceConfig.Jsii$Proxy that = (DbInstanceConfig.Jsii$Proxy) o;

            if (!instanceClass.equals(that.instanceClass)) return false;
            if (this.allocatedStorage != null ? !this.allocatedStorage.equals(that.allocatedStorage) : that.allocatedStorage != null) return false;
            if (this.allowMajorVersionUpgrade != null ? !this.allowMajorVersionUpgrade.equals(that.allowMajorVersionUpgrade) : that.allowMajorVersionUpgrade != null) return false;
            if (this.applyImmediately != null ? !this.applyImmediately.equals(that.applyImmediately) : that.applyImmediately != null) return false;
            if (this.autoMinorVersionUpgrade != null ? !this.autoMinorVersionUpgrade.equals(that.autoMinorVersionUpgrade) : that.autoMinorVersionUpgrade != null) return false;
            if (this.availabilityZone != null ? !this.availabilityZone.equals(that.availabilityZone) : that.availabilityZone != null) return false;
            if (this.backupRetentionPeriod != null ? !this.backupRetentionPeriod.equals(that.backupRetentionPeriod) : that.backupRetentionPeriod != null) return false;
            if (this.backupTarget != null ? !this.backupTarget.equals(that.backupTarget) : that.backupTarget != null) return false;
            if (this.backupWindow != null ? !this.backupWindow.equals(that.backupWindow) : that.backupWindow != null) return false;
            if (this.blueGreenUpdate != null ? !this.blueGreenUpdate.equals(that.blueGreenUpdate) : that.blueGreenUpdate != null) return false;
            if (this.caCertIdentifier != null ? !this.caCertIdentifier.equals(that.caCertIdentifier) : that.caCertIdentifier != null) return false;
            if (this.characterSetName != null ? !this.characterSetName.equals(that.characterSetName) : that.characterSetName != null) return false;
            if (this.copyTagsToSnapshot != null ? !this.copyTagsToSnapshot.equals(that.copyTagsToSnapshot) : that.copyTagsToSnapshot != null) return false;
            if (this.customerOwnedIpEnabled != null ? !this.customerOwnedIpEnabled.equals(that.customerOwnedIpEnabled) : that.customerOwnedIpEnabled != null) return false;
            if (this.customIamInstanceProfile != null ? !this.customIamInstanceProfile.equals(that.customIamInstanceProfile) : that.customIamInstanceProfile != null) return false;
            if (this.databaseInsightsMode != null ? !this.databaseInsightsMode.equals(that.databaseInsightsMode) : that.databaseInsightsMode != null) return false;
            if (this.dbName != null ? !this.dbName.equals(that.dbName) : that.dbName != null) return false;
            if (this.dbSubnetGroupName != null ? !this.dbSubnetGroupName.equals(that.dbSubnetGroupName) : that.dbSubnetGroupName != null) return false;
            if (this.dedicatedLogVolume != null ? !this.dedicatedLogVolume.equals(that.dedicatedLogVolume) : that.dedicatedLogVolume != null) return false;
            if (this.deleteAutomatedBackups != null ? !this.deleteAutomatedBackups.equals(that.deleteAutomatedBackups) : that.deleteAutomatedBackups != null) return false;
            if (this.deletionProtection != null ? !this.deletionProtection.equals(that.deletionProtection) : that.deletionProtection != null) return false;
            if (this.domain != null ? !this.domain.equals(that.domain) : that.domain != null) return false;
            if (this.domainAuthSecretArn != null ? !this.domainAuthSecretArn.equals(that.domainAuthSecretArn) : that.domainAuthSecretArn != null) return false;
            if (this.domainDnsIps != null ? !this.domainDnsIps.equals(that.domainDnsIps) : that.domainDnsIps != null) return false;
            if (this.domainFqdn != null ? !this.domainFqdn.equals(that.domainFqdn) : that.domainFqdn != null) return false;
            if (this.domainIamRoleName != null ? !this.domainIamRoleName.equals(that.domainIamRoleName) : that.domainIamRoleName != null) return false;
            if (this.domainOu != null ? !this.domainOu.equals(that.domainOu) : that.domainOu != null) return false;
            if (this.enabledCloudwatchLogsExports != null ? !this.enabledCloudwatchLogsExports.equals(that.enabledCloudwatchLogsExports) : that.enabledCloudwatchLogsExports != null) return false;
            if (this.engine != null ? !this.engine.equals(that.engine) : that.engine != null) return false;
            if (this.engineLifecycleSupport != null ? !this.engineLifecycleSupport.equals(that.engineLifecycleSupport) : that.engineLifecycleSupport != null) return false;
            if (this.engineVersion != null ? !this.engineVersion.equals(that.engineVersion) : that.engineVersion != null) return false;
            if (this.finalSnapshotIdentifier != null ? !this.finalSnapshotIdentifier.equals(that.finalSnapshotIdentifier) : that.finalSnapshotIdentifier != null) return false;
            if (this.iamDatabaseAuthenticationEnabled != null ? !this.iamDatabaseAuthenticationEnabled.equals(that.iamDatabaseAuthenticationEnabled) : that.iamDatabaseAuthenticationEnabled != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.identifier != null ? !this.identifier.equals(that.identifier) : that.identifier != null) return false;
            if (this.identifierPrefix != null ? !this.identifierPrefix.equals(that.identifierPrefix) : that.identifierPrefix != null) return false;
            if (this.iops != null ? !this.iops.equals(that.iops) : that.iops != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.licenseModel != null ? !this.licenseModel.equals(that.licenseModel) : that.licenseModel != null) return false;
            if (this.maintenanceWindow != null ? !this.maintenanceWindow.equals(that.maintenanceWindow) : that.maintenanceWindow != null) return false;
            if (this.manageMasterUserPassword != null ? !this.manageMasterUserPassword.equals(that.manageMasterUserPassword) : that.manageMasterUserPassword != null) return false;
            if (this.masterUserSecretKmsKeyId != null ? !this.masterUserSecretKmsKeyId.equals(that.masterUserSecretKmsKeyId) : that.masterUserSecretKmsKeyId != null) return false;
            if (this.maxAllocatedStorage != null ? !this.maxAllocatedStorage.equals(that.maxAllocatedStorage) : that.maxAllocatedStorage != null) return false;
            if (this.monitoringInterval != null ? !this.monitoringInterval.equals(that.monitoringInterval) : that.monitoringInterval != null) return false;
            if (this.monitoringRoleArn != null ? !this.monitoringRoleArn.equals(that.monitoringRoleArn) : that.monitoringRoleArn != null) return false;
            if (this.multiAz != null ? !this.multiAz.equals(that.multiAz) : that.multiAz != null) return false;
            if (this.ncharCharacterSetName != null ? !this.ncharCharacterSetName.equals(that.ncharCharacterSetName) : that.ncharCharacterSetName != null) return false;
            if (this.networkType != null ? !this.networkType.equals(that.networkType) : that.networkType != null) return false;
            if (this.optionGroupName != null ? !this.optionGroupName.equals(that.optionGroupName) : that.optionGroupName != null) return false;
            if (this.parameterGroupName != null ? !this.parameterGroupName.equals(that.parameterGroupName) : that.parameterGroupName != null) return false;
            if (this.password != null ? !this.password.equals(that.password) : that.password != null) return false;
            if (this.passwordWo != null ? !this.passwordWo.equals(that.passwordWo) : that.passwordWo != null) return false;
            if (this.passwordWoVersion != null ? !this.passwordWoVersion.equals(that.passwordWoVersion) : that.passwordWoVersion != null) return false;
            if (this.performanceInsightsEnabled != null ? !this.performanceInsightsEnabled.equals(that.performanceInsightsEnabled) : that.performanceInsightsEnabled != null) return false;
            if (this.performanceInsightsKmsKeyId != null ? !this.performanceInsightsKmsKeyId.equals(that.performanceInsightsKmsKeyId) : that.performanceInsightsKmsKeyId != null) return false;
            if (this.performanceInsightsRetentionPeriod != null ? !this.performanceInsightsRetentionPeriod.equals(that.performanceInsightsRetentionPeriod) : that.performanceInsightsRetentionPeriod != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.publiclyAccessible != null ? !this.publiclyAccessible.equals(that.publiclyAccessible) : that.publiclyAccessible != null) return false;
            if (this.replicaMode != null ? !this.replicaMode.equals(that.replicaMode) : that.replicaMode != null) return false;
            if (this.replicateSourceDb != null ? !this.replicateSourceDb.equals(that.replicateSourceDb) : that.replicateSourceDb != null) return false;
            if (this.restoreToPointInTime != null ? !this.restoreToPointInTime.equals(that.restoreToPointInTime) : that.restoreToPointInTime != null) return false;
            if (this.s3Import != null ? !this.s3Import.equals(that.s3Import) : that.s3Import != null) return false;
            if (this.skipFinalSnapshot != null ? !this.skipFinalSnapshot.equals(that.skipFinalSnapshot) : that.skipFinalSnapshot != null) return false;
            if (this.snapshotIdentifier != null ? !this.snapshotIdentifier.equals(that.snapshotIdentifier) : that.snapshotIdentifier != null) return false;
            if (this.storageEncrypted != null ? !this.storageEncrypted.equals(that.storageEncrypted) : that.storageEncrypted != null) return false;
            if (this.storageThroughput != null ? !this.storageThroughput.equals(that.storageThroughput) : that.storageThroughput != null) return false;
            if (this.storageType != null ? !this.storageType.equals(that.storageType) : that.storageType != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.timezone != null ? !this.timezone.equals(that.timezone) : that.timezone != null) return false;
            if (this.upgradeStorageConfig != null ? !this.upgradeStorageConfig.equals(that.upgradeStorageConfig) : that.upgradeStorageConfig != null) return false;
            if (this.username != null ? !this.username.equals(that.username) : that.username != null) return false;
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
            int result = this.instanceClass.hashCode();
            result = 31 * result + (this.allocatedStorage != null ? this.allocatedStorage.hashCode() : 0);
            result = 31 * result + (this.allowMajorVersionUpgrade != null ? this.allowMajorVersionUpgrade.hashCode() : 0);
            result = 31 * result + (this.applyImmediately != null ? this.applyImmediately.hashCode() : 0);
            result = 31 * result + (this.autoMinorVersionUpgrade != null ? this.autoMinorVersionUpgrade.hashCode() : 0);
            result = 31 * result + (this.availabilityZone != null ? this.availabilityZone.hashCode() : 0);
            result = 31 * result + (this.backupRetentionPeriod != null ? this.backupRetentionPeriod.hashCode() : 0);
            result = 31 * result + (this.backupTarget != null ? this.backupTarget.hashCode() : 0);
            result = 31 * result + (this.backupWindow != null ? this.backupWindow.hashCode() : 0);
            result = 31 * result + (this.blueGreenUpdate != null ? this.blueGreenUpdate.hashCode() : 0);
            result = 31 * result + (this.caCertIdentifier != null ? this.caCertIdentifier.hashCode() : 0);
            result = 31 * result + (this.characterSetName != null ? this.characterSetName.hashCode() : 0);
            result = 31 * result + (this.copyTagsToSnapshot != null ? this.copyTagsToSnapshot.hashCode() : 0);
            result = 31 * result + (this.customerOwnedIpEnabled != null ? this.customerOwnedIpEnabled.hashCode() : 0);
            result = 31 * result + (this.customIamInstanceProfile != null ? this.customIamInstanceProfile.hashCode() : 0);
            result = 31 * result + (this.databaseInsightsMode != null ? this.databaseInsightsMode.hashCode() : 0);
            result = 31 * result + (this.dbName != null ? this.dbName.hashCode() : 0);
            result = 31 * result + (this.dbSubnetGroupName != null ? this.dbSubnetGroupName.hashCode() : 0);
            result = 31 * result + (this.dedicatedLogVolume != null ? this.dedicatedLogVolume.hashCode() : 0);
            result = 31 * result + (this.deleteAutomatedBackups != null ? this.deleteAutomatedBackups.hashCode() : 0);
            result = 31 * result + (this.deletionProtection != null ? this.deletionProtection.hashCode() : 0);
            result = 31 * result + (this.domain != null ? this.domain.hashCode() : 0);
            result = 31 * result + (this.domainAuthSecretArn != null ? this.domainAuthSecretArn.hashCode() : 0);
            result = 31 * result + (this.domainDnsIps != null ? this.domainDnsIps.hashCode() : 0);
            result = 31 * result + (this.domainFqdn != null ? this.domainFqdn.hashCode() : 0);
            result = 31 * result + (this.domainIamRoleName != null ? this.domainIamRoleName.hashCode() : 0);
            result = 31 * result + (this.domainOu != null ? this.domainOu.hashCode() : 0);
            result = 31 * result + (this.enabledCloudwatchLogsExports != null ? this.enabledCloudwatchLogsExports.hashCode() : 0);
            result = 31 * result + (this.engine != null ? this.engine.hashCode() : 0);
            result = 31 * result + (this.engineLifecycleSupport != null ? this.engineLifecycleSupport.hashCode() : 0);
            result = 31 * result + (this.engineVersion != null ? this.engineVersion.hashCode() : 0);
            result = 31 * result + (this.finalSnapshotIdentifier != null ? this.finalSnapshotIdentifier.hashCode() : 0);
            result = 31 * result + (this.iamDatabaseAuthenticationEnabled != null ? this.iamDatabaseAuthenticationEnabled.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.identifier != null ? this.identifier.hashCode() : 0);
            result = 31 * result + (this.identifierPrefix != null ? this.identifierPrefix.hashCode() : 0);
            result = 31 * result + (this.iops != null ? this.iops.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.licenseModel != null ? this.licenseModel.hashCode() : 0);
            result = 31 * result + (this.maintenanceWindow != null ? this.maintenanceWindow.hashCode() : 0);
            result = 31 * result + (this.manageMasterUserPassword != null ? this.manageMasterUserPassword.hashCode() : 0);
            result = 31 * result + (this.masterUserSecretKmsKeyId != null ? this.masterUserSecretKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.maxAllocatedStorage != null ? this.maxAllocatedStorage.hashCode() : 0);
            result = 31 * result + (this.monitoringInterval != null ? this.monitoringInterval.hashCode() : 0);
            result = 31 * result + (this.monitoringRoleArn != null ? this.monitoringRoleArn.hashCode() : 0);
            result = 31 * result + (this.multiAz != null ? this.multiAz.hashCode() : 0);
            result = 31 * result + (this.ncharCharacterSetName != null ? this.ncharCharacterSetName.hashCode() : 0);
            result = 31 * result + (this.networkType != null ? this.networkType.hashCode() : 0);
            result = 31 * result + (this.optionGroupName != null ? this.optionGroupName.hashCode() : 0);
            result = 31 * result + (this.parameterGroupName != null ? this.parameterGroupName.hashCode() : 0);
            result = 31 * result + (this.password != null ? this.password.hashCode() : 0);
            result = 31 * result + (this.passwordWo != null ? this.passwordWo.hashCode() : 0);
            result = 31 * result + (this.passwordWoVersion != null ? this.passwordWoVersion.hashCode() : 0);
            result = 31 * result + (this.performanceInsightsEnabled != null ? this.performanceInsightsEnabled.hashCode() : 0);
            result = 31 * result + (this.performanceInsightsKmsKeyId != null ? this.performanceInsightsKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.performanceInsightsRetentionPeriod != null ? this.performanceInsightsRetentionPeriod.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.publiclyAccessible != null ? this.publiclyAccessible.hashCode() : 0);
            result = 31 * result + (this.replicaMode != null ? this.replicaMode.hashCode() : 0);
            result = 31 * result + (this.replicateSourceDb != null ? this.replicateSourceDb.hashCode() : 0);
            result = 31 * result + (this.restoreToPointInTime != null ? this.restoreToPointInTime.hashCode() : 0);
            result = 31 * result + (this.s3Import != null ? this.s3Import.hashCode() : 0);
            result = 31 * result + (this.skipFinalSnapshot != null ? this.skipFinalSnapshot.hashCode() : 0);
            result = 31 * result + (this.snapshotIdentifier != null ? this.snapshotIdentifier.hashCode() : 0);
            result = 31 * result + (this.storageEncrypted != null ? this.storageEncrypted.hashCode() : 0);
            result = 31 * result + (this.storageThroughput != null ? this.storageThroughput.hashCode() : 0);
            result = 31 * result + (this.storageType != null ? this.storageType.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.timezone != null ? this.timezone.hashCode() : 0);
            result = 31 * result + (this.upgradeStorageConfig != null ? this.upgradeStorageConfig.hashCode() : 0);
            result = 31 * result + (this.username != null ? this.username.hashCode() : 0);
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
