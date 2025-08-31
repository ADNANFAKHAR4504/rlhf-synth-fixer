package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.869Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorOutputReference")
public class MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putInputLossImageSlate(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorInputLossImageSlate value) {
        software.amazon.jsii.Kernel.call(this, "putInputLossImageSlate", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBlackFrameMsec() {
        software.amazon.jsii.Kernel.call(this, "resetBlackFrameMsec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputLossImageColor() {
        software.amazon.jsii.Kernel.call(this, "resetInputLossImageColor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputLossImageSlate() {
        software.amazon.jsii.Kernel.call(this, "resetInputLossImageSlate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputLossImageType() {
        software.amazon.jsii.Kernel.call(this, "resetInputLossImageType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRepeatFrameMsec() {
        software.amazon.jsii.Kernel.call(this, "resetRepeatFrameMsec", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorInputLossImageSlateOutputReference getInputLossImageSlate() {
        return software.amazon.jsii.Kernel.get(this, "inputLossImageSlate", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorInputLossImageSlateOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBlackFrameMsecInput() {
        return software.amazon.jsii.Kernel.get(this, "blackFrameMsecInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputLossImageColorInput() {
        return software.amazon.jsii.Kernel.get(this, "inputLossImageColorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorInputLossImageSlate getInputLossImageSlateInput() {
        return software.amazon.jsii.Kernel.get(this, "inputLossImageSlateInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorInputLossImageSlate.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputLossImageTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "inputLossImageTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRepeatFrameMsecInput() {
        return software.amazon.jsii.Kernel.get(this, "repeatFrameMsecInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBlackFrameMsec() {
        return software.amazon.jsii.Kernel.get(this, "blackFrameMsec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBlackFrameMsec(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "blackFrameMsec", java.util.Objects.requireNonNull(value, "blackFrameMsec is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputLossImageColor() {
        return software.amazon.jsii.Kernel.get(this, "inputLossImageColor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputLossImageColor(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputLossImageColor", java.util.Objects.requireNonNull(value, "inputLossImageColor is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputLossImageType() {
        return software.amazon.jsii.Kernel.get(this, "inputLossImageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputLossImageType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputLossImageType", java.util.Objects.requireNonNull(value, "inputLossImageType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRepeatFrameMsec() {
        return software.amazon.jsii.Kernel.get(this, "repeatFrameMsec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRepeatFrameMsec(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "repeatFrameMsec", java.util.Objects.requireNonNull(value, "repeatFrameMsec is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
