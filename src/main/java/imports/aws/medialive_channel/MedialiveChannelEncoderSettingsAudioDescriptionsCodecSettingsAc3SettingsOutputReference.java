package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.865Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3SettingsOutputReference")
public class MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3SettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3SettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3SettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3SettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBitrate() {
        software.amazon.jsii.Kernel.call(this, "resetBitrate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBitstreamMode() {
        software.amazon.jsii.Kernel.call(this, "resetBitstreamMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodingMode() {
        software.amazon.jsii.Kernel.call(this, "resetCodingMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDialnorm() {
        software.amazon.jsii.Kernel.call(this, "resetDialnorm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDrcProfile() {
        software.amazon.jsii.Kernel.call(this, "resetDrcProfile", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLfeFilter() {
        software.amazon.jsii.Kernel.call(this, "resetLfeFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetadataControl() {
        software.amazon.jsii.Kernel.call(this, "resetMetadataControl", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBitrateInput() {
        return software.amazon.jsii.Kernel.get(this, "bitrateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBitstreamModeInput() {
        return software.amazon.jsii.Kernel.get(this, "bitstreamModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCodingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "codingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDialnormInput() {
        return software.amazon.jsii.Kernel.get(this, "dialnormInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDrcProfileInput() {
        return software.amazon.jsii.Kernel.get(this, "drcProfileInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLfeFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "lfeFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetadataControlInput() {
        return software.amazon.jsii.Kernel.get(this, "metadataControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBitrate() {
        return software.amazon.jsii.Kernel.get(this, "bitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBitrate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bitrate", java.util.Objects.requireNonNull(value, "bitrate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBitstreamMode() {
        return software.amazon.jsii.Kernel.get(this, "bitstreamMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBitstreamMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bitstreamMode", java.util.Objects.requireNonNull(value, "bitstreamMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCodingMode() {
        return software.amazon.jsii.Kernel.get(this, "codingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCodingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "codingMode", java.util.Objects.requireNonNull(value, "codingMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDialnorm() {
        return software.amazon.jsii.Kernel.get(this, "dialnorm", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDialnorm(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "dialnorm", java.util.Objects.requireNonNull(value, "dialnorm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDrcProfile() {
        return software.amazon.jsii.Kernel.get(this, "drcProfile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDrcProfile(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "drcProfile", java.util.Objects.requireNonNull(value, "drcProfile is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLfeFilter() {
        return software.amazon.jsii.Kernel.get(this, "lfeFilter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLfeFilter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lfeFilter", java.util.Objects.requireNonNull(value, "lfeFilter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetadataControl() {
        return software.amazon.jsii.Kernel.get(this, "metadataControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetadataControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metadataControl", java.util.Objects.requireNonNull(value, "metadataControl is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
