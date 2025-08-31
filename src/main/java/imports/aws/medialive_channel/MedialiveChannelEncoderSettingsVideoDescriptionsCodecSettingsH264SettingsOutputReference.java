package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.883Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsOutputReference")
public class MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putFilterSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsFilterSettings value) {
        software.amazon.jsii.Kernel.call(this, "putFilterSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdaptiveQuantization() {
        software.amazon.jsii.Kernel.call(this, "resetAdaptiveQuantization", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAfdSignaling() {
        software.amazon.jsii.Kernel.call(this, "resetAfdSignaling", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBitrate() {
        software.amazon.jsii.Kernel.call(this, "resetBitrate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBufFillPct() {
        software.amazon.jsii.Kernel.call(this, "resetBufFillPct", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBufSize() {
        software.amazon.jsii.Kernel.call(this, "resetBufSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetColorMetadata() {
        software.amazon.jsii.Kernel.call(this, "resetColorMetadata", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEntropyEncoding() {
        software.amazon.jsii.Kernel.call(this, "resetEntropyEncoding", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilterSettings() {
        software.amazon.jsii.Kernel.call(this, "resetFilterSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFixedAfd() {
        software.amazon.jsii.Kernel.call(this, "resetFixedAfd", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFlickerAq() {
        software.amazon.jsii.Kernel.call(this, "resetFlickerAq", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForceFieldPictures() {
        software.amazon.jsii.Kernel.call(this, "resetForceFieldPictures", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFramerateControl() {
        software.amazon.jsii.Kernel.call(this, "resetFramerateControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFramerateDenominator() {
        software.amazon.jsii.Kernel.call(this, "resetFramerateDenominator", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFramerateNumerator() {
        software.amazon.jsii.Kernel.call(this, "resetFramerateNumerator", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGopBReference() {
        software.amazon.jsii.Kernel.call(this, "resetGopBReference", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGopClosedCadence() {
        software.amazon.jsii.Kernel.call(this, "resetGopClosedCadence", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGopNumBFrames() {
        software.amazon.jsii.Kernel.call(this, "resetGopNumBFrames", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGopSize() {
        software.amazon.jsii.Kernel.call(this, "resetGopSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGopSizeUnits() {
        software.amazon.jsii.Kernel.call(this, "resetGopSizeUnits", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLevel() {
        software.amazon.jsii.Kernel.call(this, "resetLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLookAheadRateControl() {
        software.amazon.jsii.Kernel.call(this, "resetLookAheadRateControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxBitrate() {
        software.amazon.jsii.Kernel.call(this, "resetMaxBitrate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinIInterval() {
        software.amazon.jsii.Kernel.call(this, "resetMinIInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNumRefFrames() {
        software.amazon.jsii.Kernel.call(this, "resetNumRefFrames", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParControl() {
        software.amazon.jsii.Kernel.call(this, "resetParControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParDenominator() {
        software.amazon.jsii.Kernel.call(this, "resetParDenominator", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParNumerator() {
        software.amazon.jsii.Kernel.call(this, "resetParNumerator", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProfile() {
        software.amazon.jsii.Kernel.call(this, "resetProfile", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQualityLevel() {
        software.amazon.jsii.Kernel.call(this, "resetQualityLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQvbrQualityLevel() {
        software.amazon.jsii.Kernel.call(this, "resetQvbrQualityLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRateControlMode() {
        software.amazon.jsii.Kernel.call(this, "resetRateControlMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScanType() {
        software.amazon.jsii.Kernel.call(this, "resetScanType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSceneChangeDetect() {
        software.amazon.jsii.Kernel.call(this, "resetSceneChangeDetect", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSlices() {
        software.amazon.jsii.Kernel.call(this, "resetSlices", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSoftness() {
        software.amazon.jsii.Kernel.call(this, "resetSoftness", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpatialAq() {
        software.amazon.jsii.Kernel.call(this, "resetSpatialAq", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubgopLength() {
        software.amazon.jsii.Kernel.call(this, "resetSubgopLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSyntax() {
        software.amazon.jsii.Kernel.call(this, "resetSyntax", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTemporalAq() {
        software.amazon.jsii.Kernel.call(this, "resetTemporalAq", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimecodeInsertion() {
        software.amazon.jsii.Kernel.call(this, "resetTimecodeInsertion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsFilterSettingsOutputReference getFilterSettings() {
        return software.amazon.jsii.Kernel.get(this, "filterSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsFilterSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdaptiveQuantizationInput() {
        return software.amazon.jsii.Kernel.get(this, "adaptiveQuantizationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAfdSignalingInput() {
        return software.amazon.jsii.Kernel.get(this, "afdSignalingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBitrateInput() {
        return software.amazon.jsii.Kernel.get(this, "bitrateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBufFillPctInput() {
        return software.amazon.jsii.Kernel.get(this, "bufFillPctInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBufSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "bufSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getColorMetadataInput() {
        return software.amazon.jsii.Kernel.get(this, "colorMetadataInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEntropyEncodingInput() {
        return software.amazon.jsii.Kernel.get(this, "entropyEncodingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsFilterSettings getFilterSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "filterSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264SettingsFilterSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFixedAfdInput() {
        return software.amazon.jsii.Kernel.get(this, "fixedAfdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFlickerAqInput() {
        return software.amazon.jsii.Kernel.get(this, "flickerAqInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getForceFieldPicturesInput() {
        return software.amazon.jsii.Kernel.get(this, "forceFieldPicturesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFramerateControlInput() {
        return software.amazon.jsii.Kernel.get(this, "framerateControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFramerateDenominatorInput() {
        return software.amazon.jsii.Kernel.get(this, "framerateDenominatorInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFramerateNumeratorInput() {
        return software.amazon.jsii.Kernel.get(this, "framerateNumeratorInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGopBReferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "gopBReferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getGopClosedCadenceInput() {
        return software.amazon.jsii.Kernel.get(this, "gopClosedCadenceInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getGopNumBFramesInput() {
        return software.amazon.jsii.Kernel.get(this, "gopNumBFramesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getGopSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "gopSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGopSizeUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "gopSizeUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "levelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLookAheadRateControlInput() {
        return software.amazon.jsii.Kernel.get(this, "lookAheadRateControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxBitrateInput() {
        return software.amazon.jsii.Kernel.get(this, "maxBitrateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinIIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "minIIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumRefFramesInput() {
        return software.amazon.jsii.Kernel.get(this, "numRefFramesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getParControlInput() {
        return software.amazon.jsii.Kernel.get(this, "parControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getParDenominatorInput() {
        return software.amazon.jsii.Kernel.get(this, "parDenominatorInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getParNumeratorInput() {
        return software.amazon.jsii.Kernel.get(this, "parNumeratorInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProfileInput() {
        return software.amazon.jsii.Kernel.get(this, "profileInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getQualityLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "qualityLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getQvbrQualityLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "qvbrQualityLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRateControlModeInput() {
        return software.amazon.jsii.Kernel.get(this, "rateControlModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScanTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "scanTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSceneChangeDetectInput() {
        return software.amazon.jsii.Kernel.get(this, "sceneChangeDetectInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSlicesInput() {
        return software.amazon.jsii.Kernel.get(this, "slicesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSoftnessInput() {
        return software.amazon.jsii.Kernel.get(this, "softnessInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSpatialAqInput() {
        return software.amazon.jsii.Kernel.get(this, "spatialAqInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubgopLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "subgopLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSyntaxInput() {
        return software.amazon.jsii.Kernel.get(this, "syntaxInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTemporalAqInput() {
        return software.amazon.jsii.Kernel.get(this, "temporalAqInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimecodeInsertionInput() {
        return software.amazon.jsii.Kernel.get(this, "timecodeInsertionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdaptiveQuantization() {
        return software.amazon.jsii.Kernel.get(this, "adaptiveQuantization", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdaptiveQuantization(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "adaptiveQuantization", java.util.Objects.requireNonNull(value, "adaptiveQuantization is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAfdSignaling() {
        return software.amazon.jsii.Kernel.get(this, "afdSignaling", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAfdSignaling(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "afdSignaling", java.util.Objects.requireNonNull(value, "afdSignaling is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBitrate() {
        return software.amazon.jsii.Kernel.get(this, "bitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBitrate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bitrate", java.util.Objects.requireNonNull(value, "bitrate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBufFillPct() {
        return software.amazon.jsii.Kernel.get(this, "bufFillPct", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBufFillPct(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bufFillPct", java.util.Objects.requireNonNull(value, "bufFillPct is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBufSize() {
        return software.amazon.jsii.Kernel.get(this, "bufSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBufSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bufSize", java.util.Objects.requireNonNull(value, "bufSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getColorMetadata() {
        return software.amazon.jsii.Kernel.get(this, "colorMetadata", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setColorMetadata(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "colorMetadata", java.util.Objects.requireNonNull(value, "colorMetadata is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEntropyEncoding() {
        return software.amazon.jsii.Kernel.get(this, "entropyEncoding", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEntropyEncoding(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "entropyEncoding", java.util.Objects.requireNonNull(value, "entropyEncoding is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFixedAfd() {
        return software.amazon.jsii.Kernel.get(this, "fixedAfd", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFixedAfd(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fixedAfd", java.util.Objects.requireNonNull(value, "fixedAfd is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFlickerAq() {
        return software.amazon.jsii.Kernel.get(this, "flickerAq", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFlickerAq(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "flickerAq", java.util.Objects.requireNonNull(value, "flickerAq is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getForceFieldPictures() {
        return software.amazon.jsii.Kernel.get(this, "forceFieldPictures", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setForceFieldPictures(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "forceFieldPictures", java.util.Objects.requireNonNull(value, "forceFieldPictures is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFramerateControl() {
        return software.amazon.jsii.Kernel.get(this, "framerateControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFramerateControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "framerateControl", java.util.Objects.requireNonNull(value, "framerateControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFramerateDenominator() {
        return software.amazon.jsii.Kernel.get(this, "framerateDenominator", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFramerateDenominator(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "framerateDenominator", java.util.Objects.requireNonNull(value, "framerateDenominator is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFramerateNumerator() {
        return software.amazon.jsii.Kernel.get(this, "framerateNumerator", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFramerateNumerator(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "framerateNumerator", java.util.Objects.requireNonNull(value, "framerateNumerator is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGopBReference() {
        return software.amazon.jsii.Kernel.get(this, "gopBReference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGopBReference(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gopBReference", java.util.Objects.requireNonNull(value, "gopBReference is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getGopClosedCadence() {
        return software.amazon.jsii.Kernel.get(this, "gopClosedCadence", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setGopClosedCadence(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "gopClosedCadence", java.util.Objects.requireNonNull(value, "gopClosedCadence is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getGopNumBFrames() {
        return software.amazon.jsii.Kernel.get(this, "gopNumBFrames", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setGopNumBFrames(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "gopNumBFrames", java.util.Objects.requireNonNull(value, "gopNumBFrames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getGopSize() {
        return software.amazon.jsii.Kernel.get(this, "gopSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setGopSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "gopSize", java.util.Objects.requireNonNull(value, "gopSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGopSizeUnits() {
        return software.amazon.jsii.Kernel.get(this, "gopSizeUnits", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGopSizeUnits(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gopSizeUnits", java.util.Objects.requireNonNull(value, "gopSizeUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLevel() {
        return software.amazon.jsii.Kernel.get(this, "level", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "level", java.util.Objects.requireNonNull(value, "level is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLookAheadRateControl() {
        return software.amazon.jsii.Kernel.get(this, "lookAheadRateControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLookAheadRateControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lookAheadRateControl", java.util.Objects.requireNonNull(value, "lookAheadRateControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxBitrate() {
        return software.amazon.jsii.Kernel.get(this, "maxBitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxBitrate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxBitrate", java.util.Objects.requireNonNull(value, "maxBitrate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinIInterval() {
        return software.amazon.jsii.Kernel.get(this, "minIInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinIInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minIInterval", java.util.Objects.requireNonNull(value, "minIInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumRefFrames() {
        return software.amazon.jsii.Kernel.get(this, "numRefFrames", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumRefFrames(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numRefFrames", java.util.Objects.requireNonNull(value, "numRefFrames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getParControl() {
        return software.amazon.jsii.Kernel.get(this, "parControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setParControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "parControl", java.util.Objects.requireNonNull(value, "parControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getParDenominator() {
        return software.amazon.jsii.Kernel.get(this, "parDenominator", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setParDenominator(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "parDenominator", java.util.Objects.requireNonNull(value, "parDenominator is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getParNumerator() {
        return software.amazon.jsii.Kernel.get(this, "parNumerator", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setParNumerator(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "parNumerator", java.util.Objects.requireNonNull(value, "parNumerator is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProfile() {
        return software.amazon.jsii.Kernel.get(this, "profile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProfile(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "profile", java.util.Objects.requireNonNull(value, "profile is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQualityLevel() {
        return software.amazon.jsii.Kernel.get(this, "qualityLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setQualityLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "qualityLevel", java.util.Objects.requireNonNull(value, "qualityLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getQvbrQualityLevel() {
        return software.amazon.jsii.Kernel.get(this, "qvbrQualityLevel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setQvbrQualityLevel(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "qvbrQualityLevel", java.util.Objects.requireNonNull(value, "qvbrQualityLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRateControlMode() {
        return software.amazon.jsii.Kernel.get(this, "rateControlMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRateControlMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rateControlMode", java.util.Objects.requireNonNull(value, "rateControlMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScanType() {
        return software.amazon.jsii.Kernel.get(this, "scanType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScanType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scanType", java.util.Objects.requireNonNull(value, "scanType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSceneChangeDetect() {
        return software.amazon.jsii.Kernel.get(this, "sceneChangeDetect", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSceneChangeDetect(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sceneChangeDetect", java.util.Objects.requireNonNull(value, "sceneChangeDetect is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSlices() {
        return software.amazon.jsii.Kernel.get(this, "slices", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSlices(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "slices", java.util.Objects.requireNonNull(value, "slices is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSoftness() {
        return software.amazon.jsii.Kernel.get(this, "softness", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSoftness(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "softness", java.util.Objects.requireNonNull(value, "softness is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpatialAq() {
        return software.amazon.jsii.Kernel.get(this, "spatialAq", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpatialAq(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "spatialAq", java.util.Objects.requireNonNull(value, "spatialAq is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubgopLength() {
        return software.amazon.jsii.Kernel.get(this, "subgopLength", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubgopLength(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subgopLength", java.util.Objects.requireNonNull(value, "subgopLength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSyntax() {
        return software.amazon.jsii.Kernel.get(this, "syntax", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSyntax(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "syntax", java.util.Objects.requireNonNull(value, "syntax is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTemporalAq() {
        return software.amazon.jsii.Kernel.get(this, "temporalAq", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTemporalAq(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "temporalAq", java.util.Objects.requireNonNull(value, "temporalAq is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimecodeInsertion() {
        return software.amazon.jsii.Kernel.get(this, "timecodeInsertion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimecodeInsertion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timecodeInsertion", java.util.Objects.requireNonNull(value, "timecodeInsertion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264Settings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264Settings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264Settings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
