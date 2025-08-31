package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.865Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettingsOutputReference")
public class MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBitrate() {
        software.amazon.jsii.Kernel.call(this, "resetBitrate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodingMode() {
        software.amazon.jsii.Kernel.call(this, "resetCodingMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDialnorm() {
        software.amazon.jsii.Kernel.call(this, "resetDialnorm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDrcLine() {
        software.amazon.jsii.Kernel.call(this, "resetDrcLine", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDrcRf() {
        software.amazon.jsii.Kernel.call(this, "resetDrcRf", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHeightTrim() {
        software.amazon.jsii.Kernel.call(this, "resetHeightTrim", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSurroundTrim() {
        software.amazon.jsii.Kernel.call(this, "resetSurroundTrim", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBitrateInput() {
        return software.amazon.jsii.Kernel.get(this, "bitrateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCodingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "codingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDialnormInput() {
        return software.amazon.jsii.Kernel.get(this, "dialnormInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDrcLineInput() {
        return software.amazon.jsii.Kernel.get(this, "drcLineInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDrcRfInput() {
        return software.amazon.jsii.Kernel.get(this, "drcRfInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHeightTrimInput() {
        return software.amazon.jsii.Kernel.get(this, "heightTrimInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSurroundTrimInput() {
        return software.amazon.jsii.Kernel.get(this, "surroundTrimInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getDialnorm() {
        return software.amazon.jsii.Kernel.get(this, "dialnorm", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDialnorm(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "dialnorm", java.util.Objects.requireNonNull(value, "dialnorm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDrcLine() {
        return software.amazon.jsii.Kernel.get(this, "drcLine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDrcLine(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "drcLine", java.util.Objects.requireNonNull(value, "drcLine is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDrcRf() {
        return software.amazon.jsii.Kernel.get(this, "drcRf", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDrcRf(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "drcRf", java.util.Objects.requireNonNull(value, "drcRf is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHeightTrim() {
        return software.amazon.jsii.Kernel.get(this, "heightTrim", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHeightTrim(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "heightTrim", java.util.Objects.requireNonNull(value, "heightTrim is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSurroundTrim() {
        return software.amazon.jsii.Kernel.get(this, "surroundTrim", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSurroundTrim(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "surroundTrim", java.util.Objects.requireNonNull(value, "surroundTrim is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
