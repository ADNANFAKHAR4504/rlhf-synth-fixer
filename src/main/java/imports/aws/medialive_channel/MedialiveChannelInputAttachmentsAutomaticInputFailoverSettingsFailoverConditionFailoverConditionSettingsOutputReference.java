package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.885Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsOutputReference")
public class MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAudioSilenceSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings value) {
        software.amazon.jsii.Kernel.call(this, "putAudioSilenceSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInputLossSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings value) {
        software.amazon.jsii.Kernel.call(this, "putInputLossSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVideoBlackSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings value) {
        software.amazon.jsii.Kernel.call(this, "putVideoBlackSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAudioSilenceSettings() {
        software.amazon.jsii.Kernel.call(this, "resetAudioSilenceSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputLossSettings() {
        software.amazon.jsii.Kernel.call(this, "resetInputLossSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVideoBlackSettings() {
        software.amazon.jsii.Kernel.call(this, "resetVideoBlackSettings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettingsOutputReference getAudioSilenceSettings() {
        return software.amazon.jsii.Kernel.get(this, "audioSilenceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettingsOutputReference getInputLossSettings() {
        return software.amazon.jsii.Kernel.get(this, "inputLossSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettingsOutputReference getVideoBlackSettings() {
        return software.amazon.jsii.Kernel.get(this, "videoBlackSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings getAudioSilenceSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "audioSilenceSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings getInputLossSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "inputLossSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings getVideoBlackSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "videoBlackSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
