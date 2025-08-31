package imports.aws.datasync_location_fsx_ontap_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.946Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationFsxOntapFileSystem.DatasyncLocationFsxOntapFileSystemProtocolOutputReference")
public class DatasyncLocationFsxOntapFileSystemProtocolOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DatasyncLocationFsxOntapFileSystemProtocolOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatasyncLocationFsxOntapFileSystemProtocolOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DatasyncLocationFsxOntapFileSystemProtocolOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putNfs(final @org.jetbrains.annotations.NotNull imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfs value) {
        software.amazon.jsii.Kernel.call(this, "putNfs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSmb(final @org.jetbrains.annotations.NotNull imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmb value) {
        software.amazon.jsii.Kernel.call(this, "putSmb", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetNfs() {
        software.amazon.jsii.Kernel.call(this, "resetNfs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSmb() {
        software.amazon.jsii.Kernel.call(this, "resetSmb", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfsOutputReference getNfs() {
        return software.amazon.jsii.Kernel.get(this, "nfs", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmbOutputReference getSmb() {
        return software.amazon.jsii.Kernel.get(this, "smb", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmbOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfs getNfsInput() {
        return software.amazon.jsii.Kernel.get(this, "nfsInput", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmb getSmbInput() {
        return software.amazon.jsii.Kernel.get(this, "smbInput", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmb.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocol getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocol.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocol value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
