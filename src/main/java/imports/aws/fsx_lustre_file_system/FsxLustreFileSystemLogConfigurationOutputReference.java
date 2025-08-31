package imports.aws.fsx_lustre_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.246Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxLustreFileSystem.FsxLustreFileSystemLogConfigurationOutputReference")
public class FsxLustreFileSystemLogConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FsxLustreFileSystemLogConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxLustreFileSystemLogConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FsxLustreFileSystemLogConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDestination() {
        software.amazon.jsii.Kernel.call(this, "resetDestination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLevel() {
        software.amazon.jsii.Kernel.call(this, "resetLevel", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "levelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestination() {
        return software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestination(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destination", java.util.Objects.requireNonNull(value, "destination is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLevel() {
        return software.amazon.jsii.Kernel.get(this, "level", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "level", java.util.Objects.requireNonNull(value, "level is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
