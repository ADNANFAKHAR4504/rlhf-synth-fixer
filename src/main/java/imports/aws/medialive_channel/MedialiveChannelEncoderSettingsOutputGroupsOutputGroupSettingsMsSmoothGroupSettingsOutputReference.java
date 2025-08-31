package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.875Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDestination(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettingsDestination value) {
        software.amazon.jsii.Kernel.call(this, "putDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAcquisitionPointId() {
        software.amazon.jsii.Kernel.call(this, "resetAcquisitionPointId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAudioOnlyTimecodeControl() {
        software.amazon.jsii.Kernel.call(this, "resetAudioOnlyTimecodeControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCertificateMode() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectionRetryInterval() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionRetryInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventId() {
        software.amazon.jsii.Kernel.call(this, "resetEventId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventIdMode() {
        software.amazon.jsii.Kernel.call(this, "resetEventIdMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventStopBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetEventStopBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilecacheDuration() {
        software.amazon.jsii.Kernel.call(this, "resetFilecacheDuration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFragmentLength() {
        software.amazon.jsii.Kernel.call(this, "resetFragmentLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputLossAction() {
        software.amazon.jsii.Kernel.call(this, "resetInputLossAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNumRetries() {
        software.amazon.jsii.Kernel.call(this, "resetNumRetries", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRestartDelay() {
        software.amazon.jsii.Kernel.call(this, "resetRestartDelay", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSegmentationMode() {
        software.amazon.jsii.Kernel.call(this, "resetSegmentationMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSendDelayMs() {
        software.amazon.jsii.Kernel.call(this, "resetSendDelayMs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSparseTrackType() {
        software.amazon.jsii.Kernel.call(this, "resetSparseTrackType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStreamManifestBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetStreamManifestBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimestampOffset() {
        software.amazon.jsii.Kernel.call(this, "resetTimestampOffset", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimestampOffsetMode() {
        software.amazon.jsii.Kernel.call(this, "resetTimestampOffsetMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettingsDestinationOutputReference getDestination() {
        return software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettingsDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAcquisitionPointIdInput() {
        return software.amazon.jsii.Kernel.get(this, "acquisitionPointIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAudioOnlyTimecodeControlInput() {
        return software.amazon.jsii.Kernel.get(this, "audioOnlyTimecodeControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateModeInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getConnectionRetryIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionRetryIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettingsDestination getDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettingsDestination.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventIdInput() {
        return software.amazon.jsii.Kernel.get(this, "eventIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventIdModeInput() {
        return software.amazon.jsii.Kernel.get(this, "eventIdModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventStopBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "eventStopBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFilecacheDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "filecacheDurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFragmentLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "fragmentLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputLossActionInput() {
        return software.amazon.jsii.Kernel.get(this, "inputLossActionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumRetriesInput() {
        return software.amazon.jsii.Kernel.get(this, "numRetriesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRestartDelayInput() {
        return software.amazon.jsii.Kernel.get(this, "restartDelayInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSegmentationModeInput() {
        return software.amazon.jsii.Kernel.get(this, "segmentationModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSendDelayMsInput() {
        return software.amazon.jsii.Kernel.get(this, "sendDelayMsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSparseTrackTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "sparseTrackTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStreamManifestBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "streamManifestBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimestampOffsetInput() {
        return software.amazon.jsii.Kernel.get(this, "timestampOffsetInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimestampOffsetModeInput() {
        return software.amazon.jsii.Kernel.get(this, "timestampOffsetModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAcquisitionPointId() {
        return software.amazon.jsii.Kernel.get(this, "acquisitionPointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAcquisitionPointId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "acquisitionPointId", java.util.Objects.requireNonNull(value, "acquisitionPointId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAudioOnlyTimecodeControl() {
        return software.amazon.jsii.Kernel.get(this, "audioOnlyTimecodeControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAudioOnlyTimecodeControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "audioOnlyTimecodeControl", java.util.Objects.requireNonNull(value, "audioOnlyTimecodeControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateMode() {
        return software.amazon.jsii.Kernel.get(this, "certificateMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateMode", java.util.Objects.requireNonNull(value, "certificateMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getConnectionRetryInterval() {
        return software.amazon.jsii.Kernel.get(this, "connectionRetryInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setConnectionRetryInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "connectionRetryInterval", java.util.Objects.requireNonNull(value, "connectionRetryInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventId() {
        return software.amazon.jsii.Kernel.get(this, "eventId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventId", java.util.Objects.requireNonNull(value, "eventId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventIdMode() {
        return software.amazon.jsii.Kernel.get(this, "eventIdMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventIdMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventIdMode", java.util.Objects.requireNonNull(value, "eventIdMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventStopBehavior() {
        return software.amazon.jsii.Kernel.get(this, "eventStopBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventStopBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventStopBehavior", java.util.Objects.requireNonNull(value, "eventStopBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFilecacheDuration() {
        return software.amazon.jsii.Kernel.get(this, "filecacheDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFilecacheDuration(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "filecacheDuration", java.util.Objects.requireNonNull(value, "filecacheDuration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFragmentLength() {
        return software.amazon.jsii.Kernel.get(this, "fragmentLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFragmentLength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "fragmentLength", java.util.Objects.requireNonNull(value, "fragmentLength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputLossAction() {
        return software.amazon.jsii.Kernel.get(this, "inputLossAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputLossAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputLossAction", java.util.Objects.requireNonNull(value, "inputLossAction is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumRetries() {
        return software.amazon.jsii.Kernel.get(this, "numRetries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumRetries(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numRetries", java.util.Objects.requireNonNull(value, "numRetries is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRestartDelay() {
        return software.amazon.jsii.Kernel.get(this, "restartDelay", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRestartDelay(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "restartDelay", java.util.Objects.requireNonNull(value, "restartDelay is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSegmentationMode() {
        return software.amazon.jsii.Kernel.get(this, "segmentationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSegmentationMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "segmentationMode", java.util.Objects.requireNonNull(value, "segmentationMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSendDelayMs() {
        return software.amazon.jsii.Kernel.get(this, "sendDelayMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSendDelayMs(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sendDelayMs", java.util.Objects.requireNonNull(value, "sendDelayMs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSparseTrackType() {
        return software.amazon.jsii.Kernel.get(this, "sparseTrackType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSparseTrackType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sparseTrackType", java.util.Objects.requireNonNull(value, "sparseTrackType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStreamManifestBehavior() {
        return software.amazon.jsii.Kernel.get(this, "streamManifestBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStreamManifestBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "streamManifestBehavior", java.util.Objects.requireNonNull(value, "streamManifestBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimestampOffset() {
        return software.amazon.jsii.Kernel.get(this, "timestampOffset", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimestampOffset(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timestampOffset", java.util.Objects.requireNonNull(value, "timestampOffset is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimestampOffsetMode() {
        return software.amazon.jsii.Kernel.get(this, "timestampOffsetMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimestampOffsetMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timestampOffsetMode", java.util.Objects.requireNonNull(value, "timestampOffsetMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
