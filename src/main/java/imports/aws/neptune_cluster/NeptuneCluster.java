package imports.aws.neptune_cluster;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster aws_neptune_cluster}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.928Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.neptuneCluster.NeptuneCluster")
public class NeptuneCluster extends com.hashicorp.cdktf.TerraformResource {

    protected NeptuneCluster(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NeptuneCluster(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.neptune_cluster.NeptuneCluster.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster aws_neptune_cluster} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public NeptuneCluster(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.neptune_cluster.NeptuneClusterConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster aws_neptune_cluster} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public NeptuneCluster(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a NeptuneCluster resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the NeptuneCluster to import. This parameter is required.
     * @param importFromId The id of the existing NeptuneCluster that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the NeptuneCluster to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.neptune_cluster.NeptuneCluster.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a NeptuneCluster resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the NeptuneCluster to import. This parameter is required.
     * @param importFromId The id of the existing NeptuneCluster that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.neptune_cluster.NeptuneCluster.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putServerlessV2ScalingConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putServerlessV2ScalingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.neptune_cluster.NeptuneClusterTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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

    public void resetBackupRetentionPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetBackupRetentionPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetClusterIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterIdentifierPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetClusterIdentifierPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCopyTagsToSnapshot() {
        software.amazon.jsii.Kernel.call(this, "resetCopyTagsToSnapshot", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeletionProtection() {
        software.amazon.jsii.Kernel.call(this, "resetDeletionProtection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableCloudwatchLogsExports() {
        software.amazon.jsii.Kernel.call(this, "resetEnableCloudwatchLogsExports", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEngine() {
        software.amazon.jsii.Kernel.call(this, "resetEngine", software.amazon.jsii.NativeType.VOID);
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

    public void resetKmsKeyArn() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNeptuneClusterParameterGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetNeptuneClusterParameterGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNeptuneInstanceParameterGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetNeptuneInstanceParameterGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNeptuneSubnetGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetNeptuneSubnetGroupName", software.amazon.jsii.NativeType.VOID);
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

    public void resetServerlessV2ScalingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetServerlessV2ScalingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkipFinalSnapshot() {
        software.amazon.jsii.Kernel.call(this, "resetSkipFinalSnapshot", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotIdentifier", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getClusterMembers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "clusterMembers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterResourceId() {
        return software.amazon.jsii.Kernel.get(this, "clusterResourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostedZoneId() {
        return software.amazon.jsii.Kernel.get(this, "hostedZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReaderEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "readerEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfigurationOutputReference getServerlessV2ScalingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "serverlessV2ScalingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.neptune_cluster.NeptuneClusterTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.neptune_cluster.NeptuneClusterTimeoutsOutputReference.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Number getBackupRetentionPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "backupRetentionPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterIdentifierPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterIdentifierPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToSnapshotInput() {
        return software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshotInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeletionProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "deletionProtectionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnableCloudwatchLogsExportsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "enableCloudwatchLogsExportsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineInput() {
        return software.amazon.jsii.Kernel.get(this, "engineInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNeptuneClusterParameterGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "neptuneClusterParameterGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNeptuneInstanceParameterGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "neptuneInstanceParameterGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNeptuneSubnetGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "neptuneSubnetGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfiguration getServerlessV2ScalingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "serverlessV2ScalingConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalSnapshotInput() {
        return software.amazon.jsii.Kernel.get(this, "skipFinalSnapshotInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnapshotIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getBackupRetentionPeriod() {
        return software.amazon.jsii.Kernel.get(this, "backupRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBackupRetentionPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "backupRetentionPeriod", java.util.Objects.requireNonNull(value, "backupRetentionPeriod is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getCopyTagsToSnapshot() {
        return software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCopyTagsToSnapshot(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "copyTagsToSnapshot", java.util.Objects.requireNonNull(value, "copyTagsToSnapshot is required"));
    }

    public void setCopyTagsToSnapshot(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "copyTagsToSnapshot", java.util.Objects.requireNonNull(value, "copyTagsToSnapshot is required"));
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEnableCloudwatchLogsExports() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "enableCloudwatchLogsExports", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEnableCloudwatchLogsExports(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "enableCloudwatchLogsExports", java.util.Objects.requireNonNull(value, "enableCloudwatchLogsExports is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngine() {
        return software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngine(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engine", java.util.Objects.requireNonNull(value, "engine is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyArn", java.util.Objects.requireNonNull(value, "kmsKeyArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNeptuneClusterParameterGroupName() {
        return software.amazon.jsii.Kernel.get(this, "neptuneClusterParameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNeptuneClusterParameterGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "neptuneClusterParameterGroupName", java.util.Objects.requireNonNull(value, "neptuneClusterParameterGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNeptuneInstanceParameterGroupName() {
        return software.amazon.jsii.Kernel.get(this, "neptuneInstanceParameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNeptuneInstanceParameterGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "neptuneInstanceParameterGroupName", java.util.Objects.requireNonNull(value, "neptuneInstanceParameterGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNeptuneSubnetGroupName() {
        return software.amazon.jsii.Kernel.get(this, "neptuneSubnetGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNeptuneSubnetGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "neptuneSubnetGroupName", java.util.Objects.requireNonNull(value, "neptuneSubnetGroupName is required"));
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
     * A fluent builder for {@link imports.aws.neptune_cluster.NeptuneCluster}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.neptune_cluster.NeptuneCluster> {
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
        private imports.aws.neptune_cluster.NeptuneClusterConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#allow_major_version_upgrade NeptuneCluster#allow_major_version_upgrade}.
         * <p>
         * @return {@code this}
         * @param allowMajorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#allow_major_version_upgrade NeptuneCluster#allow_major_version_upgrade}. This parameter is required.
         */
        public Builder allowMajorVersionUpgrade(final java.lang.Boolean allowMajorVersionUpgrade) {
            this.config().allowMajorVersionUpgrade(allowMajorVersionUpgrade);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#allow_major_version_upgrade NeptuneCluster#allow_major_version_upgrade}.
         * <p>
         * @return {@code this}
         * @param allowMajorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#allow_major_version_upgrade NeptuneCluster#allow_major_version_upgrade}. This parameter is required.
         */
        public Builder allowMajorVersionUpgrade(final com.hashicorp.cdktf.IResolvable allowMajorVersionUpgrade) {
            this.config().allowMajorVersionUpgrade(allowMajorVersionUpgrade);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#apply_immediately NeptuneCluster#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#apply_immediately NeptuneCluster#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final java.lang.Boolean applyImmediately) {
            this.config().applyImmediately(applyImmediately);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#apply_immediately NeptuneCluster#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#apply_immediately NeptuneCluster#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.config().applyImmediately(applyImmediately);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#availability_zones NeptuneCluster#availability_zones}.
         * <p>
         * @return {@code this}
         * @param availabilityZones Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#availability_zones NeptuneCluster#availability_zones}. This parameter is required.
         */
        public Builder availabilityZones(final java.util.List<java.lang.String> availabilityZones) {
            this.config().availabilityZones(availabilityZones);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#backup_retention_period NeptuneCluster#backup_retention_period}.
         * <p>
         * @return {@code this}
         * @param backupRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#backup_retention_period NeptuneCluster#backup_retention_period}. This parameter is required.
         */
        public Builder backupRetentionPeriod(final java.lang.Number backupRetentionPeriod) {
            this.config().backupRetentionPeriod(backupRetentionPeriod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#cluster_identifier NeptuneCluster#cluster_identifier}.
         * <p>
         * @return {@code this}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#cluster_identifier NeptuneCluster#cluster_identifier}. This parameter is required.
         */
        public Builder clusterIdentifier(final java.lang.String clusterIdentifier) {
            this.config().clusterIdentifier(clusterIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#cluster_identifier_prefix NeptuneCluster#cluster_identifier_prefix}.
         * <p>
         * @return {@code this}
         * @param clusterIdentifierPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#cluster_identifier_prefix NeptuneCluster#cluster_identifier_prefix}. This parameter is required.
         */
        public Builder clusterIdentifierPrefix(final java.lang.String clusterIdentifierPrefix) {
            this.config().clusterIdentifierPrefix(clusterIdentifierPrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#copy_tags_to_snapshot NeptuneCluster#copy_tags_to_snapshot}.
         * <p>
         * @return {@code this}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#copy_tags_to_snapshot NeptuneCluster#copy_tags_to_snapshot}. This parameter is required.
         */
        public Builder copyTagsToSnapshot(final java.lang.Boolean copyTagsToSnapshot) {
            this.config().copyTagsToSnapshot(copyTagsToSnapshot);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#copy_tags_to_snapshot NeptuneCluster#copy_tags_to_snapshot}.
         * <p>
         * @return {@code this}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#copy_tags_to_snapshot NeptuneCluster#copy_tags_to_snapshot}. This parameter is required.
         */
        public Builder copyTagsToSnapshot(final com.hashicorp.cdktf.IResolvable copyTagsToSnapshot) {
            this.config().copyTagsToSnapshot(copyTagsToSnapshot);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#deletion_protection NeptuneCluster#deletion_protection}.
         * <p>
         * @return {@code this}
         * @param deletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#deletion_protection NeptuneCluster#deletion_protection}. This parameter is required.
         */
        public Builder deletionProtection(final java.lang.Boolean deletionProtection) {
            this.config().deletionProtection(deletionProtection);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#deletion_protection NeptuneCluster#deletion_protection}.
         * <p>
         * @return {@code this}
         * @param deletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#deletion_protection NeptuneCluster#deletion_protection}. This parameter is required.
         */
        public Builder deletionProtection(final com.hashicorp.cdktf.IResolvable deletionProtection) {
            this.config().deletionProtection(deletionProtection);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#enable_cloudwatch_logs_exports NeptuneCluster#enable_cloudwatch_logs_exports}.
         * <p>
         * @return {@code this}
         * @param enableCloudwatchLogsExports Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#enable_cloudwatch_logs_exports NeptuneCluster#enable_cloudwatch_logs_exports}. This parameter is required.
         */
        public Builder enableCloudwatchLogsExports(final java.util.List<java.lang.String> enableCloudwatchLogsExports) {
            this.config().enableCloudwatchLogsExports(enableCloudwatchLogsExports);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#engine NeptuneCluster#engine}.
         * <p>
         * @return {@code this}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#engine NeptuneCluster#engine}. This parameter is required.
         */
        public Builder engine(final java.lang.String engine) {
            this.config().engine(engine);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#engine_version NeptuneCluster#engine_version}.
         * <p>
         * @return {@code this}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#engine_version NeptuneCluster#engine_version}. This parameter is required.
         */
        public Builder engineVersion(final java.lang.String engineVersion) {
            this.config().engineVersion(engineVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#final_snapshot_identifier NeptuneCluster#final_snapshot_identifier}.
         * <p>
         * @return {@code this}
         * @param finalSnapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#final_snapshot_identifier NeptuneCluster#final_snapshot_identifier}. This parameter is required.
         */
        public Builder finalSnapshotIdentifier(final java.lang.String finalSnapshotIdentifier) {
            this.config().finalSnapshotIdentifier(finalSnapshotIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#global_cluster_identifier NeptuneCluster#global_cluster_identifier}.
         * <p>
         * @return {@code this}
         * @param globalClusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#global_cluster_identifier NeptuneCluster#global_cluster_identifier}. This parameter is required.
         */
        public Builder globalClusterIdentifier(final java.lang.String globalClusterIdentifier) {
            this.config().globalClusterIdentifier(globalClusterIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#iam_database_authentication_enabled NeptuneCluster#iam_database_authentication_enabled}.
         * <p>
         * @return {@code this}
         * @param iamDatabaseAuthenticationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#iam_database_authentication_enabled NeptuneCluster#iam_database_authentication_enabled}. This parameter is required.
         */
        public Builder iamDatabaseAuthenticationEnabled(final java.lang.Boolean iamDatabaseAuthenticationEnabled) {
            this.config().iamDatabaseAuthenticationEnabled(iamDatabaseAuthenticationEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#iam_database_authentication_enabled NeptuneCluster#iam_database_authentication_enabled}.
         * <p>
         * @return {@code this}
         * @param iamDatabaseAuthenticationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#iam_database_authentication_enabled NeptuneCluster#iam_database_authentication_enabled}. This parameter is required.
         */
        public Builder iamDatabaseAuthenticationEnabled(final com.hashicorp.cdktf.IResolvable iamDatabaseAuthenticationEnabled) {
            this.config().iamDatabaseAuthenticationEnabled(iamDatabaseAuthenticationEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#iam_roles NeptuneCluster#iam_roles}.
         * <p>
         * @return {@code this}
         * @param iamRoles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#iam_roles NeptuneCluster#iam_roles}. This parameter is required.
         */
        public Builder iamRoles(final java.util.List<java.lang.String> iamRoles) {
            this.config().iamRoles(iamRoles);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#id NeptuneCluster#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#id NeptuneCluster#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#kms_key_arn NeptuneCluster#kms_key_arn}.
         * <p>
         * @return {@code this}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#kms_key_arn NeptuneCluster#kms_key_arn}. This parameter is required.
         */
        public Builder kmsKeyArn(final java.lang.String kmsKeyArn) {
            this.config().kmsKeyArn(kmsKeyArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#neptune_cluster_parameter_group_name NeptuneCluster#neptune_cluster_parameter_group_name}.
         * <p>
         * @return {@code this}
         * @param neptuneClusterParameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#neptune_cluster_parameter_group_name NeptuneCluster#neptune_cluster_parameter_group_name}. This parameter is required.
         */
        public Builder neptuneClusterParameterGroupName(final java.lang.String neptuneClusterParameterGroupName) {
            this.config().neptuneClusterParameterGroupName(neptuneClusterParameterGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#neptune_instance_parameter_group_name NeptuneCluster#neptune_instance_parameter_group_name}.
         * <p>
         * @return {@code this}
         * @param neptuneInstanceParameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#neptune_instance_parameter_group_name NeptuneCluster#neptune_instance_parameter_group_name}. This parameter is required.
         */
        public Builder neptuneInstanceParameterGroupName(final java.lang.String neptuneInstanceParameterGroupName) {
            this.config().neptuneInstanceParameterGroupName(neptuneInstanceParameterGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#neptune_subnet_group_name NeptuneCluster#neptune_subnet_group_name}.
         * <p>
         * @return {@code this}
         * @param neptuneSubnetGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#neptune_subnet_group_name NeptuneCluster#neptune_subnet_group_name}. This parameter is required.
         */
        public Builder neptuneSubnetGroupName(final java.lang.String neptuneSubnetGroupName) {
            this.config().neptuneSubnetGroupName(neptuneSubnetGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#port NeptuneCluster#port}.
         * <p>
         * @return {@code this}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#port NeptuneCluster#port}. This parameter is required.
         */
        public Builder port(final java.lang.Number port) {
            this.config().port(port);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#preferred_backup_window NeptuneCluster#preferred_backup_window}.
         * <p>
         * @return {@code this}
         * @param preferredBackupWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#preferred_backup_window NeptuneCluster#preferred_backup_window}. This parameter is required.
         */
        public Builder preferredBackupWindow(final java.lang.String preferredBackupWindow) {
            this.config().preferredBackupWindow(preferredBackupWindow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#preferred_maintenance_window NeptuneCluster#preferred_maintenance_window}.
         * <p>
         * @return {@code this}
         * @param preferredMaintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#preferred_maintenance_window NeptuneCluster#preferred_maintenance_window}. This parameter is required.
         */
        public Builder preferredMaintenanceWindow(final java.lang.String preferredMaintenanceWindow) {
            this.config().preferredMaintenanceWindow(preferredMaintenanceWindow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#replication_source_identifier NeptuneCluster#replication_source_identifier}.
         * <p>
         * @return {@code this}
         * @param replicationSourceIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#replication_source_identifier NeptuneCluster#replication_source_identifier}. This parameter is required.
         */
        public Builder replicationSourceIdentifier(final java.lang.String replicationSourceIdentifier) {
            this.config().replicationSourceIdentifier(replicationSourceIdentifier);
            return this;
        }

        /**
         * serverless_v2_scaling_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#serverless_v2_scaling_configuration NeptuneCluster#serverless_v2_scaling_configuration}
         * <p>
         * @return {@code this}
         * @param serverlessV2ScalingConfiguration serverless_v2_scaling_configuration block. This parameter is required.
         */
        public Builder serverlessV2ScalingConfiguration(final imports.aws.neptune_cluster.NeptuneClusterServerlessV2ScalingConfiguration serverlessV2ScalingConfiguration) {
            this.config().serverlessV2ScalingConfiguration(serverlessV2ScalingConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#skip_final_snapshot NeptuneCluster#skip_final_snapshot}.
         * <p>
         * @return {@code this}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#skip_final_snapshot NeptuneCluster#skip_final_snapshot}. This parameter is required.
         */
        public Builder skipFinalSnapshot(final java.lang.Boolean skipFinalSnapshot) {
            this.config().skipFinalSnapshot(skipFinalSnapshot);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#skip_final_snapshot NeptuneCluster#skip_final_snapshot}.
         * <p>
         * @return {@code this}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#skip_final_snapshot NeptuneCluster#skip_final_snapshot}. This parameter is required.
         */
        public Builder skipFinalSnapshot(final com.hashicorp.cdktf.IResolvable skipFinalSnapshot) {
            this.config().skipFinalSnapshot(skipFinalSnapshot);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#snapshot_identifier NeptuneCluster#snapshot_identifier}.
         * <p>
         * @return {@code this}
         * @param snapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#snapshot_identifier NeptuneCluster#snapshot_identifier}. This parameter is required.
         */
        public Builder snapshotIdentifier(final java.lang.String snapshotIdentifier) {
            this.config().snapshotIdentifier(snapshotIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#storage_encrypted NeptuneCluster#storage_encrypted}.
         * <p>
         * @return {@code this}
         * @param storageEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#storage_encrypted NeptuneCluster#storage_encrypted}. This parameter is required.
         */
        public Builder storageEncrypted(final java.lang.Boolean storageEncrypted) {
            this.config().storageEncrypted(storageEncrypted);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#storage_encrypted NeptuneCluster#storage_encrypted}.
         * <p>
         * @return {@code this}
         * @param storageEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#storage_encrypted NeptuneCluster#storage_encrypted}. This parameter is required.
         */
        public Builder storageEncrypted(final com.hashicorp.cdktf.IResolvable storageEncrypted) {
            this.config().storageEncrypted(storageEncrypted);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#storage_type NeptuneCluster#storage_type}.
         * <p>
         * @return {@code this}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#storage_type NeptuneCluster#storage_type}. This parameter is required.
         */
        public Builder storageType(final java.lang.String storageType) {
            this.config().storageType(storageType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#tags NeptuneCluster#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#tags NeptuneCluster#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#tags_all NeptuneCluster#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#tags_all NeptuneCluster#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#timeouts NeptuneCluster#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.neptune_cluster.NeptuneClusterTimeouts timeouts) {
            this.config().timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#vpc_security_group_ids NeptuneCluster#vpc_security_group_ids}.
         * <p>
         * @return {@code this}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#vpc_security_group_ids NeptuneCluster#vpc_security_group_ids}. This parameter is required.
         */
        public Builder vpcSecurityGroupIds(final java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.config().vpcSecurityGroupIds(vpcSecurityGroupIds);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.neptune_cluster.NeptuneCluster}.
         */
        @Override
        public imports.aws.neptune_cluster.NeptuneCluster build() {
            return new imports.aws.neptune_cluster.NeptuneCluster(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.neptune_cluster.NeptuneClusterConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.neptune_cluster.NeptuneClusterConfig.Builder();
            }
            return this.config;
        }
    }
}
