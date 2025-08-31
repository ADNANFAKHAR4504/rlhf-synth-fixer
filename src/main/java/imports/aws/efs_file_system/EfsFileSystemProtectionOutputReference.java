package imports.aws.efs_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.143Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.efsFileSystem.EfsFileSystemProtectionOutputReference")
public class EfsFileSystemProtectionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EfsFileSystemProtectionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EfsFileSystemProtectionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EfsFileSystemProtectionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetReplicationOverwrite() {
        software.amazon.jsii.Kernel.call(this, "resetReplicationOverwrite", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplicationOverwriteInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationOverwriteInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplicationOverwrite() {
        return software.amazon.jsii.Kernel.get(this, "replicationOverwrite", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplicationOverwrite(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replicationOverwrite", java.util.Objects.requireNonNull(value, "replicationOverwrite is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.efs_file_system.EfsFileSystemProtection getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.efs_file_system.EfsFileSystemProtection.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.efs_file_system.EfsFileSystemProtection value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
