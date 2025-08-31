package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.865Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettingsOutputReference")
public class MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBitrate() {
        software.amazon.jsii.Kernel.call(this, "resetBitrate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodingMode() {
        software.amazon.jsii.Kernel.call(this, "resetCodingMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputType() {
        software.amazon.jsii.Kernel.call(this, "resetInputType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProfile() {
        software.amazon.jsii.Kernel.call(this, "resetProfile", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRateControlMode() {
        software.amazon.jsii.Kernel.call(this, "resetRateControlMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRawFormat() {
        software.amazon.jsii.Kernel.call(this, "resetRawFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSampleRate() {
        software.amazon.jsii.Kernel.call(this, "resetSampleRate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpec() {
        software.amazon.jsii.Kernel.call(this, "resetSpec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVbrQuality() {
        software.amazon.jsii.Kernel.call(this, "resetVbrQuality", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBitrateInput() {
        return software.amazon.jsii.Kernel.get(this, "bitrateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCodingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "codingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "inputTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProfileInput() {
        return software.amazon.jsii.Kernel.get(this, "profileInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRateControlModeInput() {
        return software.amazon.jsii.Kernel.get(this, "rateControlModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRawFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "rawFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSampleRateInput() {
        return software.amazon.jsii.Kernel.get(this, "sampleRateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSpecInput() {
        return software.amazon.jsii.Kernel.get(this, "specInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVbrQualityInput() {
        return software.amazon.jsii.Kernel.get(this, "vbrQualityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBitrate() {
        return software.amazon.jsii.Kernel.get(this, "bitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBitrate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bitrate", java.util.Objects.requireNonNull(value, "bitrate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCodingMode() {
        return software.amazon.jsii.Kernel.get(this, "codingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCodingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "codingMode", java.util.Objects.requireNonNull(value, "codingMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputType() {
        return software.amazon.jsii.Kernel.get(this, "inputType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputType", java.util.Objects.requireNonNull(value, "inputType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProfile() {
        return software.amazon.jsii.Kernel.get(this, "profile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProfile(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "profile", java.util.Objects.requireNonNull(value, "profile is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRateControlMode() {
        return software.amazon.jsii.Kernel.get(this, "rateControlMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRateControlMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rateControlMode", java.util.Objects.requireNonNull(value, "rateControlMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRawFormat() {
        return software.amazon.jsii.Kernel.get(this, "rawFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRawFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rawFormat", java.util.Objects.requireNonNull(value, "rawFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSampleRate() {
        return software.amazon.jsii.Kernel.get(this, "sampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSampleRate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sampleRate", java.util.Objects.requireNonNull(value, "sampleRate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpec() {
        return software.amazon.jsii.Kernel.get(this, "spec", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpec(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "spec", java.util.Objects.requireNonNull(value, "spec is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVbrQuality() {
        return software.amazon.jsii.Kernel.get(this, "vbrQuality", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVbrQuality(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vbrQuality", java.util.Objects.requireNonNull(value, "vbrQuality is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
