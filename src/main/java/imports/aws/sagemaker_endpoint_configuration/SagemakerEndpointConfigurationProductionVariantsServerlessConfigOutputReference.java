package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.322Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationProductionVariantsServerlessConfigOutputReference")
public class SagemakerEndpointConfigurationProductionVariantsServerlessConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerEndpointConfigurationProductionVariantsServerlessConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerEndpointConfigurationProductionVariantsServerlessConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerEndpointConfigurationProductionVariantsServerlessConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetProvisionedConcurrency() {
        software.amazon.jsii.Kernel.call(this, "resetProvisionedConcurrency", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxConcurrencyInput() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrencyInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMemorySizeInMbInput() {
        return software.amazon.jsii.Kernel.get(this, "memorySizeInMbInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getProvisionedConcurrencyInput() {
        return software.amazon.jsii.Kernel.get(this, "provisionedConcurrencyInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxConcurrency() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrency", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxConcurrency(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxConcurrency", java.util.Objects.requireNonNull(value, "maxConcurrency is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMemorySizeInMb() {
        return software.amazon.jsii.Kernel.get(this, "memorySizeInMb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMemorySizeInMb(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "memorySizeInMb", java.util.Objects.requireNonNull(value, "memorySizeInMb is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getProvisionedConcurrency() {
        return software.amazon.jsii.Kernel.get(this, "provisionedConcurrency", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setProvisionedConcurrency(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "provisionedConcurrency", java.util.Objects.requireNonNull(value, "provisionedConcurrency is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
