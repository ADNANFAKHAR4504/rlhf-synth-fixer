package imports.aws.bedrock_model_invocation_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.150Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockModelInvocationLoggingConfiguration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigOutputReference")
public class BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putLargeDataDeliveryS3Config(final @org.jetbrains.annotations.NotNull imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigLargeDataDeliveryS3Config value) {
        software.amazon.jsii.Kernel.call(this, "putLargeDataDeliveryS3Config", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetLargeDataDeliveryS3Config() {
        software.amazon.jsii.Kernel.call(this, "resetLargeDataDeliveryS3Config", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetLogGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigLargeDataDeliveryS3ConfigOutputReference getLargeDataDeliveryS3Config() {
        return software.amazon.jsii.Kernel.get(this, "largeDataDeliveryS3Config", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigLargeDataDeliveryS3ConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLargeDataDeliveryS3ConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "largeDataDeliveryS3ConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "logGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogGroupName() {
        return software.amazon.jsii.Kernel.get(this, "logGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logGroupName", java.util.Objects.requireNonNull(value, "logGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
