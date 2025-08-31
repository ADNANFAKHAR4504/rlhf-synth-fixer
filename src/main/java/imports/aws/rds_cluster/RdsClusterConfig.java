package imports.aws.rds_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.135Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rdsCluster.RdsClusterConfig")
@software.amazon.jsii.Jsii.Proxy(RdsClusterConfig.Jsii$Proxy.class)
public interface RdsClusterConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine RdsCluster#engine}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEngine();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#allocated_storage RdsCluster#allocated_storage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAllocatedStorage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#allow_major_version_upgrade RdsCluster#allow_major_version_upgrade}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowMajorVersionUpgrade() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#apply_immediately RdsCluster#apply_immediately}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediately() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#availability_zones RdsCluster#availability_zones}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAvailabilityZones() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#backtrack_window RdsCluster#backtrack_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBacktrackWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#backup_retention_period RdsCluster#backup_retention_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBackupRetentionPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#ca_certificate_identifier RdsCluster#ca_certificate_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCaCertificateIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_identifier RdsCluster#cluster_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_identifier_prefix RdsCluster#cluster_identifier_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterIdentifierPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_members RdsCluster#cluster_members}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getClusterMembers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_scalability_type RdsCluster#cluster_scalability_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterScalabilityType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#copy_tags_to_snapshot RdsCluster#copy_tags_to_snapshot}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToSnapshot() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#database_insights_mode RdsCluster#database_insights_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatabaseInsightsMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#database_name RdsCluster#database_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatabaseName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_cluster_instance_class RdsCluster#db_cluster_instance_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbClusterInstanceClass() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_cluster_parameter_group_name RdsCluster#db_cluster_parameter_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbClusterParameterGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_instance_parameter_group_name RdsCluster#db_instance_parameter_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbInstanceParameterGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_subnet_group_name RdsCluster#db_subnet_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbSubnetGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_system_id RdsCluster#db_system_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbSystemId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#delete_automated_backups RdsCluster#delete_automated_backups}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeleteAutomatedBackups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#deletion_protection RdsCluster#deletion_protection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeletionProtection() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#domain RdsCluster#domain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomain() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#domain_iam_role_name RdsCluster#domain_iam_role_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainIamRoleName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enabled_cloudwatch_logs_exports RdsCluster#enabled_cloudwatch_logs_exports}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledCloudwatchLogsExports() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_global_write_forwarding RdsCluster#enable_global_write_forwarding}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableGlobalWriteForwarding() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_http_endpoint RdsCluster#enable_http_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableHttpEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_local_write_forwarding RdsCluster#enable_local_write_forwarding}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableLocalWriteForwarding() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine_lifecycle_support RdsCluster#engine_lifecycle_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngineLifecycleSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine_mode RdsCluster#engine_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngineMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine_version RdsCluster#engine_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngineVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#final_snapshot_identifier RdsCluster#final_snapshot_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFinalSnapshotIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#global_cluster_identifier RdsCluster#global_cluster_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGlobalClusterIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iam_database_authentication_enabled RdsCluster#iam_database_authentication_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIamDatabaseAuthenticationEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iam_roles RdsCluster#iam_roles}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIamRoles() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#id RdsCluster#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iops RdsCluster#iops}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIops() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#kms_key_id RdsCluster#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#manage_master_user_password RdsCluster#manage_master_user_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getManageMasterUserPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_password RdsCluster#master_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMasterPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_password_wo RdsCluster#master_password_wo}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMasterPasswordWo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_password_wo_version RdsCluster#master_password_wo_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMasterPasswordWoVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_username RdsCluster#master_username}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMasterUsername() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_user_secret_kms_key_id RdsCluster#master_user_secret_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMasterUserSecretKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#monitoring_interval RdsCluster#monitoring_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMonitoringInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#monitoring_role_arn RdsCluster#monitoring_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMonitoringRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#network_type RdsCluster#network_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetworkType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_enabled RdsCluster#performance_insights_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPerformanceInsightsEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_kms_key_id RdsCluster#performance_insights_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPerformanceInsightsKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_retention_period RdsCluster#performance_insights_retention_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPerformanceInsightsRetentionPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#port RdsCluster#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#preferred_backup_window RdsCluster#preferred_backup_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredBackupWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#preferred_maintenance_window RdsCluster#preferred_maintenance_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredMaintenanceWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#replication_source_identifier RdsCluster#replication_source_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplicationSourceIdentifier() {
        return null;
    }

    /**
     * restore_to_point_in_time block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#restore_to_point_in_time RdsCluster#restore_to_point_in_time}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.rds_cluster.RdsClusterRestoreToPointInTime getRestoreToPointInTime() {
        return null;
    }

    /**
     * s3_import block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#s3_import RdsCluster#s3_import}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.rds_cluster.RdsClusterS3Import getS3Import() {
        return null;
    }

    /**
     * scaling_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#scaling_configuration RdsCluster#scaling_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.rds_cluster.RdsClusterScalingConfiguration getScalingConfiguration() {
        return null;
    }

    /**
     * serverlessv2_scaling_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#serverlessv2_scaling_configuration RdsCluster#serverlessv2_scaling_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.rds_cluster.RdsClusterServerlessv2ScalingConfiguration getServerlessv2ScalingConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#skip_final_snapshot RdsCluster#skip_final_snapshot}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalSnapshot() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#snapshot_identifier RdsCluster#snapshot_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#source_region RdsCluster#source_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#storage_encrypted RdsCluster#storage_encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStorageEncrypted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#storage_type RdsCluster#storage_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#tags RdsCluster#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#tags_all RdsCluster#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#timeouts RdsCluster#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.rds_cluster.RdsClusterTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#vpc_security_group_ids RdsCluster#vpc_security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RdsClusterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RdsClusterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RdsClusterConfig> {
        java.lang.String engine;
        java.lang.Number allocatedStorage;
        java.lang.Object allowMajorVersionUpgrade;
        java.lang.Object applyImmediately;
        java.util.List<java.lang.String> availabilityZones;
        java.lang.Number backtrackWindow;
        java.lang.Number backupRetentionPeriod;
        java.lang.String caCertificateIdentifier;
        java.lang.String clusterIdentifier;
        java.lang.String clusterIdentifierPrefix;
        java.util.List<java.lang.String> clusterMembers;
        java.lang.String clusterScalabilityType;
        java.lang.Object copyTagsToSnapshot;
        java.lang.String databaseInsightsMode;
        java.lang.String databaseName;
        java.lang.String dbClusterInstanceClass;
        java.lang.String dbClusterParameterGroupName;
        java.lang.String dbInstanceParameterGroupName;
        java.lang.String dbSubnetGroupName;
        java.lang.String dbSystemId;
        java.lang.Object deleteAutomatedBackups;
        java.lang.Object deletionProtection;
        java.lang.String domain;
        java.lang.String domainIamRoleName;
        java.util.List<java.lang.String> enabledCloudwatchLogsExports;
        java.lang.Object enableGlobalWriteForwarding;
        java.lang.Object enableHttpEndpoint;
        java.lang.Object enableLocalWriteForwarding;
        java.lang.String engineLifecycleSupport;
        java.lang.String engineMode;
        java.lang.String engineVersion;
        java.lang.String finalSnapshotIdentifier;
        java.lang.String globalClusterIdentifier;
        java.lang.Object iamDatabaseAuthenticationEnabled;
        java.util.List<java.lang.String> iamRoles;
        java.lang.String id;
        java.lang.Number iops;
        java.lang.String kmsKeyId;
        java.lang.Object manageMasterUserPassword;
        java.lang.String masterPassword;
        java.lang.String masterPasswordWo;
        java.lang.Number masterPasswordWoVersion;
        java.lang.String masterUsername;
        java.lang.String masterUserSecretKmsKeyId;
        java.lang.Number monitoringInterval;
        java.lang.String monitoringRoleArn;
        java.lang.String networkType;
        java.lang.Object performanceInsightsEnabled;
        java.lang.String performanceInsightsKmsKeyId;
        java.lang.Number performanceInsightsRetentionPeriod;
        java.lang.Number port;
        java.lang.String preferredBackupWindow;
        java.lang.String preferredMaintenanceWindow;
        java.lang.String replicationSourceIdentifier;
        imports.aws.rds_cluster.RdsClusterRestoreToPointInTime restoreToPointInTime;
        imports.aws.rds_cluster.RdsClusterS3Import s3Import;
        imports.aws.rds_cluster.RdsClusterScalingConfiguration scalingConfiguration;
        imports.aws.rds_cluster.RdsClusterServerlessv2ScalingConfiguration serverlessv2ScalingConfiguration;
        java.lang.Object skipFinalSnapshot;
        java.lang.String snapshotIdentifier;
        java.lang.String sourceRegion;
        java.lang.Object storageEncrypted;
        java.lang.String storageType;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.rds_cluster.RdsClusterTimeouts timeouts;
        java.util.List<java.lang.String> vpcSecurityGroupIds;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RdsClusterConfig#getEngine}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine RdsCluster#engine}. This parameter is required.
         * @return {@code this}
         */
        public Builder engine(java.lang.String engine) {
            this.engine = engine;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getAllocatedStorage}
         * @param allocatedStorage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#allocated_storage RdsCluster#allocated_storage}.
         * @return {@code this}
         */
        public Builder allocatedStorage(java.lang.Number allocatedStorage) {
            this.allocatedStorage = allocatedStorage;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getAllowMajorVersionUpgrade}
         * @param allowMajorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#allow_major_version_upgrade RdsCluster#allow_major_version_upgrade}.
         * @return {@code this}
         */
        public Builder allowMajorVersionUpgrade(java.lang.Boolean allowMajorVersionUpgrade) {
            this.allowMajorVersionUpgrade = allowMajorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getAllowMajorVersionUpgrade}
         * @param allowMajorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#allow_major_version_upgrade RdsCluster#allow_major_version_upgrade}.
         * @return {@code this}
         */
        public Builder allowMajorVersionUpgrade(com.hashicorp.cdktf.IResolvable allowMajorVersionUpgrade) {
            this.allowMajorVersionUpgrade = allowMajorVersionUpgrade;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#apply_immediately RdsCluster#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(java.lang.Boolean applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#apply_immediately RdsCluster#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getAvailabilityZones}
         * @param availabilityZones Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#availability_zones RdsCluster#availability_zones}.
         * @return {@code this}
         */
        public Builder availabilityZones(java.util.List<java.lang.String> availabilityZones) {
            this.availabilityZones = availabilityZones;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getBacktrackWindow}
         * @param backtrackWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#backtrack_window RdsCluster#backtrack_window}.
         * @return {@code this}
         */
        public Builder backtrackWindow(java.lang.Number backtrackWindow) {
            this.backtrackWindow = backtrackWindow;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getBackupRetentionPeriod}
         * @param backupRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#backup_retention_period RdsCluster#backup_retention_period}.
         * @return {@code this}
         */
        public Builder backupRetentionPeriod(java.lang.Number backupRetentionPeriod) {
            this.backupRetentionPeriod = backupRetentionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getCaCertificateIdentifier}
         * @param caCertificateIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#ca_certificate_identifier RdsCluster#ca_certificate_identifier}.
         * @return {@code this}
         */
        public Builder caCertificateIdentifier(java.lang.String caCertificateIdentifier) {
            this.caCertificateIdentifier = caCertificateIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getClusterIdentifier}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_identifier RdsCluster#cluster_identifier}.
         * @return {@code this}
         */
        public Builder clusterIdentifier(java.lang.String clusterIdentifier) {
            this.clusterIdentifier = clusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getClusterIdentifierPrefix}
         * @param clusterIdentifierPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_identifier_prefix RdsCluster#cluster_identifier_prefix}.
         * @return {@code this}
         */
        public Builder clusterIdentifierPrefix(java.lang.String clusterIdentifierPrefix) {
            this.clusterIdentifierPrefix = clusterIdentifierPrefix;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getClusterMembers}
         * @param clusterMembers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_members RdsCluster#cluster_members}.
         * @return {@code this}
         */
        public Builder clusterMembers(java.util.List<java.lang.String> clusterMembers) {
            this.clusterMembers = clusterMembers;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getClusterScalabilityType}
         * @param clusterScalabilityType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_scalability_type RdsCluster#cluster_scalability_type}.
         * @return {@code this}
         */
        public Builder clusterScalabilityType(java.lang.String clusterScalabilityType) {
            this.clusterScalabilityType = clusterScalabilityType;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getCopyTagsToSnapshot}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#copy_tags_to_snapshot RdsCluster#copy_tags_to_snapshot}.
         * @return {@code this}
         */
        public Builder copyTagsToSnapshot(java.lang.Boolean copyTagsToSnapshot) {
            this.copyTagsToSnapshot = copyTagsToSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getCopyTagsToSnapshot}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#copy_tags_to_snapshot RdsCluster#copy_tags_to_snapshot}.
         * @return {@code this}
         */
        public Builder copyTagsToSnapshot(com.hashicorp.cdktf.IResolvable copyTagsToSnapshot) {
            this.copyTagsToSnapshot = copyTagsToSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDatabaseInsightsMode}
         * @param databaseInsightsMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#database_insights_mode RdsCluster#database_insights_mode}.
         * @return {@code this}
         */
        public Builder databaseInsightsMode(java.lang.String databaseInsightsMode) {
            this.databaseInsightsMode = databaseInsightsMode;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#database_name RdsCluster#database_name}.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDbClusterInstanceClass}
         * @param dbClusterInstanceClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_cluster_instance_class RdsCluster#db_cluster_instance_class}.
         * @return {@code this}
         */
        public Builder dbClusterInstanceClass(java.lang.String dbClusterInstanceClass) {
            this.dbClusterInstanceClass = dbClusterInstanceClass;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDbClusterParameterGroupName}
         * @param dbClusterParameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_cluster_parameter_group_name RdsCluster#db_cluster_parameter_group_name}.
         * @return {@code this}
         */
        public Builder dbClusterParameterGroupName(java.lang.String dbClusterParameterGroupName) {
            this.dbClusterParameterGroupName = dbClusterParameterGroupName;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDbInstanceParameterGroupName}
         * @param dbInstanceParameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_instance_parameter_group_name RdsCluster#db_instance_parameter_group_name}.
         * @return {@code this}
         */
        public Builder dbInstanceParameterGroupName(java.lang.String dbInstanceParameterGroupName) {
            this.dbInstanceParameterGroupName = dbInstanceParameterGroupName;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDbSubnetGroupName}
         * @param dbSubnetGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_subnet_group_name RdsCluster#db_subnet_group_name}.
         * @return {@code this}
         */
        public Builder dbSubnetGroupName(java.lang.String dbSubnetGroupName) {
            this.dbSubnetGroupName = dbSubnetGroupName;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDbSystemId}
         * @param dbSystemId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_system_id RdsCluster#db_system_id}.
         * @return {@code this}
         */
        public Builder dbSystemId(java.lang.String dbSystemId) {
            this.dbSystemId = dbSystemId;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDeleteAutomatedBackups}
         * @param deleteAutomatedBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#delete_automated_backups RdsCluster#delete_automated_backups}.
         * @return {@code this}
         */
        public Builder deleteAutomatedBackups(java.lang.Boolean deleteAutomatedBackups) {
            this.deleteAutomatedBackups = deleteAutomatedBackups;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDeleteAutomatedBackups}
         * @param deleteAutomatedBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#delete_automated_backups RdsCluster#delete_automated_backups}.
         * @return {@code this}
         */
        public Builder deleteAutomatedBackups(com.hashicorp.cdktf.IResolvable deleteAutomatedBackups) {
            this.deleteAutomatedBackups = deleteAutomatedBackups;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDeletionProtection}
         * @param deletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#deletion_protection RdsCluster#deletion_protection}.
         * @return {@code this}
         */
        public Builder deletionProtection(java.lang.Boolean deletionProtection) {
            this.deletionProtection = deletionProtection;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDeletionProtection}
         * @param deletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#deletion_protection RdsCluster#deletion_protection}.
         * @return {@code this}
         */
        public Builder deletionProtection(com.hashicorp.cdktf.IResolvable deletionProtection) {
            this.deletionProtection = deletionProtection;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDomain}
         * @param domain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#domain RdsCluster#domain}.
         * @return {@code this}
         */
        public Builder domain(java.lang.String domain) {
            this.domain = domain;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDomainIamRoleName}
         * @param domainIamRoleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#domain_iam_role_name RdsCluster#domain_iam_role_name}.
         * @return {@code this}
         */
        public Builder domainIamRoleName(java.lang.String domainIamRoleName) {
            this.domainIamRoleName = domainIamRoleName;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getEnabledCloudwatchLogsExports}
         * @param enabledCloudwatchLogsExports Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enabled_cloudwatch_logs_exports RdsCluster#enabled_cloudwatch_logs_exports}.
         * @return {@code this}
         */
        public Builder enabledCloudwatchLogsExports(java.util.List<java.lang.String> enabledCloudwatchLogsExports) {
            this.enabledCloudwatchLogsExports = enabledCloudwatchLogsExports;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getEnableGlobalWriteForwarding}
         * @param enableGlobalWriteForwarding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_global_write_forwarding RdsCluster#enable_global_write_forwarding}.
         * @return {@code this}
         */
        public Builder enableGlobalWriteForwarding(java.lang.Boolean enableGlobalWriteForwarding) {
            this.enableGlobalWriteForwarding = enableGlobalWriteForwarding;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getEnableGlobalWriteForwarding}
         * @param enableGlobalWriteForwarding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_global_write_forwarding RdsCluster#enable_global_write_forwarding}.
         * @return {@code this}
         */
        public Builder enableGlobalWriteForwarding(com.hashicorp.cdktf.IResolvable enableGlobalWriteForwarding) {
            this.enableGlobalWriteForwarding = enableGlobalWriteForwarding;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getEnableHttpEndpoint}
         * @param enableHttpEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_http_endpoint RdsCluster#enable_http_endpoint}.
         * @return {@code this}
         */
        public Builder enableHttpEndpoint(java.lang.Boolean enableHttpEndpoint) {
            this.enableHttpEndpoint = enableHttpEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getEnableHttpEndpoint}
         * @param enableHttpEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_http_endpoint RdsCluster#enable_http_endpoint}.
         * @return {@code this}
         */
        public Builder enableHttpEndpoint(com.hashicorp.cdktf.IResolvable enableHttpEndpoint) {
            this.enableHttpEndpoint = enableHttpEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getEnableLocalWriteForwarding}
         * @param enableLocalWriteForwarding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_local_write_forwarding RdsCluster#enable_local_write_forwarding}.
         * @return {@code this}
         */
        public Builder enableLocalWriteForwarding(java.lang.Boolean enableLocalWriteForwarding) {
            this.enableLocalWriteForwarding = enableLocalWriteForwarding;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getEnableLocalWriteForwarding}
         * @param enableLocalWriteForwarding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_local_write_forwarding RdsCluster#enable_local_write_forwarding}.
         * @return {@code this}
         */
        public Builder enableLocalWriteForwarding(com.hashicorp.cdktf.IResolvable enableLocalWriteForwarding) {
            this.enableLocalWriteForwarding = enableLocalWriteForwarding;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getEngineLifecycleSupport}
         * @param engineLifecycleSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine_lifecycle_support RdsCluster#engine_lifecycle_support}.
         * @return {@code this}
         */
        public Builder engineLifecycleSupport(java.lang.String engineLifecycleSupport) {
            this.engineLifecycleSupport = engineLifecycleSupport;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getEngineMode}
         * @param engineMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine_mode RdsCluster#engine_mode}.
         * @return {@code this}
         */
        public Builder engineMode(java.lang.String engineMode) {
            this.engineMode = engineMode;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getEngineVersion}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine_version RdsCluster#engine_version}.
         * @return {@code this}
         */
        public Builder engineVersion(java.lang.String engineVersion) {
            this.engineVersion = engineVersion;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getFinalSnapshotIdentifier}
         * @param finalSnapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#final_snapshot_identifier RdsCluster#final_snapshot_identifier}.
         * @return {@code this}
         */
        public Builder finalSnapshotIdentifier(java.lang.String finalSnapshotIdentifier) {
            this.finalSnapshotIdentifier = finalSnapshotIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getGlobalClusterIdentifier}
         * @param globalClusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#global_cluster_identifier RdsCluster#global_cluster_identifier}.
         * @return {@code this}
         */
        public Builder globalClusterIdentifier(java.lang.String globalClusterIdentifier) {
            this.globalClusterIdentifier = globalClusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getIamDatabaseAuthenticationEnabled}
         * @param iamDatabaseAuthenticationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iam_database_authentication_enabled RdsCluster#iam_database_authentication_enabled}.
         * @return {@code this}
         */
        public Builder iamDatabaseAuthenticationEnabled(java.lang.Boolean iamDatabaseAuthenticationEnabled) {
            this.iamDatabaseAuthenticationEnabled = iamDatabaseAuthenticationEnabled;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getIamDatabaseAuthenticationEnabled}
         * @param iamDatabaseAuthenticationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iam_database_authentication_enabled RdsCluster#iam_database_authentication_enabled}.
         * @return {@code this}
         */
        public Builder iamDatabaseAuthenticationEnabled(com.hashicorp.cdktf.IResolvable iamDatabaseAuthenticationEnabled) {
            this.iamDatabaseAuthenticationEnabled = iamDatabaseAuthenticationEnabled;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getIamRoles}
         * @param iamRoles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iam_roles RdsCluster#iam_roles}.
         * @return {@code this}
         */
        public Builder iamRoles(java.util.List<java.lang.String> iamRoles) {
            this.iamRoles = iamRoles;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#id RdsCluster#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getIops}
         * @param iops Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iops RdsCluster#iops}.
         * @return {@code this}
         */
        public Builder iops(java.lang.Number iops) {
            this.iops = iops;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#kms_key_id RdsCluster#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getManageMasterUserPassword}
         * @param manageMasterUserPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#manage_master_user_password RdsCluster#manage_master_user_password}.
         * @return {@code this}
         */
        public Builder manageMasterUserPassword(java.lang.Boolean manageMasterUserPassword) {
            this.manageMasterUserPassword = manageMasterUserPassword;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getManageMasterUserPassword}
         * @param manageMasterUserPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#manage_master_user_password RdsCluster#manage_master_user_password}.
         * @return {@code this}
         */
        public Builder manageMasterUserPassword(com.hashicorp.cdktf.IResolvable manageMasterUserPassword) {
            this.manageMasterUserPassword = manageMasterUserPassword;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getMasterPassword}
         * @param masterPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_password RdsCluster#master_password}.
         * @return {@code this}
         */
        public Builder masterPassword(java.lang.String masterPassword) {
            this.masterPassword = masterPassword;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getMasterPasswordWo}
         * @param masterPasswordWo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_password_wo RdsCluster#master_password_wo}.
         * @return {@code this}
         */
        public Builder masterPasswordWo(java.lang.String masterPasswordWo) {
            this.masterPasswordWo = masterPasswordWo;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getMasterPasswordWoVersion}
         * @param masterPasswordWoVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_password_wo_version RdsCluster#master_password_wo_version}.
         * @return {@code this}
         */
        public Builder masterPasswordWoVersion(java.lang.Number masterPasswordWoVersion) {
            this.masterPasswordWoVersion = masterPasswordWoVersion;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getMasterUsername}
         * @param masterUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_username RdsCluster#master_username}.
         * @return {@code this}
         */
        public Builder masterUsername(java.lang.String masterUsername) {
            this.masterUsername = masterUsername;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getMasterUserSecretKmsKeyId}
         * @param masterUserSecretKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_user_secret_kms_key_id RdsCluster#master_user_secret_kms_key_id}.
         * @return {@code this}
         */
        public Builder masterUserSecretKmsKeyId(java.lang.String masterUserSecretKmsKeyId) {
            this.masterUserSecretKmsKeyId = masterUserSecretKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getMonitoringInterval}
         * @param monitoringInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#monitoring_interval RdsCluster#monitoring_interval}.
         * @return {@code this}
         */
        public Builder monitoringInterval(java.lang.Number monitoringInterval) {
            this.monitoringInterval = monitoringInterval;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getMonitoringRoleArn}
         * @param monitoringRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#monitoring_role_arn RdsCluster#monitoring_role_arn}.
         * @return {@code this}
         */
        public Builder monitoringRoleArn(java.lang.String monitoringRoleArn) {
            this.monitoringRoleArn = monitoringRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getNetworkType}
         * @param networkType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#network_type RdsCluster#network_type}.
         * @return {@code this}
         */
        public Builder networkType(java.lang.String networkType) {
            this.networkType = networkType;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getPerformanceInsightsEnabled}
         * @param performanceInsightsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_enabled RdsCluster#performance_insights_enabled}.
         * @return {@code this}
         */
        public Builder performanceInsightsEnabled(java.lang.Boolean performanceInsightsEnabled) {
            this.performanceInsightsEnabled = performanceInsightsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getPerformanceInsightsEnabled}
         * @param performanceInsightsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_enabled RdsCluster#performance_insights_enabled}.
         * @return {@code this}
         */
        public Builder performanceInsightsEnabled(com.hashicorp.cdktf.IResolvable performanceInsightsEnabled) {
            this.performanceInsightsEnabled = performanceInsightsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getPerformanceInsightsKmsKeyId}
         * @param performanceInsightsKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_kms_key_id RdsCluster#performance_insights_kms_key_id}.
         * @return {@code this}
         */
        public Builder performanceInsightsKmsKeyId(java.lang.String performanceInsightsKmsKeyId) {
            this.performanceInsightsKmsKeyId = performanceInsightsKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getPerformanceInsightsRetentionPeriod}
         * @param performanceInsightsRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_retention_period RdsCluster#performance_insights_retention_period}.
         * @return {@code this}
         */
        public Builder performanceInsightsRetentionPeriod(java.lang.Number performanceInsightsRetentionPeriod) {
            this.performanceInsightsRetentionPeriod = performanceInsightsRetentionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#port RdsCluster#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getPreferredBackupWindow}
         * @param preferredBackupWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#preferred_backup_window RdsCluster#preferred_backup_window}.
         * @return {@code this}
         */
        public Builder preferredBackupWindow(java.lang.String preferredBackupWindow) {
            this.preferredBackupWindow = preferredBackupWindow;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getPreferredMaintenanceWindow}
         * @param preferredMaintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#preferred_maintenance_window RdsCluster#preferred_maintenance_window}.
         * @return {@code this}
         */
        public Builder preferredMaintenanceWindow(java.lang.String preferredMaintenanceWindow) {
            this.preferredMaintenanceWindow = preferredMaintenanceWindow;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getReplicationSourceIdentifier}
         * @param replicationSourceIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#replication_source_identifier RdsCluster#replication_source_identifier}.
         * @return {@code this}
         */
        public Builder replicationSourceIdentifier(java.lang.String replicationSourceIdentifier) {
            this.replicationSourceIdentifier = replicationSourceIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getRestoreToPointInTime}
         * @param restoreToPointInTime restore_to_point_in_time block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#restore_to_point_in_time RdsCluster#restore_to_point_in_time}
         * @return {@code this}
         */
        public Builder restoreToPointInTime(imports.aws.rds_cluster.RdsClusterRestoreToPointInTime restoreToPointInTime) {
            this.restoreToPointInTime = restoreToPointInTime;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getS3Import}
         * @param s3Import s3_import block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#s3_import RdsCluster#s3_import}
         * @return {@code this}
         */
        public Builder s3Import(imports.aws.rds_cluster.RdsClusterS3Import s3Import) {
            this.s3Import = s3Import;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getScalingConfiguration}
         * @param scalingConfiguration scaling_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#scaling_configuration RdsCluster#scaling_configuration}
         * @return {@code this}
         */
        public Builder scalingConfiguration(imports.aws.rds_cluster.RdsClusterScalingConfiguration scalingConfiguration) {
            this.scalingConfiguration = scalingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getServerlessv2ScalingConfiguration}
         * @param serverlessv2ScalingConfiguration serverlessv2_scaling_configuration block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#serverlessv2_scaling_configuration RdsCluster#serverlessv2_scaling_configuration}
         * @return {@code this}
         */
        public Builder serverlessv2ScalingConfiguration(imports.aws.rds_cluster.RdsClusterServerlessv2ScalingConfiguration serverlessv2ScalingConfiguration) {
            this.serverlessv2ScalingConfiguration = serverlessv2ScalingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getSkipFinalSnapshot}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#skip_final_snapshot RdsCluster#skip_final_snapshot}.
         * @return {@code this}
         */
        public Builder skipFinalSnapshot(java.lang.Boolean skipFinalSnapshot) {
            this.skipFinalSnapshot = skipFinalSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getSkipFinalSnapshot}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#skip_final_snapshot RdsCluster#skip_final_snapshot}.
         * @return {@code this}
         */
        public Builder skipFinalSnapshot(com.hashicorp.cdktf.IResolvable skipFinalSnapshot) {
            this.skipFinalSnapshot = skipFinalSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getSnapshotIdentifier}
         * @param snapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#snapshot_identifier RdsCluster#snapshot_identifier}.
         * @return {@code this}
         */
        public Builder snapshotIdentifier(java.lang.String snapshotIdentifier) {
            this.snapshotIdentifier = snapshotIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getSourceRegion}
         * @param sourceRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#source_region RdsCluster#source_region}.
         * @return {@code this}
         */
        public Builder sourceRegion(java.lang.String sourceRegion) {
            this.sourceRegion = sourceRegion;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getStorageEncrypted}
         * @param storageEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#storage_encrypted RdsCluster#storage_encrypted}.
         * @return {@code this}
         */
        public Builder storageEncrypted(java.lang.Boolean storageEncrypted) {
            this.storageEncrypted = storageEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getStorageEncrypted}
         * @param storageEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#storage_encrypted RdsCluster#storage_encrypted}.
         * @return {@code this}
         */
        public Builder storageEncrypted(com.hashicorp.cdktf.IResolvable storageEncrypted) {
            this.storageEncrypted = storageEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getStorageType}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#storage_type RdsCluster#storage_type}.
         * @return {@code this}
         */
        public Builder storageType(java.lang.String storageType) {
            this.storageType = storageType;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#tags RdsCluster#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#tags_all RdsCluster#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#timeouts RdsCluster#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.rds_cluster.RdsClusterTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getVpcSecurityGroupIds}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#vpc_security_group_ids RdsCluster#vpc_security_group_ids}.
         * @return {@code this}
         */
        public Builder vpcSecurityGroupIds(java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.vpcSecurityGroupIds = vpcSecurityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getDependsOn}
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
         * Sets the value of {@link RdsClusterConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterConfig#getProvisioners}
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
         * @return a new instance of {@link RdsClusterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RdsClusterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RdsClusterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RdsClusterConfig {
        private final java.lang.String engine;
        private final java.lang.Number allocatedStorage;
        private final java.lang.Object allowMajorVersionUpgrade;
        private final java.lang.Object applyImmediately;
        private final java.util.List<java.lang.String> availabilityZones;
        private final java.lang.Number backtrackWindow;
        private final java.lang.Number backupRetentionPeriod;
        private final java.lang.String caCertificateIdentifier;
        private final java.lang.String clusterIdentifier;
        private final java.lang.String clusterIdentifierPrefix;
        private final java.util.List<java.lang.String> clusterMembers;
        private final java.lang.String clusterScalabilityType;
        private final java.lang.Object copyTagsToSnapshot;
        private final java.lang.String databaseInsightsMode;
        private final java.lang.String databaseName;
        private final java.lang.String dbClusterInstanceClass;
        private final java.lang.String dbClusterParameterGroupName;
        private final java.lang.String dbInstanceParameterGroupName;
        private final java.lang.String dbSubnetGroupName;
        private final java.lang.String dbSystemId;
        private final java.lang.Object deleteAutomatedBackups;
        private final java.lang.Object deletionProtection;
        private final java.lang.String domain;
        private final java.lang.String domainIamRoleName;
        private final java.util.List<java.lang.String> enabledCloudwatchLogsExports;
        private final java.lang.Object enableGlobalWriteForwarding;
        private final java.lang.Object enableHttpEndpoint;
        private final java.lang.Object enableLocalWriteForwarding;
        private final java.lang.String engineLifecycleSupport;
        private final java.lang.String engineMode;
        private final java.lang.String engineVersion;
        private final java.lang.String finalSnapshotIdentifier;
        private final java.lang.String globalClusterIdentifier;
        private final java.lang.Object iamDatabaseAuthenticationEnabled;
        private final java.util.List<java.lang.String> iamRoles;
        private final java.lang.String id;
        private final java.lang.Number iops;
        private final java.lang.String kmsKeyId;
        private final java.lang.Object manageMasterUserPassword;
        private final java.lang.String masterPassword;
        private final java.lang.String masterPasswordWo;
        private final java.lang.Number masterPasswordWoVersion;
        private final java.lang.String masterUsername;
        private final java.lang.String masterUserSecretKmsKeyId;
        private final java.lang.Number monitoringInterval;
        private final java.lang.String monitoringRoleArn;
        private final java.lang.String networkType;
        private final java.lang.Object performanceInsightsEnabled;
        private final java.lang.String performanceInsightsKmsKeyId;
        private final java.lang.Number performanceInsightsRetentionPeriod;
        private final java.lang.Number port;
        private final java.lang.String preferredBackupWindow;
        private final java.lang.String preferredMaintenanceWindow;
        private final java.lang.String replicationSourceIdentifier;
        private final imports.aws.rds_cluster.RdsClusterRestoreToPointInTime restoreToPointInTime;
        private final imports.aws.rds_cluster.RdsClusterS3Import s3Import;
        private final imports.aws.rds_cluster.RdsClusterScalingConfiguration scalingConfiguration;
        private final imports.aws.rds_cluster.RdsClusterServerlessv2ScalingConfiguration serverlessv2ScalingConfiguration;
        private final java.lang.Object skipFinalSnapshot;
        private final java.lang.String snapshotIdentifier;
        private final java.lang.String sourceRegion;
        private final java.lang.Object storageEncrypted;
        private final java.lang.String storageType;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.rds_cluster.RdsClusterTimeouts timeouts;
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
            this.engine = software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allocatedStorage = software.amazon.jsii.Kernel.get(this, "allocatedStorage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.allowMajorVersionUpgrade = software.amazon.jsii.Kernel.get(this, "allowMajorVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.applyImmediately = software.amazon.jsii.Kernel.get(this, "applyImmediately", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.availabilityZones = software.amazon.jsii.Kernel.get(this, "availabilityZones", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.backtrackWindow = software.amazon.jsii.Kernel.get(this, "backtrackWindow", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.backupRetentionPeriod = software.amazon.jsii.Kernel.get(this, "backupRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.caCertificateIdentifier = software.amazon.jsii.Kernel.get(this, "caCertificateIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterIdentifier = software.amazon.jsii.Kernel.get(this, "clusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterIdentifierPrefix = software.amazon.jsii.Kernel.get(this, "clusterIdentifierPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterMembers = software.amazon.jsii.Kernel.get(this, "clusterMembers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.clusterScalabilityType = software.amazon.jsii.Kernel.get(this, "clusterScalabilityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyTagsToSnapshot = software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.databaseInsightsMode = software.amazon.jsii.Kernel.get(this, "databaseInsightsMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbClusterInstanceClass = software.amazon.jsii.Kernel.get(this, "dbClusterInstanceClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbClusterParameterGroupName = software.amazon.jsii.Kernel.get(this, "dbClusterParameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbInstanceParameterGroupName = software.amazon.jsii.Kernel.get(this, "dbInstanceParameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbSubnetGroupName = software.amazon.jsii.Kernel.get(this, "dbSubnetGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbSystemId = software.amazon.jsii.Kernel.get(this, "dbSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deleteAutomatedBackups = software.amazon.jsii.Kernel.get(this, "deleteAutomatedBackups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deletionProtection = software.amazon.jsii.Kernel.get(this, "deletionProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.domain = software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainIamRoleName = software.amazon.jsii.Kernel.get(this, "domainIamRoleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabledCloudwatchLogsExports = software.amazon.jsii.Kernel.get(this, "enabledCloudwatchLogsExports", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.enableGlobalWriteForwarding = software.amazon.jsii.Kernel.get(this, "enableGlobalWriteForwarding", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableHttpEndpoint = software.amazon.jsii.Kernel.get(this, "enableHttpEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableLocalWriteForwarding = software.amazon.jsii.Kernel.get(this, "enableLocalWriteForwarding", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.engineLifecycleSupport = software.amazon.jsii.Kernel.get(this, "engineLifecycleSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineMode = software.amazon.jsii.Kernel.get(this, "engineMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineVersion = software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.finalSnapshotIdentifier = software.amazon.jsii.Kernel.get(this, "finalSnapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.globalClusterIdentifier = software.amazon.jsii.Kernel.get(this, "globalClusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamDatabaseAuthenticationEnabled = software.amazon.jsii.Kernel.get(this, "iamDatabaseAuthenticationEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.iamRoles = software.amazon.jsii.Kernel.get(this, "iamRoles", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iops = software.amazon.jsii.Kernel.get(this, "iops", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.manageMasterUserPassword = software.amazon.jsii.Kernel.get(this, "manageMasterUserPassword", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.masterPassword = software.amazon.jsii.Kernel.get(this, "masterPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.masterPasswordWo = software.amazon.jsii.Kernel.get(this, "masterPasswordWo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.masterPasswordWoVersion = software.amazon.jsii.Kernel.get(this, "masterPasswordWoVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.masterUsername = software.amazon.jsii.Kernel.get(this, "masterUsername", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.masterUserSecretKmsKeyId = software.amazon.jsii.Kernel.get(this, "masterUserSecretKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.monitoringInterval = software.amazon.jsii.Kernel.get(this, "monitoringInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.monitoringRoleArn = software.amazon.jsii.Kernel.get(this, "monitoringRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkType = software.amazon.jsii.Kernel.get(this, "networkType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.performanceInsightsEnabled = software.amazon.jsii.Kernel.get(this, "performanceInsightsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.performanceInsightsKmsKeyId = software.amazon.jsii.Kernel.get(this, "performanceInsightsKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.performanceInsightsRetentionPeriod = software.amazon.jsii.Kernel.get(this, "performanceInsightsRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.preferredBackupWindow = software.amazon.jsii.Kernel.get(this, "preferredBackupWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preferredMaintenanceWindow = software.amazon.jsii.Kernel.get(this, "preferredMaintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicationSourceIdentifier = software.amazon.jsii.Kernel.get(this, "replicationSourceIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.restoreToPointInTime = software.amazon.jsii.Kernel.get(this, "restoreToPointInTime", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterRestoreToPointInTime.class));
            this.s3Import = software.amazon.jsii.Kernel.get(this, "s3Import", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterS3Import.class));
            this.scalingConfiguration = software.amazon.jsii.Kernel.get(this, "scalingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterScalingConfiguration.class));
            this.serverlessv2ScalingConfiguration = software.amazon.jsii.Kernel.get(this, "serverlessv2ScalingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterServerlessv2ScalingConfiguration.class));
            this.skipFinalSnapshot = software.amazon.jsii.Kernel.get(this, "skipFinalSnapshot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.snapshotIdentifier = software.amazon.jsii.Kernel.get(this, "snapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceRegion = software.amazon.jsii.Kernel.get(this, "sourceRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.storageEncrypted = software.amazon.jsii.Kernel.get(this, "storageEncrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.storageType = software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterTimeouts.class));
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
            this.engine = java.util.Objects.requireNonNull(builder.engine, "engine is required");
            this.allocatedStorage = builder.allocatedStorage;
            this.allowMajorVersionUpgrade = builder.allowMajorVersionUpgrade;
            this.applyImmediately = builder.applyImmediately;
            this.availabilityZones = builder.availabilityZones;
            this.backtrackWindow = builder.backtrackWindow;
            this.backupRetentionPeriod = builder.backupRetentionPeriod;
            this.caCertificateIdentifier = builder.caCertificateIdentifier;
            this.clusterIdentifier = builder.clusterIdentifier;
            this.clusterIdentifierPrefix = builder.clusterIdentifierPrefix;
            this.clusterMembers = builder.clusterMembers;
            this.clusterScalabilityType = builder.clusterScalabilityType;
            this.copyTagsToSnapshot = builder.copyTagsToSnapshot;
            this.databaseInsightsMode = builder.databaseInsightsMode;
            this.databaseName = builder.databaseName;
            this.dbClusterInstanceClass = builder.dbClusterInstanceClass;
            this.dbClusterParameterGroupName = builder.dbClusterParameterGroupName;
            this.dbInstanceParameterGroupName = builder.dbInstanceParameterGroupName;
            this.dbSubnetGroupName = builder.dbSubnetGroupName;
            this.dbSystemId = builder.dbSystemId;
            this.deleteAutomatedBackups = builder.deleteAutomatedBackups;
            this.deletionProtection = builder.deletionProtection;
            this.domain = builder.domain;
            this.domainIamRoleName = builder.domainIamRoleName;
            this.enabledCloudwatchLogsExports = builder.enabledCloudwatchLogsExports;
            this.enableGlobalWriteForwarding = builder.enableGlobalWriteForwarding;
            this.enableHttpEndpoint = builder.enableHttpEndpoint;
            this.enableLocalWriteForwarding = builder.enableLocalWriteForwarding;
            this.engineLifecycleSupport = builder.engineLifecycleSupport;
            this.engineMode = builder.engineMode;
            this.engineVersion = builder.engineVersion;
            this.finalSnapshotIdentifier = builder.finalSnapshotIdentifier;
            this.globalClusterIdentifier = builder.globalClusterIdentifier;
            this.iamDatabaseAuthenticationEnabled = builder.iamDatabaseAuthenticationEnabled;
            this.iamRoles = builder.iamRoles;
            this.id = builder.id;
            this.iops = builder.iops;
            this.kmsKeyId = builder.kmsKeyId;
            this.manageMasterUserPassword = builder.manageMasterUserPassword;
            this.masterPassword = builder.masterPassword;
            this.masterPasswordWo = builder.masterPasswordWo;
            this.masterPasswordWoVersion = builder.masterPasswordWoVersion;
            this.masterUsername = builder.masterUsername;
            this.masterUserSecretKmsKeyId = builder.masterUserSecretKmsKeyId;
            this.monitoringInterval = builder.monitoringInterval;
            this.monitoringRoleArn = builder.monitoringRoleArn;
            this.networkType = builder.networkType;
            this.performanceInsightsEnabled = builder.performanceInsightsEnabled;
            this.performanceInsightsKmsKeyId = builder.performanceInsightsKmsKeyId;
            this.performanceInsightsRetentionPeriod = builder.performanceInsightsRetentionPeriod;
            this.port = builder.port;
            this.preferredBackupWindow = builder.preferredBackupWindow;
            this.preferredMaintenanceWindow = builder.preferredMaintenanceWindow;
            this.replicationSourceIdentifier = builder.replicationSourceIdentifier;
            this.restoreToPointInTime = builder.restoreToPointInTime;
            this.s3Import = builder.s3Import;
            this.scalingConfiguration = builder.scalingConfiguration;
            this.serverlessv2ScalingConfiguration = builder.serverlessv2ScalingConfiguration;
            this.skipFinalSnapshot = builder.skipFinalSnapshot;
            this.snapshotIdentifier = builder.snapshotIdentifier;
            this.sourceRegion = builder.sourceRegion;
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
        public final java.lang.String getEngine() {
            return this.engine;
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
        public final java.util.List<java.lang.String> getAvailabilityZones() {
            return this.availabilityZones;
        }

        @Override
        public final java.lang.Number getBacktrackWindow() {
            return this.backtrackWindow;
        }

        @Override
        public final java.lang.Number getBackupRetentionPeriod() {
            return this.backupRetentionPeriod;
        }

        @Override
        public final java.lang.String getCaCertificateIdentifier() {
            return this.caCertificateIdentifier;
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
        public final java.util.List<java.lang.String> getClusterMembers() {
            return this.clusterMembers;
        }

        @Override
        public final java.lang.String getClusterScalabilityType() {
            return this.clusterScalabilityType;
        }

        @Override
        public final java.lang.Object getCopyTagsToSnapshot() {
            return this.copyTagsToSnapshot;
        }

        @Override
        public final java.lang.String getDatabaseInsightsMode() {
            return this.databaseInsightsMode;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getDbClusterInstanceClass() {
            return this.dbClusterInstanceClass;
        }

        @Override
        public final java.lang.String getDbClusterParameterGroupName() {
            return this.dbClusterParameterGroupName;
        }

        @Override
        public final java.lang.String getDbInstanceParameterGroupName() {
            return this.dbInstanceParameterGroupName;
        }

        @Override
        public final java.lang.String getDbSubnetGroupName() {
            return this.dbSubnetGroupName;
        }

        @Override
        public final java.lang.String getDbSystemId() {
            return this.dbSystemId;
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
        public final java.lang.String getDomainIamRoleName() {
            return this.domainIamRoleName;
        }

        @Override
        public final java.util.List<java.lang.String> getEnabledCloudwatchLogsExports() {
            return this.enabledCloudwatchLogsExports;
        }

        @Override
        public final java.lang.Object getEnableGlobalWriteForwarding() {
            return this.enableGlobalWriteForwarding;
        }

        @Override
        public final java.lang.Object getEnableHttpEndpoint() {
            return this.enableHttpEndpoint;
        }

        @Override
        public final java.lang.Object getEnableLocalWriteForwarding() {
            return this.enableLocalWriteForwarding;
        }

        @Override
        public final java.lang.String getEngineLifecycleSupport() {
            return this.engineLifecycleSupport;
        }

        @Override
        public final java.lang.String getEngineMode() {
            return this.engineMode;
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
        public final java.lang.Number getIops() {
            return this.iops;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.Object getManageMasterUserPassword() {
            return this.manageMasterUserPassword;
        }

        @Override
        public final java.lang.String getMasterPassword() {
            return this.masterPassword;
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
        public final java.lang.String getMasterUserSecretKmsKeyId() {
            return this.masterUserSecretKmsKeyId;
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
        public final java.lang.String getNetworkType() {
            return this.networkType;
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
        public final imports.aws.rds_cluster.RdsClusterRestoreToPointInTime getRestoreToPointInTime() {
            return this.restoreToPointInTime;
        }

        @Override
        public final imports.aws.rds_cluster.RdsClusterS3Import getS3Import() {
            return this.s3Import;
        }

        @Override
        public final imports.aws.rds_cluster.RdsClusterScalingConfiguration getScalingConfiguration() {
            return this.scalingConfiguration;
        }

        @Override
        public final imports.aws.rds_cluster.RdsClusterServerlessv2ScalingConfiguration getServerlessv2ScalingConfiguration() {
            return this.serverlessv2ScalingConfiguration;
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
        public final java.lang.String getSourceRegion() {
            return this.sourceRegion;
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
        public final imports.aws.rds_cluster.RdsClusterTimeouts getTimeouts() {
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

            data.set("engine", om.valueToTree(this.getEngine()));
            if (this.getAllocatedStorage() != null) {
                data.set("allocatedStorage", om.valueToTree(this.getAllocatedStorage()));
            }
            if (this.getAllowMajorVersionUpgrade() != null) {
                data.set("allowMajorVersionUpgrade", om.valueToTree(this.getAllowMajorVersionUpgrade()));
            }
            if (this.getApplyImmediately() != null) {
                data.set("applyImmediately", om.valueToTree(this.getApplyImmediately()));
            }
            if (this.getAvailabilityZones() != null) {
                data.set("availabilityZones", om.valueToTree(this.getAvailabilityZones()));
            }
            if (this.getBacktrackWindow() != null) {
                data.set("backtrackWindow", om.valueToTree(this.getBacktrackWindow()));
            }
            if (this.getBackupRetentionPeriod() != null) {
                data.set("backupRetentionPeriod", om.valueToTree(this.getBackupRetentionPeriod()));
            }
            if (this.getCaCertificateIdentifier() != null) {
                data.set("caCertificateIdentifier", om.valueToTree(this.getCaCertificateIdentifier()));
            }
            if (this.getClusterIdentifier() != null) {
                data.set("clusterIdentifier", om.valueToTree(this.getClusterIdentifier()));
            }
            if (this.getClusterIdentifierPrefix() != null) {
                data.set("clusterIdentifierPrefix", om.valueToTree(this.getClusterIdentifierPrefix()));
            }
            if (this.getClusterMembers() != null) {
                data.set("clusterMembers", om.valueToTree(this.getClusterMembers()));
            }
            if (this.getClusterScalabilityType() != null) {
                data.set("clusterScalabilityType", om.valueToTree(this.getClusterScalabilityType()));
            }
            if (this.getCopyTagsToSnapshot() != null) {
                data.set("copyTagsToSnapshot", om.valueToTree(this.getCopyTagsToSnapshot()));
            }
            if (this.getDatabaseInsightsMode() != null) {
                data.set("databaseInsightsMode", om.valueToTree(this.getDatabaseInsightsMode()));
            }
            if (this.getDatabaseName() != null) {
                data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            }
            if (this.getDbClusterInstanceClass() != null) {
                data.set("dbClusterInstanceClass", om.valueToTree(this.getDbClusterInstanceClass()));
            }
            if (this.getDbClusterParameterGroupName() != null) {
                data.set("dbClusterParameterGroupName", om.valueToTree(this.getDbClusterParameterGroupName()));
            }
            if (this.getDbInstanceParameterGroupName() != null) {
                data.set("dbInstanceParameterGroupName", om.valueToTree(this.getDbInstanceParameterGroupName()));
            }
            if (this.getDbSubnetGroupName() != null) {
                data.set("dbSubnetGroupName", om.valueToTree(this.getDbSubnetGroupName()));
            }
            if (this.getDbSystemId() != null) {
                data.set("dbSystemId", om.valueToTree(this.getDbSystemId()));
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
            if (this.getDomainIamRoleName() != null) {
                data.set("domainIamRoleName", om.valueToTree(this.getDomainIamRoleName()));
            }
            if (this.getEnabledCloudwatchLogsExports() != null) {
                data.set("enabledCloudwatchLogsExports", om.valueToTree(this.getEnabledCloudwatchLogsExports()));
            }
            if (this.getEnableGlobalWriteForwarding() != null) {
                data.set("enableGlobalWriteForwarding", om.valueToTree(this.getEnableGlobalWriteForwarding()));
            }
            if (this.getEnableHttpEndpoint() != null) {
                data.set("enableHttpEndpoint", om.valueToTree(this.getEnableHttpEndpoint()));
            }
            if (this.getEnableLocalWriteForwarding() != null) {
                data.set("enableLocalWriteForwarding", om.valueToTree(this.getEnableLocalWriteForwarding()));
            }
            if (this.getEngineLifecycleSupport() != null) {
                data.set("engineLifecycleSupport", om.valueToTree(this.getEngineLifecycleSupport()));
            }
            if (this.getEngineMode() != null) {
                data.set("engineMode", om.valueToTree(this.getEngineMode()));
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
            if (this.getIops() != null) {
                data.set("iops", om.valueToTree(this.getIops()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getManageMasterUserPassword() != null) {
                data.set("manageMasterUserPassword", om.valueToTree(this.getManageMasterUserPassword()));
            }
            if (this.getMasterPassword() != null) {
                data.set("masterPassword", om.valueToTree(this.getMasterPassword()));
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
            if (this.getMasterUserSecretKmsKeyId() != null) {
                data.set("masterUserSecretKmsKeyId", om.valueToTree(this.getMasterUserSecretKmsKeyId()));
            }
            if (this.getMonitoringInterval() != null) {
                data.set("monitoringInterval", om.valueToTree(this.getMonitoringInterval()));
            }
            if (this.getMonitoringRoleArn() != null) {
                data.set("monitoringRoleArn", om.valueToTree(this.getMonitoringRoleArn()));
            }
            if (this.getNetworkType() != null) {
                data.set("networkType", om.valueToTree(this.getNetworkType()));
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
            if (this.getPreferredBackupWindow() != null) {
                data.set("preferredBackupWindow", om.valueToTree(this.getPreferredBackupWindow()));
            }
            if (this.getPreferredMaintenanceWindow() != null) {
                data.set("preferredMaintenanceWindow", om.valueToTree(this.getPreferredMaintenanceWindow()));
            }
            if (this.getReplicationSourceIdentifier() != null) {
                data.set("replicationSourceIdentifier", om.valueToTree(this.getReplicationSourceIdentifier()));
            }
            if (this.getRestoreToPointInTime() != null) {
                data.set("restoreToPointInTime", om.valueToTree(this.getRestoreToPointInTime()));
            }
            if (this.getS3Import() != null) {
                data.set("s3Import", om.valueToTree(this.getS3Import()));
            }
            if (this.getScalingConfiguration() != null) {
                data.set("scalingConfiguration", om.valueToTree(this.getScalingConfiguration()));
            }
            if (this.getServerlessv2ScalingConfiguration() != null) {
                data.set("serverlessv2ScalingConfiguration", om.valueToTree(this.getServerlessv2ScalingConfiguration()));
            }
            if (this.getSkipFinalSnapshot() != null) {
                data.set("skipFinalSnapshot", om.valueToTree(this.getSkipFinalSnapshot()));
            }
            if (this.getSnapshotIdentifier() != null) {
                data.set("snapshotIdentifier", om.valueToTree(this.getSnapshotIdentifier()));
            }
            if (this.getSourceRegion() != null) {
                data.set("sourceRegion", om.valueToTree(this.getSourceRegion()));
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
            struct.set("fqn", om.valueToTree("aws.rdsCluster.RdsClusterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RdsClusterConfig.Jsii$Proxy that = (RdsClusterConfig.Jsii$Proxy) o;

            if (!engine.equals(that.engine)) return false;
            if (this.allocatedStorage != null ? !this.allocatedStorage.equals(that.allocatedStorage) : that.allocatedStorage != null) return false;
            if (this.allowMajorVersionUpgrade != null ? !this.allowMajorVersionUpgrade.equals(that.allowMajorVersionUpgrade) : that.allowMajorVersionUpgrade != null) return false;
            if (this.applyImmediately != null ? !this.applyImmediately.equals(that.applyImmediately) : that.applyImmediately != null) return false;
            if (this.availabilityZones != null ? !this.availabilityZones.equals(that.availabilityZones) : that.availabilityZones != null) return false;
            if (this.backtrackWindow != null ? !this.backtrackWindow.equals(that.backtrackWindow) : that.backtrackWindow != null) return false;
            if (this.backupRetentionPeriod != null ? !this.backupRetentionPeriod.equals(that.backupRetentionPeriod) : that.backupRetentionPeriod != null) return false;
            if (this.caCertificateIdentifier != null ? !this.caCertificateIdentifier.equals(that.caCertificateIdentifier) : that.caCertificateIdentifier != null) return false;
            if (this.clusterIdentifier != null ? !this.clusterIdentifier.equals(that.clusterIdentifier) : that.clusterIdentifier != null) return false;
            if (this.clusterIdentifierPrefix != null ? !this.clusterIdentifierPrefix.equals(that.clusterIdentifierPrefix) : that.clusterIdentifierPrefix != null) return false;
            if (this.clusterMembers != null ? !this.clusterMembers.equals(that.clusterMembers) : that.clusterMembers != null) return false;
            if (this.clusterScalabilityType != null ? !this.clusterScalabilityType.equals(that.clusterScalabilityType) : that.clusterScalabilityType != null) return false;
            if (this.copyTagsToSnapshot != null ? !this.copyTagsToSnapshot.equals(that.copyTagsToSnapshot) : that.copyTagsToSnapshot != null) return false;
            if (this.databaseInsightsMode != null ? !this.databaseInsightsMode.equals(that.databaseInsightsMode) : that.databaseInsightsMode != null) return false;
            if (this.databaseName != null ? !this.databaseName.equals(that.databaseName) : that.databaseName != null) return false;
            if (this.dbClusterInstanceClass != null ? !this.dbClusterInstanceClass.equals(that.dbClusterInstanceClass) : that.dbClusterInstanceClass != null) return false;
            if (this.dbClusterParameterGroupName != null ? !this.dbClusterParameterGroupName.equals(that.dbClusterParameterGroupName) : that.dbClusterParameterGroupName != null) return false;
            if (this.dbInstanceParameterGroupName != null ? !this.dbInstanceParameterGroupName.equals(that.dbInstanceParameterGroupName) : that.dbInstanceParameterGroupName != null) return false;
            if (this.dbSubnetGroupName != null ? !this.dbSubnetGroupName.equals(that.dbSubnetGroupName) : that.dbSubnetGroupName != null) return false;
            if (this.dbSystemId != null ? !this.dbSystemId.equals(that.dbSystemId) : that.dbSystemId != null) return false;
            if (this.deleteAutomatedBackups != null ? !this.deleteAutomatedBackups.equals(that.deleteAutomatedBackups) : that.deleteAutomatedBackups != null) return false;
            if (this.deletionProtection != null ? !this.deletionProtection.equals(that.deletionProtection) : that.deletionProtection != null) return false;
            if (this.domain != null ? !this.domain.equals(that.domain) : that.domain != null) return false;
            if (this.domainIamRoleName != null ? !this.domainIamRoleName.equals(that.domainIamRoleName) : that.domainIamRoleName != null) return false;
            if (this.enabledCloudwatchLogsExports != null ? !this.enabledCloudwatchLogsExports.equals(that.enabledCloudwatchLogsExports) : that.enabledCloudwatchLogsExports != null) return false;
            if (this.enableGlobalWriteForwarding != null ? !this.enableGlobalWriteForwarding.equals(that.enableGlobalWriteForwarding) : that.enableGlobalWriteForwarding != null) return false;
            if (this.enableHttpEndpoint != null ? !this.enableHttpEndpoint.equals(that.enableHttpEndpoint) : that.enableHttpEndpoint != null) return false;
            if (this.enableLocalWriteForwarding != null ? !this.enableLocalWriteForwarding.equals(that.enableLocalWriteForwarding) : that.enableLocalWriteForwarding != null) return false;
            if (this.engineLifecycleSupport != null ? !this.engineLifecycleSupport.equals(that.engineLifecycleSupport) : that.engineLifecycleSupport != null) return false;
            if (this.engineMode != null ? !this.engineMode.equals(that.engineMode) : that.engineMode != null) return false;
            if (this.engineVersion != null ? !this.engineVersion.equals(that.engineVersion) : that.engineVersion != null) return false;
            if (this.finalSnapshotIdentifier != null ? !this.finalSnapshotIdentifier.equals(that.finalSnapshotIdentifier) : that.finalSnapshotIdentifier != null) return false;
            if (this.globalClusterIdentifier != null ? !this.globalClusterIdentifier.equals(that.globalClusterIdentifier) : that.globalClusterIdentifier != null) return false;
            if (this.iamDatabaseAuthenticationEnabled != null ? !this.iamDatabaseAuthenticationEnabled.equals(that.iamDatabaseAuthenticationEnabled) : that.iamDatabaseAuthenticationEnabled != null) return false;
            if (this.iamRoles != null ? !this.iamRoles.equals(that.iamRoles) : that.iamRoles != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.iops != null ? !this.iops.equals(that.iops) : that.iops != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.manageMasterUserPassword != null ? !this.manageMasterUserPassword.equals(that.manageMasterUserPassword) : that.manageMasterUserPassword != null) return false;
            if (this.masterPassword != null ? !this.masterPassword.equals(that.masterPassword) : that.masterPassword != null) return false;
            if (this.masterPasswordWo != null ? !this.masterPasswordWo.equals(that.masterPasswordWo) : that.masterPasswordWo != null) return false;
            if (this.masterPasswordWoVersion != null ? !this.masterPasswordWoVersion.equals(that.masterPasswordWoVersion) : that.masterPasswordWoVersion != null) return false;
            if (this.masterUsername != null ? !this.masterUsername.equals(that.masterUsername) : that.masterUsername != null) return false;
            if (this.masterUserSecretKmsKeyId != null ? !this.masterUserSecretKmsKeyId.equals(that.masterUserSecretKmsKeyId) : that.masterUserSecretKmsKeyId != null) return false;
            if (this.monitoringInterval != null ? !this.monitoringInterval.equals(that.monitoringInterval) : that.monitoringInterval != null) return false;
            if (this.monitoringRoleArn != null ? !this.monitoringRoleArn.equals(that.monitoringRoleArn) : that.monitoringRoleArn != null) return false;
            if (this.networkType != null ? !this.networkType.equals(that.networkType) : that.networkType != null) return false;
            if (this.performanceInsightsEnabled != null ? !this.performanceInsightsEnabled.equals(that.performanceInsightsEnabled) : that.performanceInsightsEnabled != null) return false;
            if (this.performanceInsightsKmsKeyId != null ? !this.performanceInsightsKmsKeyId.equals(that.performanceInsightsKmsKeyId) : that.performanceInsightsKmsKeyId != null) return false;
            if (this.performanceInsightsRetentionPeriod != null ? !this.performanceInsightsRetentionPeriod.equals(that.performanceInsightsRetentionPeriod) : that.performanceInsightsRetentionPeriod != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.preferredBackupWindow != null ? !this.preferredBackupWindow.equals(that.preferredBackupWindow) : that.preferredBackupWindow != null) return false;
            if (this.preferredMaintenanceWindow != null ? !this.preferredMaintenanceWindow.equals(that.preferredMaintenanceWindow) : that.preferredMaintenanceWindow != null) return false;
            if (this.replicationSourceIdentifier != null ? !this.replicationSourceIdentifier.equals(that.replicationSourceIdentifier) : that.replicationSourceIdentifier != null) return false;
            if (this.restoreToPointInTime != null ? !this.restoreToPointInTime.equals(that.restoreToPointInTime) : that.restoreToPointInTime != null) return false;
            if (this.s3Import != null ? !this.s3Import.equals(that.s3Import) : that.s3Import != null) return false;
            if (this.scalingConfiguration != null ? !this.scalingConfiguration.equals(that.scalingConfiguration) : that.scalingConfiguration != null) return false;
            if (this.serverlessv2ScalingConfiguration != null ? !this.serverlessv2ScalingConfiguration.equals(that.serverlessv2ScalingConfiguration) : that.serverlessv2ScalingConfiguration != null) return false;
            if (this.skipFinalSnapshot != null ? !this.skipFinalSnapshot.equals(that.skipFinalSnapshot) : that.skipFinalSnapshot != null) return false;
            if (this.snapshotIdentifier != null ? !this.snapshotIdentifier.equals(that.snapshotIdentifier) : that.snapshotIdentifier != null) return false;
            if (this.sourceRegion != null ? !this.sourceRegion.equals(that.sourceRegion) : that.sourceRegion != null) return false;
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
            int result = this.engine.hashCode();
            result = 31 * result + (this.allocatedStorage != null ? this.allocatedStorage.hashCode() : 0);
            result = 31 * result + (this.allowMajorVersionUpgrade != null ? this.allowMajorVersionUpgrade.hashCode() : 0);
            result = 31 * result + (this.applyImmediately != null ? this.applyImmediately.hashCode() : 0);
            result = 31 * result + (this.availabilityZones != null ? this.availabilityZones.hashCode() : 0);
            result = 31 * result + (this.backtrackWindow != null ? this.backtrackWindow.hashCode() : 0);
            result = 31 * result + (this.backupRetentionPeriod != null ? this.backupRetentionPeriod.hashCode() : 0);
            result = 31 * result + (this.caCertificateIdentifier != null ? this.caCertificateIdentifier.hashCode() : 0);
            result = 31 * result + (this.clusterIdentifier != null ? this.clusterIdentifier.hashCode() : 0);
            result = 31 * result + (this.clusterIdentifierPrefix != null ? this.clusterIdentifierPrefix.hashCode() : 0);
            result = 31 * result + (this.clusterMembers != null ? this.clusterMembers.hashCode() : 0);
            result = 31 * result + (this.clusterScalabilityType != null ? this.clusterScalabilityType.hashCode() : 0);
            result = 31 * result + (this.copyTagsToSnapshot != null ? this.copyTagsToSnapshot.hashCode() : 0);
            result = 31 * result + (this.databaseInsightsMode != null ? this.databaseInsightsMode.hashCode() : 0);
            result = 31 * result + (this.databaseName != null ? this.databaseName.hashCode() : 0);
            result = 31 * result + (this.dbClusterInstanceClass != null ? this.dbClusterInstanceClass.hashCode() : 0);
            result = 31 * result + (this.dbClusterParameterGroupName != null ? this.dbClusterParameterGroupName.hashCode() : 0);
            result = 31 * result + (this.dbInstanceParameterGroupName != null ? this.dbInstanceParameterGroupName.hashCode() : 0);
            result = 31 * result + (this.dbSubnetGroupName != null ? this.dbSubnetGroupName.hashCode() : 0);
            result = 31 * result + (this.dbSystemId != null ? this.dbSystemId.hashCode() : 0);
            result = 31 * result + (this.deleteAutomatedBackups != null ? this.deleteAutomatedBackups.hashCode() : 0);
            result = 31 * result + (this.deletionProtection != null ? this.deletionProtection.hashCode() : 0);
            result = 31 * result + (this.domain != null ? this.domain.hashCode() : 0);
            result = 31 * result + (this.domainIamRoleName != null ? this.domainIamRoleName.hashCode() : 0);
            result = 31 * result + (this.enabledCloudwatchLogsExports != null ? this.enabledCloudwatchLogsExports.hashCode() : 0);
            result = 31 * result + (this.enableGlobalWriteForwarding != null ? this.enableGlobalWriteForwarding.hashCode() : 0);
            result = 31 * result + (this.enableHttpEndpoint != null ? this.enableHttpEndpoint.hashCode() : 0);
            result = 31 * result + (this.enableLocalWriteForwarding != null ? this.enableLocalWriteForwarding.hashCode() : 0);
            result = 31 * result + (this.engineLifecycleSupport != null ? this.engineLifecycleSupport.hashCode() : 0);
            result = 31 * result + (this.engineMode != null ? this.engineMode.hashCode() : 0);
            result = 31 * result + (this.engineVersion != null ? this.engineVersion.hashCode() : 0);
            result = 31 * result + (this.finalSnapshotIdentifier != null ? this.finalSnapshotIdentifier.hashCode() : 0);
            result = 31 * result + (this.globalClusterIdentifier != null ? this.globalClusterIdentifier.hashCode() : 0);
            result = 31 * result + (this.iamDatabaseAuthenticationEnabled != null ? this.iamDatabaseAuthenticationEnabled.hashCode() : 0);
            result = 31 * result + (this.iamRoles != null ? this.iamRoles.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.iops != null ? this.iops.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.manageMasterUserPassword != null ? this.manageMasterUserPassword.hashCode() : 0);
            result = 31 * result + (this.masterPassword != null ? this.masterPassword.hashCode() : 0);
            result = 31 * result + (this.masterPasswordWo != null ? this.masterPasswordWo.hashCode() : 0);
            result = 31 * result + (this.masterPasswordWoVersion != null ? this.masterPasswordWoVersion.hashCode() : 0);
            result = 31 * result + (this.masterUsername != null ? this.masterUsername.hashCode() : 0);
            result = 31 * result + (this.masterUserSecretKmsKeyId != null ? this.masterUserSecretKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.monitoringInterval != null ? this.monitoringInterval.hashCode() : 0);
            result = 31 * result + (this.monitoringRoleArn != null ? this.monitoringRoleArn.hashCode() : 0);
            result = 31 * result + (this.networkType != null ? this.networkType.hashCode() : 0);
            result = 31 * result + (this.performanceInsightsEnabled != null ? this.performanceInsightsEnabled.hashCode() : 0);
            result = 31 * result + (this.performanceInsightsKmsKeyId != null ? this.performanceInsightsKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.performanceInsightsRetentionPeriod != null ? this.performanceInsightsRetentionPeriod.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.preferredBackupWindow != null ? this.preferredBackupWindow.hashCode() : 0);
            result = 31 * result + (this.preferredMaintenanceWindow != null ? this.preferredMaintenanceWindow.hashCode() : 0);
            result = 31 * result + (this.replicationSourceIdentifier != null ? this.replicationSourceIdentifier.hashCode() : 0);
            result = 31 * result + (this.restoreToPointInTime != null ? this.restoreToPointInTime.hashCode() : 0);
            result = 31 * result + (this.s3Import != null ? this.s3Import.hashCode() : 0);
            result = 31 * result + (this.scalingConfiguration != null ? this.scalingConfiguration.hashCode() : 0);
            result = 31 * result + (this.serverlessv2ScalingConfiguration != null ? this.serverlessv2ScalingConfiguration.hashCode() : 0);
            result = 31 * result + (this.skipFinalSnapshot != null ? this.skipFinalSnapshot.hashCode() : 0);
            result = 31 * result + (this.snapshotIdentifier != null ? this.snapshotIdentifier.hashCode() : 0);
            result = 31 * result + (this.sourceRegion != null ? this.sourceRegion.hashCode() : 0);
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
