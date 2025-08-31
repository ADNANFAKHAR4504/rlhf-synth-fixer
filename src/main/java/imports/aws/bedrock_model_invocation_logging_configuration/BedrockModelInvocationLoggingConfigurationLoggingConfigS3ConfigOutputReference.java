package imports.aws.bedrock_model_invocation_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.150Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockModelInvocationLoggingConfiguration.BedrockModelInvocationLoggingConfigurationLoggingConfigS3ConfigOutputReference")
public class BedrockModelInvocationLoggingConfigurationLoggingConfigS3ConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockModelInvocationLoggingConfigurationLoggingConfigS3ConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockModelInvocationLoggingConfigurationLoggingConfigS3ConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BedrockModelInvocationLoggingConfigurationLoggingConfigS3ConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBucketName() {
        software.amazon.jsii.Kernel.call(this, "resetBucketName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetKeyPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "keyPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketName() {
        return software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketName", java.util.Objects.requireNonNull(value, "bucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyPrefix() {
        return software.amazon.jsii.Kernel.get(this, "keyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyPrefix", java.util.Objects.requireNonNull(value, "keyPrefix is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
