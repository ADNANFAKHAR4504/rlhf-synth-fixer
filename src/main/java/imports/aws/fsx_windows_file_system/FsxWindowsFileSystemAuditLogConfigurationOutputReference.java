package imports.aws.fsx_windows_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.258Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxWindowsFileSystem.FsxWindowsFileSystemAuditLogConfigurationOutputReference")
public class FsxWindowsFileSystemAuditLogConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FsxWindowsFileSystemAuditLogConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxWindowsFileSystemAuditLogConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FsxWindowsFileSystemAuditLogConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAuditLogDestination() {
        software.amazon.jsii.Kernel.call(this, "resetAuditLogDestination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFileAccessAuditLogLevel() {
        software.amazon.jsii.Kernel.call(this, "resetFileAccessAuditLogLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFileShareAccessAuditLogLevel() {
        software.amazon.jsii.Kernel.call(this, "resetFileShareAccessAuditLogLevel", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuditLogDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "auditLogDestinationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileAccessAuditLogLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "fileAccessAuditLogLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileShareAccessAuditLogLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "fileShareAccessAuditLogLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuditLogDestination() {
        return software.amazon.jsii.Kernel.get(this, "auditLogDestination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuditLogDestination(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "auditLogDestination", java.util.Objects.requireNonNull(value, "auditLogDestination is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileAccessAuditLogLevel() {
        return software.amazon.jsii.Kernel.get(this, "fileAccessAuditLogLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileAccessAuditLogLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileAccessAuditLogLevel", java.util.Objects.requireNonNull(value, "fileAccessAuditLogLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileShareAccessAuditLogLevel() {
        return software.amazon.jsii.Kernel.get(this, "fileShareAccessAuditLogLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileShareAccessAuditLogLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileShareAccessAuditLogLevel", java.util.Objects.requireNonNull(value, "fileShareAccessAuditLogLevel is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
