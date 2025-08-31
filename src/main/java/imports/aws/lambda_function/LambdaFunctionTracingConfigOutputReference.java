package imports.aws.lambda_function;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.504Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaFunction.LambdaFunctionTracingConfigOutputReference")
public class LambdaFunctionTracingConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LambdaFunctionTracingConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaFunctionTracingConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LambdaFunctionTracingConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getModeInput() {
        return software.amazon.jsii.Kernel.get(this, "modeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMode() {
        return software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mode", java.util.Objects.requireNonNull(value, "mode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionTracingConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionTracingConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionTracingConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
