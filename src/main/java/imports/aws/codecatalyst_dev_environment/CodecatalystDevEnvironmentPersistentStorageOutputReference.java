package imports.aws.codecatalyst_dev_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.308Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codecatalystDevEnvironment.CodecatalystDevEnvironmentPersistentStorageOutputReference")
public class CodecatalystDevEnvironmentPersistentStorageOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodecatalystDevEnvironmentPersistentStorageOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodecatalystDevEnvironmentPersistentStorageOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodecatalystDevEnvironmentPersistentStorageOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "sizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSize() {
        return software.amazon.jsii.Kernel.get(this, "size", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "size", java.util.Objects.requireNonNull(value, "size is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorage getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorage.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorage value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
