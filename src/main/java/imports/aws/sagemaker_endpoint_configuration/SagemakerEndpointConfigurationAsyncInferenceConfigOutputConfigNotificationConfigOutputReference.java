package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfigOutputReference")
public class SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetErrorTopic() {
        software.amazon.jsii.Kernel.call(this, "resetErrorTopic", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeInferenceResponseIn() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeInferenceResponseIn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSuccessTopic() {
        software.amazon.jsii.Kernel.call(this, "resetSuccessTopic", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getErrorTopicInput() {
        return software.amazon.jsii.Kernel.get(this, "errorTopicInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIncludeInferenceResponseInInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "includeInferenceResponseInInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSuccessTopicInput() {
        return software.amazon.jsii.Kernel.get(this, "successTopicInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getErrorTopic() {
        return software.amazon.jsii.Kernel.get(this, "errorTopic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setErrorTopic(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "errorTopic", java.util.Objects.requireNonNull(value, "errorTopic is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIncludeInferenceResponseIn() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "includeInferenceResponseIn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIncludeInferenceResponseIn(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "includeInferenceResponseIn", java.util.Objects.requireNonNull(value, "includeInferenceResponseIn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSuccessTopic() {
        return software.amazon.jsii.Kernel.get(this, "successTopic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSuccessTopic(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "successTopic", java.util.Objects.requireNonNull(value, "successTopic is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
