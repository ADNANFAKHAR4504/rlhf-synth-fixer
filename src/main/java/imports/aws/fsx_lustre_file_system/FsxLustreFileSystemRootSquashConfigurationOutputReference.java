package imports.aws.fsx_lustre_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.246Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxLustreFileSystem.FsxLustreFileSystemRootSquashConfigurationOutputReference")
public class FsxLustreFileSystemRootSquashConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FsxLustreFileSystemRootSquashConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxLustreFileSystemRootSquashConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FsxLustreFileSystemRootSquashConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetNoSquashNids() {
        software.amazon.jsii.Kernel.call(this, "resetNoSquashNids", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRootSquash() {
        software.amazon.jsii.Kernel.call(this, "resetRootSquash", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNoSquashNidsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "noSquashNidsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRootSquashInput() {
        return software.amazon.jsii.Kernel.get(this, "rootSquashInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNoSquashNids() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "noSquashNids", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNoSquashNids(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "noSquashNids", java.util.Objects.requireNonNull(value, "noSquashNids is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRootSquash() {
        return software.amazon.jsii.Kernel.get(this, "rootSquash", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRootSquash(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rootSquash", java.util.Objects.requireNonNull(value, "rootSquash is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
