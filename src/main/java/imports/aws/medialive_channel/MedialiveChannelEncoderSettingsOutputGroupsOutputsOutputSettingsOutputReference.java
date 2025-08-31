package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.881Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putArchiveOutputSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings value) {
        software.amazon.jsii.Kernel.call(this, "putArchiveOutputSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFrameCaptureOutputSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsFrameCaptureOutputSettings value) {
        software.amazon.jsii.Kernel.call(this, "putFrameCaptureOutputSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHlsOutputSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings value) {
        software.amazon.jsii.Kernel.call(this, "putHlsOutputSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMediaPackageOutputSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMediaPackageOutputSettings value) {
        software.amazon.jsii.Kernel.call(this, "putMediaPackageOutputSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMsSmoothOutputSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings value) {
        software.amazon.jsii.Kernel.call(this, "putMsSmoothOutputSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMultiplexOutputSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettings value) {
        software.amazon.jsii.Kernel.call(this, "putMultiplexOutputSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRtmpOutputSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings value) {
        software.amazon.jsii.Kernel.call(this, "putRtmpOutputSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUdpOutputSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettings value) {
        software.amazon.jsii.Kernel.call(this, "putUdpOutputSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetArchiveOutputSettings() {
        software.amazon.jsii.Kernel.call(this, "resetArchiveOutputSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFrameCaptureOutputSettings() {
        software.amazon.jsii.Kernel.call(this, "resetFrameCaptureOutputSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHlsOutputSettings() {
        software.amazon.jsii.Kernel.call(this, "resetHlsOutputSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMediaPackageOutputSettings() {
        software.amazon.jsii.Kernel.call(this, "resetMediaPackageOutputSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMsSmoothOutputSettings() {
        software.amazon.jsii.Kernel.call(this, "resetMsSmoothOutputSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMultiplexOutputSettings() {
        software.amazon.jsii.Kernel.call(this, "resetMultiplexOutputSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRtmpOutputSettings() {
        software.amazon.jsii.Kernel.call(this, "resetRtmpOutputSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUdpOutputSettings() {
        software.amazon.jsii.Kernel.call(this, "resetUdpOutputSettings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsOutputReference getArchiveOutputSettings() {
        return software.amazon.jsii.Kernel.get(this, "archiveOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsFrameCaptureOutputSettingsOutputReference getFrameCaptureOutputSettings() {
        return software.amazon.jsii.Kernel.get(this, "frameCaptureOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsFrameCaptureOutputSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsOutputReference getHlsOutputSettings() {
        return software.amazon.jsii.Kernel.get(this, "hlsOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMediaPackageOutputSettingsOutputReference getMediaPackageOutputSettings() {
        return software.amazon.jsii.Kernel.get(this, "mediaPackageOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMediaPackageOutputSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettingsOutputReference getMsSmoothOutputSettings() {
        return software.amazon.jsii.Kernel.get(this, "msSmoothOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsOutputReference getMultiplexOutputSettings() {
        return software.amazon.jsii.Kernel.get(this, "multiplexOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsOutputReference getRtmpOutputSettings() {
        return software.amazon.jsii.Kernel.get(this, "rtmpOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsOutputReference getUdpOutputSettings() {
        return software.amazon.jsii.Kernel.get(this, "udpOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings getArchiveOutputSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "archiveOutputSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsFrameCaptureOutputSettings getFrameCaptureOutputSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "frameCaptureOutputSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsFrameCaptureOutputSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings getHlsOutputSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "hlsOutputSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMediaPackageOutputSettings getMediaPackageOutputSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "mediaPackageOutputSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMediaPackageOutputSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings getMsSmoothOutputSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "msSmoothOutputSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettings getMultiplexOutputSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "multiplexOutputSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings getRtmpOutputSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "rtmpOutputSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettings getUdpOutputSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "udpOutputSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
