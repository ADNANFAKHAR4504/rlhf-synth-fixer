package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputReference")
public class SagemakerEndpointConfigurationAsyncInferenceConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerEndpointConfigurationAsyncInferenceConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerEndpointConfigurationAsyncInferenceConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerEndpointConfigurationAsyncInferenceConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putClientConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig value) {
        software.amazon.jsii.Kernel.call(this, "putClientConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOutputConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfig value) {
        software.amazon.jsii.Kernel.call(this, "putOutputConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetClientConfig() {
        software.amazon.jsii.Kernel.call(this, "resetClientConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigClientConfigOutputReference getClientConfig() {
        return software.amazon.jsii.Kernel.get(this, "clientConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigClientConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigOutputReference getOutputConfig() {
        return software.amazon.jsii.Kernel.get(this, "outputConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig getClientConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "clientConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfig getOutputConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "outputConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
