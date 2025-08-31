package imports.aws.fsx_openzfs_volume;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume aws_fsx_openzfs_volume}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.256Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOpenzfsVolume.FsxOpenzfsVolume")
public class FsxOpenzfsVolume extends com.hashicorp.cdktf.TerraformResource {

    protected FsxOpenzfsVolume(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxOpenzfsVolume(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolume.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume aws_fsx_openzfs_volume} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public FsxOpenzfsVolume(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a FsxOpenzfsVolume resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FsxOpenzfsVolume to import. This parameter is required.
     * @param importFromId The id of the existing FsxOpenzfsVolume that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the FsxOpenzfsVolume to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolume.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a FsxOpenzfsVolume resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FsxOpenzfsVolume to import. This parameter is required.
     * @param importFromId The id of the existing FsxOpenzfsVolume that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolume.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putNfsExports(final @org.jetbrains.annotations.NotNull imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeNfsExports value) {
        software.amazon.jsii.Kernel.call(this, "putNfsExports", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOriginSnapshot(final @org.jetbrains.annotations.NotNull imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeOriginSnapshot value) {
        software.amazon.jsii.Kernel.call(this, "putOriginSnapshot", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUserAndGroupQuotas(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeUserAndGroupQuotas>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeUserAndGroupQuotas> __cast_cd4240 = (java.util.List<imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeUserAndGroupQuotas>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeUserAndGroupQuotas __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putUserAndGroupQuotas", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCopyTagsToSnapshots() {
        software.amazon.jsii.Kernel.call(this, "resetCopyTagsToSnapshots", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataCompressionType() {
        software.amazon.jsii.Kernel.call(this, "resetDataCompressionType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeleteVolumeOptions() {
        software.amazon.jsii.Kernel.call(this, "resetDeleteVolumeOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNfsExports() {
        software.amazon.jsii.Kernel.call(this, "resetNfsExports", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOriginSnapshot() {
        software.amazon.jsii.Kernel.call(this, "resetOriginSnapshot", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReadOnly() {
        software.amazon.jsii.Kernel.call(this, "resetReadOnly", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecordSizeKib() {
        software.amazon.jsii.Kernel.call(this, "resetRecordSizeKib", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStorageCapacityQuotaGib() {
        software.amazon.jsii.Kernel.call(this, "resetStorageCapacityQuotaGib", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStorageCapacityReservationGib() {
        software.amazon.jsii.Kernel.call(this, "resetStorageCapacityReservationGib", software.amazon.jsii.NativeType.VOID);
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

    public void resetUserAndGroupQuotas() {
        software.amazon.jsii.Kernel.call(this, "resetUserAndGroupQuotas", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeNfsExportsOutputReference getNfsExports() {
        return software.amazon.jsii.Kernel.get(this, "nfsExports", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeNfsExportsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeOriginSnapshotOutputReference getOriginSnapshot() {
        return software.amazon.jsii.Kernel.get(this, "originSnapshot", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeOriginSnapshotOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeUserAndGroupQuotasList getUserAndGroupQuotas() {
        return software.amazon.jsii.Kernel.get(this, "userAndGroupQuotas", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeUserAndGroupQuotasList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToSnapshotsInput() {
        return software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshotsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataCompressionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "dataCompressionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDeleteVolumeOptionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "deleteVolumeOptionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeNfsExports getNfsExportsInput() {
        return software.amazon.jsii.Kernel.get(this, "nfsExportsInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeNfsExports.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeOriginSnapshot getOriginSnapshotInput() {
        return software.amazon.jsii.Kernel.get(this, "originSnapshotInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeOriginSnapshot.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getParentVolumeIdInput() {
        return software.amazon.jsii.Kernel.get(this, "parentVolumeIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReadOnlyInput() {
        return software.amazon.jsii.Kernel.get(this, "readOnlyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRecordSizeKibInput() {
        return software.amazon.jsii.Kernel.get(this, "recordSizeKibInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getStorageCapacityQuotaGibInput() {
        return software.amazon.jsii.Kernel.get(this, "storageCapacityQuotaGibInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getStorageCapacityReservationGibInput() {
        return software.amazon.jsii.Kernel.get(this, "storageCapacityReservationGibInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getUserAndGroupQuotasInput() {
        return software.amazon.jsii.Kernel.get(this, "userAndGroupQuotasInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVolumeTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCopyTagsToSnapshots() {
        return software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshots", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCopyTagsToSnapshots(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "copyTagsToSnapshots", java.util.Objects.requireNonNull(value, "copyTagsToSnapshots is required"));
    }

    public void setCopyTagsToSnapshots(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "copyTagsToSnapshots", java.util.Objects.requireNonNull(value, "copyTagsToSnapshots is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataCompressionType() {
        return software.amazon.jsii.Kernel.get(this, "dataCompressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataCompressionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataCompressionType", java.util.Objects.requireNonNull(value, "dataCompressionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDeleteVolumeOptions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "deleteVolumeOptions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setDeleteVolumeOptions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "deleteVolumeOptions", java.util.Objects.requireNonNull(value, "deleteVolumeOptions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getParentVolumeId() {
        return software.amazon.jsii.Kernel.get(this, "parentVolumeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setParentVolumeId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "parentVolumeId", java.util.Objects.requireNonNull(value, "parentVolumeId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getReadOnly() {
        return software.amazon.jsii.Kernel.get(this, "readOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setReadOnly(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "readOnly", java.util.Objects.requireNonNull(value, "readOnly is required"));
    }

    public void setReadOnly(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "readOnly", java.util.Objects.requireNonNull(value, "readOnly is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRecordSizeKib() {
        return software.amazon.jsii.Kernel.get(this, "recordSizeKib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRecordSizeKib(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "recordSizeKib", java.util.Objects.requireNonNull(value, "recordSizeKib is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getStorageCapacityQuotaGib() {
        return software.amazon.jsii.Kernel.get(this, "storageCapacityQuotaGib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setStorageCapacityQuotaGib(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "storageCapacityQuotaGib", java.util.Objects.requireNonNull(value, "storageCapacityQuotaGib is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getStorageCapacityReservationGib() {
        return software.amazon.jsii.Kernel.get(this, "storageCapacityReservationGib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setStorageCapacityReservationGib(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "storageCapacityReservationGib", java.util.Objects.requireNonNull(value, "storageCapacityReservationGib is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getVolumeType() {
        return software.amazon.jsii.Kernel.get(this, "volumeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVolumeType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "volumeType", java.util.Objects.requireNonNull(value, "volumeType is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.fsx_openzfs_volume.FsxOpenzfsVolume}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.fsx_openzfs_volume.FsxOpenzfsVolume> {
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
        private final imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#name FsxOpenzfsVolume#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#name FsxOpenzfsVolume#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#parent_volume_id FsxOpenzfsVolume#parent_volume_id}.
         * <p>
         * @return {@code this}
         * @param parentVolumeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#parent_volume_id FsxOpenzfsVolume#parent_volume_id}. This parameter is required.
         */
        public Builder parentVolumeId(final java.lang.String parentVolumeId) {
            this.config.parentVolumeId(parentVolumeId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#copy_tags_to_snapshots FsxOpenzfsVolume#copy_tags_to_snapshots}.
         * <p>
         * @return {@code this}
         * @param copyTagsToSnapshots Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#copy_tags_to_snapshots FsxOpenzfsVolume#copy_tags_to_snapshots}. This parameter is required.
         */
        public Builder copyTagsToSnapshots(final java.lang.Boolean copyTagsToSnapshots) {
            this.config.copyTagsToSnapshots(copyTagsToSnapshots);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#copy_tags_to_snapshots FsxOpenzfsVolume#copy_tags_to_snapshots}.
         * <p>
         * @return {@code this}
         * @param copyTagsToSnapshots Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#copy_tags_to_snapshots FsxOpenzfsVolume#copy_tags_to_snapshots}. This parameter is required.
         */
        public Builder copyTagsToSnapshots(final com.hashicorp.cdktf.IResolvable copyTagsToSnapshots) {
            this.config.copyTagsToSnapshots(copyTagsToSnapshots);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#data_compression_type FsxOpenzfsVolume#data_compression_type}.
         * <p>
         * @return {@code this}
         * @param dataCompressionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#data_compression_type FsxOpenzfsVolume#data_compression_type}. This parameter is required.
         */
        public Builder dataCompressionType(final java.lang.String dataCompressionType) {
            this.config.dataCompressionType(dataCompressionType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#delete_volume_options FsxOpenzfsVolume#delete_volume_options}.
         * <p>
         * @return {@code this}
         * @param deleteVolumeOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#delete_volume_options FsxOpenzfsVolume#delete_volume_options}. This parameter is required.
         */
        public Builder deleteVolumeOptions(final java.util.List<java.lang.String> deleteVolumeOptions) {
            this.config.deleteVolumeOptions(deleteVolumeOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#id FsxOpenzfsVolume#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#id FsxOpenzfsVolume#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * nfs_exports block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#nfs_exports FsxOpenzfsVolume#nfs_exports}
         * <p>
         * @return {@code this}
         * @param nfsExports nfs_exports block. This parameter is required.
         */
        public Builder nfsExports(final imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeNfsExports nfsExports) {
            this.config.nfsExports(nfsExports);
            return this;
        }

        /**
         * origin_snapshot block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#origin_snapshot FsxOpenzfsVolume#origin_snapshot}
         * <p>
         * @return {@code this}
         * @param originSnapshot origin_snapshot block. This parameter is required.
         */
        public Builder originSnapshot(final imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeOriginSnapshot originSnapshot) {
            this.config.originSnapshot(originSnapshot);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#read_only FsxOpenzfsVolume#read_only}.
         * <p>
         * @return {@code this}
         * @param readOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#read_only FsxOpenzfsVolume#read_only}. This parameter is required.
         */
        public Builder readOnly(final java.lang.Boolean readOnly) {
            this.config.readOnly(readOnly);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#read_only FsxOpenzfsVolume#read_only}.
         * <p>
         * @return {@code this}
         * @param readOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#read_only FsxOpenzfsVolume#read_only}. This parameter is required.
         */
        public Builder readOnly(final com.hashicorp.cdktf.IResolvable readOnly) {
            this.config.readOnly(readOnly);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#record_size_kib FsxOpenzfsVolume#record_size_kib}.
         * <p>
         * @return {@code this}
         * @param recordSizeKib Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#record_size_kib FsxOpenzfsVolume#record_size_kib}. This parameter is required.
         */
        public Builder recordSizeKib(final java.lang.Number recordSizeKib) {
            this.config.recordSizeKib(recordSizeKib);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#storage_capacity_quota_gib FsxOpenzfsVolume#storage_capacity_quota_gib}.
         * <p>
         * @return {@code this}
         * @param storageCapacityQuotaGib Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#storage_capacity_quota_gib FsxOpenzfsVolume#storage_capacity_quota_gib}. This parameter is required.
         */
        public Builder storageCapacityQuotaGib(final java.lang.Number storageCapacityQuotaGib) {
            this.config.storageCapacityQuotaGib(storageCapacityQuotaGib);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#storage_capacity_reservation_gib FsxOpenzfsVolume#storage_capacity_reservation_gib}.
         * <p>
         * @return {@code this}
         * @param storageCapacityReservationGib Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#storage_capacity_reservation_gib FsxOpenzfsVolume#storage_capacity_reservation_gib}. This parameter is required.
         */
        public Builder storageCapacityReservationGib(final java.lang.Number storageCapacityReservationGib) {
            this.config.storageCapacityReservationGib(storageCapacityReservationGib);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#tags FsxOpenzfsVolume#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#tags FsxOpenzfsVolume#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#tags_all FsxOpenzfsVolume#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#tags_all FsxOpenzfsVolume#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#timeouts FsxOpenzfsVolume#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * user_and_group_quotas block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#user_and_group_quotas FsxOpenzfsVolume#user_and_group_quotas}
         * <p>
         * @return {@code this}
         * @param userAndGroupQuotas user_and_group_quotas block. This parameter is required.
         */
        public Builder userAndGroupQuotas(final com.hashicorp.cdktf.IResolvable userAndGroupQuotas) {
            this.config.userAndGroupQuotas(userAndGroupQuotas);
            return this;
        }
        /**
         * user_and_group_quotas block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#user_and_group_quotas FsxOpenzfsVolume#user_and_group_quotas}
         * <p>
         * @return {@code this}
         * @param userAndGroupQuotas user_and_group_quotas block. This parameter is required.
         */
        public Builder userAndGroupQuotas(final java.util.List<? extends imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeUserAndGroupQuotas> userAndGroupQuotas) {
            this.config.userAndGroupQuotas(userAndGroupQuotas);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#volume_type FsxOpenzfsVolume#volume_type}.
         * <p>
         * @return {@code this}
         * @param volumeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#volume_type FsxOpenzfsVolume#volume_type}. This parameter is required.
         */
        public Builder volumeType(final java.lang.String volumeType) {
            this.config.volumeType(volumeType);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.fsx_openzfs_volume.FsxOpenzfsVolume}.
         */
        @Override
        public imports.aws.fsx_openzfs_volume.FsxOpenzfsVolume build() {
            return new imports.aws.fsx_openzfs_volume.FsxOpenzfsVolume(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
