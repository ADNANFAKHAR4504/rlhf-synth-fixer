package imports.aws.elastictranscoder_preset;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.188Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elastictranscoderPreset.ElastictranscoderPresetAudioOutputReference")
public class ElastictranscoderPresetAudioOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElastictranscoderPresetAudioOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElastictranscoderPresetAudioOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ElastictranscoderPresetAudioOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAudioPackingMode() {
        software.amazon.jsii.Kernel.call(this, "resetAudioPackingMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBitRate() {
        software.amazon.jsii.Kernel.call(this, "resetBitRate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetChannels() {
        software.amazon.jsii.Kernel.call(this, "resetChannels", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodec() {
        software.amazon.jsii.Kernel.call(this, "resetCodec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSampleRate() {
        software.amazon.jsii.Kernel.call(this, "resetSampleRate", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAudioPackingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "audioPackingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBitRateInput() {
        return software.amazon.jsii.Kernel.get(this, "bitRateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getChannelsInput() {
        return software.amazon.jsii.Kernel.get(this, "channelsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCodecInput() {
        return software.amazon.jsii.Kernel.get(this, "codecInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSampleRateInput() {
        return software.amazon.jsii.Kernel.get(this, "sampleRateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAudioPackingMode() {
        return software.amazon.jsii.Kernel.get(this, "audioPackingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAudioPackingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "audioPackingMode", java.util.Objects.requireNonNull(value, "audioPackingMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBitRate() {
        return software.amazon.jsii.Kernel.get(this, "bitRate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBitRate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bitRate", java.util.Objects.requireNonNull(value, "bitRate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getChannels() {
        return software.amazon.jsii.Kernel.get(this, "channels", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setChannels(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "channels", java.util.Objects.requireNonNull(value, "channels is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCodec() {
        return software.amazon.jsii.Kernel.get(this, "codec", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCodec(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "codec", java.util.Objects.requireNonNull(value, "codec is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSampleRate() {
        return software.amazon.jsii.Kernel.get(this, "sampleRate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSampleRate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sampleRate", java.util.Objects.requireNonNull(value, "sampleRate is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudio getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudio.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudio value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
