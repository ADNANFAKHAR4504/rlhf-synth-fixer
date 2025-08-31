package imports.aws.lambda_event_source_mapping;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.502Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaEventSourceMapping.LambdaEventSourceMappingProvisionedPollerConfigOutputReference")
public class LambdaEventSourceMappingProvisionedPollerConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LambdaEventSourceMappingProvisionedPollerConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaEventSourceMappingProvisionedPollerConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LambdaEventSourceMappingProvisionedPollerConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMaximumPollers() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumPollers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinimumPollers() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumPollers", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumPollersInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumPollersInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinimumPollersInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumPollersInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumPollers() {
        return software.amazon.jsii.Kernel.get(this, "maximumPollers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumPollers(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumPollers", java.util.Objects.requireNonNull(value, "maximumPollers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinimumPollers() {
        return software.amazon.jsii.Kernel.get(this, "minimumPollers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinimumPollers(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minimumPollers", java.util.Objects.requireNonNull(value, "minimumPollers is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_event_source_mapping.LambdaEventSourceMappingProvisionedPollerConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_event_source_mapping.LambdaEventSourceMappingProvisionedPollerConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lambda_event_source_mapping.LambdaEventSourceMappingProvisionedPollerConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
