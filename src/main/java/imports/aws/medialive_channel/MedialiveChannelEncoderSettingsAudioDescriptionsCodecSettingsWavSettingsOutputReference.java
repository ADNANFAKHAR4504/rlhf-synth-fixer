package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.866Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettingsOutputReference")
public class MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBitDepth() {
        software.amazon.jsii.Kernel.call(this, "resetBitDepth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodingMode() {
        software.amazon.jsii.Kernel.call(this, "resetCodingMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSampleRate() {
        software.amazon.jsii.Kernel.call(this, "resetSampleRate", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBitDepthInput() {
        return software.amazon.jsii.Kernel.get(this, "bitDepthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCodingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "codingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSampleRateInput() {
        return software.amazon.jsii.Kernel.get(this, "sampleRateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBitDepth() {
        return software.amazon.jsii.Kernel.get(this, "bitDepth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBitDepth(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bitDepth", java.util.Objects.requireNonNull(value, "bitDepth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCodingMode() {
        return software.amazon.jsii.Kernel.get(this, "codingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCodingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "codingMode", java.util.Objects.requireNonNull(value, "codingMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSampleRate() {
        return software.amazon.jsii.Kernel.get(this, "sampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSampleRate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sampleRate", java.util.Objects.requireNonNull(value, "sampleRate is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
