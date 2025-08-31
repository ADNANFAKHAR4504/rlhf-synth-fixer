package imports.aws.lambda_event_source_mapping;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.502Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaEventSourceMapping.LambdaEventSourceMappingScalingConfigOutputReference")
public class LambdaEventSourceMappingScalingConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LambdaEventSourceMappingScalingConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaEventSourceMappingScalingConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LambdaEventSourceMappingScalingConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMaximumConcurrency() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumConcurrency", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumConcurrencyInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumConcurrencyInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumConcurrency() {
        return software.amazon.jsii.Kernel.get(this, "maximumConcurrency", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumConcurrency(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumConcurrency", java.util.Objects.requireNonNull(value, "maximumConcurrency is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_event_source_mapping.LambdaEventSourceMappingScalingConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_event_source_mapping.LambdaEventSourceMappingScalingConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lambda_event_source_mapping.LambdaEventSourceMappingScalingConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
