package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationAsyncInferenceConfigClientConfigOutputReference")
public class SagemakerEndpointConfigurationAsyncInferenceConfigClientConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerEndpointConfigurationAsyncInferenceConfigClientConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerEndpointConfigurationAsyncInferenceConfigClientConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerEndpointConfigurationAsyncInferenceConfigClientConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMaxConcurrentInvocationsPerInstance() {
        software.amazon.jsii.Kernel.call(this, "resetMaxConcurrentInvocationsPerInstance", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxConcurrentInvocationsPerInstanceInput() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrentInvocationsPerInstanceInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxConcurrentInvocationsPerInstance() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrentInvocationsPerInstance", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxConcurrentInvocationsPerInstance(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxConcurrentInvocationsPerInstance", java.util.Objects.requireNonNull(value, "maxConcurrentInvocationsPerInstance is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
