package imports.aws.rds_cluster;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster aws_rds_cluster}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.134Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rdsCluster.RdsCluster")
public class RdsCluster extends com.hashicorp.cdktf.TerraformResource {

    protected RdsCluster(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RdsCluster(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.rds_cluster.RdsCluster.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster aws_rds_cluster} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public RdsCluster(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.rds_cluster.RdsClusterConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a RdsCluster resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RdsCluster to import. This parameter is required.
     * @param importFromId The id of the existing RdsCluster that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the RdsCluster to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.rds_cluster.RdsCluster.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a RdsCluster resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RdsCluster to import. This parameter is required.
     * @param importFromId The id of the existing RdsCluster that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.rds_cluster.RdsCluster.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putRestoreToPointInTime(final @org.jetbrains.annotations.NotNull imports.aws.rds_cluster.RdsClusterRestoreToPointInTime value) {
        software.amazon.jsii.Kernel.call(this, "putRestoreToPointInTime", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Import(final @org.jetbrains.annotations.NotNull imports.aws.rds_cluster.RdsClusterS3Import value) {
        software.amazon.jsii.Kernel.call(this, "putS3Import", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScalingConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.rds_cluster.RdsClusterScalingConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putScalingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putServerlessv2ScalingConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.rds_cluster.RdsClusterServerlessv2ScalingConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putServerlessv2ScalingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.rds_cluster.RdsClusterTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllocatedStorage() {
        software.amazon.jsii.Kernel.call(this, "resetAllocatedStorage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllowMajorVersionUpgrade() {
        software.amazon.jsii.Kernel.call(this, "resetAllowMajorVersionUpgrade", software.amazon.jsii.NativeType.VOID);
    }

    public void resetApplyImmediately() {
        software.amazon.jsii.Kernel.call(this, "resetApplyImmediately", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAvailabilityZones() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZones", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBacktrackWindow() {
        software.amazon.jsii.Kernel.call(this, "resetBacktrackWindow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBackupRetentionPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetBackupRetentionPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCaCertificateIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetCaCertificateIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetClusterIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterIdentifierPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetClusterIdentifierPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterMembers() {
        software.amazon.jsii.Kernel.call(this, "resetClusterMembers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterScalabilityType() {
        software.amazon.jsii.Kernel.call(this, "resetClusterScalabilityType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCopyTagsToSnapshot() {
        software.amazon.jsii.Kernel.call(this, "resetCopyTagsToSnapshot", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatabaseInsightsMode() {
        software.amazon.jsii.Kernel.call(this, "resetDatabaseInsightsMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatabaseName() {
        software.amazon.jsii.Kernel.call(this, "resetDatabaseName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDbClusterInstanceClass() {
        software.amazon.jsii.Kernel.call(this, "resetDbClusterInstanceClass", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDbClusterParameterGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetDbClusterParameterGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDbInstanceParameterGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetDbInstanceParameterGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDbSubnetGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetDbSubnetGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDbSystemId() {
        software.amazon.jsii.Kernel.call(this, "resetDbSystemId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeleteAutomatedBackups() {
        software.amazon.jsii.Kernel.call(this, "resetDeleteAutomatedBackups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeletionProtection() {
        software.amazon.jsii.Kernel.call(this, "resetDeletionProtection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDomain() {
        software.amazon.jsii.Kernel.call(this, "resetDomain", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDomainIamRoleName() {
        software.amazon.jsii.Kernel.call(this, "resetDomainIamRoleName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnabledCloudwatchLogsExports() {
        software.amazon.jsii.Kernel.call(this, "resetEnabledCloudwatchLogsExports", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableGlobalWriteForwarding() {
        software.amazon.jsii.Kernel.call(this, "resetEnableGlobalWriteForwarding", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableHttpEndpoint() {
        software.amazon.jsii.Kernel.call(this, "resetEnableHttpEndpoint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableLocalWriteForwarding() {
        software.amazon.jsii.Kernel.call(this, "resetEnableLocalWriteForwarding", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEngineLifecycleSupport() {
        software.amazon.jsii.Kernel.call(this, "resetEngineLifecycleSupport", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEngineMode() {
        software.amazon.jsii.Kernel.call(this, "resetEngineMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEngineVersion() {
        software.amazon.jsii.Kernel.call(this, "resetEngineVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFinalSnapshotIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetFinalSnapshotIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGlobalClusterIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetGlobalClusterIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIamDatabaseAuthenticationEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetIamDatabaseAuthenticationEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIamRoles() {
        software.amazon.jsii.Kernel.call(this, "resetIamRoles", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIops() {
        software.amazon.jsii.Kernel.call(this, "resetIops", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManageMasterUserPassword() {
        software.amazon.jsii.Kernel.call(this, "resetManageMasterUserPassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterPassword() {
        software.amazon.jsii.Kernel.call(this, "resetMasterPassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterPasswordWo() {
        software.amazon.jsii.Kernel.call(this, "resetMasterPasswordWo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterPasswordWoVersion() {
        software.amazon.jsii.Kernel.call(this, "resetMasterPasswordWoVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterUsername() {
        software.amazon.jsii.Kernel.call(this, "resetMasterUsername", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterUserSecretKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetMasterUserSecretKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMonitoringInterval() {
        software.amazon.jsii.Kernel.call(this, "resetMonitoringInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMonitoringRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetMonitoringRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkType() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPerformanceInsightsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetPerformanceInsightsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPerformanceInsightsKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetPerformanceInsightsKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPerformanceInsightsRetentionPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetPerformanceInsightsRetentionPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPort() {
        software.amazon.jsii.Kernel.call(this, "resetPort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredBackupWindow() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredBackupWindow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredMaintenanceWindow() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredMaintenanceWindow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplicationSourceIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetReplicationSourceIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRestoreToPointInTime() {
        software.amazon.jsii.Kernel.call(this, "resetRestoreToPointInTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Import() {
        software.amazon.jsii.Kernel.call(this, "resetS3Import", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScalingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetScalingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServerlessv2ScalingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetServerlessv2ScalingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkipFinalSnapshot() {
        software.amazon.jsii.Kernel.call(this, "resetSkipFinalSnapshot", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceRegion() {
        software.amazon.jsii.Kernel.call(this, "resetSourceRegion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStorageEncrypted() {
        software.amazon.jsii.Kernel.call(this, "resetStorageEncrypted", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStorageType() {
        software.amazon.jsii.Kernel.call(this, "resetStorageType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetVpcSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCaCertificateValidTill() {
        return software.amazon.jsii.Kernel.get(this, "caCertificateValidTill", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterResourceId() {
        return software.amazon.jsii.Kernel.get(this, "clusterResourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineVersionActual() {
        return software.amazon.jsii.Kernel.get(this, "engineVersionActual", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostedZoneId() {
        return software.amazon.jsii.Kernel.get(this, "hostedZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rds_cluster.RdsClusterMasterUserSecretList getMasterUserSecret() {
        return software.amazon.jsii.Kernel.get(this, "masterUserSecret", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterMasterUserSecretList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReaderEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "readerEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rds_cluster.RdsClusterRestoreToPointInTimeOutputReference getRestoreToPointInTime() {
        return software.amazon.jsii.Kernel.get(this, "restoreToPointInTime", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterRestoreToPointInTimeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rds_cluster.RdsClusterS3ImportOutputReference getS3Import() {
        return software.amazon.jsii.Kernel.get(this, "s3Import", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterS3ImportOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rds_cluster.RdsClusterScalingConfigurationOutputReference getScalingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "scalingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterScalingConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rds_cluster.RdsClusterServerlessv2ScalingConfigurationOutputReference getServerlessv2ScalingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "serverlessv2ScalingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterServerlessv2ScalingConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rds_cluster.RdsClusterTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAllocatedStorageInput() {
        return software.amazon.jsii.Kernel.get(this, "allocatedStorageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowMajorVersionUpgradeInput() {
        return software.amazon.jsii.Kernel.get(this, "allowMajorVersionUpgradeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediatelyInput() {
        return software.amazon.jsii.Kernel.get(this, "applyImmediatelyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAvailabilityZonesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "availabilityZonesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBacktrackWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "backtrackWindowInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBackupRetentionPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "backupRetentionPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCaCertificateIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "caCertificateIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterIdentifierPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterIdentifierPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getClusterMembersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "clusterMembersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterScalabilityTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterScalabilityTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToSnapshotInput() {
        return software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshotInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatabaseInsightsModeInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseInsightsModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatabaseNameInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDbClusterInstanceClassInput() {
        return software.amazon.jsii.Kernel.get(this, "dbClusterInstanceClassInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDbClusterParameterGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "dbClusterParameterGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDbInstanceParameterGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "dbInstanceParameterGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDbSubnetGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "dbSubnetGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDbSystemIdInput() {
        return software.amazon.jsii.Kernel.get(this, "dbSystemIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeleteAutomatedBackupsInput() {
        return software.amazon.jsii.Kernel.get(this, "deleteAutomatedBackupsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeletionProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "deletionProtectionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainIamRoleNameInput() {
        return software.amazon.jsii.Kernel.get(this, "domainIamRoleNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "domainInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledCloudwatchLogsExportsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "enabledCloudwatchLogsExportsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableGlobalWriteForwardingInput() {
        return software.amazon.jsii.Kernel.get(this, "enableGlobalWriteForwardingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableHttpEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "enableHttpEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableLocalWriteForwardingInput() {
        return software.amazon.jsii.Kernel.get(this, "enableLocalWriteForwardingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineInput() {
        return software.amazon.jsii.Kernel.get(this, "engineInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineLifecycleSupportInput() {
        return software.amazon.jsii.Kernel.get(this, "engineLifecycleSupportInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineModeInput() {
        return software.amazon.jsii.Kernel.get(this, "engineModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "engineVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFinalSnapshotIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "finalSnapshotIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGlobalClusterIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "globalClusterIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIamDatabaseAuthenticationEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "iamDatabaseAuthenticationEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIamRolesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "iamRolesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIopsInput() {
        return software.amazon.jsii.Kernel.get(this, "iopsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getManageMasterUserPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "manageMasterUserPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterPasswordWoInput() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordWoInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMasterPasswordWoVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordWoVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterUsernameInput() {
        return software.amazon.jsii.Kernel.get(this, "masterUsernameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterUserSecretKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "masterUserSecretKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMonitoringIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "monitoringIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMonitoringRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "monitoringRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNetworkTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "networkTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPerformanceInsightsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "performanceInsightsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPerformanceInsightsKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "performanceInsightsKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPerformanceInsightsRetentionPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "performanceInsightsRetentionPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPortInput() {
        return software.amazon.jsii.Kernel.get(this, "portInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreferredBackupWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "preferredBackupWindowInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreferredMaintenanceWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "preferredMaintenanceWindowInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplicationSourceIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationSourceIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.rds_cluster.RdsClusterRestoreToPointInTime getRestoreToPointInTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "restoreToPointInTimeInput", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterRestoreToPointInTime.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.rds_cluster.RdsClusterS3Import getS3ImportInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ImportInput", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterS3Import.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.rds_cluster.RdsClusterScalingConfiguration getScalingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "scalingConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterScalingConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.rds_cluster.RdsClusterServerlessv2ScalingConfiguration getServerlessv2ScalingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "serverlessv2ScalingConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster.RdsClusterServerlessv2ScalingConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalSnapshotInput() {
        return software.amazon.jsii.Kernel.get(this, "skipFinalSnapshotInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnapshotIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceRegionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStorageEncryptedInput() {
        return software.amazon.jsii.Kernel.get(this, "storageEncryptedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStorageTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "storageTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAllocatedStorage() {
        return software.amazon.jsii.Kernel.get(this, "allocatedStorage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAllocatedStorage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "allocatedStorage", java.util.Objects.requireNonNull(value, "allocatedStorage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowMajorVersionUpgrade() {
        return software.amazon.jsii.Kernel.get(this, "allowMajorVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowMajorVersionUpgrade(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowMajorVersionUpgrade", java.util.Objects.requireNonNull(value, "allowMajorVersionUpgrade is required"));
    }

    public void setAllowMajorVersionUpgrade(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowMajorVersionUpgrade", java.util.Objects.requireNonNull(value, "allowMajorVersionUpgrade is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getApplyImmediately() {
        return software.amazon.jsii.Kernel.get(this, "applyImmediately", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setApplyImmediately(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "applyImmediately", java.util.Objects.requireNonNull(value, "applyImmediately is required"));
    }

    public void setApplyImmediately(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "applyImmediately", java.util.Objects.requireNonNull(value, "applyImmediately is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAvailabilityZones() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "availabilityZones", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAvailabilityZones(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZones", java.util.Objects.requireNonNull(value, "availabilityZones is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBacktrackWindow() {
        return software.amazon.jsii.Kernel.get(this, "backtrackWindow", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBacktrackWindow(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "backtrackWindow", java.util.Objects.requireNonNull(value, "backtrackWindow is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBackupRetentionPeriod() {
        return software.amazon.jsii.Kernel.get(this, "backupRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBackupRetentionPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "backupRetentionPeriod", java.util.Objects.requireNonNull(value, "backupRetentionPeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCaCertificateIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "caCertificateIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCaCertificateIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "caCertificateIdentifier", java.util.Objects.requireNonNull(value, "caCertificateIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "clusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterIdentifier", java.util.Objects.requireNonNull(value, "clusterIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterIdentifierPrefix() {
        return software.amazon.jsii.Kernel.get(this, "clusterIdentifierPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterIdentifierPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterIdentifierPrefix", java.util.Objects.requireNonNull(value, "clusterIdentifierPrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getClusterMembers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "clusterMembers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setClusterMembers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "clusterMembers", java.util.Objects.requireNonNull(value, "clusterMembers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterScalabilityType() {
        return software.amazon.jsii.Kernel.get(this, "clusterScalabilityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterScalabilityType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterScalabilityType", java.util.Objects.requireNonNull(value, "clusterScalabilityType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCopyTagsToSnapshot() {
        return software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCopyTagsToSnapshot(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "copyTagsToSnapshot", java.util.Objects.requireNonNull(value, "copyTagsToSnapshot is required"));
    }

    public void setCopyTagsToSnapshot(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "copyTagsToSnapshot", java.util.Objects.requireNonNull(value, "copyTagsToSnapshot is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabaseInsightsMode() {
        return software.amazon.jsii.Kernel.get(this, "databaseInsightsMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatabaseInsightsMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "databaseInsightsMode", java.util.Objects.requireNonNull(value, "databaseInsightsMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName() {
        return software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatabaseName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "databaseName", java.util.Objects.requireNonNull(value, "databaseName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDbClusterInstanceClass() {
        return software.amazon.jsii.Kernel.get(this, "dbClusterInstanceClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDbClusterInstanceClass(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dbClusterInstanceClass", java.util.Objects.requireNonNull(value, "dbClusterInstanceClass is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDbClusterParameterGroupName() {
        return software.amazon.jsii.Kernel.get(this, "dbClusterParameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDbClusterParameterGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dbClusterParameterGroupName", java.util.Objects.requireNonNull(value, "dbClusterParameterGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDbInstanceParameterGroupName() {
        return software.amazon.jsii.Kernel.get(this, "dbInstanceParameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDbInstanceParameterGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dbInstanceParameterGroupName", java.util.Objects.requireNonNull(value, "dbInstanceParameterGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDbSubnetGroupName() {
        return software.amazon.jsii.Kernel.get(this, "dbSubnetGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDbSubnetGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dbSubnetGroupName", java.util.Objects.requireNonNull(value, "dbSubnetGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDbSystemId() {
        return software.amazon.jsii.Kernel.get(this, "dbSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDbSystemId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dbSystemId", java.util.Objects.requireNonNull(value, "dbSystemId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeleteAutomatedBackups() {
        return software.amazon.jsii.Kernel.get(this, "deleteAutomatedBackups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeleteAutomatedBackups(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deleteAutomatedBackups", java.util.Objects.requireNonNull(value, "deleteAutomatedBackups is required"));
    }

    public void setDeleteAutomatedBackups(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deleteAutomatedBackups", java.util.Objects.requireNonNull(value, "deleteAutomatedBackups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeletionProtection() {
        return software.amazon.jsii.Kernel.get(this, "deletionProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeletionProtection(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deletionProtection", java.util.Objects.requireNonNull(value, "deletionProtection is required"));
    }

    public void setDeletionProtection(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deletionProtection", java.util.Objects.requireNonNull(value, "deletionProtection is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomain() {
        return software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomain(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domain", java.util.Objects.requireNonNull(value, "domain is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainIamRoleName() {
        return software.amazon.jsii.Kernel.get(this, "domainIamRoleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainIamRoleName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainIamRoleName", java.util.Objects.requireNonNull(value, "domainIamRoleName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEnabledCloudwatchLogsExports() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "enabledCloudwatchLogsExports", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEnabledCloudwatchLogsExports(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "enabledCloudwatchLogsExports", java.util.Objects.requireNonNull(value, "enabledCloudwatchLogsExports is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableGlobalWriteForwarding() {
        return software.amazon.jsii.Kernel.get(this, "enableGlobalWriteForwarding", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableGlobalWriteForwarding(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableGlobalWriteForwarding", java.util.Objects.requireNonNull(value, "enableGlobalWriteForwarding is required"));
    }

    public void setEnableGlobalWriteForwarding(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableGlobalWriteForwarding", java.util.Objects.requireNonNull(value, "enableGlobalWriteForwarding is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableHttpEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "enableHttpEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableHttpEndpoint(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableHttpEndpoint", java.util.Objects.requireNonNull(value, "enableHttpEndpoint is required"));
    }

    public void setEnableHttpEndpoint(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableHttpEndpoint", java.util.Objects.requireNonNull(value, "enableHttpEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableLocalWriteForwarding() {
        return software.amazon.jsii.Kernel.get(this, "enableLocalWriteForwarding", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableLocalWriteForwarding(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableLocalWriteForwarding", java.util.Objects.requireNonNull(value, "enableLocalWriteForwarding is required"));
    }

    public void setEnableLocalWriteForwarding(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableLocalWriteForwarding", java.util.Objects.requireNonNull(value, "enableLocalWriteForwarding is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngine() {
        return software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngine(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engine", java.util.Objects.requireNonNull(value, "engine is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineLifecycleSupport() {
        return software.amazon.jsii.Kernel.get(this, "engineLifecycleSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngineLifecycleSupport(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engineLifecycleSupport", java.util.Objects.requireNonNull(value, "engineLifecycleSupport is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineMode() {
        return software.amazon.jsii.Kernel.get(this, "engineMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngineMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engineMode", java.util.Objects.requireNonNull(value, "engineMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineVersion() {
        return software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngineVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engineVersion", java.util.Objects.requireNonNull(value, "engineVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFinalSnapshotIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "finalSnapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFinalSnapshotIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "finalSnapshotIdentifier", java.util.Objects.requireNonNull(value, "finalSnapshotIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGlobalClusterIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "globalClusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGlobalClusterIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "globalClusterIdentifier", java.util.Objects.requireNonNull(value, "globalClusterIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIamDatabaseAuthenticationEnabled() {
        return software.amazon.jsii.Kernel.get(this, "iamDatabaseAuthenticationEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIamDatabaseAuthenticationEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "iamDatabaseAuthenticationEnabled", java.util.Objects.requireNonNull(value, "iamDatabaseAuthenticationEnabled is required"));
    }

    public void setIamDatabaseAuthenticationEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "iamDatabaseAuthenticationEnabled", java.util.Objects.requireNonNull(value, "iamDatabaseAuthenticationEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIamRoles() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "iamRoles", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIamRoles(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "iamRoles", java.util.Objects.requireNonNull(value, "iamRoles is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIops() {
        return software.amazon.jsii.Kernel.get(this, "iops", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIops(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "iops", java.util.Objects.requireNonNull(value, "iops is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getManageMasterUserPassword() {
        return software.amazon.jsii.Kernel.get(this, "manageMasterUserPassword", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setManageMasterUserPassword(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "manageMasterUserPassword", java.util.Objects.requireNonNull(value, "manageMasterUserPassword is required"));
    }

    public void setManageMasterUserPassword(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "manageMasterUserPassword", java.util.Objects.requireNonNull(value, "manageMasterUserPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterPassword() {
        return software.amazon.jsii.Kernel.get(this, "masterPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterPassword", java.util.Objects.requireNonNull(value, "masterPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterPasswordWo() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordWo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterPasswordWo(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterPasswordWo", java.util.Objects.requireNonNull(value, "masterPasswordWo is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMasterPasswordWoVersion() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordWoVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMasterPasswordWoVersion(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "masterPasswordWoVersion", java.util.Objects.requireNonNull(value, "masterPasswordWoVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterUsername() {
        return software.amazon.jsii.Kernel.get(this, "masterUsername", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterUsername(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterUsername", java.util.Objects.requireNonNull(value, "masterUsername is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterUserSecretKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "masterUserSecretKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterUserSecretKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterUserSecretKmsKeyId", java.util.Objects.requireNonNull(value, "masterUserSecretKmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMonitoringInterval() {
        return software.amazon.jsii.Kernel.get(this, "monitoringInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMonitoringInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "monitoringInterval", java.util.Objects.requireNonNull(value, "monitoringInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMonitoringRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "monitoringRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMonitoringRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "monitoringRoleArn", java.util.Objects.requireNonNull(value, "monitoringRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkType() {
        return software.amazon.jsii.Kernel.get(this, "networkType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNetworkType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "networkType", java.util.Objects.requireNonNull(value, "networkType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPerformanceInsightsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "performanceInsightsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPerformanceInsightsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "performanceInsightsEnabled", java.util.Objects.requireNonNull(value, "performanceInsightsEnabled is required"));
    }

    public void setPerformanceInsightsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "performanceInsightsEnabled", java.util.Objects.requireNonNull(value, "performanceInsightsEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPerformanceInsightsKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "performanceInsightsKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPerformanceInsightsKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "performanceInsightsKmsKeyId", java.util.Objects.requireNonNull(value, "performanceInsightsKmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPerformanceInsightsRetentionPeriod() {
        return software.amazon.jsii.Kernel.get(this, "performanceInsightsRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPerformanceInsightsRetentionPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "performanceInsightsRetentionPeriod", java.util.Objects.requireNonNull(value, "performanceInsightsRetentionPeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPort() {
        return software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "port", java.util.Objects.requireNonNull(value, "port is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreferredBackupWindow() {
        return software.amazon.jsii.Kernel.get(this, "preferredBackupWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreferredBackupWindow(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preferredBackupWindow", java.util.Objects.requireNonNull(value, "preferredBackupWindow is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreferredMaintenanceWindow() {
        return software.amazon.jsii.Kernel.get(this, "preferredMaintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreferredMaintenanceWindow(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preferredMaintenanceWindow", java.util.Objects.requireNonNull(value, "preferredMaintenanceWindow is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplicationSourceIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "replicationSourceIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplicationSourceIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replicationSourceIdentifier", java.util.Objects.requireNonNull(value, "replicationSourceIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSkipFinalSnapshot() {
        return software.amazon.jsii.Kernel.get(this, "skipFinalSnapshot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSkipFinalSnapshot(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "skipFinalSnapshot", java.util.Objects.requireNonNull(value, "skipFinalSnapshot is required"));
    }

    public void setSkipFinalSnapshot(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "skipFinalSnapshot", java.util.Objects.requireNonNull(value, "skipFinalSnapshot is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnapshotIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "snapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnapshotIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snapshotIdentifier", java.util.Objects.requireNonNull(value, "snapshotIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceRegion() {
        return software.amazon.jsii.Kernel.get(this, "sourceRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceRegion", java.util.Objects.requireNonNull(value, "sourceRegion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getStorageEncrypted() {
        return software.amazon.jsii.Kernel.get(this, "storageEncrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setStorageEncrypted(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "storageEncrypted", java.util.Objects.requireNonNull(value, "storageEncrypted is required"));
    }

    public void setStorageEncrypted(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "storageEncrypted", java.util.Objects.requireNonNull(value, "storageEncrypted is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStorageType() {
        return software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStorageType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "storageType", java.util.Objects.requireNonNull(value, "storageType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getVpcSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVpcSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "vpcSecurityGroupIds", java.util.Objects.requireNonNull(value, "vpcSecurityGroupIds is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.rds_cluster.RdsCluster}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.rds_cluster.RdsCluster> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.rds_cluster.RdsClusterConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.rds_cluster.RdsClusterConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine RdsCluster#engine}.
         * <p>
         * @return {@code this}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine RdsCluster#engine}. This parameter is required.
         */
        public Builder engine(final java.lang.String engine) {
            this.config.engine(engine);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#allocated_storage RdsCluster#allocated_storage}.
         * <p>
         * @return {@code this}
         * @param allocatedStorage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#allocated_storage RdsCluster#allocated_storage}. This parameter is required.
         */
        public Builder allocatedStorage(final java.lang.Number allocatedStorage) {
            this.config.allocatedStorage(allocatedStorage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#allow_major_version_upgrade RdsCluster#allow_major_version_upgrade}.
         * <p>
         * @return {@code this}
         * @param allowMajorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#allow_major_version_upgrade RdsCluster#allow_major_version_upgrade}. This parameter is required.
         */
        public Builder allowMajorVersionUpgrade(final java.lang.Boolean allowMajorVersionUpgrade) {
            this.config.allowMajorVersionUpgrade(allowMajorVersionUpgrade);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#allow_major_version_upgrade RdsCluster#allow_major_version_upgrade}.
         * <p>
         * @return {@code this}
         * @param allowMajorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#allow_major_version_upgrade RdsCluster#allow_major_version_upgrade}. This parameter is required.
         */
        public Builder allowMajorVersionUpgrade(final com.hashicorp.cdktf.IResolvable allowMajorVersionUpgrade) {
            this.config.allowMajorVersionUpgrade(allowMajorVersionUpgrade);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#apply_immediately RdsCluster#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#apply_immediately RdsCluster#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final java.lang.Boolean applyImmediately) {
            this.config.applyImmediately(applyImmediately);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#apply_immediately RdsCluster#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#apply_immediately RdsCluster#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.config.applyImmediately(applyImmediately);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#availability_zones RdsCluster#availability_zones}.
         * <p>
         * @return {@code this}
         * @param availabilityZones Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#availability_zones RdsCluster#availability_zones}. This parameter is required.
         */
        public Builder availabilityZones(final java.util.List<java.lang.String> availabilityZones) {
            this.config.availabilityZones(availabilityZones);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#backtrack_window RdsCluster#backtrack_window}.
         * <p>
         * @return {@code this}
         * @param backtrackWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#backtrack_window RdsCluster#backtrack_window}. This parameter is required.
         */
        public Builder backtrackWindow(final java.lang.Number backtrackWindow) {
            this.config.backtrackWindow(backtrackWindow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#backup_retention_period RdsCluster#backup_retention_period}.
         * <p>
         * @return {@code this}
         * @param backupRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#backup_retention_period RdsCluster#backup_retention_period}. This parameter is required.
         */
        public Builder backupRetentionPeriod(final java.lang.Number backupRetentionPeriod) {
            this.config.backupRetentionPeriod(backupRetentionPeriod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#ca_certificate_identifier RdsCluster#ca_certificate_identifier}.
         * <p>
         * @return {@code this}
         * @param caCertificateIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#ca_certificate_identifier RdsCluster#ca_certificate_identifier}. This parameter is required.
         */
        public Builder caCertificateIdentifier(final java.lang.String caCertificateIdentifier) {
            this.config.caCertificateIdentifier(caCertificateIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_identifier RdsCluster#cluster_identifier}.
         * <p>
         * @return {@code this}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_identifier RdsCluster#cluster_identifier}. This parameter is required.
         */
        public Builder clusterIdentifier(final java.lang.String clusterIdentifier) {
            this.config.clusterIdentifier(clusterIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_identifier_prefix RdsCluster#cluster_identifier_prefix}.
         * <p>
         * @return {@code this}
         * @param clusterIdentifierPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_identifier_prefix RdsCluster#cluster_identifier_prefix}. This parameter is required.
         */
        public Builder clusterIdentifierPrefix(final java.lang.String clusterIdentifierPrefix) {
            this.config.clusterIdentifierPrefix(clusterIdentifierPrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_members RdsCluster#cluster_members}.
         * <p>
         * @return {@code this}
         * @param clusterMembers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_members RdsCluster#cluster_members}. This parameter is required.
         */
        public Builder clusterMembers(final java.util.List<java.lang.String> clusterMembers) {
            this.config.clusterMembers(clusterMembers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_scalability_type RdsCluster#cluster_scalability_type}.
         * <p>
         * @return {@code this}
         * @param clusterScalabilityType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#cluster_scalability_type RdsCluster#cluster_scalability_type}. This parameter is required.
         */
        public Builder clusterScalabilityType(final java.lang.String clusterScalabilityType) {
            this.config.clusterScalabilityType(clusterScalabilityType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#copy_tags_to_snapshot RdsCluster#copy_tags_to_snapshot}.
         * <p>
         * @return {@code this}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#copy_tags_to_snapshot RdsCluster#copy_tags_to_snapshot}. This parameter is required.
         */
        public Builder copyTagsToSnapshot(final java.lang.Boolean copyTagsToSnapshot) {
            this.config.copyTagsToSnapshot(copyTagsToSnapshot);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#copy_tags_to_snapshot RdsCluster#copy_tags_to_snapshot}.
         * <p>
         * @return {@code this}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#copy_tags_to_snapshot RdsCluster#copy_tags_to_snapshot}. This parameter is required.
         */
        public Builder copyTagsToSnapshot(final com.hashicorp.cdktf.IResolvable copyTagsToSnapshot) {
            this.config.copyTagsToSnapshot(copyTagsToSnapshot);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#database_insights_mode RdsCluster#database_insights_mode}.
         * <p>
         * @return {@code this}
         * @param databaseInsightsMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#database_insights_mode RdsCluster#database_insights_mode}. This parameter is required.
         */
        public Builder databaseInsightsMode(final java.lang.String databaseInsightsMode) {
            this.config.databaseInsightsMode(databaseInsightsMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#database_name RdsCluster#database_name}.
         * <p>
         * @return {@code this}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#database_name RdsCluster#database_name}. This parameter is required.
         */
        public Builder databaseName(final java.lang.String databaseName) {
            this.config.databaseName(databaseName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_cluster_instance_class RdsCluster#db_cluster_instance_class}.
         * <p>
         * @return {@code this}
         * @param dbClusterInstanceClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_cluster_instance_class RdsCluster#db_cluster_instance_class}. This parameter is required.
         */
        public Builder dbClusterInstanceClass(final java.lang.String dbClusterInstanceClass) {
            this.config.dbClusterInstanceClass(dbClusterInstanceClass);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_cluster_parameter_group_name RdsCluster#db_cluster_parameter_group_name}.
         * <p>
         * @return {@code this}
         * @param dbClusterParameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_cluster_parameter_group_name RdsCluster#db_cluster_parameter_group_name}. This parameter is required.
         */
        public Builder dbClusterParameterGroupName(final java.lang.String dbClusterParameterGroupName) {
            this.config.dbClusterParameterGroupName(dbClusterParameterGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_instance_parameter_group_name RdsCluster#db_instance_parameter_group_name}.
         * <p>
         * @return {@code this}
         * @param dbInstanceParameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_instance_parameter_group_name RdsCluster#db_instance_parameter_group_name}. This parameter is required.
         */
        public Builder dbInstanceParameterGroupName(final java.lang.String dbInstanceParameterGroupName) {
            this.config.dbInstanceParameterGroupName(dbInstanceParameterGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_subnet_group_name RdsCluster#db_subnet_group_name}.
         * <p>
         * @return {@code this}
         * @param dbSubnetGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_subnet_group_name RdsCluster#db_subnet_group_name}. This parameter is required.
         */
        public Builder dbSubnetGroupName(final java.lang.String dbSubnetGroupName) {
            this.config.dbSubnetGroupName(dbSubnetGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_system_id RdsCluster#db_system_id}.
         * <p>
         * @return {@code this}
         * @param dbSystemId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#db_system_id RdsCluster#db_system_id}. This parameter is required.
         */
        public Builder dbSystemId(final java.lang.String dbSystemId) {
            this.config.dbSystemId(dbSystemId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#delete_automated_backups RdsCluster#delete_automated_backups}.
         * <p>
         * @return {@code this}
         * @param deleteAutomatedBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#delete_automated_backups RdsCluster#delete_automated_backups}. This parameter is required.
         */
        public Builder deleteAutomatedBackups(final java.lang.Boolean deleteAutomatedBackups) {
            this.config.deleteAutomatedBackups(deleteAutomatedBackups);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#delete_automated_backups RdsCluster#delete_automated_backups}.
         * <p>
         * @return {@code this}
         * @param deleteAutomatedBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#delete_automated_backups RdsCluster#delete_automated_backups}. This parameter is required.
         */
        public Builder deleteAutomatedBackups(final com.hashicorp.cdktf.IResolvable deleteAutomatedBackups) {
            this.config.deleteAutomatedBackups(deleteAutomatedBackups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#deletion_protection RdsCluster#deletion_protection}.
         * <p>
         * @return {@code this}
         * @param deletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#deletion_protection RdsCluster#deletion_protection}. This parameter is required.
         */
        public Builder deletionProtection(final java.lang.Boolean deletionProtection) {
            this.config.deletionProtection(deletionProtection);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#deletion_protection RdsCluster#deletion_protection}.
         * <p>
         * @return {@code this}
         * @param deletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#deletion_protection RdsCluster#deletion_protection}. This parameter is required.
         */
        public Builder deletionProtection(final com.hashicorp.cdktf.IResolvable deletionProtection) {
            this.config.deletionProtection(deletionProtection);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#domain RdsCluster#domain}.
         * <p>
         * @return {@code this}
         * @param domain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#domain RdsCluster#domain}. This parameter is required.
         */
        public Builder domain(final java.lang.String domain) {
            this.config.domain(domain);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#domain_iam_role_name RdsCluster#domain_iam_role_name}.
         * <p>
         * @return {@code this}
         * @param domainIamRoleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#domain_iam_role_name RdsCluster#domain_iam_role_name}. This parameter is required.
         */
        public Builder domainIamRoleName(final java.lang.String domainIamRoleName) {
            this.config.domainIamRoleName(domainIamRoleName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enabled_cloudwatch_logs_exports RdsCluster#enabled_cloudwatch_logs_exports}.
         * <p>
         * @return {@code this}
         * @param enabledCloudwatchLogsExports Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enabled_cloudwatch_logs_exports RdsCluster#enabled_cloudwatch_logs_exports}. This parameter is required.
         */
        public Builder enabledCloudwatchLogsExports(final java.util.List<java.lang.String> enabledCloudwatchLogsExports) {
            this.config.enabledCloudwatchLogsExports(enabledCloudwatchLogsExports);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_global_write_forwarding RdsCluster#enable_global_write_forwarding}.
         * <p>
         * @return {@code this}
         * @param enableGlobalWriteForwarding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_global_write_forwarding RdsCluster#enable_global_write_forwarding}. This parameter is required.
         */
        public Builder enableGlobalWriteForwarding(final java.lang.Boolean enableGlobalWriteForwarding) {
            this.config.enableGlobalWriteForwarding(enableGlobalWriteForwarding);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_global_write_forwarding RdsCluster#enable_global_write_forwarding}.
         * <p>
         * @return {@code this}
         * @param enableGlobalWriteForwarding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_global_write_forwarding RdsCluster#enable_global_write_forwarding}. This parameter is required.
         */
        public Builder enableGlobalWriteForwarding(final com.hashicorp.cdktf.IResolvable enableGlobalWriteForwarding) {
            this.config.enableGlobalWriteForwarding(enableGlobalWriteForwarding);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_http_endpoint RdsCluster#enable_http_endpoint}.
         * <p>
         * @return {@code this}
         * @param enableHttpEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_http_endpoint RdsCluster#enable_http_endpoint}. This parameter is required.
         */
        public Builder enableHttpEndpoint(final java.lang.Boolean enableHttpEndpoint) {
            this.config.enableHttpEndpoint(enableHttpEndpoint);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_http_endpoint RdsCluster#enable_http_endpoint}.
         * <p>
         * @return {@code this}
         * @param enableHttpEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_http_endpoint RdsCluster#enable_http_endpoint}. This parameter is required.
         */
        public Builder enableHttpEndpoint(final com.hashicorp.cdktf.IResolvable enableHttpEndpoint) {
            this.config.enableHttpEndpoint(enableHttpEndpoint);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_local_write_forwarding RdsCluster#enable_local_write_forwarding}.
         * <p>
         * @return {@code this}
         * @param enableLocalWriteForwarding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_local_write_forwarding RdsCluster#enable_local_write_forwarding}. This parameter is required.
         */
        public Builder enableLocalWriteForwarding(final java.lang.Boolean enableLocalWriteForwarding) {
            this.config.enableLocalWriteForwarding(enableLocalWriteForwarding);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_local_write_forwarding RdsCluster#enable_local_write_forwarding}.
         * <p>
         * @return {@code this}
         * @param enableLocalWriteForwarding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#enable_local_write_forwarding RdsCluster#enable_local_write_forwarding}. This parameter is required.
         */
        public Builder enableLocalWriteForwarding(final com.hashicorp.cdktf.IResolvable enableLocalWriteForwarding) {
            this.config.enableLocalWriteForwarding(enableLocalWriteForwarding);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine_lifecycle_support RdsCluster#engine_lifecycle_support}.
         * <p>
         * @return {@code this}
         * @param engineLifecycleSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine_lifecycle_support RdsCluster#engine_lifecycle_support}. This parameter is required.
         */
        public Builder engineLifecycleSupport(final java.lang.String engineLifecycleSupport) {
            this.config.engineLifecycleSupport(engineLifecycleSupport);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine_mode RdsCluster#engine_mode}.
         * <p>
         * @return {@code this}
         * @param engineMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine_mode RdsCluster#engine_mode}. This parameter is required.
         */
        public Builder engineMode(final java.lang.String engineMode) {
            this.config.engineMode(engineMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine_version RdsCluster#engine_version}.
         * <p>
         * @return {@code this}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#engine_version RdsCluster#engine_version}. This parameter is required.
         */
        public Builder engineVersion(final java.lang.String engineVersion) {
            this.config.engineVersion(engineVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#final_snapshot_identifier RdsCluster#final_snapshot_identifier}.
         * <p>
         * @return {@code this}
         * @param finalSnapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#final_snapshot_identifier RdsCluster#final_snapshot_identifier}. This parameter is required.
         */
        public Builder finalSnapshotIdentifier(final java.lang.String finalSnapshotIdentifier) {
            this.config.finalSnapshotIdentifier(finalSnapshotIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#global_cluster_identifier RdsCluster#global_cluster_identifier}.
         * <p>
         * @return {@code this}
         * @param globalClusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#global_cluster_identifier RdsCluster#global_cluster_identifier}. This parameter is required.
         */
        public Builder globalClusterIdentifier(final java.lang.String globalClusterIdentifier) {
            this.config.globalClusterIdentifier(globalClusterIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iam_database_authentication_enabled RdsCluster#iam_database_authentication_enabled}.
         * <p>
         * @return {@code this}
         * @param iamDatabaseAuthenticationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iam_database_authentication_enabled RdsCluster#iam_database_authentication_enabled}. This parameter is required.
         */
        public Builder iamDatabaseAuthenticationEnabled(final java.lang.Boolean iamDatabaseAuthenticationEnabled) {
            this.config.iamDatabaseAuthenticationEnabled(iamDatabaseAuthenticationEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iam_database_authentication_enabled RdsCluster#iam_database_authentication_enabled}.
         * <p>
         * @return {@code this}
         * @param iamDatabaseAuthenticationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iam_database_authentication_enabled RdsCluster#iam_database_authentication_enabled}. This parameter is required.
         */
        public Builder iamDatabaseAuthenticationEnabled(final com.hashicorp.cdktf.IResolvable iamDatabaseAuthenticationEnabled) {
            this.config.iamDatabaseAuthenticationEnabled(iamDatabaseAuthenticationEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iam_roles RdsCluster#iam_roles}.
         * <p>
         * @return {@code this}
         * @param iamRoles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iam_roles RdsCluster#iam_roles}. This parameter is required.
         */
        public Builder iamRoles(final java.util.List<java.lang.String> iamRoles) {
            this.config.iamRoles(iamRoles);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#id RdsCluster#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#id RdsCluster#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iops RdsCluster#iops}.
         * <p>
         * @return {@code this}
         * @param iops Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#iops RdsCluster#iops}. This parameter is required.
         */
        public Builder iops(final java.lang.Number iops) {
            this.config.iops(iops);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#kms_key_id RdsCluster#kms_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#kms_key_id RdsCluster#kms_key_id}. This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config.kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#manage_master_user_password RdsCluster#manage_master_user_password}.
         * <p>
         * @return {@code this}
         * @param manageMasterUserPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#manage_master_user_password RdsCluster#manage_master_user_password}. This parameter is required.
         */
        public Builder manageMasterUserPassword(final java.lang.Boolean manageMasterUserPassword) {
            this.config.manageMasterUserPassword(manageMasterUserPassword);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#manage_master_user_password RdsCluster#manage_master_user_password}.
         * <p>
         * @return {@code this}
         * @param manageMasterUserPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#manage_master_user_password RdsCluster#manage_master_user_password}. This parameter is required.
         */
        public Builder manageMasterUserPassword(final com.hashicorp.cdktf.IResolvable manageMasterUserPassword) {
            this.config.manageMasterUserPassword(manageMasterUserPassword);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_password RdsCluster#master_password}.
         * <p>
         * @return {@code this}
         * @param masterPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_password RdsCluster#master_password}. This parameter is required.
         */
        public Builder masterPassword(final java.lang.String masterPassword) {
            this.config.masterPassword(masterPassword);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_password_wo RdsCluster#master_password_wo}.
         * <p>
         * @return {@code this}
         * @param masterPasswordWo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_password_wo RdsCluster#master_password_wo}. This parameter is required.
         */
        public Builder masterPasswordWo(final java.lang.String masterPasswordWo) {
            this.config.masterPasswordWo(masterPasswordWo);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_password_wo_version RdsCluster#master_password_wo_version}.
         * <p>
         * @return {@code this}
         * @param masterPasswordWoVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_password_wo_version RdsCluster#master_password_wo_version}. This parameter is required.
         */
        public Builder masterPasswordWoVersion(final java.lang.Number masterPasswordWoVersion) {
            this.config.masterPasswordWoVersion(masterPasswordWoVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_username RdsCluster#master_username}.
         * <p>
         * @return {@code this}
         * @param masterUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_username RdsCluster#master_username}. This parameter is required.
         */
        public Builder masterUsername(final java.lang.String masterUsername) {
            this.config.masterUsername(masterUsername);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_user_secret_kms_key_id RdsCluster#master_user_secret_kms_key_id}.
         * <p>
         * @return {@code this}
         * @param masterUserSecretKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#master_user_secret_kms_key_id RdsCluster#master_user_secret_kms_key_id}. This parameter is required.
         */
        public Builder masterUserSecretKmsKeyId(final java.lang.String masterUserSecretKmsKeyId) {
            this.config.masterUserSecretKmsKeyId(masterUserSecretKmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#monitoring_interval RdsCluster#monitoring_interval}.
         * <p>
         * @return {@code this}
         * @param monitoringInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#monitoring_interval RdsCluster#monitoring_interval}. This parameter is required.
         */
        public Builder monitoringInterval(final java.lang.Number monitoringInterval) {
            this.config.monitoringInterval(monitoringInterval);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#monitoring_role_arn RdsCluster#monitoring_role_arn}.
         * <p>
         * @return {@code this}
         * @param monitoringRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#monitoring_role_arn RdsCluster#monitoring_role_arn}. This parameter is required.
         */
        public Builder monitoringRoleArn(final java.lang.String monitoringRoleArn) {
            this.config.monitoringRoleArn(monitoringRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#network_type RdsCluster#network_type}.
         * <p>
         * @return {@code this}
         * @param networkType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#network_type RdsCluster#network_type}. This parameter is required.
         */
        public Builder networkType(final java.lang.String networkType) {
            this.config.networkType(networkType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_enabled RdsCluster#performance_insights_enabled}.
         * <p>
         * @return {@code this}
         * @param performanceInsightsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_enabled RdsCluster#performance_insights_enabled}. This parameter is required.
         */
        public Builder performanceInsightsEnabled(final java.lang.Boolean performanceInsightsEnabled) {
            this.config.performanceInsightsEnabled(performanceInsightsEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_enabled RdsCluster#performance_insights_enabled}.
         * <p>
         * @return {@code this}
         * @param performanceInsightsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_enabled RdsCluster#performance_insights_enabled}. This parameter is required.
         */
        public Builder performanceInsightsEnabled(final com.hashicorp.cdktf.IResolvable performanceInsightsEnabled) {
            this.config.performanceInsightsEnabled(performanceInsightsEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_kms_key_id RdsCluster#performance_insights_kms_key_id}.
         * <p>
         * @return {@code this}
         * @param performanceInsightsKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_kms_key_id RdsCluster#performance_insights_kms_key_id}. This parameter is required.
         */
        public Builder performanceInsightsKmsKeyId(final java.lang.String performanceInsightsKmsKeyId) {
            this.config.performanceInsightsKmsKeyId(performanceInsightsKmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_retention_period RdsCluster#performance_insights_retention_period}.
         * <p>
         * @return {@code this}
         * @param performanceInsightsRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#performance_insights_retention_period RdsCluster#performance_insights_retention_period}. This parameter is required.
         */
        public Builder performanceInsightsRetentionPeriod(final java.lang.Number performanceInsightsRetentionPeriod) {
            this.config.performanceInsightsRetentionPeriod(performanceInsightsRetentionPeriod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#port RdsCluster#port}.
         * <p>
         * @return {@code this}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#port RdsCluster#port}. This parameter is required.
         */
        public Builder port(final java.lang.Number port) {
            this.config.port(port);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#preferred_backup_window RdsCluster#preferred_backup_window}.
         * <p>
         * @return {@code this}
         * @param preferredBackupWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#preferred_backup_window RdsCluster#preferred_backup_window}. This parameter is required.
         */
        public Builder preferredBackupWindow(final java.lang.String preferredBackupWindow) {
            this.config.preferredBackupWindow(preferredBackupWindow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#preferred_maintenance_window RdsCluster#preferred_maintenance_window}.
         * <p>
         * @return {@code this}
         * @param preferredMaintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#preferred_maintenance_window RdsCluster#preferred_maintenance_window}. This parameter is required.
         */
        public Builder preferredMaintenanceWindow(final java.lang.String preferredMaintenanceWindow) {
            this.config.preferredMaintenanceWindow(preferredMaintenanceWindow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#replication_source_identifier RdsCluster#replication_source_identifier}.
         * <p>
         * @return {@code this}
         * @param replicationSourceIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#replication_source_identifier RdsCluster#replication_source_identifier}. This parameter is required.
         */
        public Builder replicationSourceIdentifier(final java.lang.String replicationSourceIdentifier) {
            this.config.replicationSourceIdentifier(replicationSourceIdentifier);
            return this;
        }

        /**
         * restore_to_point_in_time block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#restore_to_point_in_time RdsCluster#restore_to_point_in_time}
         * <p>
         * @return {@code this}
         * @param restoreToPointInTime restore_to_point_in_time block. This parameter is required.
         */
        public Builder restoreToPointInTime(final imports.aws.rds_cluster.RdsClusterRestoreToPointInTime restoreToPointInTime) {
            this.config.restoreToPointInTime(restoreToPointInTime);
            return this;
        }

        /**
         * s3_import block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#s3_import RdsCluster#s3_import}
         * <p>
         * @return {@code this}
         * @param s3Import s3_import block. This parameter is required.
         */
        public Builder s3Import(final imports.aws.rds_cluster.RdsClusterS3Import s3Import) {
            this.config.s3Import(s3Import);
            return this;
        }

        /**
         * scaling_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#scaling_configuration RdsCluster#scaling_configuration}
         * <p>
         * @return {@code this}
         * @param scalingConfiguration scaling_configuration block. This parameter is required.
         */
        public Builder scalingConfiguration(final imports.aws.rds_cluster.RdsClusterScalingConfiguration scalingConfiguration) {
            this.config.scalingConfiguration(scalingConfiguration);
            return this;
        }

        /**
         * serverlessv2_scaling_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#serverlessv2_scaling_configuration RdsCluster#serverlessv2_scaling_configuration}
         * <p>
         * @return {@code this}
         * @param serverlessv2ScalingConfiguration serverlessv2_scaling_configuration block. This parameter is required.
         */
        public Builder serverlessv2ScalingConfiguration(final imports.aws.rds_cluster.RdsClusterServerlessv2ScalingConfiguration serverlessv2ScalingConfiguration) {
            this.config.serverlessv2ScalingConfiguration(serverlessv2ScalingConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#skip_final_snapshot RdsCluster#skip_final_snapshot}.
         * <p>
         * @return {@code this}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#skip_final_snapshot RdsCluster#skip_final_snapshot}. This parameter is required.
         */
        public Builder skipFinalSnapshot(final java.lang.Boolean skipFinalSnapshot) {
            this.config.skipFinalSnapshot(skipFinalSnapshot);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#skip_final_snapshot RdsCluster#skip_final_snapshot}.
         * <p>
         * @return {@code this}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#skip_final_snapshot RdsCluster#skip_final_snapshot}. This parameter is required.
         */
        public Builder skipFinalSnapshot(final com.hashicorp.cdktf.IResolvable skipFinalSnapshot) {
            this.config.skipFinalSnapshot(skipFinalSnapshot);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#snapshot_identifier RdsCluster#snapshot_identifier}.
         * <p>
         * @return {@code this}
         * @param snapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#snapshot_identifier RdsCluster#snapshot_identifier}. This parameter is required.
         */
        public Builder snapshotIdentifier(final java.lang.String snapshotIdentifier) {
            this.config.snapshotIdentifier(snapshotIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#source_region RdsCluster#source_region}.
         * <p>
         * @return {@code this}
         * @param sourceRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#source_region RdsCluster#source_region}. This parameter is required.
         */
        public Builder sourceRegion(final java.lang.String sourceRegion) {
            this.config.sourceRegion(sourceRegion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#storage_encrypted RdsCluster#storage_encrypted}.
         * <p>
         * @return {@code this}
         * @param storageEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#storage_encrypted RdsCluster#storage_encrypted}. This parameter is required.
         */
        public Builder storageEncrypted(final java.lang.Boolean storageEncrypted) {
            this.config.storageEncrypted(storageEncrypted);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#storage_encrypted RdsCluster#storage_encrypted}.
         * <p>
         * @return {@code this}
         * @param storageEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#storage_encrypted RdsCluster#storage_encrypted}. This parameter is required.
         */
        public Builder storageEncrypted(final com.hashicorp.cdktf.IResolvable storageEncrypted) {
            this.config.storageEncrypted(storageEncrypted);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#storage_type RdsCluster#storage_type}.
         * <p>
         * @return {@code this}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#storage_type RdsCluster#storage_type}. This parameter is required.
         */
        public Builder storageType(final java.lang.String storageType) {
            this.config.storageType(storageType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#tags RdsCluster#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#tags RdsCluster#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#tags_all RdsCluster#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#tags_all RdsCluster#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#timeouts RdsCluster#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.rds_cluster.RdsClusterTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#vpc_security_group_ids RdsCluster#vpc_security_group_ids}.
         * <p>
         * @return {@code this}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#vpc_security_group_ids RdsCluster#vpc_security_group_ids}. This parameter is required.
         */
        public Builder vpcSecurityGroupIds(final java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.config.vpcSecurityGroupIds(vpcSecurityGroupIds);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.rds_cluster.RdsCluster}.
         */
        @Override
        public imports.aws.rds_cluster.RdsCluster build() {
            return new imports.aws.rds_cluster.RdsCluster(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
