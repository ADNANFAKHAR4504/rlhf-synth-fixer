package imports.aws.appsync_function;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.071Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncFunction.AppsyncFunctionRuntimeOutputReference")
public class AppsyncFunctionRuntimeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppsyncFunctionRuntimeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncFunctionRuntimeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppsyncFunctionRuntimeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRuntimeVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "runtimeVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRuntimeVersion() {
        return software.amazon.jsii.Kernel.get(this, "runtimeVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRuntimeVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "runtimeVersion", java.util.Objects.requireNonNull(value, "runtimeVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_function.AppsyncFunctionRuntime getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_function.AppsyncFunctionRuntime.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appsync_function.AppsyncFunctionRuntime value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
