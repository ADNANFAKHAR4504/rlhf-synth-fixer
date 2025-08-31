package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.869Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsGlobalConfigurationOutputReference")
public class MedialiveChannelEncoderSettingsGlobalConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsGlobalConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsGlobalConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsGlobalConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putInputLossBehavior(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior value) {
        software.amazon.jsii.Kernel.call(this, "putInputLossBehavior", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetInitialAudioGain() {
        software.amazon.jsii.Kernel.call(this, "resetInitialAudioGain", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputEndAction() {
        software.amazon.jsii.Kernel.call(this, "resetInputEndAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputLossBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetInputLossBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputLockingMode() {
        software.amazon.jsii.Kernel.call(this, "resetOutputLockingMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputTimingSource() {
        software.amazon.jsii.Kernel.call(this, "resetOutputTimingSource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportLowFramerateInputs() {
        software.amazon.jsii.Kernel.call(this, "resetSupportLowFramerateInputs", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorOutputReference getInputLossBehavior() {
        return software.amazon.jsii.Kernel.get(this, "inputLossBehavior", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getInitialAudioGainInput() {
        return software.amazon.jsii.Kernel.get(this, "initialAudioGainInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputEndActionInput() {
        return software.amazon.jsii.Kernel.get(this, "inputEndActionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior getInputLossBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "inputLossBehaviorInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputLockingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "outputLockingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputTimingSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "outputTimingSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSupportLowFramerateInputsInput() {
        return software.amazon.jsii.Kernel.get(this, "supportLowFramerateInputsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInitialAudioGain() {
        return software.amazon.jsii.Kernel.get(this, "initialAudioGain", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInitialAudioGain(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "initialAudioGain", java.util.Objects.requireNonNull(value, "initialAudioGain is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputEndAction() {
        return software.amazon.jsii.Kernel.get(this, "inputEndAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputEndAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputEndAction", java.util.Objects.requireNonNull(value, "inputEndAction is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputLockingMode() {
        return software.amazon.jsii.Kernel.get(this, "outputLockingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputLockingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputLockingMode", java.util.Objects.requireNonNull(value, "outputLockingMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputTimingSource() {
        return software.amazon.jsii.Kernel.get(this, "outputTimingSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputTimingSource(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputTimingSource", java.util.Objects.requireNonNull(value, "outputTimingSource is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSupportLowFramerateInputs() {
        return software.amazon.jsii.Kernel.get(this, "supportLowFramerateInputs", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSupportLowFramerateInputs(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "supportLowFramerateInputs", java.util.Objects.requireNonNull(value, "supportLowFramerateInputs is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
