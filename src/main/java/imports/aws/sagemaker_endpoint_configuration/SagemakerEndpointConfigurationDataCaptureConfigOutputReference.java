package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.321Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationDataCaptureConfigOutputReference")
public class SagemakerEndpointConfigurationDataCaptureConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerEndpointConfigurationDataCaptureConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerEndpointConfigurationDataCaptureConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerEndpointConfigurationDataCaptureConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCaptureContentTypeHeader(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader value) {
        software.amazon.jsii.Kernel.call(this, "putCaptureContentTypeHeader", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCaptureOptions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions> __cast_cd4240 = (java.util.List<imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCaptureOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCaptureContentTypeHeader() {
        software.amazon.jsii.Kernel.call(this, "resetCaptureContentTypeHeader", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableCapture() {
        software.amazon.jsii.Kernel.call(this, "resetEnableCapture", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeaderOutputReference getCaptureContentTypeHeader() {
        return software.amazon.jsii.Kernel.get(this, "captureContentTypeHeader", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeaderOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureOptionsList getCaptureOptions() {
        return software.amazon.jsii.Kernel.get(this, "captureOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureOptionsList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader getCaptureContentTypeHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "captureContentTypeHeaderInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCaptureOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "captureOptionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationS3UriInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationS3UriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableCaptureInput() {
        return software.amazon.jsii.Kernel.get(this, "enableCaptureInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getInitialSamplingPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "initialSamplingPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationS3Uri() {
        return software.amazon.jsii.Kernel.get(this, "destinationS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestinationS3Uri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destinationS3Uri", java.util.Objects.requireNonNull(value, "destinationS3Uri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableCapture() {
        return software.amazon.jsii.Kernel.get(this, "enableCapture", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableCapture(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableCapture", java.util.Objects.requireNonNull(value, "enableCapture is required"));
    }

    public void setEnableCapture(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableCapture", java.util.Objects.requireNonNull(value, "enableCapture is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInitialSamplingPercentage() {
        return software.amazon.jsii.Kernel.get(this, "initialSamplingPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInitialSamplingPercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "initialSamplingPercentage", java.util.Objects.requireNonNull(value, "initialSamplingPercentage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
