package imports.aws.rds_cluster_instance;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance aws_rds_cluster_instance}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.142Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rdsClusterInstance.RdsClusterInstance")
public class RdsClusterInstance extends com.hashicorp.cdktf.TerraformResource {

    protected RdsClusterInstance(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RdsClusterInstance(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.rds_cluster_instance.RdsClusterInstance.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance aws_rds_cluster_instance} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public RdsClusterInstance(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.rds_cluster_instance.RdsClusterInstanceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a RdsClusterInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RdsClusterInstance to import. This parameter is required.
     * @param importFromId The id of the existing RdsClusterInstance that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the RdsClusterInstance to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.rds_cluster_instance.RdsClusterInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a RdsClusterInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RdsClusterInstance to import. This parameter is required.
     * @param importFromId The id of the existing RdsClusterInstance that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.rds_cluster_instance.RdsClusterInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.rds_cluster_instance.RdsClusterInstanceTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApplyImmediately() {
        software.amazon.jsii.Kernel.call(this, "resetApplyImmediately", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoMinorVersionUpgrade() {
        software.amazon.jsii.Kernel.call(this, "resetAutoMinorVersionUpgrade", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAvailabilityZone() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCaCertIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetCaCertIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCopyTagsToSnapshot() {
        software.amazon.jsii.Kernel.call(this, "resetCopyTagsToSnapshot", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomIamInstanceProfile() {
        software.amazon.jsii.Kernel.call(this, "resetCustomIamInstanceProfile", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDbParameterGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetDbParameterGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDbSubnetGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetDbSubnetGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEngineVersion() {
        software.amazon.jsii.Kernel.call(this, "resetEngineVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForceDestroy() {
        software.amazon.jsii.Kernel.call(this, "resetForceDestroy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdentifierPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetIdentifierPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMonitoringInterval() {
        software.amazon.jsii.Kernel.call(this, "resetMonitoringInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMonitoringRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetMonitoringRoleArn", software.amazon.jsii.NativeType.VOID);
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

    public void resetPreferredBackupWindow() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredBackupWindow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredMaintenanceWindow() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredMaintenanceWindow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPromotionTier() {
        software.amazon.jsii.Kernel.call(this, "resetPromotionTier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPubliclyAccessible() {
        software.amazon.jsii.Kernel.call(this, "resetPubliclyAccessible", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getDbiResourceId() {
        return software.amazon.jsii.Kernel.get(this, "dbiResourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineVersionActual() {
        return software.amazon.jsii.Kernel.get(this, "engineVersionActual", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkType() {
        return software.amazon.jsii.Kernel.get(this, "networkType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPort() {
        return software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getStorageEncrypted() {
        return software.amazon.jsii.Kernel.get(this, "storageEncrypted", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rds_cluster_instance.RdsClusterInstanceTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.rds_cluster_instance.RdsClusterInstanceTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getWriter() {
        return software.amazon.jsii.Kernel.get(this, "writer", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediatelyInput() {
        return software.amazon.jsii.Kernel.get(this, "applyImmediatelyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoMinorVersionUpgradeInput() {
        return software.amazon.jsii.Kernel.get(this, "autoMinorVersionUpgradeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCaCertIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "caCertIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToSnapshotInput() {
        return software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshotInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomIamInstanceProfileInput() {
        return software.amazon.jsii.Kernel.get(this, "customIamInstanceProfileInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDbParameterGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "dbParameterGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDbSubnetGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "dbSubnetGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineInput() {
        return software.amazon.jsii.Kernel.get(this, "engineInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "engineVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getForceDestroyInput() {
        return software.amazon.jsii.Kernel.get(this, "forceDestroyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "identifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentifierPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "identifierPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceClassInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceClassInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMonitoringIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "monitoringIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMonitoringRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "monitoringRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getPreferredBackupWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "preferredBackupWindowInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreferredMaintenanceWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "preferredMaintenanceWindowInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPromotionTierInput() {
        return software.amazon.jsii.Kernel.get(this, "promotionTierInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAccessibleInput() {
        return software.amazon.jsii.Kernel.get(this, "publiclyAccessibleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getApplyImmediately() {
        return software.amazon.jsii.Kernel.get(this, "applyImmediately", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setApplyImmediately(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "applyImmediately", java.util.Objects.requireNonNull(value, "applyImmediately is required"));
    }

    public void setApplyImmediately(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "applyImmediately", java.util.Objects.requireNonNull(value, "applyImmediately is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoMinorVersionUpgrade() {
        return software.amazon.jsii.Kernel.get(this, "autoMinorVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoMinorVersionUpgrade(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoMinorVersionUpgrade", java.util.Objects.requireNonNull(value, "autoMinorVersionUpgrade is required"));
    }

    public void setAutoMinorVersionUpgrade(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoMinorVersionUpgrade", java.util.Objects.requireNonNull(value, "autoMinorVersionUpgrade is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZone", java.util.Objects.requireNonNull(value, "availabilityZone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCaCertIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "caCertIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCaCertIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "caCertIdentifier", java.util.Objects.requireNonNull(value, "caCertIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "clusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterIdentifier", java.util.Objects.requireNonNull(value, "clusterIdentifier is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomIamInstanceProfile() {
        return software.amazon.jsii.Kernel.get(this, "customIamInstanceProfile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomIamInstanceProfile(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customIamInstanceProfile", java.util.Objects.requireNonNull(value, "customIamInstanceProfile is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDbParameterGroupName() {
        return software.amazon.jsii.Kernel.get(this, "dbParameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDbParameterGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dbParameterGroupName", java.util.Objects.requireNonNull(value, "dbParameterGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDbSubnetGroupName() {
        return software.amazon.jsii.Kernel.get(this, "dbSubnetGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDbSubnetGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dbSubnetGroupName", java.util.Objects.requireNonNull(value, "dbSubnetGroupName is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getForceDestroy() {
        return software.amazon.jsii.Kernel.get(this, "forceDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setForceDestroy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "forceDestroy", java.util.Objects.requireNonNull(value, "forceDestroy is required"));
    }

    public void setForceDestroy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "forceDestroy", java.util.Objects.requireNonNull(value, "forceDestroy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "identifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identifier", java.util.Objects.requireNonNull(value, "identifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentifierPrefix() {
        return software.amazon.jsii.Kernel.get(this, "identifierPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentifierPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identifierPrefix", java.util.Objects.requireNonNull(value, "identifierPrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceClass() {
        return software.amazon.jsii.Kernel.get(this, "instanceClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceClass(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceClass", java.util.Objects.requireNonNull(value, "instanceClass is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getPromotionTier() {
        return software.amazon.jsii.Kernel.get(this, "promotionTier", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPromotionTier(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "promotionTier", java.util.Objects.requireNonNull(value, "promotionTier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPubliclyAccessible() {
        return software.amazon.jsii.Kernel.get(this, "publiclyAccessible", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPubliclyAccessible(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "publiclyAccessible", java.util.Objects.requireNonNull(value, "publiclyAccessible is required"));
    }

    public void setPubliclyAccessible(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "publiclyAccessible", java.util.Objects.requireNonNull(value, "publiclyAccessible is required"));
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

    /**
     * A fluent builder for {@link imports.aws.rds_cluster_instance.RdsClusterInstance}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.rds_cluster_instance.RdsClusterInstance> {
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
        private final imports.aws.rds_cluster_instance.RdsClusterInstanceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.rds_cluster_instance.RdsClusterInstanceConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#cluster_identifier RdsClusterInstance#cluster_identifier}.
         * <p>
         * @return {@code this}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#cluster_identifier RdsClusterInstance#cluster_identifier}. This parameter is required.
         */
        public Builder clusterIdentifier(final java.lang.String clusterIdentifier) {
            this.config.clusterIdentifier(clusterIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#engine RdsClusterInstance#engine}.
         * <p>
         * @return {@code this}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#engine RdsClusterInstance#engine}. This parameter is required.
         */
        public Builder engine(final java.lang.String engine) {
            this.config.engine(engine);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#instance_class RdsClusterInstance#instance_class}.
         * <p>
         * @return {@code this}
         * @param instanceClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#instance_class RdsClusterInstance#instance_class}. This parameter is required.
         */
        public Builder instanceClass(final java.lang.String instanceClass) {
            this.config.instanceClass(instanceClass);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#apply_immediately RdsClusterInstance#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#apply_immediately RdsClusterInstance#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final java.lang.Boolean applyImmediately) {
            this.config.applyImmediately(applyImmediately);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#apply_immediately RdsClusterInstance#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#apply_immediately RdsClusterInstance#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.config.applyImmediately(applyImmediately);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#auto_minor_version_upgrade RdsClusterInstance#auto_minor_version_upgrade}.
         * <p>
         * @return {@code this}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#auto_minor_version_upgrade RdsClusterInstance#auto_minor_version_upgrade}. This parameter is required.
         */
        public Builder autoMinorVersionUpgrade(final java.lang.Boolean autoMinorVersionUpgrade) {
            this.config.autoMinorVersionUpgrade(autoMinorVersionUpgrade);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#auto_minor_version_upgrade RdsClusterInstance#auto_minor_version_upgrade}.
         * <p>
         * @return {@code this}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#auto_minor_version_upgrade RdsClusterInstance#auto_minor_version_upgrade}. This parameter is required.
         */
        public Builder autoMinorVersionUpgrade(final com.hashicorp.cdktf.IResolvable autoMinorVersionUpgrade) {
            this.config.autoMinorVersionUpgrade(autoMinorVersionUpgrade);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#availability_zone RdsClusterInstance#availability_zone}.
         * <p>
         * @return {@code this}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#availability_zone RdsClusterInstance#availability_zone}. This parameter is required.
         */
        public Builder availabilityZone(final java.lang.String availabilityZone) {
            this.config.availabilityZone(availabilityZone);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#ca_cert_identifier RdsClusterInstance#ca_cert_identifier}.
         * <p>
         * @return {@code this}
         * @param caCertIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#ca_cert_identifier RdsClusterInstance#ca_cert_identifier}. This parameter is required.
         */
        public Builder caCertIdentifier(final java.lang.String caCertIdentifier) {
            this.config.caCertIdentifier(caCertIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#copy_tags_to_snapshot RdsClusterInstance#copy_tags_to_snapshot}.
         * <p>
         * @return {@code this}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#copy_tags_to_snapshot RdsClusterInstance#copy_tags_to_snapshot}. This parameter is required.
         */
        public Builder copyTagsToSnapshot(final java.lang.Boolean copyTagsToSnapshot) {
            this.config.copyTagsToSnapshot(copyTagsToSnapshot);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#copy_tags_to_snapshot RdsClusterInstance#copy_tags_to_snapshot}.
         * <p>
         * @return {@code this}
         * @param copyTagsToSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#copy_tags_to_snapshot RdsClusterInstance#copy_tags_to_snapshot}. This parameter is required.
         */
        public Builder copyTagsToSnapshot(final com.hashicorp.cdktf.IResolvable copyTagsToSnapshot) {
            this.config.copyTagsToSnapshot(copyTagsToSnapshot);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#custom_iam_instance_profile RdsClusterInstance#custom_iam_instance_profile}.
         * <p>
         * @return {@code this}
         * @param customIamInstanceProfile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#custom_iam_instance_profile RdsClusterInstance#custom_iam_instance_profile}. This parameter is required.
         */
        public Builder customIamInstanceProfile(final java.lang.String customIamInstanceProfile) {
            this.config.customIamInstanceProfile(customIamInstanceProfile);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#db_parameter_group_name RdsClusterInstance#db_parameter_group_name}.
         * <p>
         * @return {@code this}
         * @param dbParameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#db_parameter_group_name RdsClusterInstance#db_parameter_group_name}. This parameter is required.
         */
        public Builder dbParameterGroupName(final java.lang.String dbParameterGroupName) {
            this.config.dbParameterGroupName(dbParameterGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#db_subnet_group_name RdsClusterInstance#db_subnet_group_name}.
         * <p>
         * @return {@code this}
         * @param dbSubnetGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#db_subnet_group_name RdsClusterInstance#db_subnet_group_name}. This parameter is required.
         */
        public Builder dbSubnetGroupName(final java.lang.String dbSubnetGroupName) {
            this.config.dbSubnetGroupName(dbSubnetGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#engine_version RdsClusterInstance#engine_version}.
         * <p>
         * @return {@code this}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#engine_version RdsClusterInstance#engine_version}. This parameter is required.
         */
        public Builder engineVersion(final java.lang.String engineVersion) {
            this.config.engineVersion(engineVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#force_destroy RdsClusterInstance#force_destroy}.
         * <p>
         * @return {@code this}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#force_destroy RdsClusterInstance#force_destroy}. This parameter is required.
         */
        public Builder forceDestroy(final java.lang.Boolean forceDestroy) {
            this.config.forceDestroy(forceDestroy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#force_destroy RdsClusterInstance#force_destroy}.
         * <p>
         * @return {@code this}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#force_destroy RdsClusterInstance#force_destroy}. This parameter is required.
         */
        public Builder forceDestroy(final com.hashicorp.cdktf.IResolvable forceDestroy) {
            this.config.forceDestroy(forceDestroy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#id RdsClusterInstance#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#id RdsClusterInstance#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#identifier RdsClusterInstance#identifier}.
         * <p>
         * @return {@code this}
         * @param identifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#identifier RdsClusterInstance#identifier}. This parameter is required.
         */
        public Builder identifier(final java.lang.String identifier) {
            this.config.identifier(identifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#identifier_prefix RdsClusterInstance#identifier_prefix}.
         * <p>
         * @return {@code this}
         * @param identifierPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#identifier_prefix RdsClusterInstance#identifier_prefix}. This parameter is required.
         */
        public Builder identifierPrefix(final java.lang.String identifierPrefix) {
            this.config.identifierPrefix(identifierPrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#monitoring_interval RdsClusterInstance#monitoring_interval}.
         * <p>
         * @return {@code this}
         * @param monitoringInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#monitoring_interval RdsClusterInstance#monitoring_interval}. This parameter is required.
         */
        public Builder monitoringInterval(final java.lang.Number monitoringInterval) {
            this.config.monitoringInterval(monitoringInterval);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#monitoring_role_arn RdsClusterInstance#monitoring_role_arn}.
         * <p>
         * @return {@code this}
         * @param monitoringRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#monitoring_role_arn RdsClusterInstance#monitoring_role_arn}. This parameter is required.
         */
        public Builder monitoringRoleArn(final java.lang.String monitoringRoleArn) {
            this.config.monitoringRoleArn(monitoringRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_enabled RdsClusterInstance#performance_insights_enabled}.
         * <p>
         * @return {@code this}
         * @param performanceInsightsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_enabled RdsClusterInstance#performance_insights_enabled}. This parameter is required.
         */
        public Builder performanceInsightsEnabled(final java.lang.Boolean performanceInsightsEnabled) {
            this.config.performanceInsightsEnabled(performanceInsightsEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_enabled RdsClusterInstance#performance_insights_enabled}.
         * <p>
         * @return {@code this}
         * @param performanceInsightsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_enabled RdsClusterInstance#performance_insights_enabled}. This parameter is required.
         */
        public Builder performanceInsightsEnabled(final com.hashicorp.cdktf.IResolvable performanceInsightsEnabled) {
            this.config.performanceInsightsEnabled(performanceInsightsEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_kms_key_id RdsClusterInstance#performance_insights_kms_key_id}.
         * <p>
         * @return {@code this}
         * @param performanceInsightsKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_kms_key_id RdsClusterInstance#performance_insights_kms_key_id}. This parameter is required.
         */
        public Builder performanceInsightsKmsKeyId(final java.lang.String performanceInsightsKmsKeyId) {
            this.config.performanceInsightsKmsKeyId(performanceInsightsKmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_retention_period RdsClusterInstance#performance_insights_retention_period}.
         * <p>
         * @return {@code this}
         * @param performanceInsightsRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#performance_insights_retention_period RdsClusterInstance#performance_insights_retention_period}. This parameter is required.
         */
        public Builder performanceInsightsRetentionPeriod(final java.lang.Number performanceInsightsRetentionPeriod) {
            this.config.performanceInsightsRetentionPeriod(performanceInsightsRetentionPeriod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#preferred_backup_window RdsClusterInstance#preferred_backup_window}.
         * <p>
         * @return {@code this}
         * @param preferredBackupWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#preferred_backup_window RdsClusterInstance#preferred_backup_window}. This parameter is required.
         */
        public Builder preferredBackupWindow(final java.lang.String preferredBackupWindow) {
            this.config.preferredBackupWindow(preferredBackupWindow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#preferred_maintenance_window RdsClusterInstance#preferred_maintenance_window}.
         * <p>
         * @return {@code this}
         * @param preferredMaintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#preferred_maintenance_window RdsClusterInstance#preferred_maintenance_window}. This parameter is required.
         */
        public Builder preferredMaintenanceWindow(final java.lang.String preferredMaintenanceWindow) {
            this.config.preferredMaintenanceWindow(preferredMaintenanceWindow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#promotion_tier RdsClusterInstance#promotion_tier}.
         * <p>
         * @return {@code this}
         * @param promotionTier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#promotion_tier RdsClusterInstance#promotion_tier}. This parameter is required.
         */
        public Builder promotionTier(final java.lang.Number promotionTier) {
            this.config.promotionTier(promotionTier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#publicly_accessible RdsClusterInstance#publicly_accessible}.
         * <p>
         * @return {@code this}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#publicly_accessible RdsClusterInstance#publicly_accessible}. This parameter is required.
         */
        public Builder publiclyAccessible(final java.lang.Boolean publiclyAccessible) {
            this.config.publiclyAccessible(publiclyAccessible);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#publicly_accessible RdsClusterInstance#publicly_accessible}.
         * <p>
         * @return {@code this}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#publicly_accessible RdsClusterInstance#publicly_accessible}. This parameter is required.
         */
        public Builder publiclyAccessible(final com.hashicorp.cdktf.IResolvable publiclyAccessible) {
            this.config.publiclyAccessible(publiclyAccessible);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#tags RdsClusterInstance#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#tags RdsClusterInstance#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#tags_all RdsClusterInstance#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#tags_all RdsClusterInstance#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_instance#timeouts RdsClusterInstance#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.rds_cluster_instance.RdsClusterInstanceTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.rds_cluster_instance.RdsClusterInstance}.
         */
        @Override
        public imports.aws.rds_cluster_instance.RdsClusterInstance build() {
            return new imports.aws.rds_cluster_instance.RdsClusterInstance(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
