package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.866Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3SettingsOutputReference")
public class MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3SettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3SettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3SettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3SettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAttenuationControl() {
        software.amazon.jsii.Kernel.call(this, "resetAttenuationControl", software.amazon.jsii.NativeType.VOID);
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

    public void resetDcFilter() {
        software.amazon.jsii.Kernel.call(this, "resetDcFilter", software.amazon.jsii.NativeType.VOID);
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

    public void resetLfeControl() {
        software.amazon.jsii.Kernel.call(this, "resetLfeControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLfeFilter() {
        software.amazon.jsii.Kernel.call(this, "resetLfeFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoRoCenterMixLevel() {
        software.amazon.jsii.Kernel.call(this, "resetLoRoCenterMixLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoRoSurroundMixLevel() {
        software.amazon.jsii.Kernel.call(this, "resetLoRoSurroundMixLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLtRtCenterMixLevel() {
        software.amazon.jsii.Kernel.call(this, "resetLtRtCenterMixLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLtRtSurroundMixLevel() {
        software.amazon.jsii.Kernel.call(this, "resetLtRtSurroundMixLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetadataControl() {
        software.amazon.jsii.Kernel.call(this, "resetMetadataControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPassthroughControl() {
        software.amazon.jsii.Kernel.call(this, "resetPassthroughControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPhaseControl() {
        software.amazon.jsii.Kernel.call(this, "resetPhaseControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStereoDownmix() {
        software.amazon.jsii.Kernel.call(this, "resetStereoDownmix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSurroundExMode() {
        software.amazon.jsii.Kernel.call(this, "resetSurroundExMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSurroundMode() {
        software.amazon.jsii.Kernel.call(this, "resetSurroundMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAttenuationControlInput() {
        return software.amazon.jsii.Kernel.get(this, "attenuationControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getDcFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "dcFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getLfeControlInput() {
        return software.amazon.jsii.Kernel.get(this, "lfeControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLfeFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "lfeFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getLoRoCenterMixLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "loRoCenterMixLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getLoRoSurroundMixLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "loRoSurroundMixLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getLtRtCenterMixLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "ltRtCenterMixLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getLtRtSurroundMixLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "ltRtSurroundMixLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetadataControlInput() {
        return software.amazon.jsii.Kernel.get(this, "metadataControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPassthroughControlInput() {
        return software.amazon.jsii.Kernel.get(this, "passthroughControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPhaseControlInput() {
        return software.amazon.jsii.Kernel.get(this, "phaseControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStereoDownmixInput() {
        return software.amazon.jsii.Kernel.get(this, "stereoDownmixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSurroundExModeInput() {
        return software.amazon.jsii.Kernel.get(this, "surroundExModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSurroundModeInput() {
        return software.amazon.jsii.Kernel.get(this, "surroundModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAttenuationControl() {
        return software.amazon.jsii.Kernel.get(this, "attenuationControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAttenuationControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "attenuationControl", java.util.Objects.requireNonNull(value, "attenuationControl is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getDcFilter() {
        return software.amazon.jsii.Kernel.get(this, "dcFilter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDcFilter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dcFilter", java.util.Objects.requireNonNull(value, "dcFilter is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getLfeControl() {
        return software.amazon.jsii.Kernel.get(this, "lfeControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLfeControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lfeControl", java.util.Objects.requireNonNull(value, "lfeControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLfeFilter() {
        return software.amazon.jsii.Kernel.get(this, "lfeFilter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLfeFilter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lfeFilter", java.util.Objects.requireNonNull(value, "lfeFilter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLoRoCenterMixLevel() {
        return software.amazon.jsii.Kernel.get(this, "loRoCenterMixLevel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setLoRoCenterMixLevel(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "loRoCenterMixLevel", java.util.Objects.requireNonNull(value, "loRoCenterMixLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLoRoSurroundMixLevel() {
        return software.amazon.jsii.Kernel.get(this, "loRoSurroundMixLevel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setLoRoSurroundMixLevel(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "loRoSurroundMixLevel", java.util.Objects.requireNonNull(value, "loRoSurroundMixLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLtRtCenterMixLevel() {
        return software.amazon.jsii.Kernel.get(this, "ltRtCenterMixLevel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setLtRtCenterMixLevel(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ltRtCenterMixLevel", java.util.Objects.requireNonNull(value, "ltRtCenterMixLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLtRtSurroundMixLevel() {
        return software.amazon.jsii.Kernel.get(this, "ltRtSurroundMixLevel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setLtRtSurroundMixLevel(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ltRtSurroundMixLevel", java.util.Objects.requireNonNull(value, "ltRtSurroundMixLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetadataControl() {
        return software.amazon.jsii.Kernel.get(this, "metadataControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetadataControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metadataControl", java.util.Objects.requireNonNull(value, "metadataControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPassthroughControl() {
        return software.amazon.jsii.Kernel.get(this, "passthroughControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPassthroughControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "passthroughControl", java.util.Objects.requireNonNull(value, "passthroughControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPhaseControl() {
        return software.amazon.jsii.Kernel.get(this, "phaseControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPhaseControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "phaseControl", java.util.Objects.requireNonNull(value, "phaseControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStereoDownmix() {
        return software.amazon.jsii.Kernel.get(this, "stereoDownmix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStereoDownmix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stereoDownmix", java.util.Objects.requireNonNull(value, "stereoDownmix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSurroundExMode() {
        return software.amazon.jsii.Kernel.get(this, "surroundExMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSurroundExMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "surroundExMode", java.util.Objects.requireNonNull(value, "surroundExMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSurroundMode() {
        return software.amazon.jsii.Kernel.get(this, "surroundMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSurroundMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "surroundMode", java.util.Objects.requireNonNull(value, "surroundMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3Settings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3Settings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3Settings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
