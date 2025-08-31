package imports.aws.fsx_openzfs_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.255Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOpenzfsFileSystem.FsxOpenzfsFileSystemRootVolumeConfigurationOutputReference")
public class FsxOpenzfsFileSystemRootVolumeConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FsxOpenzfsFileSystemRootVolumeConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxOpenzfsFileSystemRootVolumeConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FsxOpenzfsFileSystemRootVolumeConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putNfsExports(final @org.jetbrains.annotations.NotNull imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports value) {
        software.amazon.jsii.Kernel.call(this, "putNfsExports", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas> __cast_cd4240 = (java.util.List<imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotas __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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

    public void resetNfsExports() {
        software.amazon.jsii.Kernel.call(this, "resetNfsExports", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReadOnly() {
        software.amazon.jsii.Kernel.call(this, "resetReadOnly", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecordSizeKib() {
        software.amazon.jsii.Kernel.call(this, "resetRecordSizeKib", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserAndGroupQuotas() {
        software.amazon.jsii.Kernel.call(this, "resetUserAndGroupQuotas", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExportsOutputReference getNfsExports() {
        return software.amazon.jsii.Kernel.get(this, "nfsExports", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExportsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotasList getUserAndGroupQuotas() {
        return software.amazon.jsii.Kernel.get(this, "userAndGroupQuotas", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationUserAndGroupQuotasList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToSnapshotsInput() {
        return software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshotsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataCompressionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "dataCompressionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports getNfsExportsInput() {
        return software.amazon.jsii.Kernel.get(this, "nfsExportsInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfigurationNfsExports.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReadOnlyInput() {
        return software.amazon.jsii.Kernel.get(this, "readOnlyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRecordSizeKibInput() {
        return software.amazon.jsii.Kernel.get(this, "recordSizeKibInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUserAndGroupQuotasInput() {
        return software.amazon.jsii.Kernel.get(this, "userAndGroupQuotasInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fsx_openzfs_file_system.FsxOpenzfsFileSystemRootVolumeConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
