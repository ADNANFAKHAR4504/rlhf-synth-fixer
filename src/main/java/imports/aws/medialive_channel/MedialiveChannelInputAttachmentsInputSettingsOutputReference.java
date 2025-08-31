package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsOutputReference")
public class MedialiveChannelInputAttachmentsInputSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsInputSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsInputSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputAttachmentsInputSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAudioSelector(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelector>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelector> __cast_cd4240 = (java.util.List<imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelector>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelector __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAudioSelector", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCaptionSelector(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelector>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelector> __cast_cd4240 = (java.util.List<imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelector>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelector __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCaptionSelector", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkInputSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkInputSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVideoSelector(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector value) {
        software.amazon.jsii.Kernel.call(this, "putVideoSelector", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAudioSelector() {
        software.amazon.jsii.Kernel.call(this, "resetAudioSelector", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCaptionSelector() {
        software.amazon.jsii.Kernel.call(this, "resetCaptionSelector", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeblockFilter() {
        software.amazon.jsii.Kernel.call(this, "resetDeblockFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDenoiseFilter() {
        software.amazon.jsii.Kernel.call(this, "resetDenoiseFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilterStrength() {
        software.amazon.jsii.Kernel.call(this, "resetFilterStrength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputFilter() {
        software.amazon.jsii.Kernel.call(this, "resetInputFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkInputSettings() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkInputSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScte35Pid() {
        software.amazon.jsii.Kernel.call(this, "resetScte35Pid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSmpte2038DataPreference() {
        software.amazon.jsii.Kernel.call(this, "resetSmpte2038DataPreference", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceEndBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetSourceEndBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVideoSelector() {
        software.amazon.jsii.Kernel.call(this, "resetVideoSelector", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorList getAudioSelector() {
        return software.amazon.jsii.Kernel.get(this, "audioSelector", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorList getCaptionSelector() {
        return software.amazon.jsii.Kernel.get(this, "captionSelector", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsOutputReference getNetworkInputSettings() {
        return software.amazon.jsii.Kernel.get(this, "networkInputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelectorOutputReference getVideoSelector() {
        return software.amazon.jsii.Kernel.get(this, "videoSelector", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelectorOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAudioSelectorInput() {
        return software.amazon.jsii.Kernel.get(this, "audioSelectorInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCaptionSelectorInput() {
        return software.amazon.jsii.Kernel.get(this, "captionSelectorInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeblockFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "deblockFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDenoiseFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "denoiseFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFilterStrengthInput() {
        return software.amazon.jsii.Kernel.get(this, "filterStrengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "inputFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings getNetworkInputSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "networkInputSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getScte35PidInput() {
        return software.amazon.jsii.Kernel.get(this, "scte35PidInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSmpte2038DataPreferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "smpte2038DataPreferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceEndBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceEndBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector getVideoSelectorInput() {
        return software.amazon.jsii.Kernel.get(this, "videoSelectorInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeblockFilter() {
        return software.amazon.jsii.Kernel.get(this, "deblockFilter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeblockFilter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deblockFilter", java.util.Objects.requireNonNull(value, "deblockFilter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDenoiseFilter() {
        return software.amazon.jsii.Kernel.get(this, "denoiseFilter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDenoiseFilter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "denoiseFilter", java.util.Objects.requireNonNull(value, "denoiseFilter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFilterStrength() {
        return software.amazon.jsii.Kernel.get(this, "filterStrength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFilterStrength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "filterStrength", java.util.Objects.requireNonNull(value, "filterStrength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputFilter() {
        return software.amazon.jsii.Kernel.get(this, "inputFilter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputFilter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputFilter", java.util.Objects.requireNonNull(value, "inputFilter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getScte35Pid() {
        return software.amazon.jsii.Kernel.get(this, "scte35Pid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setScte35Pid(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "scte35Pid", java.util.Objects.requireNonNull(value, "scte35Pid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSmpte2038DataPreference() {
        return software.amazon.jsii.Kernel.get(this, "smpte2038DataPreference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSmpte2038DataPreference(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "smpte2038DataPreference", java.util.Objects.requireNonNull(value, "smpte2038DataPreference is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceEndBehavior() {
        return software.amazon.jsii.Kernel.get(this, "sourceEndBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceEndBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceEndBehavior", java.util.Objects.requireNonNull(value, "sourceEndBehavior is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
