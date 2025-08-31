package imports.aws.fsx_ontap_volume;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume aws_fsx_ontap_volume}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.248Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOntapVolume.FsxOntapVolume")
public class FsxOntapVolume extends com.hashicorp.cdktf.TerraformResource {

    protected FsxOntapVolume(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxOntapVolume(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.fsx_ontap_volume.FsxOntapVolume.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume aws_fsx_ontap_volume} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public FsxOntapVolume(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a FsxOntapVolume resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FsxOntapVolume to import. This parameter is required.
     * @param importFromId The id of the existing FsxOntapVolume that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the FsxOntapVolume to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.fsx_ontap_volume.FsxOntapVolume.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a FsxOntapVolume resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FsxOntapVolume to import. This parameter is required.
     * @param importFromId The id of the existing FsxOntapVolume that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.fsx_ontap_volume.FsxOntapVolume.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAggregateConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAggregateConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSnaplockConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSnaplockConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTieringPolicy(final @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeTieringPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putTieringPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAggregateConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAggregateConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBypassSnaplockEnterpriseRetention() {
        software.amazon.jsii.Kernel.call(this, "resetBypassSnaplockEnterpriseRetention", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCopyTagsToBackups() {
        software.amazon.jsii.Kernel.call(this, "resetCopyTagsToBackups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFinalBackupTags() {
        software.amazon.jsii.Kernel.call(this, "resetFinalBackupTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJunctionPath() {
        software.amazon.jsii.Kernel.call(this, "resetJunctionPath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOntapVolumeType() {
        software.amazon.jsii.Kernel.call(this, "resetOntapVolumeType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityStyle() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityStyle", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSizeInBytes() {
        software.amazon.jsii.Kernel.call(this, "resetSizeInBytes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSizeInMegabytes() {
        software.amazon.jsii.Kernel.call(this, "resetSizeInMegabytes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkipFinalBackup() {
        software.amazon.jsii.Kernel.call(this, "resetSkipFinalBackup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnaplockConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSnaplockConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStorageEfficiencyEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetStorageEfficiencyEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTieringPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetTieringPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumeStyle() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeStyle", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumeType() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeType", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfigurationOutputReference getAggregateConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "aggregateConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileSystemId() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFlexcacheEndpointType() {
        return software.amazon.jsii.Kernel.get(this, "flexcacheEndpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationOutputReference getSnaplockConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "snaplockConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeTieringPolicyOutputReference getTieringPolicy() {
        return software.amazon.jsii.Kernel.get(this, "tieringPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeTieringPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUuid() {
        return software.amazon.jsii.Kernel.get(this, "uuid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfiguration getAggregateConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "aggregateConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBypassSnaplockEnterpriseRetentionInput() {
        return software.amazon.jsii.Kernel.get(this, "bypassSnaplockEnterpriseRetentionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToBackupsInput() {
        return software.amazon.jsii.Kernel.get(this, "copyTagsToBackupsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getFinalBackupTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "finalBackupTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJunctionPathInput() {
        return software.amazon.jsii.Kernel.get(this, "junctionPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOntapVolumeTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "ontapVolumeTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecurityStyleInput() {
        return software.amazon.jsii.Kernel.get(this, "securityStyleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSizeInBytesInput() {
        return software.amazon.jsii.Kernel.get(this, "sizeInBytesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSizeInMegabytesInput() {
        return software.amazon.jsii.Kernel.get(this, "sizeInMegabytesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalBackupInput() {
        return software.amazon.jsii.Kernel.get(this, "skipFinalBackupInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfiguration getSnaplockConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "snaplockConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnapshotPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStorageEfficiencyEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "storageEfficiencyEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStorageVirtualMachineIdInput() {
        return software.amazon.jsii.Kernel.get(this, "storageVirtualMachineIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeTieringPolicy getTieringPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "tieringPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeTieringPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVolumeStyleInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeStyleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVolumeTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBypassSnaplockEnterpriseRetention() {
        return software.amazon.jsii.Kernel.get(this, "bypassSnaplockEnterpriseRetention", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBypassSnaplockEnterpriseRetention(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "bypassSnaplockEnterpriseRetention", java.util.Objects.requireNonNull(value, "bypassSnaplockEnterpriseRetention is required"));
    }

    public void setBypassSnaplockEnterpriseRetention(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "bypassSnaplockEnterpriseRetention", java.util.Objects.requireNonNull(value, "bypassSnaplockEnterpriseRetention is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getJunctionPath() {
        return software.amazon.jsii.Kernel.get(this, "junctionPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJunctionPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "junctionPath", java.util.Objects.requireNonNull(value, "junctionPath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOntapVolumeType() {
        return software.amazon.jsii.Kernel.get(this, "ontapVolumeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOntapVolumeType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ontapVolumeType", java.util.Objects.requireNonNull(value, "ontapVolumeType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityStyle() {
        return software.amazon.jsii.Kernel.get(this, "securityStyle", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecurityStyle(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "securityStyle", java.util.Objects.requireNonNull(value, "securityStyle is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSizeInBytes() {
        return software.amazon.jsii.Kernel.get(this, "sizeInBytes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSizeInBytes(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sizeInBytes", java.util.Objects.requireNonNull(value, "sizeInBytes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSizeInMegabytes() {
        return software.amazon.jsii.Kernel.get(this, "sizeInMegabytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSizeInMegabytes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sizeInMegabytes", java.util.Objects.requireNonNull(value, "sizeInMegabytes is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getSnapshotPolicy() {
        return software.amazon.jsii.Kernel.get(this, "snapshotPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnapshotPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snapshotPolicy", java.util.Objects.requireNonNull(value, "snapshotPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getStorageEfficiencyEnabled() {
        return software.amazon.jsii.Kernel.get(this, "storageEfficiencyEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setStorageEfficiencyEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "storageEfficiencyEnabled", java.util.Objects.requireNonNull(value, "storageEfficiencyEnabled is required"));
    }

    public void setStorageEfficiencyEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "storageEfficiencyEnabled", java.util.Objects.requireNonNull(value, "storageEfficiencyEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStorageVirtualMachineId() {
        return software.amazon.jsii.Kernel.get(this, "storageVirtualMachineId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStorageVirtualMachineId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "storageVirtualMachineId", java.util.Objects.requireNonNull(value, "storageVirtualMachineId is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getVolumeStyle() {
        return software.amazon.jsii.Kernel.get(this, "volumeStyle", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVolumeStyle(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "volumeStyle", java.util.Objects.requireNonNull(value, "volumeStyle is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVolumeType() {
        return software.amazon.jsii.Kernel.get(this, "volumeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVolumeType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "volumeType", java.util.Objects.requireNonNull(value, "volumeType is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.fsx_ontap_volume.FsxOntapVolume}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.fsx_ontap_volume.FsxOntapVolume> {
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
        private final imports.aws.fsx_ontap_volume.FsxOntapVolumeConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.fsx_ontap_volume.FsxOntapVolumeConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#name FsxOntapVolume#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#name FsxOntapVolume#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_virtual_machine_id FsxOntapVolume#storage_virtual_machine_id}.
         * <p>
         * @return {@code this}
         * @param storageVirtualMachineId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_virtual_machine_id FsxOntapVolume#storage_virtual_machine_id}. This parameter is required.
         */
        public Builder storageVirtualMachineId(final java.lang.String storageVirtualMachineId) {
            this.config.storageVirtualMachineId(storageVirtualMachineId);
            return this;
        }

        /**
         * aggregate_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#aggregate_configuration FsxOntapVolume#aggregate_configuration}
         * <p>
         * @return {@code this}
         * @param aggregateConfiguration aggregate_configuration block. This parameter is required.
         */
        public Builder aggregateConfiguration(final imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfiguration aggregateConfiguration) {
            this.config.aggregateConfiguration(aggregateConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#bypass_snaplock_enterprise_retention FsxOntapVolume#bypass_snaplock_enterprise_retention}.
         * <p>
         * @return {@code this}
         * @param bypassSnaplockEnterpriseRetention Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#bypass_snaplock_enterprise_retention FsxOntapVolume#bypass_snaplock_enterprise_retention}. This parameter is required.
         */
        public Builder bypassSnaplockEnterpriseRetention(final java.lang.Boolean bypassSnaplockEnterpriseRetention) {
            this.config.bypassSnaplockEnterpriseRetention(bypassSnaplockEnterpriseRetention);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#bypass_snaplock_enterprise_retention FsxOntapVolume#bypass_snaplock_enterprise_retention}.
         * <p>
         * @return {@code this}
         * @param bypassSnaplockEnterpriseRetention Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#bypass_snaplock_enterprise_retention FsxOntapVolume#bypass_snaplock_enterprise_retention}. This parameter is required.
         */
        public Builder bypassSnaplockEnterpriseRetention(final com.hashicorp.cdktf.IResolvable bypassSnaplockEnterpriseRetention) {
            this.config.bypassSnaplockEnterpriseRetention(bypassSnaplockEnterpriseRetention);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#copy_tags_to_backups FsxOntapVolume#copy_tags_to_backups}.
         * <p>
         * @return {@code this}
         * @param copyTagsToBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#copy_tags_to_backups FsxOntapVolume#copy_tags_to_backups}. This parameter is required.
         */
        public Builder copyTagsToBackups(final java.lang.Boolean copyTagsToBackups) {
            this.config.copyTagsToBackups(copyTagsToBackups);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#copy_tags_to_backups FsxOntapVolume#copy_tags_to_backups}.
         * <p>
         * @return {@code this}
         * @param copyTagsToBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#copy_tags_to_backups FsxOntapVolume#copy_tags_to_backups}. This parameter is required.
         */
        public Builder copyTagsToBackups(final com.hashicorp.cdktf.IResolvable copyTagsToBackups) {
            this.config.copyTagsToBackups(copyTagsToBackups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#final_backup_tags FsxOntapVolume#final_backup_tags}.
         * <p>
         * @return {@code this}
         * @param finalBackupTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#final_backup_tags FsxOntapVolume#final_backup_tags}. This parameter is required.
         */
        public Builder finalBackupTags(final java.util.Map<java.lang.String, java.lang.String> finalBackupTags) {
            this.config.finalBackupTags(finalBackupTags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#id FsxOntapVolume#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#id FsxOntapVolume#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#junction_path FsxOntapVolume#junction_path}.
         * <p>
         * @return {@code this}
         * @param junctionPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#junction_path FsxOntapVolume#junction_path}. This parameter is required.
         */
        public Builder junctionPath(final java.lang.String junctionPath) {
            this.config.junctionPath(junctionPath);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#ontap_volume_type FsxOntapVolume#ontap_volume_type}.
         * <p>
         * @return {@code this}
         * @param ontapVolumeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#ontap_volume_type FsxOntapVolume#ontap_volume_type}. This parameter is required.
         */
        public Builder ontapVolumeType(final java.lang.String ontapVolumeType) {
            this.config.ontapVolumeType(ontapVolumeType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#security_style FsxOntapVolume#security_style}.
         * <p>
         * @return {@code this}
         * @param securityStyle Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#security_style FsxOntapVolume#security_style}. This parameter is required.
         */
        public Builder securityStyle(final java.lang.String securityStyle) {
            this.config.securityStyle(securityStyle);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_bytes FsxOntapVolume#size_in_bytes}.
         * <p>
         * @return {@code this}
         * @param sizeInBytes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_bytes FsxOntapVolume#size_in_bytes}. This parameter is required.
         */
        public Builder sizeInBytes(final java.lang.String sizeInBytes) {
            this.config.sizeInBytes(sizeInBytes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_megabytes FsxOntapVolume#size_in_megabytes}.
         * <p>
         * @return {@code this}
         * @param sizeInMegabytes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_megabytes FsxOntapVolume#size_in_megabytes}. This parameter is required.
         */
        public Builder sizeInMegabytes(final java.lang.Number sizeInMegabytes) {
            this.config.sizeInMegabytes(sizeInMegabytes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#skip_final_backup FsxOntapVolume#skip_final_backup}.
         * <p>
         * @return {@code this}
         * @param skipFinalBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#skip_final_backup FsxOntapVolume#skip_final_backup}. This parameter is required.
         */
        public Builder skipFinalBackup(final java.lang.Boolean skipFinalBackup) {
            this.config.skipFinalBackup(skipFinalBackup);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#skip_final_backup FsxOntapVolume#skip_final_backup}.
         * <p>
         * @return {@code this}
         * @param skipFinalBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#skip_final_backup FsxOntapVolume#skip_final_backup}. This parameter is required.
         */
        public Builder skipFinalBackup(final com.hashicorp.cdktf.IResolvable skipFinalBackup) {
            this.config.skipFinalBackup(skipFinalBackup);
            return this;
        }

        /**
         * snaplock_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snaplock_configuration FsxOntapVolume#snaplock_configuration}
         * <p>
         * @return {@code this}
         * @param snaplockConfiguration snaplock_configuration block. This parameter is required.
         */
        public Builder snaplockConfiguration(final imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfiguration snaplockConfiguration) {
            this.config.snaplockConfiguration(snaplockConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snapshot_policy FsxOntapVolume#snapshot_policy}.
         * <p>
         * @return {@code this}
         * @param snapshotPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snapshot_policy FsxOntapVolume#snapshot_policy}. This parameter is required.
         */
        public Builder snapshotPolicy(final java.lang.String snapshotPolicy) {
            this.config.snapshotPolicy(snapshotPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_efficiency_enabled FsxOntapVolume#storage_efficiency_enabled}.
         * <p>
         * @return {@code this}
         * @param storageEfficiencyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_efficiency_enabled FsxOntapVolume#storage_efficiency_enabled}. This parameter is required.
         */
        public Builder storageEfficiencyEnabled(final java.lang.Boolean storageEfficiencyEnabled) {
            this.config.storageEfficiencyEnabled(storageEfficiencyEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_efficiency_enabled FsxOntapVolume#storage_efficiency_enabled}.
         * <p>
         * @return {@code this}
         * @param storageEfficiencyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_efficiency_enabled FsxOntapVolume#storage_efficiency_enabled}. This parameter is required.
         */
        public Builder storageEfficiencyEnabled(final com.hashicorp.cdktf.IResolvable storageEfficiencyEnabled) {
            this.config.storageEfficiencyEnabled(storageEfficiencyEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags FsxOntapVolume#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags FsxOntapVolume#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags_all FsxOntapVolume#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags_all FsxOntapVolume#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * tiering_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tiering_policy FsxOntapVolume#tiering_policy}
         * <p>
         * @return {@code this}
         * @param tieringPolicy tiering_policy block. This parameter is required.
         */
        public Builder tieringPolicy(final imports.aws.fsx_ontap_volume.FsxOntapVolumeTieringPolicy tieringPolicy) {
            this.config.tieringPolicy(tieringPolicy);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#timeouts FsxOntapVolume#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.fsx_ontap_volume.FsxOntapVolumeTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_style FsxOntapVolume#volume_style}.
         * <p>
         * @return {@code this}
         * @param volumeStyle Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_style FsxOntapVolume#volume_style}. This parameter is required.
         */
        public Builder volumeStyle(final java.lang.String volumeStyle) {
            this.config.volumeStyle(volumeStyle);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_type FsxOntapVolume#volume_type}.
         * <p>
         * @return {@code this}
         * @param volumeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_type FsxOntapVolume#volume_type}. This parameter is required.
         */
        public Builder volumeType(final java.lang.String volumeType) {
            this.config.volumeType(volumeType);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.fsx_ontap_volume.FsxOntapVolume}.
         */
        @Override
        public imports.aws.fsx_ontap_volume.FsxOntapVolume build() {
            return new imports.aws.fsx_ontap_volume.FsxOntapVolume(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
