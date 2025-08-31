package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.866Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsOutputReference")
public class MedialiveChannelEncoderSettingsAudioDescriptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsAudioDescriptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsAudioDescriptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public MedialiveChannelEncoderSettingsAudioDescriptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAudioNormalizationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putAudioNormalizationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAudioWatermarkSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettings value) {
        software.amazon.jsii.Kernel.call(this, "putAudioWatermarkSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCodecSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings value) {
        software.amazon.jsii.Kernel.call(this, "putCodecSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRemixSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings value) {
        software.amazon.jsii.Kernel.call(this, "putRemixSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAudioNormalizationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetAudioNormalizationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAudioType() {
        software.amazon.jsii.Kernel.call(this, "resetAudioType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAudioTypeControl() {
        software.amazon.jsii.Kernel.call(this, "resetAudioTypeControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAudioWatermarkSettings() {
        software.amazon.jsii.Kernel.call(this, "resetAudioWatermarkSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodecSettings() {
        software.amazon.jsii.Kernel.call(this, "resetCodecSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLanguageCode() {
        software.amazon.jsii.Kernel.call(this, "resetLanguageCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLanguageCodeControl() {
        software.amazon.jsii.Kernel.call(this, "resetLanguageCodeControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRemixSettings() {
        software.amazon.jsii.Kernel.call(this, "resetRemixSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStreamName() {
        software.amazon.jsii.Kernel.call(this, "resetStreamName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettingsOutputReference getAudioNormalizationSettings() {
        return software.amazon.jsii.Kernel.get(this, "audioNormalizationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsOutputReference getAudioWatermarkSettings() {
        return software.amazon.jsii.Kernel.get(this, "audioWatermarkSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsOutputReference getCodecSettings() {
        return software.amazon.jsii.Kernel.get(this, "codecSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsOutputReference getRemixSettings() {
        return software.amazon.jsii.Kernel.get(this, "remixSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings getAudioNormalizationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "audioNormalizationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAudioSelectorNameInput() {
        return software.amazon.jsii.Kernel.get(this, "audioSelectorNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAudioTypeControlInput() {
        return software.amazon.jsii.Kernel.get(this, "audioTypeControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAudioTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "audioTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettings getAudioWatermarkSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "audioWatermarkSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings getCodecSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "codecSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLanguageCodeControlInput() {
        return software.amazon.jsii.Kernel.get(this, "languageCodeControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLanguageCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "languageCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings getRemixSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "remixSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStreamNameInput() {
        return software.amazon.jsii.Kernel.get(this, "streamNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAudioSelectorName() {
        return software.amazon.jsii.Kernel.get(this, "audioSelectorName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAudioSelectorName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "audioSelectorName", java.util.Objects.requireNonNull(value, "audioSelectorName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAudioType() {
        return software.amazon.jsii.Kernel.get(this, "audioType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAudioType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "audioType", java.util.Objects.requireNonNull(value, "audioType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAudioTypeControl() {
        return software.amazon.jsii.Kernel.get(this, "audioTypeControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAudioTypeControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "audioTypeControl", java.util.Objects.requireNonNull(value, "audioTypeControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLanguageCode() {
        return software.amazon.jsii.Kernel.get(this, "languageCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLanguageCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "languageCode", java.util.Objects.requireNonNull(value, "languageCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLanguageCodeControl() {
        return software.amazon.jsii.Kernel.get(this, "languageCodeControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLanguageCodeControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "languageCodeControl", java.util.Objects.requireNonNull(value, "languageCodeControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStreamName() {
        return software.amazon.jsii.Kernel.get(this, "streamName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStreamName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "streamName", java.util.Objects.requireNonNull(value, "streamName is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
