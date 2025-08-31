package imports.aws.chime_voice_connector_streaming;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.206Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimeVoiceConnectorStreaming.ChimeVoiceConnectorStreamingMediaInsightsConfigurationOutputReference")
public class ChimeVoiceConnectorStreamingMediaInsightsConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ChimeVoiceConnectorStreamingMediaInsightsConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ChimeVoiceConnectorStreamingMediaInsightsConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ChimeVoiceConnectorStreamingMediaInsightsConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetConfigurationArn() {
        software.amazon.jsii.Kernel.call(this, "resetConfigurationArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisabled() {
        software.amazon.jsii.Kernel.call(this, "resetDisabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationArnInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisabledInput() {
        return software.amazon.jsii.Kernel.get(this, "disabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurationArn() {
        return software.amazon.jsii.Kernel.get(this, "configurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfigurationArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configurationArn", java.util.Objects.requireNonNull(value, "configurationArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisabled() {
        return software.amazon.jsii.Kernel.get(this, "disabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disabled", java.util.Objects.requireNonNull(value, "disabled is required"));
    }

    public void setDisabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disabled", java.util.Objects.requireNonNull(value, "disabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chime_voice_connector_streaming.ChimeVoiceConnectorStreamingMediaInsightsConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.chime_voice_connector_streaming.ChimeVoiceConnectorStreamingMediaInsightsConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.chime_voice_connector_streaming.ChimeVoiceConnectorStreamingMediaInsightsConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
