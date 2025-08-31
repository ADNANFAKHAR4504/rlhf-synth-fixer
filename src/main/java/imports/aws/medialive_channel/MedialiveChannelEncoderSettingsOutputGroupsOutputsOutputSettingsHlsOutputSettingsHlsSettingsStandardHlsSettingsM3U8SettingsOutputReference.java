package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.878Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8SettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8SettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8SettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8SettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8SettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAudioFramesPerPes() {
        software.amazon.jsii.Kernel.call(this, "resetAudioFramesPerPes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAudioPids() {
        software.amazon.jsii.Kernel.call(this, "resetAudioPids", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEcmPid() {
        software.amazon.jsii.Kernel.call(this, "resetEcmPid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNielsenId3Behavior() {
        software.amazon.jsii.Kernel.call(this, "resetNielsenId3Behavior", software.amazon.jsii.NativeType.VOID);
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

    public void resetScte35Behavior() {
        software.amazon.jsii.Kernel.call(this, "resetScte35Behavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScte35Pid() {
        software.amazon.jsii.Kernel.call(this, "resetScte35Pid", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.Number getAudioFramesPerPesInput() {
        return software.amazon.jsii.Kernel.get(this, "audioFramesPerPesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAudioPidsInput() {
        return software.amazon.jsii.Kernel.get(this, "audioPidsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEcmPidInput() {
        return software.amazon.jsii.Kernel.get(this, "ecmPidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNielsenId3BehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "nielsenId3BehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getScte35BehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "scte35BehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScte35PidInput() {
        return software.amazon.jsii.Kernel.get(this, "scte35PidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getEcmPid() {
        return software.amazon.jsii.Kernel.get(this, "ecmPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEcmPid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ecmPid", java.util.Objects.requireNonNull(value, "ecmPid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNielsenId3Behavior() {
        return software.amazon.jsii.Kernel.get(this, "nielsenId3Behavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNielsenId3Behavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nielsenId3Behavior", java.util.Objects.requireNonNull(value, "nielsenId3Behavior is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getScte35Behavior() {
        return software.amazon.jsii.Kernel.get(this, "scte35Behavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScte35Behavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scte35Behavior", java.util.Objects.requireNonNull(value, "scte35Behavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScte35Pid() {
        return software.amazon.jsii.Kernel.get(this, "scte35Pid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScte35Pid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scte35Pid", java.util.Objects.requireNonNull(value, "scte35Pid is required"));
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

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
