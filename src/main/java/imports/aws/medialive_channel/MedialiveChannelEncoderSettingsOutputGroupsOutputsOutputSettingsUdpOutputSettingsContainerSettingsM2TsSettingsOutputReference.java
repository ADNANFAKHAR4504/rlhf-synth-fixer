package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.881Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDvbNitSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbNitSettings value) {
        software.amazon.jsii.Kernel.call(this, "putDvbNitSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDvbSdtSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings value) {
        software.amazon.jsii.Kernel.call(this, "putDvbSdtSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDvbTdtSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings value) {
        software.amazon.jsii.Kernel.call(this, "putDvbTdtSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAbsentInputAudioBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetAbsentInputAudioBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetArib() {
        software.amazon.jsii.Kernel.call(this, "resetArib", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAribCaptionsPid() {
        software.amazon.jsii.Kernel.call(this, "resetAribCaptionsPid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAribCaptionsPidControl() {
        software.amazon.jsii.Kernel.call(this, "resetAribCaptionsPidControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAudioBufferModel() {
        software.amazon.jsii.Kernel.call(this, "resetAudioBufferModel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAudioFramesPerPes() {
        software.amazon.jsii.Kernel.call(this, "resetAudioFramesPerPes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAudioPids() {
        software.amazon.jsii.Kernel.call(this, "resetAudioPids", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAudioStreamType() {
        software.amazon.jsii.Kernel.call(this, "resetAudioStreamType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBitrate() {
        software.amazon.jsii.Kernel.call(this, "resetBitrate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBufferModel() {
        software.amazon.jsii.Kernel.call(this, "resetBufferModel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCcDescriptor() {
        software.amazon.jsii.Kernel.call(this, "resetCcDescriptor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDvbNitSettings() {
        software.amazon.jsii.Kernel.call(this, "resetDvbNitSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDvbSdtSettings() {
        software.amazon.jsii.Kernel.call(this, "resetDvbSdtSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDvbSubPids() {
        software.amazon.jsii.Kernel.call(this, "resetDvbSubPids", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDvbTdtSettings() {
        software.amazon.jsii.Kernel.call(this, "resetDvbTdtSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDvbTeletextPid() {
        software.amazon.jsii.Kernel.call(this, "resetDvbTeletextPid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbif() {
        software.amazon.jsii.Kernel.call(this, "resetEbif", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbpAudioInterval() {
        software.amazon.jsii.Kernel.call(this, "resetEbpAudioInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbpLookaheadMs() {
        software.amazon.jsii.Kernel.call(this, "resetEbpLookaheadMs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbpPlacement() {
        software.amazon.jsii.Kernel.call(this, "resetEbpPlacement", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEcmPid() {
        software.amazon.jsii.Kernel.call(this, "resetEcmPid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEsRateInPes() {
        software.amazon.jsii.Kernel.call(this, "resetEsRateInPes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEtvPlatformPid() {
        software.amazon.jsii.Kernel.call(this, "resetEtvPlatformPid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEtvSignalPid() {
        software.amazon.jsii.Kernel.call(this, "resetEtvSignalPid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFragmentTime() {
        software.amazon.jsii.Kernel.call(this, "resetFragmentTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKlv() {
        software.amazon.jsii.Kernel.call(this, "resetKlv", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKlvDataPids() {
        software.amazon.jsii.Kernel.call(this, "resetKlvDataPids", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNielsenId3Behavior() {
        software.amazon.jsii.Kernel.call(this, "resetNielsenId3Behavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNullPacketBitrate() {
        software.amazon.jsii.Kernel.call(this, "resetNullPacketBitrate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPatInterval() {
        software.amazon.jsii.Kernel.call(this, "resetPatInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPcrControl() {
        software.amazon.jsii.Kernel.call(this, "resetPcrControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPcrPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetPcrPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPcrPid() {
        software.amazon.jsii.Kernel.call(this, "resetPcrPid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPmtInterval() {
        software.amazon.jsii.Kernel.call(this, "resetPmtInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPmtPid() {
        software.amazon.jsii.Kernel.call(this, "resetPmtPid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProgramNum() {
        software.amazon.jsii.Kernel.call(this, "resetProgramNum", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRateMode() {
        software.amazon.jsii.Kernel.call(this, "resetRateMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScte27Pids() {
        software.amazon.jsii.Kernel.call(this, "resetScte27Pids", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScte35Control() {
        software.amazon.jsii.Kernel.call(this, "resetScte35Control", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScte35Pid() {
        software.amazon.jsii.Kernel.call(this, "resetScte35Pid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSegmentationMarkers() {
        software.amazon.jsii.Kernel.call(this, "resetSegmentationMarkers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSegmentationStyle() {
        software.amazon.jsii.Kernel.call(this, "resetSegmentationStyle", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSegmentationTime() {
        software.amazon.jsii.Kernel.call(this, "resetSegmentationTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimedMetadataBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetTimedMetadataBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimedMetadataPid() {
        software.amazon.jsii.Kernel.call(this, "resetTimedMetadataPid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransportStreamId() {
        software.amazon.jsii.Kernel.call(this, "resetTransportStreamId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVideoPid() {
        software.amazon.jsii.Kernel.call(this, "resetVideoPid", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbNitSettingsOutputReference getDvbNitSettings() {
        return software.amazon.jsii.Kernel.get(this, "dvbNitSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbNitSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettingsOutputReference getDvbSdtSettings() {
        return software.amazon.jsii.Kernel.get(this, "dvbSdtSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettingsOutputReference getDvbTdtSettings() {
        return software.amazon.jsii.Kernel.get(this, "dvbTdtSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAbsentInputAudioBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "absentInputAudioBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAribCaptionsPidControlInput() {
        return software.amazon.jsii.Kernel.get(this, "aribCaptionsPidControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAribCaptionsPidInput() {
        return software.amazon.jsii.Kernel.get(this, "aribCaptionsPidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAribInput() {
        return software.amazon.jsii.Kernel.get(this, "aribInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAudioBufferModelInput() {
        return software.amazon.jsii.Kernel.get(this, "audioBufferModelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAudioFramesPerPesInput() {
        return software.amazon.jsii.Kernel.get(this, "audioFramesPerPesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAudioPidsInput() {
        return software.amazon.jsii.Kernel.get(this, "audioPidsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAudioStreamTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "audioStreamTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBitrateInput() {
        return software.amazon.jsii.Kernel.get(this, "bitrateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBufferModelInput() {
        return software.amazon.jsii.Kernel.get(this, "bufferModelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCcDescriptorInput() {
        return software.amazon.jsii.Kernel.get(this, "ccDescriptorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbNitSettings getDvbNitSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "dvbNitSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbNitSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings getDvbSdtSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "dvbSdtSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDvbSubPidsInput() {
        return software.amazon.jsii.Kernel.get(this, "dvbSubPidsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings getDvbTdtSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "dvbTdtSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDvbTeletextPidInput() {
        return software.amazon.jsii.Kernel.get(this, "dvbTeletextPidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEbifInput() {
        return software.amazon.jsii.Kernel.get(this, "ebifInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEbpAudioIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "ebpAudioIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getEbpLookaheadMsInput() {
        return software.amazon.jsii.Kernel.get(this, "ebpLookaheadMsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEbpPlacementInput() {
        return software.amazon.jsii.Kernel.get(this, "ebpPlacementInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEcmPidInput() {
        return software.amazon.jsii.Kernel.get(this, "ecmPidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEsRateInPesInput() {
        return software.amazon.jsii.Kernel.get(this, "esRateInPesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEtvPlatformPidInput() {
        return software.amazon.jsii.Kernel.get(this, "etvPlatformPidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEtvSignalPidInput() {
        return software.amazon.jsii.Kernel.get(this, "etvSignalPidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFragmentTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "fragmentTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKlvDataPidsInput() {
        return software.amazon.jsii.Kernel.get(this, "klvDataPidsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKlvInput() {
        return software.amazon.jsii.Kernel.get(this, "klvInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNielsenId3BehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "nielsenId3BehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNullPacketBitrateInput() {
        return software.amazon.jsii.Kernel.get(this, "nullPacketBitrateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPatIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "patIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPcrControlInput() {
        return software.amazon.jsii.Kernel.get(this, "pcrControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPcrPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "pcrPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPcrPidInput() {
        return software.amazon.jsii.Kernel.get(this, "pcrPidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPmtIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "pmtIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPmtPidInput() {
        return software.amazon.jsii.Kernel.get(this, "pmtPidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getProgramNumInput() {
        return software.amazon.jsii.Kernel.get(this, "programNumInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRateModeInput() {
        return software.amazon.jsii.Kernel.get(this, "rateModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScte27PidsInput() {
        return software.amazon.jsii.Kernel.get(this, "scte27PidsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScte35ControlInput() {
        return software.amazon.jsii.Kernel.get(this, "scte35ControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScte35PidInput() {
        return software.amazon.jsii.Kernel.get(this, "scte35PidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSegmentationMarkersInput() {
        return software.amazon.jsii.Kernel.get(this, "segmentationMarkersInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSegmentationStyleInput() {
        return software.amazon.jsii.Kernel.get(this, "segmentationStyleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSegmentationTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "segmentationTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimedMetadataBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimedMetadataPidInput() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataPidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTransportStreamIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transportStreamIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVideoPidInput() {
        return software.amazon.jsii.Kernel.get(this, "videoPidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAbsentInputAudioBehavior() {
        return software.amazon.jsii.Kernel.get(this, "absentInputAudioBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAbsentInputAudioBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "absentInputAudioBehavior", java.util.Objects.requireNonNull(value, "absentInputAudioBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArib() {
        return software.amazon.jsii.Kernel.get(this, "arib", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setArib(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "arib", java.util.Objects.requireNonNull(value, "arib is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAribCaptionsPid() {
        return software.amazon.jsii.Kernel.get(this, "aribCaptionsPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAribCaptionsPid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "aribCaptionsPid", java.util.Objects.requireNonNull(value, "aribCaptionsPid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAribCaptionsPidControl() {
        return software.amazon.jsii.Kernel.get(this, "aribCaptionsPidControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAribCaptionsPidControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "aribCaptionsPidControl", java.util.Objects.requireNonNull(value, "aribCaptionsPidControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAudioBufferModel() {
        return software.amazon.jsii.Kernel.get(this, "audioBufferModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAudioBufferModel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "audioBufferModel", java.util.Objects.requireNonNull(value, "audioBufferModel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAudioFramesPerPes() {
        return software.amazon.jsii.Kernel.get(this, "audioFramesPerPes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAudioFramesPerPes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "audioFramesPerPes", java.util.Objects.requireNonNull(value, "audioFramesPerPes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAudioPids() {
        return software.amazon.jsii.Kernel.get(this, "audioPids", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAudioPids(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "audioPids", java.util.Objects.requireNonNull(value, "audioPids is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAudioStreamType() {
        return software.amazon.jsii.Kernel.get(this, "audioStreamType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAudioStreamType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "audioStreamType", java.util.Objects.requireNonNull(value, "audioStreamType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBitrate() {
        return software.amazon.jsii.Kernel.get(this, "bitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBitrate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bitrate", java.util.Objects.requireNonNull(value, "bitrate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBufferModel() {
        return software.amazon.jsii.Kernel.get(this, "bufferModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBufferModel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bufferModel", java.util.Objects.requireNonNull(value, "bufferModel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCcDescriptor() {
        return software.amazon.jsii.Kernel.get(this, "ccDescriptor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCcDescriptor(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ccDescriptor", java.util.Objects.requireNonNull(value, "ccDescriptor is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDvbSubPids() {
        return software.amazon.jsii.Kernel.get(this, "dvbSubPids", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDvbSubPids(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dvbSubPids", java.util.Objects.requireNonNull(value, "dvbSubPids is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDvbTeletextPid() {
        return software.amazon.jsii.Kernel.get(this, "dvbTeletextPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDvbTeletextPid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dvbTeletextPid", java.util.Objects.requireNonNull(value, "dvbTeletextPid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEbif() {
        return software.amazon.jsii.Kernel.get(this, "ebif", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEbif(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ebif", java.util.Objects.requireNonNull(value, "ebif is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEbpAudioInterval() {
        return software.amazon.jsii.Kernel.get(this, "ebpAudioInterval", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEbpAudioInterval(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ebpAudioInterval", java.util.Objects.requireNonNull(value, "ebpAudioInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEbpLookaheadMs() {
        return software.amazon.jsii.Kernel.get(this, "ebpLookaheadMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setEbpLookaheadMs(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ebpLookaheadMs", java.util.Objects.requireNonNull(value, "ebpLookaheadMs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEbpPlacement() {
        return software.amazon.jsii.Kernel.get(this, "ebpPlacement", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEbpPlacement(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ebpPlacement", java.util.Objects.requireNonNull(value, "ebpPlacement is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEcmPid() {
        return software.amazon.jsii.Kernel.get(this, "ecmPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEcmPid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ecmPid", java.util.Objects.requireNonNull(value, "ecmPid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEsRateInPes() {
        return software.amazon.jsii.Kernel.get(this, "esRateInPes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEsRateInPes(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "esRateInPes", java.util.Objects.requireNonNull(value, "esRateInPes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEtvPlatformPid() {
        return software.amazon.jsii.Kernel.get(this, "etvPlatformPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEtvPlatformPid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "etvPlatformPid", java.util.Objects.requireNonNull(value, "etvPlatformPid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEtvSignalPid() {
        return software.amazon.jsii.Kernel.get(this, "etvSignalPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEtvSignalPid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "etvSignalPid", java.util.Objects.requireNonNull(value, "etvSignalPid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFragmentTime() {
        return software.amazon.jsii.Kernel.get(this, "fragmentTime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFragmentTime(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "fragmentTime", java.util.Objects.requireNonNull(value, "fragmentTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKlv() {
        return software.amazon.jsii.Kernel.get(this, "klv", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKlv(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "klv", java.util.Objects.requireNonNull(value, "klv is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKlvDataPids() {
        return software.amazon.jsii.Kernel.get(this, "klvDataPids", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKlvDataPids(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "klvDataPids", java.util.Objects.requireNonNull(value, "klvDataPids is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNielsenId3Behavior() {
        return software.amazon.jsii.Kernel.get(this, "nielsenId3Behavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNielsenId3Behavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nielsenId3Behavior", java.util.Objects.requireNonNull(value, "nielsenId3Behavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNullPacketBitrate() {
        return software.amazon.jsii.Kernel.get(this, "nullPacketBitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNullPacketBitrate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "nullPacketBitrate", java.util.Objects.requireNonNull(value, "nullPacketBitrate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPatInterval() {
        return software.amazon.jsii.Kernel.get(this, "patInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPatInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "patInterval", java.util.Objects.requireNonNull(value, "patInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPcrControl() {
        return software.amazon.jsii.Kernel.get(this, "pcrControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPcrControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pcrControl", java.util.Objects.requireNonNull(value, "pcrControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPcrPeriod() {
        return software.amazon.jsii.Kernel.get(this, "pcrPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPcrPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "pcrPeriod", java.util.Objects.requireNonNull(value, "pcrPeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPcrPid() {
        return software.amazon.jsii.Kernel.get(this, "pcrPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPcrPid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pcrPid", java.util.Objects.requireNonNull(value, "pcrPid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPmtInterval() {
        return software.amazon.jsii.Kernel.get(this, "pmtInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPmtInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "pmtInterval", java.util.Objects.requireNonNull(value, "pmtInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPmtPid() {
        return software.amazon.jsii.Kernel.get(this, "pmtPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPmtPid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pmtPid", java.util.Objects.requireNonNull(value, "pmtPid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getProgramNum() {
        return software.amazon.jsii.Kernel.get(this, "programNum", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setProgramNum(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "programNum", java.util.Objects.requireNonNull(value, "programNum is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRateMode() {
        return software.amazon.jsii.Kernel.get(this, "rateMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRateMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rateMode", java.util.Objects.requireNonNull(value, "rateMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScte27Pids() {
        return software.amazon.jsii.Kernel.get(this, "scte27Pids", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScte27Pids(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scte27Pids", java.util.Objects.requireNonNull(value, "scte27Pids is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScte35Control() {
        return software.amazon.jsii.Kernel.get(this, "scte35Control", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScte35Control(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scte35Control", java.util.Objects.requireNonNull(value, "scte35Control is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScte35Pid() {
        return software.amazon.jsii.Kernel.get(this, "scte35Pid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScte35Pid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scte35Pid", java.util.Objects.requireNonNull(value, "scte35Pid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSegmentationMarkers() {
        return software.amazon.jsii.Kernel.get(this, "segmentationMarkers", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSegmentationMarkers(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "segmentationMarkers", java.util.Objects.requireNonNull(value, "segmentationMarkers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSegmentationStyle() {
        return software.amazon.jsii.Kernel.get(this, "segmentationStyle", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSegmentationStyle(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "segmentationStyle", java.util.Objects.requireNonNull(value, "segmentationStyle is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSegmentationTime() {
        return software.amazon.jsii.Kernel.get(this, "segmentationTime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSegmentationTime(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "segmentationTime", java.util.Objects.requireNonNull(value, "segmentationTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimedMetadataBehavior() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimedMetadataBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timedMetadataBehavior", java.util.Objects.requireNonNull(value, "timedMetadataBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimedMetadataPid() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimedMetadataPid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timedMetadataPid", java.util.Objects.requireNonNull(value, "timedMetadataPid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTransportStreamId() {
        return software.amazon.jsii.Kernel.get(this, "transportStreamId", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTransportStreamId(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "transportStreamId", java.util.Objects.requireNonNull(value, "transportStreamId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVideoPid() {
        return software.amazon.jsii.Kernel.get(this, "videoPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVideoPid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "videoPid", java.util.Objects.requireNonNull(value, "videoPid is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
