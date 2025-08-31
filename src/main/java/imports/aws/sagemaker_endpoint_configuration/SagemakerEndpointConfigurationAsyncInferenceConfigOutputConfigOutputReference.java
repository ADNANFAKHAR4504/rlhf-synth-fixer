package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigOutputReference")
public class SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putNotificationConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig value) {
        software.amazon.jsii.Kernel.call(this, "putNotificationConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotificationConfig() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3FailurePath() {
        software.amazon.jsii.Kernel.call(this, "resetS3FailurePath", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfigOutputReference getNotificationConfig() {
        return software.amazon.jsii.Kernel.get(this, "notificationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig getNotificationConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3FailurePathInput() {
        return software.amazon.jsii.Kernel.get(this, "s3FailurePathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3OutputPathInput() {
        return software.amazon.jsii.Kernel.get(this, "s3OutputPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3FailurePath() {
        return software.amazon.jsii.Kernel.get(this, "s3FailurePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3FailurePath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3FailurePath", java.util.Objects.requireNonNull(value, "s3FailurePath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3OutputPath() {
        return software.amazon.jsii.Kernel.get(this, "s3OutputPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3OutputPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3OutputPath", java.util.Objects.requireNonNull(value, "s3OutputPath is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
