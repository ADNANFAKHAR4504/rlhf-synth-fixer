package imports.aws.datasync_location_fsx_openzfs_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.946Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationFsxOpenzfsFileSystem.DatasyncLocationFsxOpenzfsFileSystemProtocolNfsOutputReference")
public class DatasyncLocationFsxOpenzfsFileSystemProtocolNfsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DatasyncLocationFsxOpenzfsFileSystemProtocolNfsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatasyncLocationFsxOpenzfsFileSystemProtocolNfsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DatasyncLocationFsxOpenzfsFileSystemProtocolNfsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMountOptions(final @org.jetbrains.annotations.NotNull imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfsMountOptions value) {
        software.amazon.jsii.Kernel.call(this, "putMountOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfsMountOptionsOutputReference getMountOptions() {
        return software.amazon.jsii.Kernel.get(this, "mountOptions", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfsMountOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfsMountOptions getMountOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "mountOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfsMountOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfs getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfs.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.datasync_location_fsx_openzfs_file_system.DatasyncLocationFsxOpenzfsFileSystemProtocolNfs value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
