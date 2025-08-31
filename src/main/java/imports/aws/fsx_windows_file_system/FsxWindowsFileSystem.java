package imports.aws.fsx_windows_file_system;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system aws_fsx_windows_file_system}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.257Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxWindowsFileSystem.FsxWindowsFileSystem")
public class FsxWindowsFileSystem extends com.hashicorp.cdktf.TerraformResource {

    protected FsxWindowsFileSystem(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxWindowsFileSystem(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.fsx_windows_file_system.FsxWindowsFileSystem.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system aws_fsx_windows_file_system} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public FsxWindowsFileSystem(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.fsx_windows_file_system.FsxWindowsFileSystemConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a FsxWindowsFileSystem resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FsxWindowsFileSystem to import. This parameter is required.
     * @param importFromId The id of the existing FsxWindowsFileSystem that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the FsxWindowsFileSystem to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.fsx_windows_file_system.FsxWindowsFileSystem.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a FsxWindowsFileSystem resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FsxWindowsFileSystem to import. This parameter is required.
     * @param importFromId The id of the existing FsxWindowsFileSystem that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.fsx_windows_file_system.FsxWindowsFileSystem.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAuditLogConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAuditLogConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDiskIopsConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.fsx_windows_file_system.FsxWindowsFileSystemDiskIopsConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putDiskIopsConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSelfManagedActiveDirectory(final @org.jetbrains.annotations.NotNull imports.aws.fsx_windows_file_system.FsxWindowsFileSystemSelfManagedActiveDirectory value) {
        software.amazon.jsii.Kernel.call(this, "putSelfManagedActiveDirectory", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.fsx_windows_file_system.FsxWindowsFileSystemTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetActiveDirectoryId() {
        software.amazon.jsii.Kernel.call(this, "resetActiveDirectoryId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAliases() {
        software.amazon.jsii.Kernel.call(this, "resetAliases", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuditLogConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAuditLogConfiguration", software.amazon.jsii.NativeType.VOID);
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

    public void resetDeploymentType() {
        software.amazon.jsii.Kernel.call(this, "resetDeploymentType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDiskIopsConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetDiskIopsConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFinalBackupTags() {
        software.amazon.jsii.Kernel.call(this, "resetFinalBackupTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredSubnetId() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredSubnetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSelfManagedActiveDirectory() {
        software.amazon.jsii.Kernel.call(this, "resetSelfManagedActiveDirectory", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfigurationOutputReference getAuditLogConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "auditLogConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_windows_file_system.FsxWindowsFileSystemDiskIopsConfigurationOutputReference getDiskIopsConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "diskIopsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemDiskIopsConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDnsName() {
        return software.amazon.jsii.Kernel.get(this, "dnsName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNetworkInterfaceIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "networkInterfaceIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwnerId() {
        return software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreferredFileServerIp() {
        return software.amazon.jsii.Kernel.get(this, "preferredFileServerIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRemoteAdministrationEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "remoteAdministrationEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_windows_file_system.FsxWindowsFileSystemSelfManagedActiveDirectoryOutputReference getSelfManagedActiveDirectory() {
        return software.amazon.jsii.Kernel.get(this, "selfManagedActiveDirectory", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemSelfManagedActiveDirectoryOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_windows_file_system.FsxWindowsFileSystemTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcId() {
        return software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getActiveDirectoryIdInput() {
        return software.amazon.jsii.Kernel.get(this, "activeDirectoryIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAliasesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "aliasesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfiguration getAuditLogConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "auditLogConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfiguration.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getDeploymentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_windows_file_system.FsxWindowsFileSystemDiskIopsConfiguration getDiskIopsConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "diskIopsConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemDiskIopsConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getFinalBackupTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "finalBackupTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreferredSubnetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "preferredSubnetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_windows_file_system.FsxWindowsFileSystemSelfManagedActiveDirectory getSelfManagedActiveDirectoryInput() {
        return software.amazon.jsii.Kernel.get(this, "selfManagedActiveDirectoryInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemSelfManagedActiveDirectory.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getActiveDirectoryId() {
        return software.amazon.jsii.Kernel.get(this, "activeDirectoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setActiveDirectoryId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "activeDirectoryId", java.util.Objects.requireNonNull(value, "activeDirectoryId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAliases() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "aliases", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAliases(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "aliases", java.util.Objects.requireNonNull(value, "aliases is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentType() {
        return software.amazon.jsii.Kernel.get(this, "deploymentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeploymentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deploymentType", java.util.Objects.requireNonNull(value, "deploymentType is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreferredSubnetId() {
        return software.amazon.jsii.Kernel.get(this, "preferredSubnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreferredSubnetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preferredSubnetId", java.util.Objects.requireNonNull(value, "preferredSubnetId is required"));
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
     * A fluent builder for {@link imports.aws.fsx_windows_file_system.FsxWindowsFileSystem}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.fsx_windows_file_system.FsxWindowsFileSystem> {
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
        private final imports.aws.fsx_windows_file_system.FsxWindowsFileSystemConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.fsx_windows_file_system.FsxWindowsFileSystemConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#subnet_ids FsxWindowsFileSystem#subnet_ids}.
         * <p>
         * @return {@code this}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#subnet_ids FsxWindowsFileSystem#subnet_ids}. This parameter is required.
         */
        public Builder subnetIds(final java.util.List<java.lang.String> subnetIds) {
            this.config.subnetIds(subnetIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#throughput_capacity FsxWindowsFileSystem#throughput_capacity}.
         * <p>
         * @return {@code this}
         * @param throughputCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#throughput_capacity FsxWindowsFileSystem#throughput_capacity}. This parameter is required.
         */
        public Builder throughputCapacity(final java.lang.Number throughputCapacity) {
            this.config.throughputCapacity(throughputCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#active_directory_id FsxWindowsFileSystem#active_directory_id}.
         * <p>
         * @return {@code this}
         * @param activeDirectoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#active_directory_id FsxWindowsFileSystem#active_directory_id}. This parameter is required.
         */
        public Builder activeDirectoryId(final java.lang.String activeDirectoryId) {
            this.config.activeDirectoryId(activeDirectoryId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#aliases FsxWindowsFileSystem#aliases}.
         * <p>
         * @return {@code this}
         * @param aliases Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#aliases FsxWindowsFileSystem#aliases}. This parameter is required.
         */
        public Builder aliases(final java.util.List<java.lang.String> aliases) {
            this.config.aliases(aliases);
            return this;
        }

        /**
         * audit_log_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#audit_log_configuration FsxWindowsFileSystem#audit_log_configuration}
         * <p>
         * @return {@code this}
         * @param auditLogConfiguration audit_log_configuration block. This parameter is required.
         */
        public Builder auditLogConfiguration(final imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfiguration auditLogConfiguration) {
            this.config.auditLogConfiguration(auditLogConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#automatic_backup_retention_days FsxWindowsFileSystem#automatic_backup_retention_days}.
         * <p>
         * @return {@code this}
         * @param automaticBackupRetentionDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#automatic_backup_retention_days FsxWindowsFileSystem#automatic_backup_retention_days}. This parameter is required.
         */
        public Builder automaticBackupRetentionDays(final java.lang.Number automaticBackupRetentionDays) {
            this.config.automaticBackupRetentionDays(automaticBackupRetentionDays);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#backup_id FsxWindowsFileSystem#backup_id}.
         * <p>
         * @return {@code this}
         * @param backupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#backup_id FsxWindowsFileSystem#backup_id}. This parameter is required.
         */
        public Builder backupId(final java.lang.String backupId) {
            this.config.backupId(backupId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#copy_tags_to_backups FsxWindowsFileSystem#copy_tags_to_backups}.
         * <p>
         * @return {@code this}
         * @param copyTagsToBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#copy_tags_to_backups FsxWindowsFileSystem#copy_tags_to_backups}. This parameter is required.
         */
        public Builder copyTagsToBackups(final java.lang.Boolean copyTagsToBackups) {
            this.config.copyTagsToBackups(copyTagsToBackups);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#copy_tags_to_backups FsxWindowsFileSystem#copy_tags_to_backups}.
         * <p>
         * @return {@code this}
         * @param copyTagsToBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#copy_tags_to_backups FsxWindowsFileSystem#copy_tags_to_backups}. This parameter is required.
         */
        public Builder copyTagsToBackups(final com.hashicorp.cdktf.IResolvable copyTagsToBackups) {
            this.config.copyTagsToBackups(copyTagsToBackups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#daily_automatic_backup_start_time FsxWindowsFileSystem#daily_automatic_backup_start_time}.
         * <p>
         * @return {@code this}
         * @param dailyAutomaticBackupStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#daily_automatic_backup_start_time FsxWindowsFileSystem#daily_automatic_backup_start_time}. This parameter is required.
         */
        public Builder dailyAutomaticBackupStartTime(final java.lang.String dailyAutomaticBackupStartTime) {
            this.config.dailyAutomaticBackupStartTime(dailyAutomaticBackupStartTime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#deployment_type FsxWindowsFileSystem#deployment_type}.
         * <p>
         * @return {@code this}
         * @param deploymentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#deployment_type FsxWindowsFileSystem#deployment_type}. This parameter is required.
         */
        public Builder deploymentType(final java.lang.String deploymentType) {
            this.config.deploymentType(deploymentType);
            return this;
        }

        /**
         * disk_iops_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#disk_iops_configuration FsxWindowsFileSystem#disk_iops_configuration}
         * <p>
         * @return {@code this}
         * @param diskIopsConfiguration disk_iops_configuration block. This parameter is required.
         */
        public Builder diskIopsConfiguration(final imports.aws.fsx_windows_file_system.FsxWindowsFileSystemDiskIopsConfiguration diskIopsConfiguration) {
            this.config.diskIopsConfiguration(diskIopsConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#final_backup_tags FsxWindowsFileSystem#final_backup_tags}.
         * <p>
         * @return {@code this}
         * @param finalBackupTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#final_backup_tags FsxWindowsFileSystem#final_backup_tags}. This parameter is required.
         */
        public Builder finalBackupTags(final java.util.Map<java.lang.String, java.lang.String> finalBackupTags) {
            this.config.finalBackupTags(finalBackupTags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#id FsxWindowsFileSystem#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#id FsxWindowsFileSystem#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#kms_key_id FsxWindowsFileSystem#kms_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#kms_key_id FsxWindowsFileSystem#kms_key_id}. This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config.kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#preferred_subnet_id FsxWindowsFileSystem#preferred_subnet_id}.
         * <p>
         * @return {@code this}
         * @param preferredSubnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#preferred_subnet_id FsxWindowsFileSystem#preferred_subnet_id}. This parameter is required.
         */
        public Builder preferredSubnetId(final java.lang.String preferredSubnetId) {
            this.config.preferredSubnetId(preferredSubnetId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#security_group_ids FsxWindowsFileSystem#security_group_ids}.
         * <p>
         * @return {@code this}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#security_group_ids FsxWindowsFileSystem#security_group_ids}. This parameter is required.
         */
        public Builder securityGroupIds(final java.util.List<java.lang.String> securityGroupIds) {
            this.config.securityGroupIds(securityGroupIds);
            return this;
        }

        /**
         * self_managed_active_directory block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#self_managed_active_directory FsxWindowsFileSystem#self_managed_active_directory}
         * <p>
         * @return {@code this}
         * @param selfManagedActiveDirectory self_managed_active_directory block. This parameter is required.
         */
        public Builder selfManagedActiveDirectory(final imports.aws.fsx_windows_file_system.FsxWindowsFileSystemSelfManagedActiveDirectory selfManagedActiveDirectory) {
            this.config.selfManagedActiveDirectory(selfManagedActiveDirectory);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#skip_final_backup FsxWindowsFileSystem#skip_final_backup}.
         * <p>
         * @return {@code this}
         * @param skipFinalBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#skip_final_backup FsxWindowsFileSystem#skip_final_backup}. This parameter is required.
         */
        public Builder skipFinalBackup(final java.lang.Boolean skipFinalBackup) {
            this.config.skipFinalBackup(skipFinalBackup);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#skip_final_backup FsxWindowsFileSystem#skip_final_backup}.
         * <p>
         * @return {@code this}
         * @param skipFinalBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#skip_final_backup FsxWindowsFileSystem#skip_final_backup}. This parameter is required.
         */
        public Builder skipFinalBackup(final com.hashicorp.cdktf.IResolvable skipFinalBackup) {
            this.config.skipFinalBackup(skipFinalBackup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#storage_capacity FsxWindowsFileSystem#storage_capacity}.
         * <p>
         * @return {@code this}
         * @param storageCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#storage_capacity FsxWindowsFileSystem#storage_capacity}. This parameter is required.
         */
        public Builder storageCapacity(final java.lang.Number storageCapacity) {
            this.config.storageCapacity(storageCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#storage_type FsxWindowsFileSystem#storage_type}.
         * <p>
         * @return {@code this}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#storage_type FsxWindowsFileSystem#storage_type}. This parameter is required.
         */
        public Builder storageType(final java.lang.String storageType) {
            this.config.storageType(storageType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#tags FsxWindowsFileSystem#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#tags FsxWindowsFileSystem#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#tags_all FsxWindowsFileSystem#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#tags_all FsxWindowsFileSystem#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#timeouts FsxWindowsFileSystem#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.fsx_windows_file_system.FsxWindowsFileSystemTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#weekly_maintenance_start_time FsxWindowsFileSystem#weekly_maintenance_start_time}.
         * <p>
         * @return {@code this}
         * @param weeklyMaintenanceStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#weekly_maintenance_start_time FsxWindowsFileSystem#weekly_maintenance_start_time}. This parameter is required.
         */
        public Builder weeklyMaintenanceStartTime(final java.lang.String weeklyMaintenanceStartTime) {
            this.config.weeklyMaintenanceStartTime(weeklyMaintenanceStartTime);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.fsx_windows_file_system.FsxWindowsFileSystem}.
         */
        @Override
        public imports.aws.fsx_windows_file_system.FsxWindowsFileSystem build() {
            return new imports.aws.fsx_windows_file_system.FsxWindowsFileSystem(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
