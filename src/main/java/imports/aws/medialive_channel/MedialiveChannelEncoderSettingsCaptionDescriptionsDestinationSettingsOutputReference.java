package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.868Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsOutputReference")
public class MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAribDestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsAribDestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putAribDestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBurnInDestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsBurnInDestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putBurnInDestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDvbSubDestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putDvbSubDestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEbuTtDDestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putEbuTtDDestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEmbeddedDestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEmbeddedDestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putEmbeddedDestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEmbeddedPlusScte20DestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEmbeddedPlusScte20DestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putEmbeddedPlusScte20DestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRtmpCaptionInfoDestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsRtmpCaptionInfoDestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putRtmpCaptionInfoDestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScte20PlusEmbeddedDestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsScte20PlusEmbeddedDestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putScte20PlusEmbeddedDestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScte27DestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsScte27DestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putScte27DestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSmpteTtDestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsSmpteTtDestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putSmpteTtDestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTeletextDestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTeletextDestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putTeletextDestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTtmlDestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putTtmlDestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWebvttDestinationSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsWebvttDestinationSettings value) {
        software.amazon.jsii.Kernel.call(this, "putWebvttDestinationSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAribDestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetAribDestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBurnInDestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetBurnInDestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDvbSubDestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetDvbSubDestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbuTtDDestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetEbuTtDDestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmbeddedDestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetEmbeddedDestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmbeddedPlusScte20DestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetEmbeddedPlusScte20DestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRtmpCaptionInfoDestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetRtmpCaptionInfoDestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScte20PlusEmbeddedDestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetScte20PlusEmbeddedDestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScte27DestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetScte27DestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSmpteTtDestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetSmpteTtDestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTeletextDestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetTeletextDestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTtmlDestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetTtmlDestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWebvttDestinationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetWebvttDestinationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsAribDestinationSettingsOutputReference getAribDestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "aribDestinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsAribDestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsBurnInDestinationSettingsOutputReference getBurnInDestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "burnInDestinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsBurnInDestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettingsOutputReference getDvbSubDestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "dvbSubDestinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettingsOutputReference getEbuTtDDestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "ebuTtDDestinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEmbeddedDestinationSettingsOutputReference getEmbeddedDestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "embeddedDestinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEmbeddedDestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEmbeddedPlusScte20DestinationSettingsOutputReference getEmbeddedPlusScte20DestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "embeddedPlusScte20DestinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEmbeddedPlusScte20DestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsRtmpCaptionInfoDestinationSettingsOutputReference getRtmpCaptionInfoDestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "rtmpCaptionInfoDestinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsRtmpCaptionInfoDestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsScte20PlusEmbeddedDestinationSettingsOutputReference getScte20PlusEmbeddedDestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "scte20PlusEmbeddedDestinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsScte20PlusEmbeddedDestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsScte27DestinationSettingsOutputReference getScte27DestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "scte27DestinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsScte27DestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsSmpteTtDestinationSettingsOutputReference getSmpteTtDestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "smpteTtDestinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsSmpteTtDestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTeletextDestinationSettingsOutputReference getTeletextDestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "teletextDestinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTeletextDestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettingsOutputReference getTtmlDestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "ttmlDestinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsWebvttDestinationSettingsOutputReference getWebvttDestinationSettings() {
        return software.amazon.jsii.Kernel.get(this, "webvttDestinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsWebvttDestinationSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsAribDestinationSettings getAribDestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "aribDestinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsAribDestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsBurnInDestinationSettings getBurnInDestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "burnInDestinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsBurnInDestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettings getDvbSubDestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "dvbSubDestinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsDvbSubDestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings getEbuTtDDestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "ebuTtDDestinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEmbeddedDestinationSettings getEmbeddedDestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "embeddedDestinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEmbeddedDestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEmbeddedPlusScte20DestinationSettings getEmbeddedPlusScte20DestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "embeddedPlusScte20DestinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEmbeddedPlusScte20DestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsRtmpCaptionInfoDestinationSettings getRtmpCaptionInfoDestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "rtmpCaptionInfoDestinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsRtmpCaptionInfoDestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsScte20PlusEmbeddedDestinationSettings getScte20PlusEmbeddedDestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "scte20PlusEmbeddedDestinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsScte20PlusEmbeddedDestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsScte27DestinationSettings getScte27DestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "scte27DestinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsScte27DestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsSmpteTtDestinationSettings getSmpteTtDestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "smpteTtDestinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsSmpteTtDestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTeletextDestinationSettings getTeletextDestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "teletextDestinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTeletextDestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings getTtmlDestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "ttmlDestinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsWebvttDestinationSettings getWebvttDestinationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "webvttDestinationSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsWebvttDestinationSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
