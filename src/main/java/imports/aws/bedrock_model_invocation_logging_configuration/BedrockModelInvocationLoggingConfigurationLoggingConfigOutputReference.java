package imports.aws.bedrock_model_invocation_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.150Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockModelInvocationLoggingConfiguration.BedrockModelInvocationLoggingConfigurationLoggingConfigOutputReference")
public class BedrockModelInvocationLoggingConfigurationLoggingConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockModelInvocationLoggingConfigurationLoggingConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockModelInvocationLoggingConfigurationLoggingConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BedrockModelInvocationLoggingConfigurationLoggingConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchConfig(final @org.jetbrains.annotations.NotNull imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Config(final @org.jetbrains.annotations.NotNull imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config value) {
        software.amazon.jsii.Kernel.call(this, "putS3Config", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmbeddingDataDeliveryEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEmbeddingDataDeliveryEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageDataDeliveryEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetImageDataDeliveryEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Config() {
        software.amazon.jsii.Kernel.call(this, "resetS3Config", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTextDataDeliveryEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetTextDataDeliveryEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVideoDataDeliveryEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetVideoDataDeliveryEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigOutputReference getCloudwatchConfig() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchConfig", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigS3ConfigOutputReference getS3Config() {
        return software.amazon.jsii.Kernel.get(this, "s3Config", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigS3ConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEmbeddingDataDeliveryEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "embeddingDataDeliveryEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getImageDataDeliveryEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "imageDataDeliveryEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getS3ConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTextDataDeliveryEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "textDataDeliveryEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVideoDataDeliveryEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "videoDataDeliveryEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEmbeddingDataDeliveryEnabled() {
        return software.amazon.jsii.Kernel.get(this, "embeddingDataDeliveryEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEmbeddingDataDeliveryEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "embeddingDataDeliveryEnabled", java.util.Objects.requireNonNull(value, "embeddingDataDeliveryEnabled is required"));
    }

    public void setEmbeddingDataDeliveryEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "embeddingDataDeliveryEnabled", java.util.Objects.requireNonNull(value, "embeddingDataDeliveryEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getImageDataDeliveryEnabled() {
        return software.amazon.jsii.Kernel.get(this, "imageDataDeliveryEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setImageDataDeliveryEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "imageDataDeliveryEnabled", java.util.Objects.requireNonNull(value, "imageDataDeliveryEnabled is required"));
    }

    public void setImageDataDeliveryEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "imageDataDeliveryEnabled", java.util.Objects.requireNonNull(value, "imageDataDeliveryEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getTextDataDeliveryEnabled() {
        return software.amazon.jsii.Kernel.get(this, "textDataDeliveryEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTextDataDeliveryEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "textDataDeliveryEnabled", java.util.Objects.requireNonNull(value, "textDataDeliveryEnabled is required"));
    }

    public void setTextDataDeliveryEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "textDataDeliveryEnabled", java.util.Objects.requireNonNull(value, "textDataDeliveryEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getVideoDataDeliveryEnabled() {
        return software.amazon.jsii.Kernel.get(this, "videoDataDeliveryEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setVideoDataDeliveryEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "videoDataDeliveryEnabled", java.util.Objects.requireNonNull(value, "videoDataDeliveryEnabled is required"));
    }

    public void setVideoDataDeliveryEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "videoDataDeliveryEnabled", java.util.Objects.requireNonNull(value, "videoDataDeliveryEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
