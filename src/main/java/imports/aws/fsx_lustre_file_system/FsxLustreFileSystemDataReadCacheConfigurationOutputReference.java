package imports.aws.fsx_lustre_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.246Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxLustreFileSystem.FsxLustreFileSystemDataReadCacheConfigurationOutputReference")
public class FsxLustreFileSystemDataReadCacheConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FsxLustreFileSystemDataReadCacheConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxLustreFileSystemDataReadCacheConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FsxLustreFileSystemDataReadCacheConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetSize() {
        software.amazon.jsii.Kernel.call(this, "resetSize", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "sizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSizingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "sizingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSize() {
        return software.amazon.jsii.Kernel.get(this, "size", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "size", java.util.Objects.requireNonNull(value, "size is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSizingMode() {
        return software.amazon.jsii.Kernel.get(this, "sizingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSizingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sizingMode", java.util.Objects.requireNonNull(value, "sizingMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
