package imports.aws.fsx_lustre_file_system;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system aws_fsx_lustre_file_system}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.245Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxLustreFileSystem.FsxLustreFileSystem")
public class FsxLustreFileSystem extends com.hashicorp.cdktf.TerraformResource {

    protected FsxLustreFileSystem(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxLustreFileSystem(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.fsx_lustre_file_system.FsxLustreFileSystem.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system aws_fsx_lustre_file_system} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public FsxLustreFileSystem(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.fsx_lustre_file_system.FsxLustreFileSystemConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a FsxLustreFileSystem resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FsxLustreFileSystem to import. This parameter is required.
     * @param importFromId The id of the existing FsxLustreFileSystem that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the FsxLustreFileSystem to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.fsx_lustre_file_system.FsxLustreFileSystem.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a FsxLustreFileSystem resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FsxLustreFileSystem to import. This parameter is required.
     * @param importFromId The id of the existing FsxLustreFileSystem that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.fsx_lustre_file_system.FsxLustreFileSystem.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDataReadCacheConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putDataReadCacheConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLogConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putLogConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMetadataConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.fsx_lustre_file_system.FsxLustreFileSystemMetadataConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putMetadataConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRootSquashConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putRootSquashConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.fsx_lustre_file_system.FsxLustreFileSystemTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutoImportPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetAutoImportPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutomaticBackupRetentionDays() {
        software.amazon.jsii.Kernel.call(this, "resetAutomaticBackupRetentionDays", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBackupId() {
        software.amazon.jsii.Kernel.call(this, "resetBackupId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCopyTagsToBackups() {
        software.amazon.jsii.Kernel.call(this, "resetCopyTagsToBackups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDailyAutomaticBackupStartTime() {
        software.amazon.jsii.Kernel.call(this, "resetDailyAutomaticBackupStartTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataCompressionType() {
        software.amazon.jsii.Kernel.call(this, "resetDataCompressionType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataReadCacheConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetDataReadCacheConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeploymentType() {
        software.amazon.jsii.Kernel.call(this, "resetDeploymentType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDriveCacheType() {
        software.amazon.jsii.Kernel.call(this, "resetDriveCacheType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEfaEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEfaEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExportPath() {
        software.amazon.jsii.Kernel.call(this, "resetExportPath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFileSystemTypeVersion() {
        software.amazon.jsii.Kernel.call(this, "resetFileSystemTypeVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFinalBackupTags() {
        software.amazon.jsii.Kernel.call(this, "resetFinalBackupTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImportedFileChunkSize() {
        software.amazon.jsii.Kernel.call(this, "resetImportedFileChunkSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImportPath() {
        software.amazon.jsii.Kernel.call(this, "resetImportPath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetLogConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetadataConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetMetadataConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPerUnitStorageThroughput() {
        software.amazon.jsii.Kernel.call(this, "resetPerUnitStorageThroughput", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRootSquashConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetRootSquashConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkipFinalBackup() {
        software.amazon.jsii.Kernel.call(this, "resetSkipFinalBackup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStorageCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetStorageCapacity", software.amazon.jsii.NativeType.VOID);
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

    public void resetThroughputCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetThroughputCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWeeklyMaintenanceStartTime() {
        software.amazon.jsii.Kernel.call(this, "resetWeeklyMaintenanceStartTime", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfigurationOutputReference getDataReadCacheConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "dataReadCacheConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDnsName() {
        return software.amazon.jsii.Kernel.get(this, "dnsName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfigurationOutputReference getLogConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "logConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_lustre_file_system.FsxLustreFileSystemMetadataConfigurationOutputReference getMetadataConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "metadataConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemMetadataConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMountName() {
        return software.amazon.jsii.Kernel.get(this, "mountName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNetworkInterfaceIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "networkInterfaceIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwnerId() {
        return software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfigurationOutputReference getRootSquashConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "rootSquashConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_lustre_file_system.FsxLustreFileSystemTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcId() {
        return software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutoImportPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "autoImportPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAutomaticBackupRetentionDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "automaticBackupRetentionDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBackupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "backupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToBackupsInput() {
        return software.amazon.jsii.Kernel.get(this, "copyTagsToBackupsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDailyAutomaticBackupStartTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "dailyAutomaticBackupStartTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataCompressionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "dataCompressionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfiguration getDataReadCacheConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "dataReadCacheConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeploymentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDriveCacheTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "driveCacheTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEfaEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "efaEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExportPathInput() {
        return software.amazon.jsii.Kernel.get(this, "exportPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileSystemTypeVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemTypeVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getFinalBackupTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "finalBackupTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getImportedFileChunkSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "importedFileChunkSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImportPathInput() {
        return software.amazon.jsii.Kernel.get(this, "importPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfiguration getLogConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "logConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemMetadataConfiguration getMetadataConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "metadataConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemMetadataConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPerUnitStorageThroughputInput() {
        return software.amazon.jsii.Kernel.get(this, "perUnitStorageThroughputInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfiguration getRootSquashConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "rootSquashConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalBackupInput() {
        return software.amazon.jsii.Kernel.get(this, "skipFinalBackupInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getStorageCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "storageCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStorageTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "storageTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "subnetIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getThroughputCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "throughputCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWeeklyMaintenanceStartTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "weeklyMaintenanceStartTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoImportPolicy() {
        return software.amazon.jsii.Kernel.get(this, "autoImportPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutoImportPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "autoImportPolicy", java.util.Objects.requireNonNull(value, "autoImportPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAutomaticBackupRetentionDays() {
        return software.amazon.jsii.Kernel.get(this, "automaticBackupRetentionDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAutomaticBackupRetentionDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "automaticBackupRetentionDays", java.util.Objects.requireNonNull(value, "automaticBackupRetentionDays is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBackupId() {
        return software.amazon.jsii.Kernel.get(this, "backupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBackupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "backupId", java.util.Objects.requireNonNull(value, "backupId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCopyTagsToBackups() {
        return software.amazon.jsii.Kernel.get(this, "copyTagsToBackups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCopyTagsToBackups(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "copyTagsToBackups", java.util.Objects.requireNonNull(value, "copyTagsToBackups is required"));
    }

    public void setCopyTagsToBackups(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "copyTagsToBackups", java.util.Objects.requireNonNull(value, "copyTagsToBackups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDailyAutomaticBackupStartTime() {
        return software.amazon.jsii.Kernel.get(this, "dailyAutomaticBackupStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDailyAutomaticBackupStartTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dailyAutomaticBackupStartTime", java.util.Objects.requireNonNull(value, "dailyAutomaticBackupStartTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataCompressionType() {
        return software.amazon.jsii.Kernel.get(this, "dataCompressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataCompressionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataCompressionType", java.util.Objects.requireNonNull(value, "dataCompressionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentType() {
        return software.amazon.jsii.Kernel.get(this, "deploymentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeploymentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deploymentType", java.util.Objects.requireNonNull(value, "deploymentType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDriveCacheType() {
        return software.amazon.jsii.Kernel.get(this, "driveCacheType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDriveCacheType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "driveCacheType", java.util.Objects.requireNonNull(value, "driveCacheType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEfaEnabled() {
        return software.amazon.jsii.Kernel.get(this, "efaEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEfaEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "efaEnabled", java.util.Objects.requireNonNull(value, "efaEnabled is required"));
    }

    public void setEfaEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "efaEnabled", java.util.Objects.requireNonNull(value, "efaEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExportPath() {
        return software.amazon.jsii.Kernel.get(this, "exportPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExportPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "exportPath", java.util.Objects.requireNonNull(value, "exportPath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileSystemTypeVersion() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemTypeVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileSystemTypeVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileSystemTypeVersion", java.util.Objects.requireNonNull(value, "fileSystemTypeVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getFinalBackupTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "finalBackupTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setFinalBackupTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "finalBackupTags", java.util.Objects.requireNonNull(value, "finalBackupTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getImportedFileChunkSize() {
        return software.amazon.jsii.Kernel.get(this, "importedFileChunkSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setImportedFileChunkSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "importedFileChunkSize", java.util.Objects.requireNonNull(value, "importedFileChunkSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImportPath() {
        return software.amazon.jsii.Kernel.get(this, "importPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImportPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "importPath", java.util.Objects.requireNonNull(value, "importPath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPerUnitStorageThroughput() {
        return software.amazon.jsii.Kernel.get(this, "perUnitStorageThroughput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPerUnitStorageThroughput(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "perUnitStorageThroughput", java.util.Objects.requireNonNull(value, "perUnitStorageThroughput is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupIds", java.util.Objects.requireNonNull(value, "securityGroupIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSkipFinalBackup() {
        return software.amazon.jsii.Kernel.get(this, "skipFinalBackup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSkipFinalBackup(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "skipFinalBackup", java.util.Objects.requireNonNull(value, "skipFinalBackup is required"));
    }

    public void setSkipFinalBackup(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "skipFinalBackup", java.util.Objects.requireNonNull(value, "skipFinalBackup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getStorageCapacity() {
        return software.amazon.jsii.Kernel.get(this, "storageCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setStorageCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "storageCapacity", java.util.Objects.requireNonNull(value, "storageCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStorageType() {
        return software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStorageType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "storageType", java.util.Objects.requireNonNull(value, "storageType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSubnetIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "subnetIds", java.util.Objects.requireNonNull(value, "subnetIds is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getThroughputCapacity() {
        return software.amazon.jsii.Kernel.get(this, "throughputCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setThroughputCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "throughputCapacity", java.util.Objects.requireNonNull(value, "throughputCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWeeklyMaintenanceStartTime() {
        return software.amazon.jsii.Kernel.get(this, "weeklyMaintenanceStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWeeklyMaintenanceStartTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "weeklyMaintenanceStartTime", java.util.Objects.requireNonNull(value, "weeklyMaintenanceStartTime is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.fsx_lustre_file_system.FsxLustreFileSystem}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.fsx_lustre_file_system.FsxLustreFileSystem> {
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
        private final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.fsx_lustre_file_system.FsxLustreFileSystemConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#subnet_ids FsxLustreFileSystem#subnet_ids}.
         * <p>
         * @return {@code this}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#subnet_ids FsxLustreFileSystem#subnet_ids}. This parameter is required.
         */
        public Builder subnetIds(final java.util.List<java.lang.String> subnetIds) {
            this.config.subnetIds(subnetIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#auto_import_policy FsxLustreFileSystem#auto_import_policy}.
         * <p>
         * @return {@code this}
         * @param autoImportPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#auto_import_policy FsxLustreFileSystem#auto_import_policy}. This parameter is required.
         */
        public Builder autoImportPolicy(final java.lang.String autoImportPolicy) {
            this.config.autoImportPolicy(autoImportPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#automatic_backup_retention_days FsxLustreFileSystem#automatic_backup_retention_days}.
         * <p>
         * @return {@code this}
         * @param automaticBackupRetentionDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#automatic_backup_retention_days FsxLustreFileSystem#automatic_backup_retention_days}. This parameter is required.
         */
        public Builder automaticBackupRetentionDays(final java.lang.Number automaticBackupRetentionDays) {
            this.config.automaticBackupRetentionDays(automaticBackupRetentionDays);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#backup_id FsxLustreFileSystem#backup_id}.
         * <p>
         * @return {@code this}
         * @param backupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#backup_id FsxLustreFileSystem#backup_id}. This parameter is required.
         */
        public Builder backupId(final java.lang.String backupId) {
            this.config.backupId(backupId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#copy_tags_to_backups FsxLustreFileSystem#copy_tags_to_backups}.
         * <p>
         * @return {@code this}
         * @param copyTagsToBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#copy_tags_to_backups FsxLustreFileSystem#copy_tags_to_backups}. This parameter is required.
         */
        public Builder copyTagsToBackups(final java.lang.Boolean copyTagsToBackups) {
            this.config.copyTagsToBackups(copyTagsToBackups);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#copy_tags_to_backups FsxLustreFileSystem#copy_tags_to_backups}.
         * <p>
         * @return {@code this}
         * @param copyTagsToBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#copy_tags_to_backups FsxLustreFileSystem#copy_tags_to_backups}. This parameter is required.
         */
        public Builder copyTagsToBackups(final com.hashicorp.cdktf.IResolvable copyTagsToBackups) {
            this.config.copyTagsToBackups(copyTagsToBackups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#daily_automatic_backup_start_time FsxLustreFileSystem#daily_automatic_backup_start_time}.
         * <p>
         * @return {@code this}
         * @param dailyAutomaticBackupStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#daily_automatic_backup_start_time FsxLustreFileSystem#daily_automatic_backup_start_time}. This parameter is required.
         */
        public Builder dailyAutomaticBackupStartTime(final java.lang.String dailyAutomaticBackupStartTime) {
            this.config.dailyAutomaticBackupStartTime(dailyAutomaticBackupStartTime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#data_compression_type FsxLustreFileSystem#data_compression_type}.
         * <p>
         * @return {@code this}
         * @param dataCompressionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#data_compression_type FsxLustreFileSystem#data_compression_type}. This parameter is required.
         */
        public Builder dataCompressionType(final java.lang.String dataCompressionType) {
            this.config.dataCompressionType(dataCompressionType);
            return this;
        }

        /**
         * data_read_cache_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#data_read_cache_configuration FsxLustreFileSystem#data_read_cache_configuration}
         * <p>
         * @return {@code this}
         * @param dataReadCacheConfiguration data_read_cache_configuration block. This parameter is required.
         */
        public Builder dataReadCacheConfiguration(final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfiguration dataReadCacheConfiguration) {
            this.config.dataReadCacheConfiguration(dataReadCacheConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#deployment_type FsxLustreFileSystem#deployment_type}.
         * <p>
         * @return {@code this}
         * @param deploymentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#deployment_type FsxLustreFileSystem#deployment_type}. This parameter is required.
         */
        public Builder deploymentType(final java.lang.String deploymentType) {
            this.config.deploymentType(deploymentType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#drive_cache_type FsxLustreFileSystem#drive_cache_type}.
         * <p>
         * @return {@code this}
         * @param driveCacheType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#drive_cache_type FsxLustreFileSystem#drive_cache_type}. This parameter is required.
         */
        public Builder driveCacheType(final java.lang.String driveCacheType) {
            this.config.driveCacheType(driveCacheType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#efa_enabled FsxLustreFileSystem#efa_enabled}.
         * <p>
         * @return {@code this}
         * @param efaEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#efa_enabled FsxLustreFileSystem#efa_enabled}. This parameter is required.
         */
        public Builder efaEnabled(final java.lang.Boolean efaEnabled) {
            this.config.efaEnabled(efaEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#efa_enabled FsxLustreFileSystem#efa_enabled}.
         * <p>
         * @return {@code this}
         * @param efaEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#efa_enabled FsxLustreFileSystem#efa_enabled}. This parameter is required.
         */
        public Builder efaEnabled(final com.hashicorp.cdktf.IResolvable efaEnabled) {
            this.config.efaEnabled(efaEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#export_path FsxLustreFileSystem#export_path}.
         * <p>
         * @return {@code this}
         * @param exportPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#export_path FsxLustreFileSystem#export_path}. This parameter is required.
         */
        public Builder exportPath(final java.lang.String exportPath) {
            this.config.exportPath(exportPath);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#file_system_type_version FsxLustreFileSystem#file_system_type_version}.
         * <p>
         * @return {@code this}
         * @param fileSystemTypeVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#file_system_type_version FsxLustreFileSystem#file_system_type_version}. This parameter is required.
         */
        public Builder fileSystemTypeVersion(final java.lang.String fileSystemTypeVersion) {
            this.config.fileSystemTypeVersion(fileSystemTypeVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#final_backup_tags FsxLustreFileSystem#final_backup_tags}.
         * <p>
         * @return {@code this}
         * @param finalBackupTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#final_backup_tags FsxLustreFileSystem#final_backup_tags}. This parameter is required.
         */
        public Builder finalBackupTags(final java.util.Map<java.lang.String, java.lang.String> finalBackupTags) {
            this.config.finalBackupTags(finalBackupTags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#id FsxLustreFileSystem#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#id FsxLustreFileSystem#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#imported_file_chunk_size FsxLustreFileSystem#imported_file_chunk_size}.
         * <p>
         * @return {@code this}
         * @param importedFileChunkSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#imported_file_chunk_size FsxLustreFileSystem#imported_file_chunk_size}. This parameter is required.
         */
        public Builder importedFileChunkSize(final java.lang.Number importedFileChunkSize) {
            this.config.importedFileChunkSize(importedFileChunkSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#import_path FsxLustreFileSystem#import_path}.
         * <p>
         * @return {@code this}
         * @param importPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#import_path FsxLustreFileSystem#import_path}. This parameter is required.
         */
        public Builder importPath(final java.lang.String importPath) {
            this.config.importPath(importPath);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#kms_key_id FsxLustreFileSystem#kms_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#kms_key_id FsxLustreFileSystem#kms_key_id}. This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config.kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * log_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#log_configuration FsxLustreFileSystem#log_configuration}
         * <p>
         * @return {@code this}
         * @param logConfiguration log_configuration block. This parameter is required.
         */
        public Builder logConfiguration(final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfiguration logConfiguration) {
            this.config.logConfiguration(logConfiguration);
            return this;
        }

        /**
         * metadata_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#metadata_configuration FsxLustreFileSystem#metadata_configuration}
         * <p>
         * @return {@code this}
         * @param metadataConfiguration metadata_configuration block. This parameter is required.
         */
        public Builder metadataConfiguration(final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemMetadataConfiguration metadataConfiguration) {
            this.config.metadataConfiguration(metadataConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#per_unit_storage_throughput FsxLustreFileSystem#per_unit_storage_throughput}.
         * <p>
         * @return {@code this}
         * @param perUnitStorageThroughput Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#per_unit_storage_throughput FsxLustreFileSystem#per_unit_storage_throughput}. This parameter is required.
         */
        public Builder perUnitStorageThroughput(final java.lang.Number perUnitStorageThroughput) {
            this.config.perUnitStorageThroughput(perUnitStorageThroughput);
            return this;
        }

        /**
         * root_squash_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#root_squash_configuration FsxLustreFileSystem#root_squash_configuration}
         * <p>
         * @return {@code this}
         * @param rootSquashConfiguration root_squash_configuration block. This parameter is required.
         */
        public Builder rootSquashConfiguration(final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfiguration rootSquashConfiguration) {
            this.config.rootSquashConfiguration(rootSquashConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#security_group_ids FsxLustreFileSystem#security_group_ids}.
         * <p>
         * @return {@code this}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#security_group_ids FsxLustreFileSystem#security_group_ids}. This parameter is required.
         */
        public Builder securityGroupIds(final java.util.List<java.lang.String> securityGroupIds) {
            this.config.securityGroupIds(securityGroupIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#skip_final_backup FsxLustreFileSystem#skip_final_backup}.
         * <p>
         * @return {@code this}
         * @param skipFinalBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#skip_final_backup FsxLustreFileSystem#skip_final_backup}. This parameter is required.
         */
        public Builder skipFinalBackup(final java.lang.Boolean skipFinalBackup) {
            this.config.skipFinalBackup(skipFinalBackup);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#skip_final_backup FsxLustreFileSystem#skip_final_backup}.
         * <p>
         * @return {@code this}
         * @param skipFinalBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#skip_final_backup FsxLustreFileSystem#skip_final_backup}. This parameter is required.
         */
        public Builder skipFinalBackup(final com.hashicorp.cdktf.IResolvable skipFinalBackup) {
            this.config.skipFinalBackup(skipFinalBackup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_capacity FsxLustreFileSystem#storage_capacity}.
         * <p>
         * @return {@code this}
         * @param storageCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_capacity FsxLustreFileSystem#storage_capacity}. This parameter is required.
         */
        public Builder storageCapacity(final java.lang.Number storageCapacity) {
            this.config.storageCapacity(storageCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_type FsxLustreFileSystem#storage_type}.
         * <p>
         * @return {@code this}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_type FsxLustreFileSystem#storage_type}. This parameter is required.
         */
        public Builder storageType(final java.lang.String storageType) {
            this.config.storageType(storageType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags FsxLustreFileSystem#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags FsxLustreFileSystem#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags_all FsxLustreFileSystem#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags_all FsxLustreFileSystem#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#throughput_capacity FsxLustreFileSystem#throughput_capacity}.
         * <p>
         * @return {@code this}
         * @param throughputCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#throughput_capacity FsxLustreFileSystem#throughput_capacity}. This parameter is required.
         */
        public Builder throughputCapacity(final java.lang.Number throughputCapacity) {
            this.config.throughputCapacity(throughputCapacity);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#timeouts FsxLustreFileSystem#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#weekly_maintenance_start_time FsxLustreFileSystem#weekly_maintenance_start_time}.
         * <p>
         * @return {@code this}
         * @param weeklyMaintenanceStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#weekly_maintenance_start_time FsxLustreFileSystem#weekly_maintenance_start_time}. This parameter is required.
         */
        public Builder weeklyMaintenanceStartTime(final java.lang.String weeklyMaintenanceStartTime) {
            this.config.weeklyMaintenanceStartTime(weeklyMaintenanceStartTime);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.fsx_lustre_file_system.FsxLustreFileSystem}.
         */
        @Override
        public imports.aws.fsx_lustre_file_system.FsxLustreFileSystem build() {
            return new imports.aws.fsx_lustre_file_system.FsxLustreFileSystem(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
