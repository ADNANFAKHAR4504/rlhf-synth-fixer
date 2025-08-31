package imports.aws.datasync_location_fsx_ontap_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.946Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationFsxOntapFileSystem.DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptionsOutputReference")
public class DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetVersion() {
        software.amazon.jsii.Kernel.call(this, "resetVersion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "versionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "version", java.util.Objects.requireNonNull(value, "version is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolNfsMountOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
